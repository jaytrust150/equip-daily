# Deployment Guide - Equip Daily

**Author:** Jonathan Vargas — Sebastian, Florida

---

## 🚀 Deploying to Vercel

### Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### Step 2: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Import Project**: Click "Add New" → "Project"
3. **Connect Git Repository**: Select your GitHub repository `jaytrust150/equip-daily`
4. **Configure Project**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### Required Environment Variables:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `equip-daily.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `equip-daily` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `equip-daily.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging ID | `449502753790` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:449502...` |
| `BIBLE_API_KEY` | Bible API Key from api.bible (server-side) | `ei2xq...` |

**Important**: 
- Set these for **Production**, **Preview**, and **Development** environments.
- `BIBLE_API_KEY` (without VITE_ prefix) is used by serverless functions - keep it secure!
- The old `VITE_BIBLE_API_KEY` is no longer needed (API calls now go through serverless proxy)

### Step 4: Deploy
Click "Deploy" and Vercel will build and deploy your app automatically.

---

## 🔐 Bible API Setup (api.bible)

### Architecture: Serverless Proxy Pattern

**✅ Implemented!** Your app now uses a secure serverless proxy:

```
Frontend → /api/bible-chapter → API.Bible
Frontend → /api/bible-search   → API.Bible
```

**Benefits:**
- 🔒 API key stays on server (not exposed in browser)
- 🌐 No CORS issues
- 🛡️ No security alerts from GitHub
- ✅ Works on Vercel out of the box

### Current Configuration:
- **Default Bible Version**: NLT (New Living Translation)
- **Bible ID**: `d6e14a625393b4da-01`
- **API Endpoint**: Proxied through `/api/bible-*` endpoints
- **Serverless Functions**: 
  - `/api/bible-chapter.js` - Fetches chapters
  - `/api/bible-search.js` - Performs searches

### Setup Instructions:

1. **Get API Key**: 
   - Go to https://scripture.api.bible
   - Sign up/Login
   - Create an application with your Vercel URL
   - Copy your API key

2. **Add to Vercel**:
   - Vercel Dashboard → Environment Variables
   - Add `BIBLE_API_KEY` (without VITE_ prefix)
   - This key stays on the server side only

3. **No Domain Whitelisting Needed!**:
   - ✅ API calls come from Vercel servers (not browser)
   - ✅ No CORS issues
   - ✅ Domain restrictions don't apply to server-side calls

---

## 🔥 Firestore Configuration

### Do You Need Bible API Key in Firestore?

**Answer: NO** ❌

The Bible API key should **NOT** be stored in Firestore because:

1. **Client-Side Usage**: The API calls are made directly from the browser/client
2. **Environment Variables**: Vite handles client-side env vars with `VITE_` prefix
3. **Security**: API key is exposed in client code anyway (it's domain-restricted)
4. **Simplicity**: No need for additional database calls to fetch the key

### What IS Stored in Firestore:
- ✅ User authentication data
- ✅ User notes and highlights
- ✅ User preferences (theme, selected version)
- ✅ Reading progress
- ❌ API keys (handled via environment variables)

---

## 🧪 Health Check - Current Issues

### Issue 1: Environment Variable Name Inconsistency

**Problem**: Two different variable names were used  
**Status**: ✅ FIXED - Now using serverless proxy pattern

**New Architecture:**
- Frontend no longer needs `VITE_BIBLE_API_KEY`
- Server-side uses `BIBLE_API_KEY` (secure, not exposed)
- API calls go through `/api/bible-*` endpoints

### Issue 2: API Authorization & CORS

**Previous Behavior**: 
- Direct API calls from browser
- CORS errors possible
- API key exposed in client code

**Current Behavior**: ✅ FIXED
- Serverless proxy handles all API calls
- No CORS issues
- API key stays secure on server
- Cleaner error handling

---

## 📋 Deployment Checklist

- [ ] Environment variables added to Vercel (7 variables including `BIBLE_API_KEY`)
- [ ] Vercel deployment successful
- [ ] Serverless functions deployed (`/api/bible-chapter.js`, `/api/bible-search.js`)
- [ ] Test Bible text loading
- [ ] Test Bible search functionality
- [ ] Test user authentication
- [ ] Test notes and highlights
- [ ] ~~Domain whitelisted in api.bible~~ ✅ Not needed (using serverless proxy)
- [ ] Firebase authorized domains updated

---

## 🔧 Testing Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📞 Troubleshooting

### "Unauthorized" Error
- ✅ No longer an issue with serverless proxy!
- If you still see it: Check `BIBLE_API_KEY` is set in Vercel
- Verify the key is valid in scripture.api.bible
- Check Vercel function logs for errors

### Build Fails
- Ensure all environment variables are set
- Check for TypeScript/ESLint errors
- Run `npm run build` locally first
- Verify `/api/` folder is included in deployment

### Serverless Function Errors
- Check Vercel Function logs (Dashboard → Functions)
- Verify `BIBLE_API_KEY` environment variable is set
- Test locally: `vercel dev` (requires Vercel CLI)
- Make sure `/api/*.js` files are in your repo

### Firebase Auth Issues
- Verify Firebase config in Vercel
- Add Vercel domain to Firebase authorized domains
- Check Firebase console for auth settings
