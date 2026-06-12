const path = require("path");
const multer = require("multer");
const router = require("express").Router();
const ctrl = require("./expenses.controller");

// Upload config (multer) is route-layer middleware. Destination resolves to the
// repo-root /uploads/expenses (three levels up from backend/modules/finance).
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads/expenses"),
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

router.get("/", ctrl.list);
router.post("/", upload.array("files", 20), ctrl.create);
router.post("/:id/attachments", upload.array("files", 20), ctrl.addAttachments);
router.delete("/:id/attachments/:idx", ctrl.removeAttachment);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
