const mongoose = require('mongoose');

// Audit trail for every message sent by an automation.
// Includes sends, failures, skips (opt-out, no contact, no credits, etc.).
const automationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null }, // null if customer was deleted

  // What we tried to send
  channel: { type: String, enum: ['email', 'sms', 'whatsapp'], required: true },
  recipient: { type: String, trim: true }, // email address, phone number, or contact identifier
  messageContent: { type: String, required: true }, // The actual text sent (after template substitution)

  // Outcome
  status: {
    type: String,
    enum: [
      'sent',               // Successfully submitted to provider
      'failed',             // Provider returned error
      'skipped_optout',     // Customer opted out of this channel
      'skipped_no_contact', // No valid recipient (e.g., missing email)
      'skipped_no_credits', // Insufficient messaging credits
    ],
    required: true,
    index: true,
  },

  // Failure details (if status='failed')
  failureReason: { type: String, default: null },
  
  // Provider response tracking (optional)
  providerMessageId: { type: String, default: null }, // Message ID from SMS/WhatsApp provider
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: null }, // Full response from provider (for debugging)

  // Timestamp
  createdAt: { type: Date, default: Date.now, index: true },
});

automationLogSchema.index({ userId: 1, automationId: 1, createdAt: -1 });
automationLogSchema.index({ userId: 1, status: 1, createdAt: -1 });
automationLogSchema.index({ userId: 1, createdAt: -1 }); // For "show message log" queries

module.exports = mongoose.model('AutomationLog', automationLogSchema);
