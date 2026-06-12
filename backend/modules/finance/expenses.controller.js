const { asyncHandler } = require("../../core");
const service = require("./expenses.service");

// Map multer file objects → the Expense.attachments sub-doc shape. This is an
// HTTP-layer concern (it knows about req.files), so it lives in the controller.
function filesToAttachments(files = []) {
  return files.map((f) => ({
    fileName:   f.originalname,
    filePath:   `/uploads/expenses/${f.filename}`,
    fileSizeMB: +(f.size / (1024 * 1024)).toFixed(2),
  }));
}

exports.list = asyncHandler(async (req, res) => res.json(await service.list(req.query)));

exports.create = asyncHandler(async (req, res) =>
  res.status(201).json(await service.create(req.body, filesToAttachments(req.files))));

exports.addAttachments = asyncHandler(async (req, res) =>
  res.json(await service.addAttachments(req.params.id, filesToAttachments(req.files))));

exports.removeAttachment = asyncHandler(async (req, res) =>
  res.json(await service.removeAttachment(req.params.id, parseInt(req.params.idx, 10))));

exports.update = asyncHandler(async (req, res) => res.json(await service.update(req.params.id, req.body)));

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: "Deleted" });
});
