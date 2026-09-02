const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date:        { type: String, required: true },
  time:        { type: String, required: true },
  location:    { type: String, trim: true, default: 'Online' },
  capacity:    { type: Number, default: 0 },
  price:       { type: Number, default: 0 },
  status:      { type: String, enum: ['active', 'cancelled'], default: 'active' },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
