const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  day:       { type: Number, min: 0, max: 6 }, // 0=Sun, 1=Mon, ... 6=Sat
  startTime: { type: String }, // "09:00"
  endTime:   { type: String }, // "17:00"
}, { _id: false });

const specificDateSchema = new mongoose.Schema({
  date:      { type: String }, // "2026-09-25"
  startTime: { type: String, default: '09:00' },
  endTime:   { type: String, default: '17:00' },
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, trim: true },
  duration:      { type: Number, required: true },
  price:         { type: Number, default: 0 },
  isFree:        { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  category:      { type: String, default: 'General' },
  location:      { type: String, default: 'Online' },
  availabilityMode: { type: String, enum: ['weekly', 'specific'], default: 'weekly' },
  availability:  { type: [availabilitySlotSchema], default: [] },
  specificDates: { type: [specificDateSchema], default: [] },
  bufferTime:    { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('Service', serviceSchema);
