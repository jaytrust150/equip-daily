/**
 * Application Monitoring & Analytics Setup
 * 
 * Initializes:
 * - Sentry for error tracking and performance monitoring
 * - Firebase Analytics for user engagement tracking
 * - Custom event tracking for user interactions
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry Error Tracking & Performance Monitoring
 * Only initializes in production/staging to avoid noise in development
 * 
 * Features:
 * - Automatic error and exception tracking
 * - Performance monitoring (Web Vitals)
 * - Session replay for debugging
 * - Source map support
 */
export function initSentry() {
  // Only initialize Sentry in production builds
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || "",
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1, // Sample 10% of transactions for performance monitoring
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions for replay
      replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event) {
        // Optionally filter events before sending to Sentry
        return event;
      },
    });
  }
}

/**
 * Initialize Firebase Analytics
 * Tracks user engagement with the application
 * 
 * Events tracked:
 * - Page views
 * - User interactions (Bible searches, devotional reads, etc.)
 * - Feature usage
 */
export function initFirebaseAnalytics(analytics) {
  if (!analytics) return;

  // Set user properties if available
  try {
    // User properties can be set here when user logs in
    // analytics.setUserProperties({ ... })
  } catch (error) {
    console.warn("Failed to set Firebase analytics properties:", error);
  }
}

/**
 * Track custom event for analytics
 * @param {string} eventName - Name of the event (e.g., 'bible_search', 'devotional_read')
 * @param {Object} eventData - Additional event data
 * @param {Object} analytics - Firebase analytics instance
 */
export function trackEvent(eventName, eventData = {}, analytics = null) {
  // Firebase Analytics tracking
  if (analytics) {
    try {
      analytics.logEvent(eventName, {
        timestamp: new Date().toISOString(),
        ...eventData,
      });
    } catch (error) {
      console.warn(`Failed to track analytics event '${eventName}':`, error);
    }
  }

  // Sentry Performance Monitoring
  if (import.meta.env.PROD) {
    try {
      Sentry.captureMessage(`User Event: ${eventName}`, "info", {
        contexts: {
          event: eventData,
        },
      });
    } catch (error) {
      console.warn(`Failed to track Sentry event '${eventName}':`, error);
    }
  }
}

/**
 * Capture user error with context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context about the error
 */
export function captureError(error, context = {}) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        errorContext: context,
      },
    });
  } else {
    // Log to console in development
    console.error("Captured Error:", error, context);
  }
}

/**
 * Start a performance monitoring transaction
 * @param {string} name - Name of the operation (e.g., 'fetch_bible_chapter')
 * @returns {Function} End transaction callback
 */
export function startPerformanceMonitoring(name) {
  if (!import.meta.env.PROD) return () => {};

  const transaction = Sentry.startTransaction({
    name,
    op: "task",
  });

  return (tags = {}) => {
    Object.entries(tags).forEach(([key, value]) => {
      transaction.setTag(key, value);
    });
    transaction.finish();
  };
}

/**
 * Export Sentry for use as error boundary wrapper
 */
export { Sentry };
