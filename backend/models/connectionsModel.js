// models/Connections.js
const mongoose = require("mongoose");

const connectionsSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true }, // Ensure unique email addresses
  },
  { timestamps: true }
);

const Connections = mongoose.model("Connections", connectionsSchema);

module.exports = Connections;
