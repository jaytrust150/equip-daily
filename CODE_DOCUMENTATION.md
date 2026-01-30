# Equip Daily - Code Documentation
**Generated:** January 30, 2026
**Purpose:** Document each component's functionality for AI context and debugging

---

## 🏗️ PROJECT STRUCTURE

### Core Application Files

#### **src/App.jsx** (549 lines)
**Purpose:** Main application component and router
**Functionality:**
- Manages global state (user auth, theme, active tab navigation)
- Handles tab switching between Home, Devotional, Bible, Profile
- Contains `jumpToVerse()` function for cross-app navigation
- Manages SearchWell popup state and queries
- Handles devotional text processing with clickable verse links
- Community reflections subscription and management
- YouTube video embedding from devotional content

**Key Functions:**
- `jumpToVerse(book, chapter, verseNum)` - Navigates to Bible with optional verse highlighting
- `triggerSearch(query)` - Opens SearchWell with pre-filled query
- `processDevotionalText(text)` - Makes verse references clickable in devotional
- `handlePostClick(post)` - Navigates based on community post content

**State Variables:**
- `activeTab` - Current view ('home'|'devotional'|'bible'|'profile')
- `bibleBook`, `bibleChapter` - Current Bible location
- `isWellOpen` - SearchWell visibility
- `wellQuery` - Current search query

---

#### **src/features/bible/BibleStudy.jsx** (2213 lines)
**Purpose:** Main Bible reading interface with study tools
**Functionality:**
- Displays Bible chapters with verse-by-verse rendering
- Audio playback with fallback version support
- Highlighting system with 6 color palette
- Note-taking with inline editing and long-press functionality
- Mark chapters as read with confetti celebration
- Testament navigation (Old Testament/New Testament buttons)
- Community reflections per chapter
- Reading progress tracking
- Floating toolbar for study tools

**Key Functions:**
- `markChapterAsRead()` - Toggles chapter read status, shows confetti
- `handleVerseClick(verseNum)` - Handles highlighting/selection
- `handleLongPress()` - Opens inline note editor
- `saveCurrentNote()` - Saves note to Firestore
- `handleHighlight(verseNum)` - Applies highlight color to verse
- `toggleAudio()` - Plays/pauses chapter audio

**State Variables:**
- `readChapters` - Array of read chapter keys ("Genesis 1", etc.)
- `showTestamentNav` - Shows OT/NT navigation ('OT'|'NT'|null)
- `highlightsMap` - Object mapping verse numbers to highlight colors
- `userNotes` - Array of notes for current chapter
- `selectedVerses` - Array of selected verse numbers
- `activeHighlightColor` - Currently selected highlight color

**Integration Points:**
- Uses `BibleTracker` component for progress visualization
- Uses `FloatingTools` for draggable study toolbar
- Uses `CommunityFeed` for chapter reflections
- Calls `firestoreService` functions for data persistence

---

#### **src/features/bible/BibleTracker.jsx** (181 lines)
**Purpose:** Visual progress tracker for Bible reading
**Functionality:**
- Shows all books as "pills" with progress percentages
- Displays global Bible reading progress (1189 total chapters)
- Drill-down view: click book → see chapter grid
- Color-coded progress (gold for 100%, gradient for partial)
- Supports filtering by testament (OT/NT)
- Double-click chapters to mark as read (if logged in)

**View Modes:**
1. **Bookshelf View** - All books displayed as pills
2. **Drill-down View** - Individual book's chapters in grid

**Props:**
- `readChapters` - Array of completed chapter keys
- `onNavigate(book, chapter)` - Callback for chapter navigation
- `sectionFilter` - 'OT'|'NT'|null to filter books
- `theme` - 'light'|'dark' for styling
- `onToggleRead(chapterKey)` - Callback to mark chapter read

**Used In:**
- Bottom of BibleStudy component (full tracker)
- Top testament navigation (filtered view) - NOT YET IMPLEMENTED

---

#### **src/shared/SearchWell.jsx** (437 lines)
**Purpose:** Bible search and concordance popup
**Functionality:**
- Draggable floating window (desktop) or full-screen modal (mobile)
- Two search modes:
  1. **Verse Reference** (e.g., "John 3:16") - Fetches and displays verses
  2. **Keyword Search** (e.g., "faith") - Searches across Bible
- Bible version selector dropdown
- Collapsible results grouped by book/chapter
- Click verse to navigate to Bible reader

**Key Functions:**
- `parseVerseReference(query)` - Detects if search is verse reference
- `performSearch(searchTerm)` - Handles both verse lookup and keyword search
- `handleResultClick(r)` - Navigates to clicked verse in Bible
- `toggleChapter(chapterKey)` - Collapse/expand chapter groups

