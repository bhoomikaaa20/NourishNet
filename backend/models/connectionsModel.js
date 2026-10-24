// models/Connections.js
const mongoose = require("mongoose");

const connectionsSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

const Connections = mongoose.model("Connections", connectionsSchema);

module.exports = Connections;
