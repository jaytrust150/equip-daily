# Monitoring & Analytics Documentation

**Author:** Jonathan Vargas — Sebastian, Florida

---

## Overview

The equip-daily application includes comprehensive monitoring and analytics to track errors, performance, and user engagement.

## Monitoring Stack

### 1. **Sentry** - Error Tracking & Performance Monitoring
- **Purpose**: Captures application errors, exceptions, and performance metrics
- **Coverage**: All unhandled errors, React component crashes, API failures
- **Data Captured**:
  - Error stack traces with source maps
  - User session information
  - Browser/device details
  - Performance metrics (Web Vitals)
  - Session replays on errors

**Setup**:
```bash
# Already installed: @sentry/react
npm install --save @sentry/react
```

**Configuration** (src/services/monitoring.js):
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // Sample 10% for performance
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Always capture error replays
});
```

**Usage**:
```javascript
import { captureError, startPerformanceMonitoring } from './services/monitoring';

// Capture error with context
try {
  // some code
} catch (error) {
  captureError(error, { context: 'bible_search' });
}

// Monitor performance
const endMonitoring = startPerformanceMonitoring('fetch_bible_chapter');
// ... perform operation
endMonitoring({ book: 'John', chapter: 3 });
```

### 2. **Firebase Analytics** - User Engagement Tracking
- **Purpose**: Tracks user behavior and app usage patterns
- **Built-in**: No additional setup needed (uses existing Firebase)
- **Events Tracked**:
  - Page views
  - Bible searches
  - Devotional reads
  - Community reflections posted
  - Audio playback
  - User authentication

**Available Tracking Functions** (src/hooks/useFirebaseAnalytics.js):
```javascript
import {
  trackBibleSearch,
  trackBibleChapterView,
  trackDevotionalRead,
  trackReflectionPosted,
  trackAudioPlayback,
} from './hooks/useFirebaseAnalytics';

// Track Bible search
trackBibleSearch('faith', 156);

// Track devotional read
trackDevotionalRead('2.14');

// Track audio playback
trackAudioPlayback(120);
```

### 3. **Error Boundary** - React Component Error Handling
- **Location**: src/shared/ErrorBoundary.jsx
- **Purpose**: Catches React component errors before crashing the app
- **Features**:
  - User-friendly error page
  - Automatic Sentry error capture
  - Error reset/recovery options
  - Development error details

**Usage** (already in main.jsx):
```jsx
import ErrorBoundary from './shared/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Configuration

### Environment Variables

Add to your `.env` file:
```env
# Sentry Configuration
VITE_SENTRY_DSN=https://[key]@[project].ingest.sentry.io/[id]

# Firebase Analytics (automatic - no additional env var needed)
```

### Setting Up Sentry

1. **Create Sentry Account**: https://sentry.io/
2. **Create Project**: Select "React" as platform
3. **Copy DSN**: Available in Settings → Client Keys (DSN)
4. **Add to .env**:
   ```env
   VITE_SENTRY_DSN=your_dsn_here
   ```
5. **Deploy**: Sentry only initializes in production (`PROD` mode)

### Vercel Deployment

Add environment variable in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `VITE_SENTRY_DSN` with your Sentry DSN
3. Rebuild and deploy

---

## Monitoring Best Practices

### 1. Error Handling
```javascript
import { captureError } from './services/monitoring';

try {
  // risky operation
} catch (error) {
  // Log and track the error
  captureError(error, {
    operation: 'fetchBibleChapter',
    params: { book, chapter },
    severity: 'high',
  });
  
  // Show user feedback
  setError('Failed to load Bible chapter');
}
```

### 2. Performance Monitoring
```javascript
import { startPerformanceMonitoring } from './services/monitoring';

const endMonitoring = startPerformanceMonitoring('search_operation');

// ... perform search
setTimeout(() => {
  endMonitoring({
    resultsCount: results.length,
    queryLength: query.length,
  });
}, 0);
```

### 3. Event Tracking
```javascript
import { trackBibleSearch } from './hooks/useFirebaseAnalytics';

const handleSearch = async (query) => {
  const results = await searchBible(query);
  
  // Track the search event
  trackBibleSearch(query, results.length);
};
```

---

## Accessing Monitoring Data

### Sentry Dashboard
- **URL**: https://sentry.io/organizations/[org]/issues/
- **View**:
  - Recent errors and crashes
  - Performance trends
  - Session replays (on errors)
  - Release tracking
  - Alerts and notifications

### Firebase Analytics
- **Location**: Firebase Console → Analytics → Dashboard
- **View**:
  - User engagement metrics
  - Top events
  - Event parameters
  - User demographics
  - Retention analysis

---

## Events Being Tracked

| Event | Source | Data |
|-------|--------|------|
| `page_view` | Auto | page_title, page_location |
| `user_logged_in` | Auto (on auth) | user_id |
| `bible_search` | Manual | search_query, results_count |
| `bible_chapter_view` | Manual | book, chapter |
| `devotional_read` | Manual | devotional_date |
| `reflection_posted` | Manual | reflection_type |
| `audio_played` | Manual | duration_seconds |

---

## Development vs Production

### Development (`npm run dev`)
- Sentry: **Disabled** (logs to console instead)
- Firebase Analytics: **Active** (but limited - development events)
- Error Boundary: **Active** (shows detailed error info)
- Console Logging: **Enabled** (detailed debug info)

### Production (`vercel` or deployed)
- Sentry: **Enabled** (10% transaction sampling)
- Firebase Analytics: **Active** (full tracking)
- Error Boundary: **Active** (user-friendly fallback)
- Console Logging: **Disabled** (clean console)

---

## Troubleshooting

### Sentry Not Capturing Errors
1. Verify `VITE_SENTRY_DSN` is set in production
2. Check that app is running in production mode
3. Confirm error is not caught silently elsewhere
4. Check Sentry project settings for rate limits

### Firebase Analytics Not Recording
1. Verify Firebase project has Analytics enabled
2. Check that app has internet connectivity
3. Allow 24 hours for data to appear in dashboard
4. Check Firebase console for errors

### Performance Issues
- Sentry transaction sampling is set to 10% by default
- Increase `tracesSampleRate` carefully (performance impact)
- Monitor bundle size: monitoring adds ~100KB (gzipped: ~30KB)

---

## Future Enhancements

- [ ] Custom Sentry dashboards for specific error types
- [ ] Slack/Email alerts for critical errors
- [ ] Performance budget tracking
- [ ] User satisfaction tracking (CSAT)
- [ ] Custom analytics events for new features
- [ ] A/B testing framework integration

---

## Support

For questions about monitoring setup:
1. Check Sentry docs: https://docs.sentry.io/product/
2. Check Firebase Analytics: https://firebase.google.com/docs/analytics
3. Review monitoring configuration in: `src/services/monitoring.js`
