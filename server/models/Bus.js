const mongoose = require('mongoose');

const BusStopSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  lat:    { type: Number, required: true },
  lng:    { type: Number, required: true },
  etaMin: { type: Number, default: 0 },
}, { _id: false });

const BusSchema = new mongoose.Schema({
  busNumber:     { type: String, required: true, unique: true, trim: true }, // e.g. "BUS-4201"
  routeNumber:   { type: String, required: true },                            // e.g. "42"
  routeName:     { type: String, required: true },                            // e.g. "Raichur - Sindhanur Express"
  from:          { type: String, required: true },
  to:            { type: String, required: true },
  stops:         [BusStopSchema],
  fare:          { type: Number, required: true, default: 20 },
  totalSeats:    { type: Number, default: 50 },
  reservedSeats: { type: Number, default: 4 },
  womenSeats:    { type: Number, default: 6 },
  seniorSeats:   { type: Number, default: 4 },
  assignedDriver:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);
