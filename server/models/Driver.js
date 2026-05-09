const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  driverId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  assignedBus: { type: String },
  assignedRoute: { type: String },
  licenseNumber: { type: String, required: true },
  dutyTimings: { type: String },
  weeklyOffDay: { type: String },
  generatedPassword: { type: String },
  totalWorkingHours: { type: Number, default: 0 },
  dutyDays: { type: Number, default: 0 },
  totalCompletedTrips: { type: Number, default: 0 },
  averageTripTime: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  status: { type: String, enum: ['Active', 'Offline', 'On Leave'], default: 'Offline' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
