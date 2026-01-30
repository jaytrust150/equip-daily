# Sentry + Vercel Setup Guide

**Last Updated:** January 30, 2026  
**Status:** Ready to Deploy

---

## Quick Setup (5 minutes)

### Step 1: Create Sentry Account
1. Go to https://sentry.io
2. Sign up with GitHub (recommended) or email
3. Choose **Free Plan** (includes 5,000 errors/month)

### Step 2: Create React Project
1. Click "Create Project"
2. Select **React** as platform
3. Name: `equip-daily`
4. Click "Create Project"

### Step 3: Copy Your DSN
After project creation, Sentry shows your DSN:
```
https://[YOUR_KEY]@[YOUR_ORG].ingest.sentry.io/[PROJECT_ID]
```

**Copy this entire URL** - you'll need it in Step 4.

### Step 4: Add DSN to Vercel
1. Go to https://vercel.com/dashboard
2. Select your **equip-daily** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name:** `VITE_SENTRY_DSN`
   - **Value:** (paste your DSN from Step 3)
   - **Environment:** Production, Preview, Development (all 3 checked)
6. Click **Save**

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click the **⋮** menu on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2 minutes)

**Done!** 🎉 Monitoring is now active.

---

## Verify It's Working

### Test Error Tracking
1. Visit your deployed app
2. Open browser console (F12)
3. Type: `throw new Error('Test error for Sentry')`
4. Press Enter
5. Go to Sentry dashboard → Issues
6. You should see the test error appear within 30 seconds

### Check Real-Time Monitoring
- **Errors:** Sentry dashboard → Issues
- **Performance:** Sentry dashboard → Performance
- **Session Replays:** Sentry dashboard → Replays (captured on errors)
- **Analytics:** Firebase Console → Analytics

---

## What's Being Monitored

### Automatic Error Capture
- ✅ JavaScript errors (unhandled exceptions)
- ✅ Promise rejections
- ✅ React component crashes (via ErrorBoundary)
- ✅ Network request failures
- ✅ Source maps for stack traces

### Performance Monitoring (10% sampling)
- ✅ Page load times
- ✅ Component render times
- ✅ API request durations
- ✅ Web Vitals (LCP, FID, CLS)

### Session Replays
- ✅ 10% of normal sessions recorded
- ✅ 100% of error sessions recorded
- ✅ User interactions captured
- ✅ Console logs included

### User Analytics (Firebase)
- ✅ Bible search queries
- ✅ Chapter views
- ✅ Devotional reads
- ✅ Reflection posts
- ✅ Audio playback duration

---

## Sentry Configuration

### Current Settings (src/services/monitoring.js)
```javascript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,  // 'production' or 'development'
  
  // Performance Monitoring
  tracesSampleRate: 0.1,              // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1,      // 10% of sessions
  replaysOnErrorSampleRate: 1.0,      // 100% when errors occur
  
  // Integration
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
})
```

### Why These Percentages?
- **10% transactions:** Captures performance trends without overwhelming quota
- **10% sessions:** Provides usage insights while staying within free tier
- **100% errors:** Never miss a bug - all crashes get full context

---

## Development vs Production

### Development Mode (local)
- Sentry is **disabled**
- Errors logged to console only
- No network calls to Sentry
- ErrorBoundary shows full stack traces

### Production Mode (Vercel)
- Sentry is **enabled**
- Errors sent to dashboard
- Session replays captured
- ErrorBoundary shows user-friendly message

---

## Viewing Errors in Sentry

### Dashboard Sections
1. **Issues** - All captured errors
   - Click any error to see:
     - Full stack trace
     - User device/browser
     - Breadcrumbs (user actions before error)
     - Session replay (if captured)

2. **Performance** - Transaction timing
   - Page load speeds
   - API call durations
   - Component render times

3. **Releases** - Version tracking
   - Errors per deployment
   - Regression detection
   - Source map uploads

4. **Alerts** - Notifications
   - Email on new errors
   - Slack integration
   - Custom rules

---

## Setting Up Alerts (Optional)

### Email Notifications
1. Go to Sentry project → **Settings** → **Alerts**
2. Click **Create Alert Rule**
3. Choose **Issues** alert type
4. Set conditions:
   - **When:** "An issue is first seen"
   - **Then:** "Send a notification to all project members"
5. Save

### Slack Integration (Recommended)
1. Go to Sentry → **Settings** → **Integrations**
2. Find **Slack** and click **Install**
3. Authorize Slack workspace
4. Choose channel (e.g., `#errors`)
5. Errors now appear in Slack in real-time

---

## Free Tier Limits

**Sentry Free Plan:**
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 replays/month
- 1 project
- 7-day data retention

**With our 10% sampling:**
- ~50,000 real users/month = 5,000 tracked errors
- ~100,000 page loads/month = 10,000 transactions
- ~500 error sessions/month = 50 replays

**More than enough for current scale.**

---

## Troubleshooting

### "No errors appearing in Sentry"
1. Check VITE_SENTRY_DSN is set in Vercel
2. Verify you redeployed after adding DSN
3. Check browser console for Sentry init errors
4. Ensure you're testing in production (not localhost)

### "Source maps not working"
- Source maps are auto-generated by Vite
- Stack traces should show original code locations
- If not, check build logs for map generation

### "Too many errors captured"
- Reduce `tracesSampleRate` to 0.05 (5%)
- Reduce `replaysSessionSampleRate` to 0.05 (5%)
- Add ignore rules in Sentry dashboard

---

## Next Steps

After Sentry is active:

1. **Monitor first week** - Check dashboard daily
2. **Fix critical errors** - Address any crashes
3. **Set up alerts** - Get notified of new issues
4. **Review performance** - Identify slow operations
5. **Adjust sampling** - Increase if under quota

---

## Support

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Firebase Analytics:** https://console.firebase.google.com
- **Questions?** Check CODE_DOCUMENTATION.md or MONITORING_SETUP.md

---

**Ready to activate monitoring!** Follow the 5 steps above and you're done. 🚀
