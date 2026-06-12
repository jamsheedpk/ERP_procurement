/**
 * Shared backend primitives for the modular architecture.
 *
 * These replace the patterns that were copy-pasted across every legacy route:
 *  - asyncHandler  → removes the per-handler try/catch
 *  - ApiError      → expected failures (404/400/409) thrown from services
 *  - genId         → the inline `PREFIX + Date.now().toString(36)` ID generation
 */

// Wrap an async route handler so any thrown/rejected error flows to the central
// error handler via next(), instead of needing try/catch in every handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Operational error carrying an HTTP status. Throw from services/controllers for
// *expected* failures; unexpected errors become 500 in the error handler.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.expose = true; // safe to send `message` to the client
  }
  static badRequest(msg = "Bad request") { return new ApiError(400, msg); }
  static unauthorized(msg = "Authentication required") { return new ApiError(401, msg); }
  static notFound(msg = "Not found") { return new ApiError(404, msg); }
}

// Human-readable business IDs, matching the legacy convention:
//   genId("PAR") → "PAR-LXY12Z3"
const genId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

module.exports = { asyncHandler, ApiError, genId };
