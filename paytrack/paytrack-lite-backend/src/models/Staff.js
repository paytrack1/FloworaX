const mongoose = require('mongoose');

// A staff member invited by a business owner. Distinct from `User` --
// staff never get a User account; they authenticate with their own JWT
// ({ staffId, ownerId, role, permissions, branchId, isStaff: true })
// issued by POST /api/staff/login once they've accepted their invite.
const staffSchema = new mongoose.Schema({
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, default: null },

  role: { type: String, enum: ['staff', 'manager'], default: 'staff' },
  permissions: { type: [String], default: [] },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },

  inviteToken: { type: String, default: null, index: true },
  inviteTokenExpiry: { type: Date, default: null },
  accepted: { type: Boolean, default: false },
  acceptedAt: { type: Date, default: null },

  status: { type: String, enum: ['active', 'suspended'], default: 'active' },

  createdAt: { type: Date, default: Date.now },
});

staffSchema.index({ ownerId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema);