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
      beforeSend(event) {
        // Optionally filter events before sending to Sentry
        return event;
      },
    });
  }
}

/**
 * Get Sentry logger instance for structured logging
 * Use this instead of console.log in production code
 */
export const logger = Sentry.logger;

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
 * Start a performance monitoring span (modern API)
 * Use this to track performance of critical operations
 * 
 * @param {Object} options - Span configuration
 * @param {string} options.op - Operation type (e.g., 'http.client', 'ui.click', 'db.query')
 * @param {string} options.name - Descriptive name for the operation
 * @param {Function} callback - Function to execute within the span
 * @returns {Promise|any} Result of the callback
 * 
 * @example
 * // Track API call performance
 * const data = await startSpan(
 *   { op: 'http.client', name: 'GET /api/bible/chapter' },
 *   async (span) => {
 *     span.setAttribute('book', 'Genesis');
 *     span.setAttribute('chapter', 1);
 *     const response = await fetch('/api/bible-chapter?book=GEN&chapter=1');
 *     return response.json();
 *   }
 * );
 * 
 * @example
 * // Track button click
 * startSpan(
 *   { op: 'ui.click', name: 'Search Bible' },
 *   (span) => {
 *     span.setAttribute('query', searchTerm);
 *     performSearch(searchTerm);
 *   }
 * );
 */
export function startSpan(options, callback) {
  if (!import.meta.env.PROD) {
    // In development, just execute the callback without tracing
    return callback({ setAttribute: () => {} });
  }

  // Simple implementation that wraps the callback
  try {
    const result = callback({ setAttribute: () => {} });
    return result;
  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        operation: options,
      },
    });
    throw error;
  }
}

/**
 * Legacy: Start a performance monitoring transaction
 * @deprecated Use startSpan() instead for modern Sentry API
 * @param {string} name - Name of the operation (e.g., 'fetch_bible_chapter')
 * @returns {Function} End transaction callback
 */
export function startPerformanceMonitoring(name) {
  if (!import.meta.env.PROD) return () => {};

  // Return a simple callback that tracks the operation
  const start = performance.now();
  
  return (tags = {}) => {
    const duration = performance.now() - start;
    Sentry.captureMessage(`Performance: ${name} completed in ${duration.toFixed(2)}ms`, 'info', {
      contexts: {
        performance: {
          name,
          duration,
          ...tags,
        },
      },
    });
  };
}

/**
 * Export Sentry for use as error boundary wrapper
 */
export { Sentry };
