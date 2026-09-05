const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceNumber:{ type: String, required: true, unique: true },
  clientName:   { type: String, required: true, trim: true },
  clientEmail:  { type: String, trim: true },
  items:        { type: Array, default: [] },
  amount:       { type: Number, required: true },
  status:       { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  dueDate:      { type: Date },
  paidAt:       { type: Date, default: null },
  notes:        { type: String },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
