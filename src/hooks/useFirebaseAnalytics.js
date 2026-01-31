/**
 * Firebase Analytics Hook
 * 
 * Integrates Firebase Analytics for user engagement tracking
 * Automatically tracks page views and provides event tracking
 */

import { useEffect } from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useAuth } from 'react-firebase-hooks/auth';
import { auth } from './firestoreService';

/**
 * Hook to initialize and manage Firebase Analytics
 */
export function useFirebaseAnalytics() {
  const [user] = useAuth(auth);

  useEffect(() => {
    try {
      const analytics = getAnalytics();

      // Track page view
      logEvent(analytics, 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
      });

      // Set user ID for logged-in users
      if (user) {
        logEvent(analytics, 'user_logged_in', {
          user_id: user.uid,
        });
      }
    } catch (error) {
      // Analytics may not be initialized in development
      if (!import.meta.env.PROD) {
        console.warn('Firebase Analytics not initialized:', error.message);
      }
    }
  }, [user]);

  return {
    trackCustomEvent: (eventName, eventData) => {
      try {
        const analytics = getAnalytics();
        logEvent(analytics, eventName, eventData);
      } catch (error) {
        console.warn(`Failed to track event '${eventName}':`, error);
      }
    },
  };
}

/**
 * Track Bible search event
 */
export const trackBibleSearch = (query, results_count) => {
  const analytics = getAnalytics();
  logEvent(analytics, 'bible_search', {
    search_query: query,
    results_count,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Bible chapter view
 */
export const trackBibleChapterView = (book, chapter) => {
  const analytics = getAnalytics();
  logEvent(analytics, 'bible_chapter_view', {
    book,
    chapter,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track devotional read
 */
export const trackDevotionalRead = (date) => {
  const analytics = getAnalytics();
  logEvent(analytics, 'devotional_read', {
    devotional_date: date,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track community reflection post
 */
export const trackReflectionPosted = (reflection_type) => {
  const analytics = getAnalytics();
  logEvent(analytics, 'reflection_posted', {
    reflection_type,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track audio playback
 */
export const trackAudioPlayback = (duration_seconds) => {
  const analytics = getAnalytics();
  logEvent(analytics, 'audio_played', {
    duration_seconds,
    timestamp: new Date().toISOString(),
  });
};
