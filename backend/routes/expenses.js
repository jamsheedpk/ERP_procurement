const express = require("express");
const router  = express.Router();
const path    = require("path");
const multer  = require("multer");
const Expense = require("../models/Expense");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/expenses"),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".heic", ".webp"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

function filesToAttachments(files = []) {
  return files.map(f => ({
    fileName:   f.originalname,
    filePath:   `/uploads/expenses/${f.filename}`,
    fileSizeMB: +(f.size / (1024 * 1024)).toFixed(2),
  }));
}

// GET /api/expenses
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.cat)    filter.cat    = req.query.cat;
    if (req.query.empId)  filter.empId  = req.query.empId;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.month)  filter.date   = { $regex: `^${req.query.month}` };
    const docs = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/expenses — multipart, files optional
router.post("/", upload.array("files", 20), async (req, res) => {
  try {
    const attachments = filesToAttachments(req.files);
    const body = { ...req.body };
    if (body.amount)   body.amount   = parseFloat(body.amount)   || 0;
    if (body.receipts) body.receipts = parseInt(body.receipts,10) || 0;
    body.attachments = attachments;
    if (!body.receipts) body.receipts = attachments.length;
    const doc = await Expense.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/expenses/:id/attachments — add files to an existing expense
router.post("/:id/attachments", upload.array("files", 20), async (req, res) => {
  try {
    const newAttachments = filesToAttachments(req.files);
    const doc = await Expense.findOneAndUpdate(
      { expenseId: req.params.id },
      {
        $push:  { attachments: { $each: newAttachments } },
        $inc:   { receipts: newAttachments.length },
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/expenses/:id/attachments/:idx
router.delete("/:id/attachments/:idx", async (req, res) => {
  try {
    const doc = await Expense.findOne({ expenseId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const idx = parseInt(req.params.idx, 10);
    if (idx < 0 || idx >= doc.attachments.length) return res.status(400).json({ error: "Invalid index" });
    doc.attachments.splice(idx, 1);
    doc.receipts = Math.max(0, doc.receipts - 1);
    doc.markModified("attachments");
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await Expense.findOneAndUpdate(
      { expenseId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Expense.findOneAndDelete({ expenseId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
