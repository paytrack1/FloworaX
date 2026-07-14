const mongoose = require('mongoose');

const eventTicketSchema = new mongoose.Schema({
  eventId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  buyerName:     { type: String, required: true, trim: true },
  buyerEmail:    { type: String, required: true, trim: true },
  ticketCode:    { type: String, required: true, unique: true },
  status:        { type: String, enum: ['pending', 'valid', 'used', 'cancelled'], default: 'valid' },
  paymentStatus: { type: String, enum: ['free', 'pending', 'paid'], default: 'free' },
  paymentRef:    { type: String, default: null },
  paidAmount:    { type: Number, default: 0 },
  usedAt:        { type: Date, default: null },
  purchasedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventTicket', eventTicketSchema);