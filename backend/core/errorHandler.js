/**
 * Central error handling — the single place that turns thrown errors into HTTP
 * responses with a consistent { error, code } shape. This replaces the
 * `catch (err) { res.status(...).json({ error: err.message }) }` block that was
 * duplicated in every legacy route handler.
 *
 * Register `errorHandler` LAST (after all routes); register `notFound` after the
 * API routes so unmatched /api/* paths return JSON instead of falling through to
 * the static file middleware.
 */

// JSON 404 for unmatched API routes.
function notFound(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: "NOT_FOUND",
  });
}

// eslint-disable-next-line no-unused-vars  (Express needs the 4-arg signature)
function errorHandler(err, req, res, next) {
  // Mongoose schema validation → 400
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message, code: "VALIDATION" });
  }
  // Bad ObjectId / cast → 400
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid value for "${err.path}"`, code: "CAST" });
  }
  // Duplicate unique key → 409
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate key", code: "DUPLICATE", keyValue: err.keyValue });
  }
  // Multer upload errors → 400
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message, code: "UPLOAD" });
  }

  const status = err.statusCode || 500;
  // Never leak internal 500 messages/stacks to the client.
  const message = status < 500 || err.expose ? err.message : "Internal server error";
  if (status >= 500) console.error(err);

  res.status(status).json({ error: message, code: err.code || "ERROR" });
}

module.exports = { errorHandler, notFound };
