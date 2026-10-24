const mongoose = require("mongoose");

const STATUSES = ["new", "active", "inactive"];
const INTERESTS = ["pickup", "sorting", "delivery", "events", "outreach"];
const AVAILABILITY = ["weekdays", "weekends", "flexible"];

const volunteerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    availability: { type: String, enum: AVAILABILITY, required: true },
    interests: { type: [{ type: String, enum: INTERESTS }], default: [] },
    hasVehicle: { type: Boolean, default: false },
    message: { type: String, trim: true, default: "" },
    status: { type: String, enum: STATUSES, default: "new", index: true },
  },
  { timestamps: true }
);

const Volunteer = mongoose.model("Volunteer", volunteerSchema);

module.exports = Volunteer;
module.exports.STATUSES = STATUSES;
module.exports.INTERESTS = INTERESTS;
module.exports.AVAILABILITY = AVAILABILITY;
