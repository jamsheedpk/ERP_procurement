const express  = require("express");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const Employee = require("../models/Employee");

const router  = express.Router();
const SECRET  = process.env.JWT_SECRET || "hrm_dev_secret_2026";
const EXPIRES = "8h";

function userPayload(user) {
  return {
    id:       user._id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    userRole: user.userRole || "admin",
    empId:    user.empId || null,
    avatar:   user.avatar,
  };
}

/* POST /api/auth/login */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.active)
    return res.status(401).json({ message: "No account found with that email." });

  const ok = await user.matchPassword(password);
  if (!ok)
    return res.status(401).json({ message: "Incorrect password." });

  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: EXPIRES });
  res.json({ token, user: userPayload(user) });
});

/* GET /api/auth/me  — validate stored token */
router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token." });

  try {
    const payload = jwt.verify(token, SECRET);
    const user    = await User.findById(payload.id).select("-password");
    if (!user || !user.active) return res.status(401).json({ message: "User not found." });
    res.json(userPayload(user));
  } catch {
    res.status(401).json({ message: "Token invalid or expired." });
  }
});

/* GET /api/auth/users — list all system users (admin only) */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: 1 });
    res.json(users.map(u => ({
      id:       u._id,
      name:     u.name,
      email:    u.email,
      role:     u.role,
      userRole: u.userRole || "admin",
      empId:    u.empId || null,
      avatar:   u.avatar,
      active:   u.active,
      createdAt: u.createdAt,
    })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* PATCH /api/auth/users/:id — update role or active status */
router.patch("/users/:id", async (req, res) => {
  try {
    const { role, userRole, active } = req.body;
    const update = {};
    if (role     !== undefined) update.role     = role;
    if (userRole !== undefined) update.userRole = userRole;
    if (active   !== undefined) update.active   = active;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, userRole: user.userRole, empId: user.empId, avatar: user.avatar, active: user.active });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* GET /api/auth/my-profile  — employee's linked record + leave data */
router.get("/my-profile", async (req, res) => {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token." });

  try {
    const payload = jwt.verify(token, SECRET);
    const user    = await User.findById(payload.id).select("-password");
    if (!user || !user.active) return res.status(401).json({ message: "User not found." });
    if (!user.empId) return res.status(404).json({ message: "No employee record linked to this account." });

    const employee     = await Employee.findOne({ empId: user.empId });
    if (!employee) return res.status(404).json({ message: "Employee record not found." });

    res.json({ user: userPayload(user), employee });
  } catch {
    res.status(401).json({ message: "Token invalid or expired." });
  }
});

module.exports = router;
