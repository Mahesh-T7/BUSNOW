const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/** Generate a signed JWT for a user */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/** Unified response helper */
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      busId: user.busId,
      assignedRoute: user.assignedRoute,
    },
  });
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Public self-registration is PASSENGER-ONLY.
// ✦ Admin accounts are pre-seeded at server startup (no self-registration).
// ✦ Driver accounts are created by an admin via POST /api/admin/drivers.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    // Hard-block any attempt to register as admin or driver via this public route
    const requestedRole = (req.body.role || "").toLowerCase();
    if (requestedRole === "admin") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be created via registration. Contact your system administrator." });
    }
    if (requestedRole === "driver") {
      return res.status(403).json({ success: false, message: "Driver accounts are created by the admin. Please contact your administrator." });
    }

    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "passenger", // always passenger — never trust client-supplied role
    });

    sendToken(user, 201, res);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email/Driver ID and password are required" });
    }

    // Include password in query
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { driverId: email } // case-sensitive matching for driverId, or could use regex, but driverId is usually exact
      ]
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated. Contact admin." });
    }

    // Optional: enforce role match from client
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as '${user.role}', not '${role}'`,
      });
    }

    // Update lastSeen
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const { protect } = require("../middleware/auth");

router.get("/me", protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/logout", protect, (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

module.exports = router;
