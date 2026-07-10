import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)