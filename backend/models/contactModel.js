const mongoose = require("mongoose");

const STATUSES = ["new", "resolved"];

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    comments: { type: String, required: true, trim: true, maxlength: 600 },
    status: { type: String, enum: STATUSES, default: "new", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
module.exports.STATUSES = STATUSES;
