/**
 * routes/routes.js
 * Public read-only route lookup – no JWT required.
 * Mounted at /api/routes
 *
 * GET  /api/routes              – list all active routes
 * GET  /api/routes/:number      – get single route by route number (e.g. "42")
 * GET  /api/routes/search?from=X&to=Y  – find routes between two stops
 */
const express = require('express');
const router  = express.Router();
const Route   = require('../models/Route');

// List all active routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ number: 1 });
    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Search routes by from/to city name (case-insensitive partial match)
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { isActive: true };
    if (from) query.from = { $regex: from, $options: 'i' };
    if (to)   query.to   = { $regex: to,   $options: 'i' };
    const routes = await Route.find(query).sort({ number: 1 });
    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get a single route by route number
router.get('/:number', async (req, res) => {
  try {
    const route = await Route.findOne({ number: req.params.number, isActive: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
