const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  email:     { type: String, trim: true, lowercase: true },
  phone:     { type: String, trim: true },
  address:   { type: String, trim: true },
  notes:     { type: String },
  tags:      { type: [String], default: [] },

  // â”€â”€ Communication consent â”€â”€
  // Default true for email (matches existing behavior elsewhere in the
  // app, e.g. booking confirmations), opt-in (default false) for
  // SMS/WhatsApp since those are more intrusive and cost real messaging
  // credits per send.
  emailOptIn:    { type: Boolean, default: true },
  smsOptIn:      { type: Boolean, default: false },
  whatsappOptIn: { type: Boolean, default: false },
  consentUpdatedAt: { type: Date, default: null },

  // How this member/customer record was created. Lets the "new" audience
  // filter and reporting distinguish self-registrations from manual adds.
  source: { type: String, enum: ['manual', 'public_join', 'booking'], default: 'manual' },

  // Set once a 'new_member' welcome automation has actually fired for this
  // customer, so it's easy to see (and audit) who got welcomed.
  welcomedAt: { type: Date, default: null },

  // First-timer / intake details, captured on public self-registration.
  howHeard:  { type: String, trim: true, default: null }, // e.g. "Friend", "Social media", "Walked in"
  invitedBy: { type: String, trim: true, default: null },
  wantsVisit: { type: Boolean, default: false }, // would like a follow-up visit or call

  createdAt: { type: Date, default: Date.now },
});

customerSchema.index({ userId: 1, email: 1 });
customerSchema.index({ userId: 1, tags: 1 });
module.exports = mongoose.model('Customer', customerSchema);
