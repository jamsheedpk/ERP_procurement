const { asyncHandler } = require("../../core");
const service = require("./parties.service");

// HTTP glue only: read the request, call the service, shape the response.
// No try/catch — asyncHandler forwards errors to the central error handler.
exports.list   = asyncHandler(async (req, res) => res.json(await service.list(req.query)));
exports.get    = asyncHandler(async (req, res) => res.json(await service.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body)));
exports.update = asyncHandler(async (req, res) => res.json(await service.update(req.params.id, req.body)));
exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ message: "Deleted" });
});
