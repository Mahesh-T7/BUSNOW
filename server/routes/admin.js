/**
 * routes/adminData.js
 * Full CRUD for Buses, Routes, and Schedules — admin-only, JWT-protected.
 * Mounted at /api/admin
 */
const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User     = require('../models/User');
const Bus      = require('../models/Bus');
const Route    = require('../models/Route');
const Schedule = require('../models/Schedule');
const bcrypt   = require('bcryptjs');

// All routes below require a valid admin JWT
router.use(protect, authorize('admin'));

/* ══════════════════════════════════════════════
   BUSES
   GET    /api/admin/buses       – list all buses
   POST   /api/admin/buses       – add a bus
   PATCH  /api/admin/buses/:id   – update
   DELETE /api/admin/buses/:id   – delete
══════════════════════════════════════════════ */
router.get('/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 }).populate('assignedDriver', 'name email');
    res.json({ success: true, buses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/buses', async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json({ success: true, bus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, bus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/buses/:id', async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bus deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   ROUTES
   GET    /api/admin/routes
   POST   /api/admin/routes
   PATCH  /api/admin/routes/:id
   DELETE /api/admin/routes/:id
══════════════════════════════════════════════ */
router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/routes', async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ success: true, route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/routes/:id', async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   SCHEDULES
   GET    /api/admin/schedules
   POST   /api/admin/schedules
   PATCH  /api/admin/schedules/:id
   DELETE /api/admin/schedules/:id
══════════════════════════════════════════════ */
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/schedules', async (req, res) => {
  try {
    const schedule = await Schedule.create(req.body);
    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   DRIVERS (Users with role=driver)
   GET    /api/admin/drivers          – list all drivers
   POST   /api/admin/drivers          – create driver account + auto credentials
   PATCH  /api/admin/drivers/:id      – update driver info
   DELETE /api/admin/drivers/:id      – remove driver
══════════════════════════════════════════════ */
router.get('/drivers', async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'driver' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
      ];
    }
    const drivers = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/drivers', async (req, res) => {
  try {
    const {
      name, email, phoneNumber, licenseNumber,
      assignedBus, assignedRoute, dutyTimings, weeklyOffDay,
      driverId: customId,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Auto-generate credentials
    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const driverId = customId || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const driver = await User.create({
      name,
      email: email.toLowerCase(),
      password: generatedPassword,
      role: 'driver',
      driverId,
      busId:         assignedBus    || null,
      assignedRoute: assignedRoute  || null,
      licenseNumber: licenseNumber  || null,
      phoneNumber:   phoneNumber    || null,
      dutyTimings:   dutyTimings    || null,
      weeklyOffDay:  weeklyOffDay   || null,
    });

    res.status(201).json({
      success: true,
      driver,
      driverId,
      generatedPassword, // returned once so admin can share it
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/drivers/:id', async (req, res) => {
  try {
    const allowed = ['name', 'email', 'busId', 'assignedRoute', 'licenseNumber',
                     'phoneNumber', 'dutyTimings', 'weeklyOffDay', 'isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'driver' },
      updates,
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/drivers/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   USERS  (all roles)
   GET    /api/admin/users
   PATCH  /api/admin/users/:id
   DELETE /api/admin/users/:id
══════════════════════════════════════════════ */
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['role', 'isActive', 'busId', 'assignedRoute', 'name'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   STATS
   GET /api/admin/stats
══════════════════════════════════════════════ */
const BusSession = require('../models/BusSession');
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalPassengers, activeSessions, totalSessions] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'driver' }),
        User.countDocuments({ role: 'passenger' }),
        BusSession.countDocuments({ isActive: true }),
        BusSession.countDocuments(),
      ]);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessionsToday = await BusSession.countDocuments({ createdAt: { $gte: since24h } });

    res.json({
      success: true,
      stats: { totalUsers, totalDrivers, totalPassengers, activeBuses: activeSessions, totalSessions, sessionsToday },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   SEED (dev only)
══════════════════════════════════════════════ */
router.post('/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }
  try {
    const demoUsers = [
      { name: 'Admin User',   email: 'admin@varadtrack.app',     password: 'admin123',  role: 'admin' },
      { name: 'R. Sharma',    email: 'rsharma@varadtrack.app',   password: 'driver123', role: 'driver', busId: 'BUS-4201', assignedRoute: '42', driverId: 'DRV-4201' },
      { name: 'A. Patil',     email: 'apatil@varadtrack.app',    password: 'driver123', role: 'driver', busId: 'BUS-1702', assignedRoute: '17', driverId: 'DRV-1702' },
      { name: 'Passenger One',email: 'passenger@varadtrack.app', password: 'pass123',   role: 'passenger' },
    ];
    const results = [];
    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        results.push({ email: u.email, status: 'created' });
      } else {
        results.push({ email: u.email, status: 'already exists' });
      }
    }
    res.json({ success: true, seeded: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
