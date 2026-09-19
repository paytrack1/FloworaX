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
  cancelToken:   { type: String, default: null, index: true },
  createdAt:     { type: Date, default: Date.now },
});

// Speeds up the dashboard, reminders cron, follow-ups cron, and branch reports —
// all of which query on this exact combination of fields.
bookingSchema.index({ providerId: 1, scheduledDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
