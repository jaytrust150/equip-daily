# Vercel Environment Variables Setup

**Author:** Jonathan Vargas — Sebastian, Florida

---

## ✅ Code Changes Deployed
Your code changes have been pushed to GitHub and Vercel will automatically deploy them.

## 🔑 Required Environment Variables in Vercel

Make sure these are set in your Vercel Dashboard:

### Production Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Set these variables for Production, Preview, and Development:**

```
VITE_FIREBASE_API_KEY=AIzaSyDzP0xxYVMyu-GPHX2EPSsk9BF17OxDttc
VITE_FIREBASE_AUTH_DOMAIN=equip-daily.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=equip-daily
VITE_FIREBASE_STORAGE_BUCKET=equip-daily.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=449502753790
VITE_FIREBASE_APP_ID=1:449502753790:web:b7aae5c4ba0300d08a06af

VITE_BIBLE_API_KEY=62vlBtnuEnjYym5Wj9OH2
VITE_BIBLE_ID=d6e14a625393b4da-01

BIBLE_API_KEY=62vlBtnuEnjYym5Wj9OH2
```

**Important Notes:**
- `VITE_BIBLE_API_KEY` is used by frontend during development
- `BIBLE_API_KEY` is used by serverless functions (keeps key secure on server)
- Both should have the same value: `62vlBtnuEnjYym5Wj9OH2`

## 🔧 What Was Fixed

### 1. API Endpoint (Critical Fix)
- **Before:** `https://api.scripture.api.bible/v1/` (for 32-char keys)
- **After:** `https://rest.api.bible/v1/` (for 21-char keys)

### 2. Query Parameters Added
Now includes required parameters for proper verse parsing:
- `content-type=json`
- `include-verse-numbers=true`
- `include-titles=true`
- `include-chapter-numbers=true`
- `include-verse-spans=true`

### 3. Default Bible Version
- Set to licensed NLT: `d6e14a625393b4da-01`
- Exported as `DEFAULT_BIBLE_VERSION` constant

### 4. Files Updated
- ✅ `/api/bible-chapter.js` - Fixed endpoint + added query params
- ✅ `/api/bible-search.js` - Fixed endpoint
- ✅ `/src/pages/BibleStudy.jsx` - Fixed endpoint + added query params
- ✅ `/src/components/Shared/SearchWell.jsx` - Fixed endpoint
- ✅ `/src/config/constants.js` - Added NLT_BIBLE_ID and DEFAULT_BIBLE_VERSION

## 🧪 Testing Your Deployment

### After Vercel Deploys (2-3 minutes):

1. **Check Deployment Status**: 
   Visit: https://vercel.com/dashboard

2. **Test Your Live Site**:
   ```
   Open: https://your-site.vercel.app
   Go to: Bible Study page
   Select: Any book and chapter
   Expected: Verses should load successfully
   ```

3. **Test API Endpoints**:
   ```bash
   # Test chapter endpoint
   curl "https://your-site.vercel.app/api/bible-chapter?bibleId=d6e14a625393b4da-01&bookId=GEN&chapter=1"
   
   # Test search endpoint
   curl "https://your-site.vercel.app/api/bible-search?bibleId=d6e14a625393b4da-01&query=love"
   ```

## ⚠️ Common Issues

### Issue: "401 Unauthorized" or "403 Forbidden"
**Solution:** Check that `BIBLE_API_KEY` is set in Vercel environment variables

### Issue: Verses not showing
**Solution:** 
1. Verify `VITE_BIBLE_ID=d6e14a625393b4da-01` is set
2. Check browser console for errors
3. Verify deployment completed successfully

### Issue: Old code still running
**Solution:** 
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Wait for deployment to complete (check Vercel dashboard)
3. Verify latest commit is deployed

## 📝 Deployment Checklist

- [x] Code changes committed and pushed to GitHub
- [x] API endpoint changed from `api.scripture.api.bible` to `rest.api.bible`
- [x] Query parameters added for proper verse parsing
- [x] Default Bible ID set to licensed NLT
- [ ] Verify environment variables in Vercel Dashboard
- [ ] Wait for Vercel deployment to complete (~2-3 min)
- [ ] Test live site with Bible Study page
- [ ] Test search functionality

## 🎉 Expected Results

After deployment:
- ✅ Bible verses load correctly in NLT translation
- ✅ Search works across all Bible content
- ✅ No 401/403 errors
- ✅ Verse numbers display properly
- ✅ Chapter titles appear correctly
