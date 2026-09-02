const mongoose = require('mongoose');

// Recurring service reminders, new-member welcomes, and other customer automations.
// An automation is the **definition** of when/how to send messages (e.g. "every Sunday at 9am").
// Actual executions are logged separately in AutomationExecution for idempotency.
const automationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Basic metadata
  name: { type: String, required: true, trim: true }, // "Sunday Service", "Welcome Message"
  description: { type: String, trim: true },
  status: { type: String, enum: ['active', 'paused'], default: 'active' },

  // Trigger type: 'schedule' (recurring) or 'new_member' (once per member)
  trigger: { type: String, enum: ['schedule', 'new_member'], default: 'schedule', index: true },

  // ── For 'schedule' trigger ──
  // Recurring schedule: day of week + time
  dayOfWeek: { type: Number, min: 0, max: 6, default: 0 }, // 0=Sunday, 6=Saturday
  startTime: { type: String, default: '09:00' }, // HH:mm format
  endTime: { type: String, default: '' }, // Optional end time for the session
  timezone: { type: String, default: 'Africa/Lagos' }, // IANA timezone

  // Reminder timing (how many days before, at what time)
  reminder: {
    daysBefore: { type: Number, default: 1 },
    atTime: { type: String, default: '10:00' }, // HH:mm
  },

  // ── Audience targeting ──
  audience: {
    mode: { type: String, enum: ['all', 'new', 'group', 'selected'], default: 'all' },
    newWithinDays: { type: Number, default: 30 }, // For 'new' mode: members created within last N days
    tag: { type: String, default: '' }, // For 'group' mode: customer tag to match
    customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }], // For 'selected' mode
  },

  // ── Messaging ──
  channel: { type: String, enum: ['email', 'sms', 'whatsapp'], default: 'email' },
  messageTemplate: { type: String, required: true }, // Template with {{variable}} placeholders
  // Safe variables: firstName, lastName, fullName, businessName, serviceName, date, startTime, endTime, dayOfWeek

  // ── Execution tracking ──
  // For 'new_member': which members have been welcomed already (to prevent duplicates)
  // We use AutomationExecution model for full audit trail; this is a convenience reference.
  lastExecutedAt: { type: Date, default: null },
  nextExecutionAt: { type: Date, default: null }, // Precomputed for UI/sorting

  // ── Metadata ──
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for fast "get my active automations" queries
automationSchema.index({ userId: 1, status: 1 });
automationSchema.index({ userId: 1, trigger: 1 });
automationSchema.index({ userId: 1, nextExecutionAt: 1 }); // For scheduler

module.exports = mongoose.model('Automation', automationSchema);