**API Calls:**
- `/api/bibles` - Fetch available Bible versions
- `/api/bible-chapter` - Fetch specific chapter for verse references
- `/api/bible-search` - Keyword search across Bible

**Props:**
- `isOpen` - Visibility state
- `onClose` - Callback to close well
- `initialQuery` - Pre-filled search query
- `onJumpToVerse(book, chapter, verse)` - Navigation callback
- `theme` - Light/dark styling

---

#### **src/services/firestoreService.js** (159 lines)
**Purpose:** All Firebase Firestore database operations
**Functionality:**
- CRUD operations for notes, reflections, highlights
- Real-time subscriptions with error handling
- User profile management
- Chapter read status tracking

**Functions:**
- `subscribeToReflections(keyField, keyValue, callback)` - Listen to reflections
- `saveReflection(user, text, keyField, keyValue, editingId)` - Save/update reflection
- `deleteReflection(id)` - Delete reflection
- `toggleFruitReaction(postId, fruitId, userId, reactions)` - Like/unlike posts
- `saveNote(user, book, chapter, verses, text, editingId)` - Save Bible note
- `deleteNote(noteId)` - Delete note
- `updateUserHighlight(userId, book, chapter, verseNum, highlightObj)` - Save highlight
- `subscribeToUserProfile(userId, callback)` - Listen to user data (highlights, read chapters)
- `subscribeToNotes(userId, book, chapter, callback)` - Listen to notes for chapter
- `toggleChapterReadStatus(userId, chapterKey, isRead)` - Mark chapter read/unread

**Error Handling:**
- All `onSnapshot` listeners have error callbacks
- Permission errors logged as warnings (graceful degradation)
- Returns empty data on permission-denied

---

#### **src/features/bible/FloatingTools.jsx** (273 lines)
**Purpose:** Draggable toolbar for Bible study tools
**Functionality:**
- Highlight color palette with selection indicator
- Copy verses to clipboard
- Paste verse references
- Save selected verses as note
- Delete current note
- Draggable positioning

**Props:**
- `selectedVerses` - Array of selected verse numbers
- `onCopyVerses` - Callback to copy verses
- `onPasteVerses` - Callback to paste references
- `onSaveNote` - Callback to save note
- `onClearNote` - Callback to clear selections
- `onHighlight(color)` - Callback to apply highlight
- `activeColor` - Currently selected color object
- `theme` - Styling theme
- `noteText` - Current note text
- `onNoteChange` - Text change callback

---

#### **src/shared/CommunityFeed.jsx** (66 lines)
**Purpose:** Reflection input and display component
**Functionality:**
- Text input for reflections
- Displays community posts
- Fruit reaction system (like buttons)
- Edit/delete own posts
- Custom placeholder support

**Props:**
- `keyField` - Firestore field name ('chapter', 'devotional', etc.)
- `keyValue` - Value to filter by
- `user` - Current user object
- `theme` - Light/dark styling
- `placeholder` - Custom placeholder text

---

### Data & Configuration Files

#### **src/data/bibleData.js** (70 lines)
**Purpose:** Static Bible structure data
**Exports:**
- `bibleData` - Array of all 66 books with:
  - `name` - Book name (e.g., "Genesis")
  - `chapters` - Number of chapters
  - `section` - 'OT' or 'NT'

**Used For:**
- Populating book lists
- Filtering by testament
- Chapter count validation

---

#### **src/config/constants.js** (100 lines)
**Purpose:** Application-wide constants
**Exports:**
- `API_BIBLE_KEY` - API.Bible API key from env
- `COLOR_PALETTE` - 6 highlight colors with borders
- `DEFAULT_NOTE_COLOR` - Blue color for notes
- `NLT_BIBLE_ID` - Licensed NLT version ID
- `WEB_BIBLE_ID` - World English Bible ID
- `DEFAULT_BIBLE_VERSION` - Default to NLT
- `AUDIO_FALLBACK_VERSION` - Audio fallback (WEB)
- `USFM_MAPPING` - Book names to USFM codes (e.g., "Genesis" → "GEN")
- `OSIS_TO_BOOK` - Reverse mapping (USFM → book name)

---

### API Routes (Serverless Functions)

#### **api/bible-chapter.js**
**Purpose:** Fetch specific Bible chapter
**Endpoint:** `/api/bible-chapter?bibleId=xxx&chapterId=GEN.1`
**Returns:** Chapter content with HTML markup

#### **api/bible-search.js**
**Purpose:** Keyword search across Bible
**Endpoint:** `/api/bible-search?bibleId=xxx&query=faith&limit=20`
**Returns:** Array of verses matching search

#### **api/bibles.js**
**Purpose:** List available Bible versions
**Endpoint:** `/api/bibles`
**Returns:** Array of Bible versions with IDs

