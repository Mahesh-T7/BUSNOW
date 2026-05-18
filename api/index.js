/**
 * api/index.js — Vercel Serverless Function entry point
 * ────────────────────────────────────────────────────────────────────────────
 * Wraps the Express server as a Vercel serverless function.
 * Vercel functions are stateless, so we cache the Mongoose connection
 * across warm invocations to avoid opening a new connection per request.
 *
 * Socket.io works via long-polling on Vercel (WebSocket upgrades are
 * not persistent in serverless, but polling is fully supported).
 * ────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server: SocketServer } = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes      = require('../server/routes/auth');
const driverRoutes    = require('../server/routes/driver');
const busesRoutes     = require('../server/routes/buses');
const adminRoutes     = require('../server/routes/admin');
const newDriverRoutes = require('../server/routes/drivers');
const scheduleRoutes  = require('../server/routes/schedules');
const routesRoutes    = require('../server/routes/routes');

const { socketAuth }          = require('../server/middleware/auth');
const registerSocketHandlers  = require('../server/socket/handlers');

// ─── App ──────────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.io (polling transport for Vercel) ─────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || '*').split(',').map(s => s.trim());

const io = new SocketServer(server, {
  cors: {
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*'
      ? '*'
      : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // On Vercel we cannot maintain WebSocket upgrades across serverless
  // invocations, so restrict to polling for reliability.
  transports: ['polling'],
  path: '/api/socket.io',
});

app.set('io', io);
io.use(socketAuth);
registerSocketHandlers(io);

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*'
    ? '*'
    : allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    platform: 'vercel-serverless',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/driver',    driverRoutes);
app.use('/api/buses',     busesRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/drivers',   newDriverRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/routes',    routesRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── MongoDB connection cache ─────────────────────────────────────────────────
// Vercel reuses function instances between requests (warm starts).
// Cache the connection so we don't open a new one every invocation.
let _mongoReady = false;

async function ensureDb() {
  if (_mongoReady && mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI environment variable is not set');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  _mongoReady = true;

  // Guarantee admin account exists on first connection
  try {
    const User = require('../server/models/User');
    const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@varadtrack.app';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin User';

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!existing) {
      await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), password: ADMIN_PASSWORD, role: 'admin' });
      console.log(`[startup] Admin created: ${ADMIN_EMAIL}`);
    }
  } catch (e) {
    console.warn('[startup] Admin upsert skipped:', e.message);
  }
}

// ─── Vercel handler export ────────────────────────────────────────────────────
module.exports = async (req, res) => {
  await ensureDb();
  return new Promise((resolve, reject) => {
    server.emit('request', req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
};
