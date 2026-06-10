const express     = require("express");
const router      = express.Router();
const fs          = require("fs");
const path        = require("path");
const multer      = require("multer");
const Procurement = require("../models/Procurement");

const QUOTE_DIR = path.join(__dirname, "../../uploads/procurement");
fs.mkdirSync(QUOTE_DIR, { recursive: true });
const { PROC_STAGES, STAGE_KEYS } = Procurement;

const stageMeta = key => PROC_STAGES.find(s => s.key === key) || null;

// Vendor quote document uploads (step 4 — Comparison).
const quoteStorage = multer.diskStorage({
  destination: QUOTE_DIR,
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const quoteUpload = multer({
  storage: quoteStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".heic", ".webp"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// GET /api/procurement/stages — expose the canonical 12-stage definition
router.get("/stages", (req, res) => res.json(PROC_STAGES));

// GET /api/procurement?stage=&status=&department=&search=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.stage)      filter.currentStage = req.query.stage;
    if (req.query.status)     filter.status       = req.query.status;
    if (req.query.department) filter.department    = req.query.department;
    if (req.query.search) {
      filter.$or = [
        { title:  { $regex: req.query.search, $options: "i" } },
        { procId: { $regex: req.query.search, $options: "i" } },
        { vendor: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const docs = await Procurement.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const procId = "PRC-" + Date.now().toString(36).toUpperCase();
    const doc = await Procurement.create({ ...req.body, procId, currentStage: "enquiry" });
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    // Guard immutable identity fields
    const { procId, _id, ...rest } = req.body;
    const doc = await Procurement.findOneAndUpdate(
      { procId: req.params.id },
      { $set: rest },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/*
 * POST /api/procurement/:id/advance
 * Sign off the CURRENT stage (appending a history entry) and move to the next one.
 * Completing the final stage marks the whole request `completed`.
 * Body: { by, note, patch }  — `patch` optionally updates stage fields (poNumber, etc.)
 */
router.post("/:id/advance", async (req, res) => {
  try {
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    const { by = "", note = "", patch = {} } = req.body || {};
    const idx  = STAGE_KEYS.indexOf(doc.currentStage);
    const meta = stageMeta(doc.currentStage);

    // Apply any stage-specific field updates that came with the sign-off
    const { procId, _id, ...rest } = patch;
    Object.assign(doc, rest);

    doc.history.push({
      stage:  doc.currentStage,
      label:  meta ? meta.label : doc.currentStage,
      action: meta ? meta.action : "",
      by, note,
      at: new Date(),
    });

    if (idx >= 0 && idx < STAGE_KEYS.length - 1) {
      doc.currentStage = STAGE_KEYS[idx + 1];
    } else {
      doc.status = "completed";   // final stage signed off
    }

    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/procurement/:id/stage — jump to a specific stage (e.g. send back). Body: { stage }
router.post("/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body || {};
    if (!STAGE_KEYS.includes(stage)) return res.status(400).json({ error: "Invalid stage" });
    const doc = await Procurement.findOneAndUpdate(
      { procId: req.params.id },
      { $set: { currentStage: stage, status: "in_progress" } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/*
 * POST /api/procurement/:id/quote-file  (multipart)
 * Attach a vendor's quotation document for a category. Field `file`, plus body
 * { category, vendor }. One file per (category, vendor) — re-uploading replaces
 * the previous attachment (and deletes the old file from disk).
 */
router.post("/:id/quote-file", quoteUpload.single("file"), async (req, res) => {
  try {
    const { category = "", vendor = "" } = req.body || {};
    if (!req.file)        return res.status(400).json({ error: "No file uploaded" });
    if (!vendor.trim())   return res.status(400).json({ error: "Vendor is required" });
    if (!category.trim()) return res.status(400).json({ error: "Category is required" });

    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    // Replace any existing attachment for this (category, vendor) pair.
    const existing = (doc.quoteFiles || []).find(q => q.category === category && q.vendor === vendor);
    if (existing && existing.filePath) {
      const old = path.join(__dirname, "../../", existing.filePath);
      fs.unlink(old, () => {});   // best-effort; ignore if already gone
    }
    doc.quoteFiles = (doc.quoteFiles || []).filter(q => !(q.category === category && q.vendor === vendor));
    doc.quoteFiles.push({
      category, vendor,
      fileName:   req.file.originalname,
      filePath:   `/uploads/procurement/${req.file.filename}`,
      fileSizeMB: +(req.file.size / (1024 * 1024)).toFixed(2),
      uploadedAt: new Date(),
    });
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/procurement/:id/quote-file?category=&vendor=  — remove one attachment
router.delete("/:id/quote-file", async (req, res) => {
  try {
    const { category = "", vendor = "" } = req.query || {};
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    const existing = (doc.quoteFiles || []).find(q => q.category === category && q.vendor === vendor);
    if (existing && existing.filePath) {
      fs.unlink(path.join(__dirname, "../../", existing.filePath), () => {});
    }
    doc.quoteFiles = (doc.quoteFiles || []).filter(q => !(q.category === category && q.vendor === vendor));
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/*
 * POST /api/procurement/:id/proforma-file  (multipart, field `file`)
 * Attach the Proforma Invoice document (step 7). One file — re-uploading
 * replaces the previous one and deletes the old file from disk.
 */
router.post("/:id/proforma-file", quoteUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    if (doc.proformaFile && doc.proformaFile.filePath) {
      fs.unlink(path.join(__dirname, "../../", doc.proformaFile.filePath), () => {});
    }
    doc.proformaFile = {
      fileName:   req.file.originalname,
      filePath:   `/uploads/procurement/${req.file.filename}`,
      fileSizeMB: +(req.file.size / (1024 * 1024)).toFixed(2),
      uploadedAt: new Date(),
    };
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/procurement/:id/proforma-file — remove the proforma invoice doc
router.delete("/:id/proforma-file", async (req, res) => {
  try {
    const doc = await Procurement.findOne({ procId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.proformaFile && doc.proformaFile.filePath) {
      fs.unlink(path.join(__dirname, "../../", doc.proformaFile.filePath), () => {});
    }
    doc.proformaFile = null;
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Procurement.findOneAndDelete({ procId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
