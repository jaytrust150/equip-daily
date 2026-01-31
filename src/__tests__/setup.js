/**
 * Test Setup Configuration
 * 
 * Configures the test environment:
 * - Sets up DOM testing library
 * - Mocks Firebase and external APIs
 * - Provides global test utilities
 */

import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Mock: no user logged in by default
    callback(null)
    return () => {}
  }),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ docs: [] })
    return () => {}
  }),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
}))

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(() => [null, false, null]),
  useAuth: vi.fn(() => [null, false, null]),
}))

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  startTransaction: vi.fn(() => ({
    setTag: vi.fn(),
    finish: vi.fn(),
  })),
  startSpan: vi.fn((options, callback) => callback({ setAttribute: vi.fn() })),
  Replay: vi.fn(() => ({})),
  consoleLoggingIntegration: vi.fn(() => ({})),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
  withErrorBoundary: vi.fn((component) => component),
}))

// Mock environment variables
process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
process.env.VITE_SENTRY_DSN = ''

// Global test utilities
global.matchMedia = global.matchMedia || function () {
  return {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
