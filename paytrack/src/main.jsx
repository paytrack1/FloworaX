import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import * as Sentry from '@sentry/react'
import { initAnalytics } from './utils/analytics'
import './index.css'
import App from './App.jsx'

// ── Analytics (Google Analytics 4) ──
initAnalytics();

// ── Error monitoring (Sentry) ──
// Set VITE_SENTRY_DSN in your environment to enable. Leaving it unset is
// safe — Sentry just never initializes and the app behaves exactly as before.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Check for a new service worker every 60 seconds while the app is open
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
  onNeedRefresh() {
    // A new version is available — activate it and reload immediately
    updateSW(true);
  },
})

const AppTree = (
  <StrictMode>
    <App />
  </StrictMode>
);

createRoot(document.getElementById('root')).render(
  import.meta.env.VITE_SENTRY_DSN ? (
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 24 }}>Something went wrong. Please refresh the page.</p>}>
      {AppTree}
    </Sentry.ErrorBoundary>
  ) : (
    AppTree
  )
)
