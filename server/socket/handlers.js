const BusSession = require("../models/BusSession");

/**
 * registerSocketHandlers
 * Called once when the Socket.io server is ready.
 * Handles all real-time events for drivers and passengers.
 */
module.exports = function registerSocketHandlers(io) {
  // Rooms:
  //   "passengers"   — all connected passengers
  //   "admins"       — all connected admins
  //   "driver:<id>"  — a specific driver

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.role} connected: ${user.name} (${socket.id})`);

    // ── Join the right room based on role ──────────────────────────────────
    if (user.role === "passenger") {
      socket.join("passengers");
      // Send current live bus list immediately on connect
      BusSession.find({ isActive: true })
        .select("-locationHistory")
        .lean()
        .then((sessions) => {
          const buses = sessions.map((s) => ({
            sessionId: s._id,
            busId: s.busId,
            route: s.route,
            routeName: s.routeName,
            lat: s.lat,
            lng: s.lng,
            speed: s.speed || 0,
            heading: s.heading || 0,
            crowd: s.crowdLevel,
            driver: s.driverName,
          }));
          socket.emit("bus:snapshot", buses);
        })
        .catch(console.error);
    }

    if (user.role === "driver") {
      socket.join(`driver:${user._id}`);
    }

    if (user.role === "admin") {
      socket.join("admins");
    }

    // ── DRIVER: start sharing location ────────────────────────────────────
    socket.on("driver:start", async (data, ack) => {
      if (user.role !== "driver") return ack?.({ error: "Forbidden" });

      try {
        const { busId, route, routeName, crowdLevel } = data;

        // Close existing sessions
        await BusSession.updateMany(
          { driver: user._id, isActive: true },
          { isActive: false, endedAt: new Date() }
        );

        const session = await BusSession.create({
          driver: user._id,
          driverName: user.name,
          busId,
          route,
          routeName,
          crowdLevel: crowdLevel || "Medium",
        });

        socket.sessionId = session._id.toString();

        // Notify admin room
        io.to("admins").emit("admin:driver_started", {
          driverId: user._id,
          driverName: user.name,
          busId,
          route,
          routeName,
          sessionId: session._id,
        });

        ack?.({ success: true, sessionId: session._id });
      } catch (err) {
        console.error("driver:start error:", err);
        ack?.({ error: "Failed to start session" });
      }
    });

    // ── DRIVER: send live location ─────────────────────────────────────────
    socket.on("driver:location", async (data) => {
      if (user.role !== "driver" || !socket.sessionId) return;

      try {
        const { lat, lng, speed, heading, accuracy, crowdLevel } = data;

        // Update DB
        const session = await BusSession.findByIdAndUpdate(
          socket.sessionId,
          {
            lat, lng,
            speed: speed ?? 0,
            heading: heading ?? 0,
            accuracy: accuracy ?? 0,
            ...(crowdLevel ? { crowdLevel } : {}),
            $push: {
              locationHistory: {
                $each: [{ lat, lng, speed: speed ?? 0, heading: heading ?? 0 }],
                $slice: -500,
              },
            },
          },
          { new: false }
        );

        if (!session) return;

        const payload = {
          sessionId: socket.sessionId,
          busId: session.busId,
          route: session.route,
          routeName: session.routeName,
          driverName: session.driverName,
          lat,
          lng,
          speed: speed ?? 0,
          heading: heading ?? 0,
          crowd: crowdLevel || session.crowdLevel,
        };

        // Broadcast to all passengers and admins
        io.to("passengers").emit("bus:update", payload);
        io.to("admins").emit("bus:update", payload);
      } catch (err) {
        console.error("driver:location error:", err);
      }
    });

    // ── DRIVER: stop sharing ───────────────────────────────────────────────
    socket.on("driver:stop", async (data, ack) => {
      if (user.role !== "driver") return ack?.({ error: "Forbidden" });

      try {
        const sessionId = data?.sessionId || socket.sessionId;
        if (!sessionId) return ack?.({ error: "No active session" });

        const session = await BusSession.findByIdAndUpdate(
          sessionId,
          { isActive: false, endedAt: new Date() },
          { new: true }
        );

        io.to("passengers").emit("bus:offline", {
          sessionId,
          busId: session?.busId,
        });
        io.to("admins").emit("admin:driver_stopped", {
          driverId: user._id,
          driverName: user.name,
          sessionId,
          busId: session?.busId,
        });

        socket.sessionId = null;
        ack?.({ success: true });
      } catch (err) {
        console.error("driver:stop error:", err);
        ack?.({ error: "Failed to stop session" });
      }
    });

    // ── PASSENGER: subscribe to a specific bus ────────────────────────────
    socket.on("passenger:track", (busId) => {
      socket.join(`bus:${busId}`);
    });

    socket.on("passenger:untrack", (busId) => {
      socket.leave(`bus:${busId}`);
    });

    // ── Disconnect cleanup ────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`[Socket] ${user.role} disconnected: ${user.name}`);

      if (user.role === "driver" && socket.sessionId) {
        // Auto-close session after driver disconnects (optional: add grace period)
        try {
          const session = await BusSession.findByIdAndUpdate(
            socket.sessionId,
            { isActive: false, endedAt: new Date() },
            { new: true }
          );
          if (session) {
            io.to("passengers").emit("bus:offline", {
              sessionId: socket.sessionId,
              busId: session.busId,
            });
            io.to("admins").emit("admin:driver_stopped", {
              driverId: user._id,
              driverName: user.name,
              sessionId: socket.sessionId,
              busId: session.busId,
              reason: "disconnected",
            });
          }
        } catch (err) {
          console.error("Disconnect cleanup error:", err);
        }
      }
    });
  });
};
