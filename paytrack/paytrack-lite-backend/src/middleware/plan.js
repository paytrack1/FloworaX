const mongoose = require('mongoose');

const PLAN_CATALOG = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Start for free with core sales, services, bookings, finance, reports, and a taste of events.',
    features: ['sales', 'services', 'bookings', 'finance', 'reports', 'events'],
    limits: { sales: 50, bookings: 40, services: 8, events: 3 },
    badge: 'Best for starters',
  },
  pro: {
    name: 'Pro',
    price: 2000,
    description: 'Grow with higher limits, invoices, unlimited events, advanced reports, and booking controls.',
    features: ['sales', 'services', 'bookings', 'finance', 'reports', 'invoices', 'events'],
    limits: { sales: 500, bookings: 200, services: 20, events: null },
    badge: 'Most popular',
  },
  business: {
    name: 'Business',
    price: 4000,
    description: 'Unlimited access to all business tools, staff features, and premium support.',
    features: ['sales', 'services', 'bookings', 'finance', 'reports', 'invoices', 'events', 'staff'],
    limits: { sales: null, bookings: null, services: null, events: null },
    badge: 'Enterprise',
  },
};

const DEFAULT_PLAN = 'free';

const getPlan = (planId) => PLAN_CATALOG[planId] || PLAN_CATALOG[DEFAULT_PLAN];
const getPlanList = () => Object.entries(PLAN_CATALOG).map(([id, plan]) => ({ id, ...plan }));

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function countMonthlySales(userId) {
  const Sale = mongoose.model('Sale');
  return Sale.countDocuments({
    userId,
    createdAt: { $gte: getMonthStart() },
  });
}

async function countMonthlyBookings(userId) {
  const Booking = mongoose.model('Booking');
  return Booking.countDocuments({
    providerId: userId,
    createdAt: { $gte: getMonthStart() },
  });
}

async function countActiveServices(userId) {
  const Service = mongoose.model('Service');
  return Service.countDocuments({ userId, isActive: true });
}

async function countActiveEvents(userId) {
  const Event = mongoose.model('Event');
  return Event.countDocuments({ userId, status: 'active' });
}

async function buildSubscriptionSummary(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  if (!user) return null;

  const plan = getPlan(user.plan);
  const [monthlySales, monthlyBookings, activeServices, activeEvents] = await Promise.all([
    countMonthlySales(userId),
    countMonthlyBookings(userId),
    countActiveServices(userId),
    countActiveEvents(userId),
  ]);

  return {
    plan: { id: user.plan || DEFAULT_PLAN, ...plan },
    usage: {
      monthlySales,
      monthlyBookings,
      activeServices,
      activeEvents,
    },
    limits: plan.limits,
    features: plan.features,
  };
}

function formatFeatureError(feature, plan) {
  return `Your ${plan.name} plan does not include access to ${feature}. Upgrade to unlock it.`;
}

function formatLimitError(feature, limit, plan) {
  return `You have reached your ${plan.name} plan limit of ${limit} ${feature}. Upgrade to continue.`;
}

function normalizeFeatureName(feature) {
  return feature?.toString().trim().toLowerCase();
}

function isUnlimited(limit) {
  return limit === null || limit === undefined;
}

async function countUsageFor(normalizedFeature, userId) {
  if (normalizedFeature === 'sales') return countMonthlySales(userId);
  if (normalizedFeature === 'bookings') return countMonthlyBookings(userId);
  if (normalizedFeature === 'services') return countActiveServices(userId);
  if (normalizedFeature === 'events') return countActiveEvents(userId);
  return 0;
}

function requireFeature(feature) {
  const normalizedFeature = normalizeFeatureName(feature);
  return async (req, res, next) => {
    const User = mongoose.model('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const plan = getPlan(user.plan);
    if (!plan.features.includes(normalizedFeature)) {
      return res.status(403).json({ error: formatFeatureError(normalizedFeature, plan) });
    }

    const limit = plan.limits?.[normalizedFeature];
    if (!isUnlimited(limit)) {
      const count = await countUsageFor(normalizedFeature, user._id);
      if (count >= limit) {
        return res.status(403).json({ error: formatLimitError(normalizedFeature, limit, plan) });
      }
    }

    req.currentPlan = plan;
    req.currentUser = user;
    next();
  };
}

async function requireProviderFeature(providerId, feature) {
  const normalizedFeature = normalizeFeatureName(feature);
  const User = mongoose.model('User');
  const user = await User.findById(providerId);
  if (!user) return { allowed: false, status: 404, error: 'Service provider not found' };

  const plan = getPlan(user.plan);
  if (!plan.features.includes(normalizedFeature)) {
    return { allowed: false, status: 403, error: `This provider's plan does not allow ${normalizedFeature}.` };
  }

  const limit = plan.limits?.[normalizedFeature];
  if (!isUnlimited(limit)) {
    const count = await countUsageFor(normalizedFeature, providerId);
    if (count >= limit) {
      return { allowed: false, status: 403, error: `This provider has reached the ${plan.name} plan limit of ${limit} ${normalizedFeature}.` };
    }
  }

  return { allowed: true, plan, user };
}

module.exports = {
  getPlan,
  getPlanList,
  buildSubscriptionSummary,
  requireFeature,
  requireProviderFeature,
};
