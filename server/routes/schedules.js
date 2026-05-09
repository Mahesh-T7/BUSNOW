const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find().populate('driverId');
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('driverId');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a schedule
router.post('/', async (req, res) => {
  const schedule = new Schedule(req.body);
  try {
    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a schedule
router.put('/:id', async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSchedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(updatedSchedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a schedule
router.delete('/:id', async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!deletedSchedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
