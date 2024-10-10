// models/FoodDonation.js
const mongoose = require("mongoose");

const foodDonationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    quantity: { type: Number, required: true }, // Assuming quantity in kilograms
    foodType: { type: String, required: true }, // New field for food type
  },
  { timestamps: true }
);

const FoodDonation = mongoose.model("FoodDonation", foodDonationSchema);

module.exports = FoodDonation;
