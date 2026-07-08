const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  email:     { type: String, trim: true, lowercase: true },
  phone:     { type: String, trim: true },
  address:   { type: String, trim: true },
  notes:     { type: String },
  tags:      { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

customerSchema.index({ userId: 1, email: 1 });
module.exports = mongoose.model('Customer', customerSchema);
