const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, trim: true, lowercase: true, unique: true },
  businessType: { type: String, trim: true },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Waitlist', waitlistSchema);
