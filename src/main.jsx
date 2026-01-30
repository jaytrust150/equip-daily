/**
 * Main Entry Point
 * 
 * Bootstraps the React application with:
 * - React 18 StrictMode for development warnings
 * - Root app component mounting
 * - Global CSS imports
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Create React root and render App component in StrictMode
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
