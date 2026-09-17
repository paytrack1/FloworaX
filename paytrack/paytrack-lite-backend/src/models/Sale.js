const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  userId:        { type: String, required: true, index: true },
  items:         { type: Array, default: [] },
  itemName:      { type: String },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  reference:     { type: String },
  status:        { type: String, default: 'pending' },
  synced:        { type: Number, default: 0 },
  verified:      { type: Boolean, default: false },
  provider:      { type: String, default: null },
  profit:        { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
  syncedAt:      { type: Date, default: null },
});

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
