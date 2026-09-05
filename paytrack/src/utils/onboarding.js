// Single source of truth for "where is this owner in onboarding".
// Previously this was three independent boolean checks scattered directly
// inside App.jsx (!user.emailVerified, !user.businessType, role === 'admin')
// with no shared concept of "step". Centralizing it here means adding a
// future step (e.g. a payment-setup step) is a one-line change here plus
// one new case in App.jsx, instead of hunting through render logic.
//
// Returns:
//   'verify-email'     — user.emailVerified is false
//   'business-profile'  — emailVerified but no businessType set yet
//   'complete'          — fully onboarded, render the real app
export function getOnboardingStep(user) {
  if (!user) return null;
  if (!user.emailVerified) return 'verify-email';
  if (!user.businessType) return 'business-profile';
  return 'complete';
}
