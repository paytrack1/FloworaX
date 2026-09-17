const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      { type: String, required: true, index: true },
  description: { type: String },
  amount:      { type: Number, required: true },
  category:    { type: String, default: 'Other' },
  synced:      { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
