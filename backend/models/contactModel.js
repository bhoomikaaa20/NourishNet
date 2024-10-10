const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  comments: String,
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
