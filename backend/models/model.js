// models/FoodRequest.js
const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    urgency: { type: String, required: true },
  },
  { timestamps: true }
);

const FoodRequest = mongoose.model("FoodRequest", foodRequestSchema);

module.exports = FoodRequest;
