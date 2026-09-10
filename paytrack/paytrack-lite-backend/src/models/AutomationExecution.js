const mongoose = require('mongoose');

// Tracks when an automation **should** execute to prevent duplicates.
// For 'schedule' trigger: one record per occurrence (e.g., Sunday 9am on Sep 6, 2026).
// For 'new_member' trigger: one record per automation-customer pair.
// 
// This is the idempotency key: if the scheduler runs twice and we've already created
// an execution record for that occurrence, we skip it.
const automationExecutionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', required: true, index: true },

  // For 'schedule' trigger: a unique date string identifying the occurrence.
  // Example: "2026-09-06" (the Sunday when the reminder is due to fire)
  // For 'new_member' trigger: empty (idempotency is per-customer-automation pair instead)
  occurrenceDate: { type: String, default: '' }, // YYYY-MM-DD

  // For 'new_member' trigger: track which customer this welcome is for
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },

  // Status of this execution
  // 'pending': queued, ready to send
  // 'sent': all audience messages were delivered successfully
  // 'failed': something went wrong (e.g., database error, no matching audience)
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending', index: true },

  // Count of messages actually sent as part of this execution
  messagesSent: { type: Number, default: 0 },

  // Schedule recipients that failed and should be retried on the next run.
  failedCustomerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

  // Error details if status='failed'
  errorReason: { type: String, default: null },

  // When the scheduler ran this execution
  executedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
});

// Composite unique index: prevent duplicate executions for the same automation + occurrence
automationExecutionSchema.index({ automationId: 1, occurrenceDate: 1 }, { unique: true, sparse: true });
automationExecutionSchema.index({ automationId: 1, customerId: 1 }, { unique: true, sparse: true });
automationExecutionSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationExecution', automationExecutionSchema);
