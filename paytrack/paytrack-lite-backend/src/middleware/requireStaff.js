const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Mirrors src/middleware/auth.js's requireAuth, but for staff tokens
// specifically. Staff tokens carry { staffId, ownerId, role, permissions,
// branchId, isStaff: true } — see Staff.login. Rejecting anything without
// isStaff === true keeps a stolen/reused owner token from acting as staff
// (and vice versa, since requireAuth doesn't check for isStaff at all).
const requireStaff = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.isStaff !== true) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    req.staff = decoded;
    req.ownerId = decoded.ownerId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Route-level permission gate, e.g. router.get('/x', requireStaff, checkPermission('bookings'), handler).
// Managers bypass the check entirely (they get all permissions per the
// original spec: "Manager role gets all permissions by default").
const checkPermission = (permissionKey) => (req, res, next) => {
  if (!req.staff) return res.status(401).json({ error: 'No token provided' });
  if (req.staff.role === 'manager') return next();
  if (Array.isArray(req.staff.permissions) && req.staff.permissions.includes(permissionKey)) {
    return next();
  }
  return res.status(403).json({ error: `Missing permission: ${permissionKey}` });
};

module.exports = { requireStaff, checkPermission };
