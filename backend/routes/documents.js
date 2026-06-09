const express  = require("express");
const router   = express.Router();
const path     = require("path");
const multer   = require("multer");
const Document = require("../models/Document");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/documents"),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// GET /api/documents?category=&empId=&status=&search=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.empId)    filter.empId    = req.query.empId;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.search)   filter.title    = { $regex: req.query.search, $options: "i" };
    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Document.findOne({ docId: req.params.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/documents — accepts multipart/form-data (file optional)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.filePath   = `/uploads/documents/${req.file.filename}`;
      body.fileName   = req.file.originalname;
      body.fileSizeMB = +(req.file.size / (1024 * 1024)).toFixed(2);
    }
    const doc = await Document.create(body);
    res.status(201).json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { docId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Document.findOneAndDelete({ docId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
