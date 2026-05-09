const mongoose = require("mongoose");

/**
 * BusSession — one active shift for a driver.
 * Created when driver starts sharing, closed when they stop.
 */
const BusSessionSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverName: { type: String, required: true },
    busId: { type: String, required: true },       // e.g. "BUS-4201"
    route: { type: String, required: true },        // e.g. "42"
    routeName: { type: String, required: true },    // e.g. "Sitabuldi → Wardha Rd"
    crowdLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    // Current position
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    speed: { type: Number, default: 0 },       // km/h
    heading: { type: Number, default: 0 },     // degrees
    accuracy: { type: Number, default: 0 },    // metres
    // Session state
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    // Location history (ring-buffer, last 500 points)
    locationHistory: [
      {
        lat: Number,
        lng: Number,
        speed: Number,
        heading: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for fast "all active sessions" queries
BusSessionSchema.index({ isActive: 1 });
BusSessionSchema.index({ driver: 1, isActive: 1 });

// Virtual: duration in seconds
BusSessionSchema.virtual("durationSec").get(function () {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 1000);
});

module.exports = mongoose.model("BusSession", BusSessionSchema);
