const express = require("express");
const User = require("../models/User");
const BusSession = require("../models/BusSession");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, authorize("admin"));

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalPassengers, activeSessions, totalSessions] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "driver" }),
        User.countDocuments({ role: "passenger" }),
        BusSession.countDocuments({ isActive: true }),
        BusSession.countDocuments(),
      ]);

    // Sessions in the last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessionsToday = await BusSession.countDocuments({
      createdAt: { $gte: since24h },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        totalPassengers,
        activeBuses: activeSessions,
        totalSessions,
        sessionsToday,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/drivers ───────────────────────────────────────────────────
// Drivers with their current session status
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver" }).lean();
    const activeSessions = await BusSession.find({ isActive: true })
      .select("driver busId route routeName crowdLevel lat lng speed startedAt")
      .lean();

    const sessionMap = {};
    activeSessions.forEach((s) => {
      sessionMap[s.driver.toString()] = s;
    });

    const enriched = drivers.map((d) => ({
      ...d,
      currentSession: sessionMap[d._id.toString()] || null,
      status: sessionMap[d._id.toString()] ? "Active" : "Offline",
    }));

    res.json({ success: true, drivers: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/buses ─────────────────────────────────────────────────────
// All active bus sessions for fleet map
router.get("/buses", async (req, res) => {
  try {
    const sessions = await BusSession.find({ isActive: true })
      .populate("driver", "name email")
      .select("-locationHistory")
      .lean();

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/sessions ──────────────────────────────────────────────────
// Session history with filters
router.get("/sessions", async (req, res) => {
  try {
    const { driverId, isActive, page = 1, limit = 30 } = req.query;
    const query = {};
    if (driverId) query.driver = driverId;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const [sessions, total] = await Promise.all([
      BusSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("driver", "name email")
        .select("-locationHistory"),
      BusSession.countDocuments(query),
    ]);

    res.json({
      success: true,
      sessions,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────
// Admin updates a user (role, active status, bus assignment)
router.patch("/users/:id", async (req, res) => {
  try {
    const allowed = ["role", "isActive", "busId", "assignedRoute", "name"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/admin/seed ─────────────────────────────────────────────────────
// Seed demo users for development (only works in non-production)
router.post("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, message: "Not available in production" });
  }

  try {
    const bcrypt = require("bcryptjs");

    const demoUsers = [
      { name: "Admin User", email: "admin@varadtrack.app", password: "admin123", role: "admin" },
      { name: "R. Sharma", email: "rsharma@varadtrack.app", password: "driver123", role: "driver", busId: "BUS-4201", assignedRoute: "42" },
      { name: "A. Patil", email: "apatil@varadtrack.app", password: "driver123", role: "driver", busId: "BUS-1702", assignedRoute: "17" },
      { name: "S. Deshmukh", email: "sdeshmukh@varadtrack.app", password: "driver123", role: "driver", busId: "BUS-0803", assignedRoute: "08" },
      { name: "Passenger One", email: "passenger@varadtrack.app", password: "pass123", role: "passenger" },
    ];

    const results = [];
    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const created = await User.create(u);
        results.push({ email: created.email, role: created.role });
      } else {
        results.push({ email: exists.email, role: exists.role, note: "already exists" });
      }
    }

    res.json({ success: true, seeded: results });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
