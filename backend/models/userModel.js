const mongoose = require("mongoose");
const { ROLES } = require("../rbac");

// "status" (rather than a boolean) lets the admin dashboard filter and edit
// accounts the same way it handles every other collection.
const STATUSES = ["active", "suspended"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    role: { type: String, enum: ROLES, default: "user", index: true },
    status: { type: String, enum: STATUSES, default: "active", index: true },
    // Tokens issued before this moment are rejected (password change, role change, suspension).
    tokensValidAfter: { type: Date, default: () => new Date(0) },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.STATUSES = STATUSES;
