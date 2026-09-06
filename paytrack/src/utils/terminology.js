// Central place for words that should change based on what kind of business
// the owner picked during onboarding (BusinessTypeOnboarding.jsx). Nothing
// about data or routes changes here â€” this is display text only. A church's
// "Members" are stored in the exact same Customer collection as a regular
// business's "Customers"; this file just decides what to call them on screen.
//
// To support another business type's wording, add a key here â€” nothing
// else in the app needs to change.
const TERMINOLOGY = {
  church: {
    customerPlural: 'Members',
    customerSingular: 'Member',
    bookingPlural: 'Services',
    bookingSingular: 'Service',
  },
};

const DEFAULT_TERMINOLOGY = {
  customerPlural: 'Customers',
  customerSingular: 'Customer',
  bookingPlural: 'Bookings',
  bookingSingular: 'Booking',
};

export function getTerminology(businessType) {
  const key = (businessType || '').toLowerCase();
  return TERMINOLOGY[key] || DEFAULT_TERMINOLOGY;
}
