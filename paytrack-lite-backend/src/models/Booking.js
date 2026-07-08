const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  serviceId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  type:          { type: String, enum: ['appointment', 'event'], default: 'appointment' },
  providerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName:    { type: String, required: true, trim: true },
  clientEmail:   { type: String, required: true, trim: true },
  clientPhone:   { type: String, trim: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  status:        { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['free','pending','paid','failed'], default: 'pending' },
  paymentRef:    { type: String },
  amount:        { type: Number, default: 0 },
  notes:         { type: String },
  createdAt:     { type: Date, default: Date.now },
});
module.exports = mongoose.model('Booking', bookingSchema);
