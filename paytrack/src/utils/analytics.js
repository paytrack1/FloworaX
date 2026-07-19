// Lightweight Google Analytics (GA4) wrapper.
//
// Set VITE_GA_MEASUREMENT_ID in your environment (e.g. G-XXXXXXXXXX) to
// enable. Leaving it unset is completely safe — every function below
// becomes a no-op, so nothing breaks and nothing is sent to Google.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let initialized = false;

export function initAnalytics() {
  if (!GA_ID || initialized || typeof window === 'undefined') return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: true });
}

/**
 * Track a custom event. Safe to call even if analytics isn't enabled.
 * @param {string} name e.g. 'sign_up', 'booking_page_view', 'subscription_upgrade'
 * @param {object} params optional extra data, e.g. { plan: 'pro' }
 */
export function trackEvent(name, params = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

/** Track a virtual page view — useful since this app is a single-page tab switcher, not URL-routed. */
export function trackPageView(pageName) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', { page_title: pageName, page_location: window.location.href });
}
