const express = require("express");
const BusSession = require("../models/BusSession");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All driver routes require auth + driver role
router.use(protect, authorize("driver"));

// ─── POST /api/driver/start ──────────────────────────────────────────────────
// Driver starts a new shift / location sharing session
router.post("/start", async (req, res) => {
  try {
    const { busId, route, routeName, crowdLevel } = req.body;

    if (!busId || !route || !routeName) {
      return res.status(400).json({
        success: false,
        message: "busId, route and routeName are required",
      });
    }

    // Close any existing active session for this driver
    await BusSession.updateMany(
      { driver: req.user._id, isActive: true },
      { isActive: false, endedAt: new Date() }
    );

    const session = await BusSession.create({
      driver: req.user._id,
      driverName: req.user.name,
      busId,
      route,
      routeName,
      crowdLevel: crowdLevel || "Medium",
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error("Driver start error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/driver/location ──────────────────────────────────────────────
// Driver sends a live location ping
router.patch("/location", async (req, res) => {
  try {
    const { sessionId, lat, lng, speed, heading, accuracy, crowdLevel } = req.body;

    if (!sessionId || lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        message: "sessionId, lat and lng are required",
      });
    }

    const session = await BusSession.findOne({
      _id: sessionId,
      driver: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Active session not found" });
    }

    // Update current position
    session.lat = lat;
    session.lng = lng;
    session.speed = speed ?? session.speed;
    session.heading = heading ?? session.heading;
    session.accuracy = accuracy ?? session.accuracy;
    if (crowdLevel) session.crowdLevel = crowdLevel;

    // Append to history, keep last 500 points
    session.locationHistory.push({ lat, lng, speed: speed ?? 0, heading: heading ?? 0 });
    if (session.locationHistory.length > 500) {
      session.locationHistory = session.locationHistory.slice(-500);
    }

    await session.save();

    // Emit real-time update via socket (attached to app)
    const io = req.app.get("io");
    if (io) {
      io.emit("bus:update", {
        sessionId: session._id,
        busId: session.busId,
        route: session.route,
        routeName: session.routeName,
        driverName: session.driverName,
        lat,
        lng,
        speed: session.speed,
        heading: session.heading,
        crowdLevel: session.crowdLevel,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Driver location error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/driver/stop ───────────────────────────────────────────────────
// Driver ends their shift
router.post("/stop", async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await BusSession.findOneAndUpdate(
      { _id: sessionId, driver: req.user._id, isActive: true },
      { isActive: false, endedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Notify all clients that this bus went offline
    const io = req.app.get("io");
    if (io) {
      io.emit("bus:offline", { sessionId: session._id, busId: session.busId });
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error("Driver stop error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/driver/session ─────────────────────────────────────────────────
// Get current driver's active session (if any)
router.get("/session", async (req, res) => {
  try {
    const session = await BusSession.findOne({
      driver: req.user._id,
      isActive: true,
    }).select("-locationHistory");

    res.json({ success: true, session: session || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/driver/history ─────────────────────────────────────────────────
// Driver's past sessions
router.get("/history", async (req, res) => {
  try {
    const sessions = await BusSession.find({ driver: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-locationHistory");

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
