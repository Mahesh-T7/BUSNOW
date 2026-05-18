/**
 * server/seeders/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone seed runner.
 * Usage (from project root):
 *   node server/seeders/seed.js
 *
 * Or with a custom MONGO_URI:
 *   MONGO_URI=mongodb://... node server/seeders/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User     = require('../models/User');
const Bus      = require('../models/Bus');
const Route    = require('../models/Route');
const Schedule = require('../models/Schedule');
const { ROUTES, BUSES, SCHEDULES } = require('./demoData');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/varadtrack';

async function seed() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected:', mongoose.connection.host);

  // ── Users ──────────────────────────────────────────────────────────────────
  const demoUsers = [
    { name: 'Admin User',    email: 'admin@varadtrack.app',     password: 'admin123',  role: 'admin' },
    { name: 'R. Sharma',     email: 'rsharma@varadtrack.app',   password: 'driver123', role: 'driver',    busId: 'BUS-4201', assignedRoute: '42', driverId: 'DRV-4201' },
    { name: 'A. Patil',      email: 'apatil@varadtrack.app',    password: 'driver123', role: 'driver',    busId: 'BUS-1702', assignedRoute: '17', driverId: 'DRV-1702' },
    { name: 'S. Deshmukh',   email: 'sdeshmukh@varadtrack.app', password: 'driver123', role: 'driver',    busId: 'BUS-0803', assignedRoute: '08', driverId: 'DRV-0803' },
    { name: 'K. Reddy',      email: 'kreddy@varadtrack.app',    password: 'driver123', role: 'driver',    busId: 'BUS-3301', assignedRoute: '33', driverId: 'DRV-3301' },
    { name: 'M. Kumar',      email: 'mkumar@varadtrack.app',    password: 'driver123', role: 'driver',    busId: 'BUS-5501', assignedRoute: '55', driverId: 'DRV-5501' },
    { name: 'P. Nair',       email: 'pnair@varadtrack.app',     password: 'driver123', role: 'driver',    busId: 'BUS-2101', assignedRoute: '21', driverId: 'DRV-2101' },
    { name: 'Passenger Demo', email: 'passenger@varadtrack.app', password: 'pass123',   role: 'passenger' },
  ];

  let userCount = 0;
  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) { await User.create(u); userCount++; }
  }
  console.log(`👤 Users seeded: ${userCount} new`);

  // ── Routes ─────────────────────────────────────────────────────────────────
  let routeCount = 0;
  for (const r of ROUTES) {
    const exists = await Route.findOne({ number: r.number });
    if (!exists) { await Route.create(r); routeCount++; }
  }
  console.log(`🗺️  Routes seeded: ${routeCount} new`);

  // ── Buses ──────────────────────────────────────────────────────────────────
  let busCount = 0;
  for (const b of BUSES) {
    const exists = await Bus.findOne({ busNumber: b.busNumber });
    if (!exists) { await Bus.create(b); busCount++; }
  }
  console.log(`🚌 Buses seeded: ${busCount} new`);

  // ── Schedules ──────────────────────────────────────────────────────────────
  let schedCount = 0;
  for (const s of SCHEDULES) {
    const exists = await Schedule.findOne({ busNumber: s.busNumber, departureTime: s.departureTime });
    if (!exists) { await Schedule.create(s); schedCount++; }
  }
  console.log(`🕐 Schedules seeded: ${schedCount} new`);

  console.log('\n✅ Seeding complete!\n');
  console.log('Demo accounts:');
  console.log('  admin@varadtrack.app      / admin123');
  console.log('  rsharma@varadtrack.app    / driver123  (Route 42 – Sindhanur)');
  console.log('  apatil@varadtrack.app     / driver123  (Route 17 – Mudgal)');
  console.log('  sdeshmukh@varadtrack.app  / driver123  (Route 08 – Lingsugur)');
  console.log('  kreddy@varadtrack.app     / driver123  (Route 33 – City Circular)');
  console.log('  mkumar@varadtrack.app     / driver123  (Route 55 – Hyderabad)');
  console.log('  pnair@varadtrack.app      / driver123  (Route 21 – Deodurga)');
  console.log('  passenger@varadtrack.app  / pass123\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
