// models/FoodRequest.js
const mongoose = require("mongoose");
const { generateTrackingId } = require("./trackingId");

const STATUSES = ["pending", "approved", "completed", "rejected"];

const foodRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    urgency: {
      type: String,
      required: true,
      enum: ["immediate", "within_a_week"],
    },
    address: { type: String, trim: true, default: "" },
    householdSize: { type: Number, min: 1, default: 1 },
    notes: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    // Present when the request was made by claiming a public donation listing.
    donation: { type: mongoose.Schema.Types.ObjectId, ref: "FoodDonation", default: null },
    status: { type: String, enum: STATUSES, default: "pending", index: true },
    adminNote: { type: String, trim: true, default: "" },
    trackingId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => generateTrackingId("REQ"),
    },
  },
  { timestamps: true }
);

const FoodRequest = mongoose.model("FoodRequest", foodRequestSchema);

module.exports = FoodRequest;
module.exports.STATUSES = STATUSES;
