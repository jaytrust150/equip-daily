/**
 * Main Entry Point
 * 
 * Bootstraps the React application with:
 * - React 18 StrictMode for development warnings
 * - Root app component mounting
 * - Global CSS imports
 * - Error boundary for crash handling
 * - Monitoring and analytics integration
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './shared/ErrorBoundary.jsx'
import { initSentry } from './services/monitoring.js'

// Initialize Sentry error tracking
initSentry()

// Register service worker with update prompt
const updateSW = registerSW({
  onNeedRefresh() {
    const shouldRefresh = window.confirm('A new version is available. Reload now?')
    if (shouldRefresh) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.info('App is ready to work offline.')
  },
})

// Create React root and render App component with error boundary and strict mode
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
