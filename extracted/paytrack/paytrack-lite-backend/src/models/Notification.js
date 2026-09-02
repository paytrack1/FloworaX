const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true, trim: true },
  message:   { type: String, required: true, trim: true },
  type:      {
    type: String,
    enum: ['booking', 'invoice', 'event', 'subscription', 'payment', 'system'],
    default: 'system',
  },
  read:      { type: Boolean, default: false },
  link:      { type: String, default: null }, // optional: where clicking the notification should take the user
  createdAt: { type: Date, default: Date.now },
});

// Fast "get my unread count" and "get my recent notifications" queries
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
