# 🔐 Serverless Proxy Implementation Guide

**Author:** Jonathan Vargas — Sebastian, Florida

---

## What Changed (and Why It's Better!)

### ❌ Old Way (Insecure)
```javascript
// API key exposed in browser code
const response = await fetch('https://api.scripture.api.bible/...', {
  headers: { 'api-key': 'YOUR_KEY_HERE' } // ⚠️ Visible to everyone!
});
```

**Problems:**
- 🚨 API key visible in browser DevTools
- 🚨 GitHub security alerts
- 🚨 CORS errors
- 🚨 Anyone can steal your key

### ✅ New Way (Secure)
```javascript
// Frontend calls your serverless function
const response = await fetch('/api/bible-chapter?bibleId=...&bookId=...&chapter=...');
```

**Benefits:**
- 🔒 API key stays on server (never exposed)
- 🛡️ No GitHub security alerts
- 🌐 No CORS issues
- ✅ Professional architecture

---

## How It Works

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │────────▶│ Vercel Function  │────────▶│  API.Bible  │
│  (Frontend) │         │  /api/bible-*    │         │   Server    │
└─────────────┘         └──────────────────┘         └─────────────┘
                              ▲
                              │
                        API key stored here
                        (secure environment variable)
```

1. **Frontend** calls `/api/bible-chapter` (your Vercel serverless function)
2. **Serverless function** reads `BIBLE_API_KEY` from environment
3. **Function** calls API.Bible with the key
4. **Function** returns data to frontend
5. **User** never sees the API key!

---

## File Structure

```
your-project/
├── api/                          # ← Serverless functions
│   ├── bible-chapter.js          # Proxies chapter requests
│   └── bible-search.js           # Proxies search requests
├── src/
│   ├── components/
│   │   └── Shared/
│   │       └── SearchWell.jsx    # ← Updated to use /api/bible-search
│   └── pages/
│       └── BibleStudy.jsx        # ← Updated to use /api/bible-chapter
└── vercel.json                   # Vercel configuration
```

---

## The Code

### 1. Serverless Function (`/api/bible-chapter.js`)

```javascript
export default async function handler(request, response) {
  // Get parameters from frontend
  const { bibleId, bookId, chapter } = request.query;
  
  // Get API key from secure environment (NOT from frontend!)
  const API_KEY = process.env.BIBLE_API_KEY;
  
  // Call API.Bible
  const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${bookId}.${chapter}?content-type=json`;
  const apiResponse = await fetch(url, {
    headers: { 'api-key': API_KEY } // ✅ Key never leaves server
  });
  
  const data = await apiResponse.json();
  return response.status(200).json(data); // Send to frontend
}
```

### 2. Frontend Code (BibleStudy.jsx)

**Before:**
```javascript
// ❌ Old way - API key exposed
const url = `https://api.scripture.api.bible/v1/bibles/${version}/chapters/${bookId}.${chapter}`;
const response = await fetch(url, {
  headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY } // Exposed!
});
```

**After:**
```javascript
// ✅ New way - secure proxy
const url = `/api/bible-chapter?bibleId=${version}&bookId=${bookId}&chapter=${chapter}`;
const response = await fetch(url); // No API key needed!
```

---

## Environment Variables

### Local Development (`.env`)
```bash
BIBLE_API_KEY=your_api_key_here
```

### Vercel Production
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add: `BIBLE_API_KEY` = `your_api_key_here`
4. **Important:** No `VITE_` prefix! (server-side only)

---

## Testing

### Test Locally (with Vercel CLI)
```bash
# Install Vercel CLI
npm i -g vercel

# Run local dev server (simulates serverless functions)
vercel dev

# Test in browser
# http://localhost:3000
```

### Test Endpoints Directly
```bash
# Test chapter endpoint
curl "http://localhost:3000/api/bible-chapter?bibleId=de4e12af7f28f599-01&bookId=JHN&chapter=3"

# Test search endpoint
curl "http://localhost:3000/api/bible-search?bibleId=de4e12af7f28f599-01&query=love&limit=5"
```

---

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add `BIBLE_API_KEY` environment variable
4. Deploy automatically!

### Option 2: Vercel CLI
```bash
# Login
vercel login

# Deploy
vercel --prod

# Add environment variable
vercel env add BIBLE_API_KEY production
```

---

## FAQ

### Q: Do I need to whitelist my domain in API.Bible?
**A: NO!** ✅ With serverless functions, API calls come from Vercel's servers (not your browser), so domain whitelisting doesn't apply.

### Q: Can people still see my API key?
**A: NO!** 🔒 The key lives in Vercel's secure environment. It never appears in:
- Browser DevTools
- Network tab
- Source code
- JavaScript bundles

### Q: What about CORS errors?
**A: Fixed!** 🌐 Since you're calling your own domain (`/api/...`), there are no cross-origin requests.

### Q: Does this cost more?
**A: NO!** 💰 Vercel's free tier includes:
- 100GB bandwidth
- 100,000 serverless function invocations/month
- More than enough for most apps!

### Q: Can I still use this locally?
**A: YES!** ✅ Two options:
1. Use `vercel dev` (simulates serverless functions)
2. Add `BIBLE_API_KEY` to `.env` file

### Q: What if my serverless function fails?
**A: Check logs!** 🔍
- Vercel Dashboard → Your Project → Functions
- View real-time logs and errors
- Debug any issues

---

## Common Errors & Solutions

### Error: "BIBLE_API_KEY not configured"
**Solution:** Add environment variable in Vercel Dashboard

### Error: "Failed to fetch"
**Solution:** 
- Check `/api/` folder exists in deployment
- Verify Vercel detected your serverless functions
- Check function logs in Vercel Dashboard

### Error: "API error: 401"
**Solution:** 
- Verify your API.Bible key is valid
- Check you copied the correct key to Vercel
- Try generating a new key at scripture.api.bible

---

## Benefits Summary

| Feature | Old (Direct) | New (Proxy) |
|---------|-------------|-------------|
| **Security** | ❌ Key exposed | ✅ Key hidden |
| **CORS** | ⚠️ Can fail | ✅ No issues |
| **GitHub Alerts** | 🚨 Detected | ✅ None |
| **Domain Whitelisting** | ⚠️ Required | ✅ Not needed |
| **Professional** | ❌ Not recommended | ✅ Industry standard |
| **Cost** | Free | Free |

---

## Next Steps

1. ✅ Code is already updated!
2. 🔄 Push to GitHub
3. 🚀 Deploy to Vercel
4. ⚙️ Add `BIBLE_API_KEY` environment variable
5. ✅ Test your app
6. 🎉 Enjoy secure Bible API access!

**You're all set!** The serverless proxy is implemented and ready to deploy. 🚀
