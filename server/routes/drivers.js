const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const User = require('../models/User');

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific driver
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a driver
router.post('/', async (req, res) => {
  try {
    const { name, email, phoneNumber, licenseNumber, dutyTimings, weeklyOffDay, driverId, assignedBus, assignedRoute } = req.body;
    
    // Auto-generate ID if not provided
    const uniqueId = driverId || 'DRV-' + Math.floor(1000 + Math.random() * 9000);
    // Auto-generate password
    const autoPassword = Math.random().toString(36).slice(-8);

    // Create User for login
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    await User.create({
      name,
      email,
      password: autoPassword,
      role: 'driver',
      driverId: uniqueId,
      licenseNumber: licenseNumber || '',
      busId: assignedBus || '',
      assignedRoute: assignedRoute || ''
    });

    const driver = new Driver({
      ...req.body,
      driverId: uniqueId,
      generatedPassword: autoPassword
    });

    const newDriver = await driver.save();
    res.status(201).json(newDriver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a driver
router.put('/:id', async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDriver) return res.status(404).json({ message: 'Driver not found' });
    res.json(updatedDriver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a driver
router.delete('/:id', async (req, res) => {
  try {
    const deletedDriver = await Driver.findByIdAndDelete(req.params.id);
    if (!deletedDriver) return res.status(404).json({ message: 'Driver not found' });
    
    // Also delete user
    await User.findOneAndDelete({ email: deletedDriver.email });

    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
