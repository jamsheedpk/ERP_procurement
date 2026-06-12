const jwt = require("jsonwebtoken");
const { ApiError } = require("./");

// Same secret/default as routes/auth.js — centralise this in one place.
const SECRET = process.env.JWT_SECRET || "hrm_dev_secret_2026";

/**
 * Reusable JWT auth guard. The legacy resource routes were all unauthenticated
 * (only auth.js verified tokens); this is the shared middleware to apply per
 * route or per module. On success it sets `req.user` from the token payload.
 *
 * NOTE: not yet applied to the finance routes — the ported finance pages fetch
 * `window.API` directly without an Authorization header, so enforcing it now
 * would 401 the running app. Apply it once those pages move to the auth-aware
 * api client (mfe/packages/api). See modules/finance/*.routes.js.
 */
function authGuard(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

module.exports = { authGuard };
