require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const driverRoutes = require("./routes/driver");
const busesRoutes = require("./routes/buses");
const adminRoutes = require("./routes/admin");
const newDriverRoutes = require("./routes/drivers");
const scheduleRoutes = require("./routes/schedules");
const routesRoutes = require("./routes/routes");
const { socketAuth } = require("./middleware/auth");
const registerSocketHandlers = require("./socket/handlers");

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Attach io to app so routes can emit events
app.set("io", io);

// Socket auth middleware
io.use(socketAuth);

// Register all socket event handlers
registerSocketHandlers(io);

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/buses", busesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/drivers", newDriverRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/routes", routesRoutes); // public route map lookup

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── MongoDB Connection + Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/varadtrack";

async function start() {
  let mongoUri = MONGO_URI;

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("✅ MongoDB connected:", mongoose.connection.host);
  } catch (_localErr) {
    console.warn("⚠️  Local MongoDB unavailable. Starting embedded in-memory MongoDB...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const memServer = await MongoMemoryServer.create();
      mongoUri = memServer.getUri();
      await mongoose.connect(mongoUri);
      console.log("✅ In-memory MongoDB started (data resets on server restart)");
      console.log("   To persist data, install MongoDB locally or set MONGO_URI in server/.env");

      // Seed demo data automatically in dev/memory mode
      const User     = require("./models/User");
      const Bus      = require("./models/Bus");
      const Route    = require("./models/Route");
      const Schedule = require("./models/Schedule");
      const { ROUTES, BUSES, SCHEDULES } = require("./seeders/demoData");

      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // ── Users ────────────────────────────────────────────────────────────
        await User.create([
          { name: "Admin User",    email: "admin@varadtrack.app",     password: "admin123",  role: "admin" },
          { name: "R. Sharma",    email: "rsharma@varadtrack.app",   password: "driver123", role: "driver",    busId: "BUS-4201", assignedRoute: "42", driverId: "DRV-4201" },
          { name: "A. Patil",     email: "apatil@varadtrack.app",    password: "driver123", role: "driver",    busId: "BUS-1702", assignedRoute: "17", driverId: "DRV-1702" },
          { name: "S. Deshmukh",  email: "sdeshmukh@varadtrack.app", password: "driver123", role: "driver",    busId: "BUS-0803", assignedRoute: "08", driverId: "DRV-0803" },
          { name: "K. Reddy",     email: "kreddy@varadtrack.app",    password: "driver123", role: "driver",    busId: "BUS-3301", assignedRoute: "33", driverId: "DRV-3301" },
          { name: "M. Kumar",     email: "mkumar@varadtrack.app",    password: "driver123", role: "driver",    busId: "BUS-5501", assignedRoute: "55", driverId: "DRV-5501" },
          { name: "P. Nair",      email: "pnair@varadtrack.app",     password: "driver123", role: "driver",    busId: "BUS-2101", assignedRoute: "21", driverId: "DRV-2101" },
          { name: "Passenger",    email: "passenger@varadtrack.app", password: "pass123",   role: "passenger" },
        ]);

        // ── Routes (map: from → to with GPS stops) ───────────────────────────
        for (const r of ROUTES) {
          const exists = await Route.findOne({ number: r.number });
          if (!exists) await Route.create(r);
        }

        // ── Buses ────────────────────────────────────────────────────────────
        for (const b of BUSES) {
          const exists = await Bus.findOne({ busNumber: b.busNumber });
          if (!exists) await Bus.create(b);
        }

        // ── Schedules ────────────────────────────────────────────────────────
        for (const s of SCHEDULES) {
          await Schedule.create(s);
        }

        console.log("\n🌱 Demo data seeded:");
        console.log("   Routes  : 6 (Raichur region with GPS stops)");
        console.log("   Buses   : 6 (BUS-4201 … BUS-2101)");
        console.log("   Schedules: 8 daily services");
        console.log("\n   Accounts:");
        console.log("   admin@varadtrack.app      / admin123");
        console.log("   rsharma@varadtrack.app    / driver123  (Rt 42 Sindhanur)");
        console.log("   apatil@varadtrack.app     / driver123  (Rt 17 Mudgal)");
        console.log("   sdeshmukh@varadtrack.app  / driver123  (Rt 08 Lingsugur)");
        console.log("   kreddy@varadtrack.app     / driver123  (Rt 33 City Loop)");
        console.log("   mkumar@varadtrack.app     / driver123  (Rt 55 Hyderabad)");
        console.log("   pnair@varadtrack.app      / driver123  (Rt 21 Deodurga)");
        console.log("   passenger@varadtrack.app  / pass123\n");
      }
    } catch (memErr) {
      console.error("❌ Could not start in-memory MongoDB:", memErr.message);
      console.error("Install MongoDB locally or set MONGO_URI to a MongoDB Atlas URI in server/.env");
      process.exit(1);
    }
  }

  server.listen(PORT, () => {
    console.log(`\n🚌 VaradTrack Backend  →  http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`\nEndpoints:`);
    console.log(`  POST  /api/auth/register   POST /api/auth/login`);
    console.log(`  GET   /api/buses`);
    console.log(`  POST  /api/driver/start    PATCH /api/driver/location   POST /api/driver/stop`);
    console.log(`  GET   /api/admin/stats     GET /api/admin/drivers\n`);
  });
}

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server...");
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});
