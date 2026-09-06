const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const Staff = require('../models/Staff');
const requireAuth = require('../middleware/auth');
const { requireFeature } = require('../middleware/plan');
const { requireStaff } = require('../middleware/requireStaff');

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours, per spec

// Rate limits mirror the pattern in customers.js's publicJoinLimiter â€”
// accept-invite and login are unauthenticated, so they're the ones worth
// protecting from brute-force/enumeration.
const acceptInviteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const staffLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// â”€â”€ POST /api/staff/invite â€” owner invites a staff member â”€â”€
router.post('/invite', requireAuth, requireFeature('staff'), async (req, res) => {
  try {
    const { email, name, role, permissions } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Staff.findOne({ ownerId: req.user.id, email: normalizedEmail });
    if (existing && existing.accepted) {
      return res.status(409).json({ error: 'This person is already on your team' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + INVITE_EXPIRY_MS);

    const staff = existing
      ? Object.assign(existing, {
          name: name?.trim() || existing.name,
          role: role === 'manager' ? 'manager' : 'staff',
          permissions: Array.isArray(permissions) ? permissions : existing.permissions,
          inviteToken, inviteTokenExpiry,
        })
      : new Staff({
          ownerId: req.user.id,
          email: normalizedEmail,
          name: name?.trim() || '',
          role: role === 'manager' ? 'manager' : 'staff',
          permissions: Array.isArray(permissions) ? permissions : [],
          inviteToken, inviteTokenExpiry,
        });
    await staff.save();

    const inviteLink = `${FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    let emailSent = false;
    if (!resend) {
      console.log(`[DEV] Staff invite link for ${normalizedEmail}: ${inviteLink}`);
    } else {
      try {
        const result = await resend.emails.send({
          from: EMAIL_FROM,
          to: normalizedEmail,
          subject: `You've been invited to join ${req.user.businessName || 'the team'} on Flowora`,
          html: `<p>You've been invited to join ${req.user.businessName || 'a business'} on Flowora.</p>
                 <p><a href="${inviteLink}">Click here to accept and set your password</a>. This link expires in 48 hours.</p>`,
        });
        if (result.error) {
          console.error('Staff invite email failed:', result.error);
        } else {
          emailSent = true;
        }
      } catch (emailErr) {
        console.error('Staff invite email threw:', emailErr.message);
      }
      if (!emailSent) {
        console.log(`[FALLBACK] Staff invite link for ${normalizedEmail}: ${inviteLink}`);
      }
    }

    res.status(201).json({ success: true, emailSent, inviteLink, staff: { id: staff._id, email: staff.email, role: staff.role } });
  } catch (err) {
    console.error('Staff invite error:', err.message);
    res.status(500).json({ error: 'Failed to send invite', debugMessage: err.message, debugStack: err.stack });
  }
});

// â”€â”€ POST /api/staff/accept-invite â€” staff sets their password (public) â”€â”€
router.post('/accept-invite', acceptInviteLimiter, async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token) return res.status(400).json({ error: 'Invite token is required' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const staff = await Staff.findOne({ inviteToken: token });
    if (!staff) return res.status(404).json({ error: 'Invite link is invalid or has already been used' });
    if (staff.inviteTokenExpiry && staff.inviteTokenExpiry < new Date()) {
      return res.status(410).json({ error: 'Invite link has expired. Ask the business owner to send a new one.' });
    }

    staff.passwordHash = await bcrypt.hash(password, 12);
    if (name?.trim()) staff.name = name.trim();
    staff.accepted = true;
    staff.acceptedAt = new Date();
    staff.inviteToken = null;
    staff.inviteTokenExpiry = null;
    await staff.save();

    res.json({ success: true, message: 'Account set up. You can now log in.' });
  } catch (err) {
    console.error('Accept invite error:', err.message);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// â”€â”€ POST /api/staff/login â€” staff signs in (public) â”€â”€
router.post('/login', staffLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const staff = await Staff.findOne({ email: email.toLowerCase().trim() });
    // Same message whether the account doesn't exist, isn't accepted yet, or
    // the password is wrong â€” avoids leaking which case it is.
    if (!staff || !staff.accepted || !staff.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (staff.status !== 'active') {
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      {
        staffId: staff._id.toString(),
        ownerId: staff.ownerId.toString(),
        role: staff.role,
        permissions: staff.permissions,
        branchId: staff.branchId ? staff.branchId.toString() : null,
        isStaff: true,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      staff: { id: staff._id, name: staff.name, email: staff.email, role: staff.role, permissions: staff.permissions, branchId: staff.branchId },
    });
  } catch (err) {
    console.error('Staff login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// â”€â”€ GET /api/staff â€” owner lists their team â”€â”€
router.get('/', requireAuth, async (req, res) => {
  try {
    const staff = await Staff.find({ ownerId: req.user.id }).select('-passwordHash -inviteToken').sort({ createdAt: -1 });
    res.json({ staff });
  } catch (err) {
    console.error('List staff error:', err.message);
    res.status(500).json({ error: 'Failed to load staff' });
  }
});

// â”€â”€ PATCH /api/staff/:id/permissions â”€â”€
router.patch('/:id/permissions', requireAuth, async (req, res) => {
  try {
    const { permissions, role } = req.body;
    const staff = await Staff.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    if (Array.isArray(permissions)) staff.permissions = permissions;
    if (role === 'manager' || role === 'staff') staff.role = role;
    await staff.save();
    res.json({ success: true, staff: { id: staff._id, role: staff.role, permissions: staff.permissions } });
  } catch (err) {
    console.error('Update staff permissions error:', err.message);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// â”€â”€ DELETE /api/staff/:id â€” owner removes staff â”€â”€
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await Staff.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete staff error:', err.message);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

module.exports = router;
