const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  duration:    { type: Number, required: true },
  price:       { type: Number, default: 0 },
  isFree:      { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  category:    { type: String, default: 'General' },
  location:    { type: String, default: 'Online' },
  createdAt:   { type: Date, default: Date.now },
});
module.exports = mongoose.model('Service', serviceSchema);
