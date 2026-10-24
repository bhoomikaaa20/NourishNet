// models/FoodDonation.js
const mongoose = require("mongoose");
const { generateTrackingId } = require("./trackingId");

const STATUSES = ["pending", "approved", "completed", "rejected"];

const foodDonationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 }, // kilograms
    foodType: {
      type: String,
      required: true,
      enum: ["rice", "vegetables", "fruits", "bread", "other"],
    },
    notes: { type: String, trim: true, default: "" },
    // Public listing details. Optional at the model level so older records stay valid.
    city: { type: String, trim: true, default: "" },
    dietType: { type: String, enum: ["", "veg", "nonveg", "vegan"], default: "" },
    availableUntil: { type: Date },
    // Set atomically when someone claims the listing (see POST /api/listings/:id/claim).
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "FoodRequest", default: null },
    claimedAt: { type: Date },
    status: { type: String, enum: STATUSES, default: "pending", index: true },
    adminNote: { type: String, trim: true, default: "" },
    // Set when submitted while signed in; anonymous submissions stay null.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    trackingId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => generateTrackingId("DON"),
    },
  },
  { timestamps: true }
);

const FoodDonation = mongoose.model("FoodDonation", foodDonationSchema);

module.exports = FoodDonation;
module.exports.STATUSES = STATUSES;
