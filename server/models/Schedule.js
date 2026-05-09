const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  busNumber: { type: String, required: true },
  routeNumber: { type: String, required: true },
  routeName: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  stops: [{
    name: String,
    eta: String
  }],
  estimatedDuration: { type: String },
  fare: { type: Number, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  recurring: { type: String, enum: ['Daily', 'Weekdays', 'Weekends', 'Once'], default: 'Daily' },
  type: { type: String, enum: ['Express', 'Local'], default: 'Local' },
  timeOfDay: { type: String, enum: ['Morning', 'Afternoon', 'Night'], default: 'Morning' },
  status: { type: String, enum: ['On Time', 'Delayed', 'Arriving Soon'], default: 'On Time' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
