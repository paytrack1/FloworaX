export const getModulesForBusinessType = (businessType) => {
  const base = ['home', 'expenses', 'customers', 'settings', 'events', 'communications', 'team'];

  const map = {
    // Bookings + Payments
    therapist:  [...base, 'bookings', 'sales', 'invoices'],
    consultant: [...base, 'bookings', 'sales', 'invoices'],
    coach:      [...base, 'bookings', 'sales', 'invoices'],
    lawyer:     [...base, 'bookings', 'sales', 'invoices'],
    doctor:     [...base, 'bookings', 'sales', 'invoices'],
    tutor:      [...base, 'bookings', 'sales', 'invoices'],
    salon:      [...base, 'bookings', 'sales'],
    fitness:    [...base, 'bookings', 'sales'],

    // Payments and Invoicing Only
    agency:     [...base, 'sales', 'invoices'],
    freelancer: [...base, 'sales', 'invoices'],
    contractor: [...base, 'sales', 'invoices'],

    // Finance and Expense Tracking
    church:     [...base, 'sales', 'finance', 'reports'],
    ngo:        [...base, 'sales'],

    clinic:     [...base, 'bookings', 'sales', 'invoices'],
    school:     [...base, 'sales', 'invoices'],
    other:      [...base, 'bookings', 'sales', 'invoices'],
    // Full Business
    shop:       [...base, 'sales', 'invoices'],
    event:      [...base, 'sales', 'invoices'],
    full:       [...base, 'bookings', 'sales', 'invoices'],

    // Current onboarding picker categories (BusinessTypeOnboarding.jsx).
    // These MUST stay in sync with getModulesForBusinessType() in that file -
    // this map is only a fallback for accounts with no saved `modules` array.
    health_wellness:        [...base, 'bookings', 'invoices', 'finance', 'reports', 'events'],
    professional_services:  [...base, 'bookings', 'invoices', 'finance', 'reports', 'events'],
    education_nonprofits:   [...base, 'events', 'invoices', 'finance', 'reports'],
    business_retail:        [...base, 'sales', 'invoices', 'finance', 'reports'],
    complete_business_os:   [...base, 'sales', 'bookings', 'invoices', 'finance', 'reports', 'events'],
  };

  return map[businessType?.toLowerCase()] || [...base, 'sales'];
};

/**
 * Modules that are always available regardless of what the person picked
 * in the onboarding checklist - they were never pickable options there
 * (see MODULE_OPTIONS in BusinessTypeOnboarding.jsx), so they must be
 * unioned in rather than overridden by user.modules.
 *
 * NOTE: 'team' is intentionally excluded here for now (hidden from nav
 * until the business needs staff management at scale) - the TeamManagement
 * page and backend routes are untouched, just not linked from nav. Add
 * 'team' back to this list to re-enable it later.
 */
const ALWAYS_ON_MODULES = ['home', 'expenses', 'settings'];

/**
 * The real source of truth for what's enabled for a given user: their own
 * saved module selection from onboarding/Settings (`user.modules`), unioned
 * with the always-on modules that were never part of that picker. Falls
 * back to a businessType-based default only for accounts that never went
 * through the module picker (e.g. very old signups, or a missing/corrupted
 * modules array).
 */
export const getEnabledModules = (user) => {
  const picked = Array.isArray(user?.modules) && user.modules.length > 0
    ? user.modules
    : getModulesForBusinessType(user?.businessType);
  return [...new Set([...ALWAYS_ON_MODULES, ...picked])];
};