#### **api/health.js**
**Purpose:** Health check endpoint
**Endpoint:** `/api/health`
**Returns:** Status and timestamp

---

## 🔄 DATA FLOW

### Bible Reading Flow
1. User selects book/chapter in BibleStudy
2. BibleStudy fetches chapter from `/api/bible-chapter`
3. Verses rendered with highlight overlays from `highlightsMap`
4. Notes fetched via `subscribeToNotes()` and displayed inline
5. User interactions (highlights, notes) saved via `firestoreService`

### Search Flow
1. User types query in SearchWell
2. `parseVerseReference()` checks if it's a verse reference
3. If verse reference:
   - Fetches chapter from `/api/bible-chapter`
   - Parses and displays specific verses
4. If keyword:
   - Calls `/api/bible-search`
   - Displays results grouped by chapter
5. User clicks result → calls `onJumpToVerse()` → navigates to Bible

### Testament Navigation Flow (Current)
1. User clicks "📖 Old Testament" or "✝️ New Testament"
2. Sets `showTestamentNav` state to 'OT' or 'NT'
3. Simple grid navigation shows filtered books
4. User clicks book → navigates to that book chapter 1

### Testament Navigation Flow (INTENDED - NOT IMPLEMENTED)
1. User clicks "📖 Old Testament" or "✝️ New Testament"
2. Should render full BibleTracker component with `sectionFilter='OT'` or 'NT'
3. Shows books as pills with progress percentages
4. User can drill down to chapters
5. Can double-click chapters to mark read (if logged in)

---

## 🐛 KNOWN ISSUES & TODO

### ✅ COMPLETED ENHANCEMENTS
**Testament Navigation (Jan 30, 2026):**
- Successfully implemented Old Testament/New Testament navigation
- Currently displays simple grid of book names
- Users can easily navigate between testaments and select books
- Progress tracking works as intended with double-click to mark chapters read
- **Status:** Working to user satisfaction

---

## 🚀 FUTURE FEATURES TO IMPLEMENT

### 📅 Bible Reading Tracker with Customizable Plans (Priority: High)

**Feature Description:**
A comprehensive Bible reading tracker system integrated into the Devotional section of the app that allows users to select and follow different pre-designed reading plans with smart scheduling and email reminders.

**User Interface:**
- Devotional side: Display a calendar widget in the middle section
- Clicking the calendar opens a plan selection and tracking layout
- Users can choose from multiple reading plan options and customize their reading schedule

**Reading Plan Options:**
- Chronological reading plan
- 31-year reading plan
- Various pre-built Bible reading plans (to be curated)

**Smart Features:**
1. **Weekend Flexibility** - Users can configure whether to read on weekends or skip to weekdays only
2. **Email Reminders** - Automatic email notifications to remind users to:
   - Read the assigned chapters/passages for the day
   - Visit the app to mark readings as completed
   - Encourage consistency and progress tracking
3. **Calendar Integration** - Visual calendar showing:
   - Books assigned to specific dates
   - Reading progress by color coding (completed, pending, upcoming)
   - Ability to track multiple reading plans simultaneously if desired

**Backend Requirements:**
- User preferences table: Reading plan selection, weekend options, email preferences
- Reading tracker collection: Daily/weekly assignments linked to user and plan
- Email service integration: Send reminders based on user timezone and preferences
- Progress calculation: Calculate completion percentage for selected plan

**Frontend Requirements:**
- Calendar component with date selection and visual indicators
- Plan selection modal/interface
- Settings panel for reminders, weekends, and preferences
- Progress visualization dashboard
- Integration with existing highlight and notes systems

**Technical Considerations:**
- Link completed readings to existing `readChapters` tracking
- Sync calendar progress with Firestore user profile
- Handle timezones for email delivery accuracy
- Prevent duplicate reminders if user already visited the app

**Location for Implementation:**
- File: `src/features/devotional/BibleReadingTracker.jsx` (new component)
- File: `src/shared/ReadingPlanSelector.jsx` (new component)
- Update: `src/App.jsx` to integrate tracker into devotional tab
- Update: `src/services/firestoreService.js` to handle reading plan data

---

