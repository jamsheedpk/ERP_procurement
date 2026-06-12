const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "hrm_dev_secret_2026";

/**
 * Verifies the Bearer JWT and attaches the authoritative user record to req.user.
 * The token only carries the user id, so we look the user up each request — that
 * keeps role/active status current (a demoted or disabled account loses access
 * immediately, without waiting for the token to expire).
 */
async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Authentication required." });

    const payload = jwt.verify(token, SECRET);
    const user = await User.findById(payload.id).select("name email role userRole empId active");
    if (!user) return res.status(401).json({ error: "Invalid session." });
    if (user.active === false) return res.status(403).json({ error: "Account is disabled." });

    req.user = {
      id:       String(user._id),
      name:     user.name,
      email:    user.email,
      role:     user.role,
      userRole: user.userRole || "admin",
      empId:    user.empId || null,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/** Requires an authenticated admin. Runs authRequired first if it hasn't already. */
function adminOnly(req, res, next) {
  const guard = () => {
    if (req.user.userRole !== "admin") return res.status(403).json({ error: "Admin access required." });
    next();
  };
  if (req.user) return guard();
  return authRequired(req, res, (err) => (err ? next(err) : guard()));
}

module.exports = { authRequired, adminOnly };
