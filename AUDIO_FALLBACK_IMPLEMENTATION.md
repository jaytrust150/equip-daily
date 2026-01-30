# Audio Fallback Implementation for NLT

**Author:** Jonathan Vargas — Sebastian, Florida

---

## Overview
Since NLT (New Living Translation) does not have audio available, we've implemented a clean fallback solution that:

1. ✅ Shows "WEB Audio" label when NLT is selected
2. ✅ Uses World English Bible (WEB) audio files (which are available)
3. ✅ Displays both NLT text AND WEB text side-by-side
4. ✅ Clear messaging that "Audio not available for NLT"

## What Changed

### 1. Constants (`src/config/constants.js`)
- Added `WEB_BIBLE_ID = '9879dbb7cfe39e4d-01'`
- Added `AUDIO_FALLBACK_VERSION` constant for when primary version lacks audio

### 2. BibleStudy Component (`src/pages/BibleStudy.jsx`)

#### New State Variables
- `audioVersion`: Tracks which version the audio is from (e.g., "WEB")
- `audioVerses`: Stores the text from the fallback audio version

#### Audio Effect Enhancement
When NLT is selected:
1. Detects that NLT needs audio fallback
2. Fetches WEB text from API.Bible
3. Loads WEB audio files
4. Sets `audioVersion` to "WEB" for UI display

#### UI Changes

**Audio Button:**
- Shows "WEB Audio" label below the play button when using fallback
- Audio plays from WEB version

**Bible Text Display:**
- Primary section: Shows NLT text (user's selected version)
- Secondary section (below): Shows WEB text with:
  - 🎧 Audio Version (WEB) header
  - Note: "Audio not available for NLT"
  - Slightly smaller font (95% of main text)
  - Gray text color for distinction

## User Experience

When user selects NLT:
1. Sees NLT text as primary content
2. Audio button shows "WEB Audio" indicator
3. Below NLT text, sees matching WEB text that corresponds to the audio
4. Clear message explains why different version for audio

## Technical Details

**Audio Files Location:** `/audio/[BookName]/[Chapter].mp3`
- Uses WEB audio files when NLT is selected
- Graceful error handling if audio file missing

**API Calls:**
- Primary call: Fetches NLT text
- Fallback call: Fetches WEB text (only when NLT selected)
- Both use same API.Bible endpoints with different `bibleId` parameters

## Benefits

✅ **User-Friendly:** Clear communication about why different version for audio
✅ **Clean Design:** Side-by-side text comparison
✅ **No Confusion:** Labels make it obvious which text matches the audio
✅ **Fallback-Ready:** System can easily be extended for other versions

## Future Enhancements

If more versions need audio fallback, simply:
1. Check version ID in the audio effect
2. Set appropriate `AUDIO_FALLBACK_VERSION`
3. UI automatically adapts

## Data Reference

From your Bible API data:
- NLT (`d6e14a625393b4da-01`): `audioBibles: []` ❌ No audio
- WEB (`9879dbb7cfe39e4d-01`): Has audio ID `105a06b6146d11e7-01` ✅

Other versions with audio available:
- Indian Revised Version Bengali
- Kannada Contemporary Version
- Malayalam Contemporary Version
- Tamil Indian Revised Version
- Telugu Contemporary Version
- Many more (see your data)

## Testing Checklist

- [ ] Select NLT version
- [ ] Verify "WEB Audio" label appears
- [ ] Click play button
- [ ] Verify audio plays
- [ ] Verify NLT text shows at top
- [ ] Verify WEB text shows below with header
- [ ] Switch to different chapter
- [ ] Verify both texts update correctly
- [ ] Switch to KJV or another version
- [ ] Verify fallback text disappears (only shows for NLT)
