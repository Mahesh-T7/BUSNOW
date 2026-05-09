const express = require("express");
const BusSession = require("../models/BusSession");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public — passengers don't need to be logged in to view buses
// (but optionally gated if you want)

// ─── GET /api/buses ───────────────────────────────────────────────────────────
// Returns all currently active bus sessions (live buses on the map)
router.get("/", async (req, res) => {
  try {
    const activeSessions = await BusSession.find({ isActive: true })
      .select("-locationHistory")
      .lean();

    // Shape the response to match the frontend Bus interface
    const buses = activeSessions.map((s) => ({
      id: s.busId,
      sessionId: s._id,
      route: s.route,
      routeName: s.routeName,
      lat: s.lat,
      lng: s.lng,
      speed: s.speed || 0,
      heading: s.heading || 0,
      crowd: s.crowdLevel,
      driver: s.driverName,
      startedAt: s.startedAt,
    }));

    res.json({ success: true, buses });
  } catch (err) {
    console.error("GET /buses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/buses/:sessionId ────────────────────────────────────────────────
// Single bus detail + recent location track (last 50 points)
router.get("/:sessionId", async (req, res) => {
  try {
    const session = await BusSession.findById(req.params.sessionId).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Bus session not found" });
    }

    const track = (session.locationHistory || []).slice(-50);
    res.json({
      success: true,
      bus: {
        id: session.busId,
        sessionId: session._id,
        route: session.route,
        routeName: session.routeName,
        lat: session.lat,
        lng: session.lng,
        speed: session.speed,
        heading: session.heading,
        crowd: session.crowdLevel,
        driver: session.driverName,
        isActive: session.isActive,
        startedAt: session.startedAt,
        track,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