### ✅ RECENT FIXES (Jan 30, 2026)
1. **Book Name Centering** - Fixed book name selector to display centered in the toolbar (changed textAlign from 'left' to 'center')
2. **Code Health Phase 1** - Removed all 18 console.log statements from src/, added no-console ESLint rule, created 19 CSS utility classes, reduced inline styles
3. **Dark Mode UI Phase 2** - Fixed "ghost" Sign In button, enhanced login button contrast, improved navigation arrow visibility with better hover states
4. **Perfect ESLint Compliance** - Achieved 0 errors, 0 warnings across entire codebase (100% compliance)
5. **Dark Mode System Override** - Added data-theme attribute to document root to ensure manual theme toggle strictly overrides system color scheme preferences
6. **Navigation Button Visibility** - Converted Prev/Next buttons to theme-aware styling (bright green in dark mode) so they're clearly visible and interactive
7. **Login Modal Auto-Close** - Modal now closes automatically when user signs in (added useEffect watching user state)
8. **Toolbar Fade-In Effect** - Toolbar buttons (-, +, Prev, Next, Mark Read) now fade in smoothly with chapter text during loading
9. **Dark Mode Button Styling** - Fixed font size buttons and Mark Read button to have proper dark mode colors and hover states
10. **Testament Navigation Confirmation** - Testament navigation (Old Testament/New Testament) is working to user satisfaction with simple grid layout
6. **Book Pills Dark Mode** - Fixed book progress pills in testament navigation to display properly in dark mode
7. **Dev Server Fix** - Changed package.json dev script from `vercel dev` (recursive) to `vite` (local development)
8. **System Theme Override** - Removed system dark mode preference detection (`color-scheme` and `@media prefers-color-scheme`) so app respects only manual theme toggle
9. **Dark Mode Consistency** - Added theme-driven CSS variables for nav buttons, cards, pills, and verse containers; updated MemberCard to use them
10. **BibleStudy.jsx Growth** - Component expanded from 1434 to 2213 lines with recent enhancements

---

## 🔑 KEY STATE VARIABLES

### App.jsx
- `activeTab` - Which main view is showing
- `bibleBook`, `bibleChapter` - Current Bible location
- `isWellOpen`, `wellQuery` - Search well state

### BibleStudy.jsx
- `book`, `chapter` - Current Bible location
- `verses` - Array of verse objects for current chapter
- `readChapters` - Array of completed chapters
- `highlightsMap` - Object: { verseNum: { bg, border } }
- `userNotes` - Array of note objects
- `selectedVerses` - Currently selected verses
- `showTestamentNav` - 'OT'|'NT'|null for navigation
- `longPressVerse` - Verse number for inline editing
- `isPlaying`, `audioError` - Audio player state

### SearchWell.jsx
- `query` - Current search input
- `results` - Array of search results
- `selectedVersion` - Bible version ID for searching
- `collapsedChapters` - Which chapter groups are collapsed

---

## 📊 FIREBASE COLLECTIONS

### users
**Document ID:** userId
**Fields:**
- `highlights` - Nested object: { bookName: { chapter: { verseNum: { bg, border } } } }
- `readChapters` - Array of strings: ["Genesis 1", "Genesis 2", ...]
- `defaultBibleVersion` - String: Bible version ID preference

### notes
**Fields:**
- `userId` - String
- `book` - String (e.g., "Genesis")
- `chapter` - Number
- `verses` - Array of verse numbers
- `text` - String
- `timestamp` - Firestore timestamp
- `color` - String (hex color)

### reflections
**Document ID:** Auto-generated or `${userId}_${keyValue}`
**Fields:**
- `userId` - String
- `userName` - String
- `userPhoto` - String URL
- `text` - String
- `timestamp` - Firestore timestamp
- `location` - String (city name)
- `reactions` - Object: { fruitId: [userId, userId, ...] }
- `chapter` - String (e.g., "Genesis 1") OR
- `devotional` - String (e.g., "1.1") OR
- Other custom key fields

---

## 🎨 STYLING

**Theme System:**
- `theme` prop passed down: 'light' or 'dark'
- Dark mode: darker backgrounds, lighter text
- Light mode: white backgrounds, dark text

**Tailwind Classes:**
- Used throughout for utility styling
- Custom styles for complex components

**Color Palette (Highlights):**
1. Yellow: `#ffeb3b` / border `#fbc02d`
2. Green: `#a5d6a7` / border `#66bb6a`
3. Blue: `#90caf9` / border `#42a5f5`
4. Pink: `#f48fb1` / border `#ec407a`
5. Orange: `#ffcc80` / border `#ffa726`
6. White: `#ffffff` / border `#b0bec5`

---

## 🚀 DEPLOYMENT

**Platform:** Vercel
**Auto-Deploy:** Pushes to `main` branch trigger deploy
**Build Command:** `npm run build`
**Build Output:** `dist/` directory

**Environment Variables (Vercel):**
- `VITE_BIBLE_API_KEY` - API.Bible API key
- Firebase config variables

---

## 📝 DEVELOPMENT NOTES

**Common Issues:**
- `replace_string_in_file` tool sometimes doesn't persist changes
- Python scripts are reliable workaround in codespaces
- File system sync issues in codespaces require verification

**Testing:**
- Run `npm run build` to check for errors
- Check `get_errors` tool for TypeScript/lint issues
- Test with and without login
- Test on mobile viewport

---

**End of Documentation**
