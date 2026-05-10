const mongoose = require('mongoose');

const RouteStopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat:  { type: Number, required: true },
  lng:  { type: Number, required: true },
}, { _id: false });

const RouteSchema = new mongoose.Schema({
  number:      { type: String, required: true, unique: true },  // e.g. "42"
  name:        { type: String, required: true },                  // e.g. "Raichur - Sindhanur Express"
  from:        { type: String, required: true },
  to:          { type: String, required: true },
  stops:       [RouteStopSchema],
  distanceKm:  { type: Number, default: 0 },
  durationMin: { type: Number, default: 0 },
  fare:        { type: Number, required: true },
  peakFare:    { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Route', RouteSchema);
