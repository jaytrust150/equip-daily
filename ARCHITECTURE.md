# Equip Daily - Architecture & Design Decisions

## 🎯 Core Philosophy

Equip Daily is designed around **a single, unified backend** (Vercel serverless + Firebase) with **multiple frontend implementations** (web, iOS, Android). Every architectural decision prioritizes:

1. **API-first design** - All data flows through consistent APIs
2. **State separation** - UI state vs. persistent data clearly separated
3. **Multi-platform readiness** - No web-specific logic in data layer
4. **Offline resilience** - Firebase handles offline-first sync

---

## 📊 Data Architecture

### Data Flow

```
User Actions (UI)
    ↓
State Management (React)
    ↓
Service Layer (firestoreService.js, etc.)
    ↓
Backend APIs
    ├─ Firestore (Real-time database)
    ├─ Firebase Auth (Authentication)
    └─ Vercel Functions (Bible API proxy, etc.)
```

### Firestore Schema

**`users/{userId}` - User Profile**
```javascript
{
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  preferences: {
    theme: 'light' | 'dark',
    fontSize: number,
    audioVersion: string
  }
}
```

**`userNotes/{userId}/notes/{noteId}` - User Notes**
```javascript
{
  userId: string,
  book: string,           // "Genesis", "John", etc.
  chapter: number,        // 1, 2, 3...
  verses: array,          // [1, 2, 3] - array of verse numbers
  text: string,           // Note content
  color: string,          // Highlight color
  createdAt: timestamp,
  updatedAt: timestamp,
  visibility: 'private'   // Future: 'shared', 'public'
}
```

**`userHighlights/{userId}/highlights/{id}` - User Highlights**
```javascript
{
  userId: string,
  book: string,
  chapter: number,
  verses: array,          // [1, 2, 3]
  color: string,          // 'yellow', 'blue', 'green', 'pink', 'orange', 'purple'
  createdAt: timestamp
}
```

**`readProgress/{userId}/chapters/{chapterKey}` - Read Status**
```javascript
{
  userId: string,
  chapterKey: "Genesis 1",  // "BookName Chapter#"
  isRead: boolean,
  readDate: timestamp
}
```

**`reflections/{book}/{chapter}/{reflectionId}` - Community Reflections**
```javascript
{
  userId: string,
  text: string,
  reactions: {
    love: number,
    joy: number,
    peace: number,
    patience: number,
    kindness: number,
    goodness: number,
    faithfulness: number,
    gentleness: number,
    selfControl: number
  },
  createdAt: timestamp,
  userReactions: {
    [userId]: 'love'  // Which reaction this user gave
  }
}
```

---

## 🔄 State Management

### Component-Level State (React)

Each component manages its own UI state:

**BibleStudy.jsx** - Bible reading state
- `showNotes` - Reading vs Study mode toggle
- `selectedVerses` - Currently selected verses with checkmarks
- `activeHighlightColor` - Selected highlight color
- `versesCopied` - Clipboard tracking
- `expandedNotes` - Which note previews are expanded

**DailyDevotional.jsx** - Devotional reading state
- `audioPlaying` - Is audio playing?
- `audioTime` - Current play position
- `expandedReflections` - Which reflections are expanded

### Why Not Global State Management?

We avoid Redux/Zustand because:

1. **Data persistence** - Firebase handles state sync automatically
2. **Real-time updates** - Firestore subscriptions push updates naturally
3. **Offline-first** - Each component can manage local cache independently
4. **Mobile readiness** - Native apps handle their own state differently
5. **Simplicity** - React hooks + service layer is sufficient

---

## 🔌 Service Layer (Data Access)

### firestoreService.js

**Why separate this?**
- Single source of truth for all Firestore operations
- Easy to mock for testing
- Ready for native app SDKs (iOS/Android have their own Firestore SDKs)
- Clear error handling layer

**Key Functions:**
```javascript
// User Management
subscribeToUserProfile(userId, callback)
updateUserProfile(userId, data)

// Notes
subscribeToNotes(userId, book, chapter, callback)
saveNote(userId, noteData)
deleteNote(userId, noteId)
updateNoteColor(userId, noteId, color)

// Highlights
subscribeToHighlights(userId, book, chapter, callback)
saveHighlight(userId, highlightData)
deleteHighlight(userId, highlightId)

// Reading Progress
toggleChapterRead(userId, chapterKey)
getChaptersRead(userId)

// Reflections
subscribeToReflections(book, chapter, callback)
saveReflection(userId, reflectionData)
toggleFruitReaction(userId, reflectionId, fruit)
```

---

## 🌐 Backend APIs (Vercel Serverless)

### API Strategy

All APIs use **Vercel serverless functions** as a proxy layer:

```
Mobile/Web Client → Vercel Function → External API
                 ↓
              Caching
              Rate Limiting
              Error Handling
              Response Formatting
```

### Implemented APIs

**`api/bible-chapter.js`** - Fetch Bible chapters
- Calls API.Bible to get verse content
- Returns formatted chapter data
- Rate limit: 100 requests/min

**`api/bible-audio.js`** - Fetch audio URLs
- Gets MP3 URLs for audio Bible chapters
- Supports multiple audio Bible versions
- Rate limit: 40 requests/min

**`api/bible-search.js`** - Search verses
- Full-text search across Bible
- Returns matching verses with book/chapter/verse references
- Rate limit: 50 requests/min

**`api/bibles.js`** - List available versions
- Returns all available Bible translations
- Caches results (rarely changes)
- Used on app startup

**`api/health.js`** - Health check
- Verifies backend connectivity
- No authentication required
- Used for monitoring

### Rate Limiting

All APIs use `api/middleware/rateLimiter.js`:
- **In-memory token bucket algorithm**
- **Per-IP tracking** (using `x-forwarded-for` for Vercel)
- **Per-API configuration** (different limits for different endpoints)
- **Returns 429 when exceeded**

---

## 🎨 UI Layer Architecture

### Component Hierarchy

```
App.jsx (Router & Global State)
├─ Header.jsx (Navigation)
├─ Home.jsx (Dashboard)
├─ DailyDevotional.jsx
│  ├─ DevotionalContent.jsx
│  ├─ CommunityFeed.jsx
│  └─ AudioPlayer.jsx
├─ BibleStudy.jsx (Main Bible View)
│  ├─ VerseList.jsx (Verse Display)
│  ├─ FloatingTools.jsx (Draggable Toolbar)
│  ├─ BibleTracker.jsx (Progress Visualization)
│  └─ CommunityFeed.jsx
├─ Profile.jsx
│  ├─ ReadingProgress.jsx
│  ├─ ReadingPlans.jsx
│  └─ AccountSettings.jsx
└─ SearchWell.jsx (Search Modal)
```

### Reading Mode vs Study Mode

**Why separate modes?**

Dedicated modes provide distinct UX optimized for different activities:

**Reading Mode (📖)** - Meditation-focused
- Passive text reading
- Note pills show at bottom (collapsible)
- No verse selection
- Simple share button
- Goal: Distraction-free reflection

**Study Mode (📝)** - Analysis-focused
- Checkmarks for verse selection
- Inline note editor on long-press
- Floating toolbar with copy/paste
- Full note management
- Goal: Active annotation and composition

**Why not combine them?**
- Separate UI reduces cognitive load
- Touch targets differ (no selection in reading mode = better readability)
- Different interaction patterns (swipe, long-press, etc.)
- Mobile app will likely use separate screens

---

## 🎨 Theming System

### Why Custom CSS Variables?

Instead of Tailwind's utility classes in many places, we use inline styles + CSS variables:

**Advantages:**
- Ready for mobile native apps (no Tailwind build)
- Dynamic theming without page reload
- Clear visual hierarchy in code
- Easier to audit theme changes

### Theme Definition

```javascript
const theme = 'light' | 'dark';

// Usage in components:
const bgColor = theme === 'dark' ? '#1f2937' : '#ffffff';
const textColor = theme === 'dark' ? '#f3f4f6' : '#111827';

// Buttons (standardized pattern):
const buttonStyle = {
  background: versesCopied ? '#9c27b0' : (selectedVerses.length > 0 ? '#4caf50' : '#ccc'),
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  padding: '6px 12px',
  fontWeight: '500',
  transition: '0.2s',
};
```

### Button Color Meanings

- **Green (#4caf50)** - Primary action (Copy, Save, Mark Read)
- **Purple (#9c27b0)** - Active state (Paste copied verses)
- **Blue (#2196f3)** - Secondary action (Open Note)
- **Red (#f44336)** - Destructive (Delete)
- **Emerald (#10b981)** - Sharing (🔗 Share)
- **Gray (#ccc)** - Disabled

---

## 📱 Mobile App Readiness

### What's Ready for Mobile?

✅ **Completely ready:**
- Firestore service layer (Firebase has iOS/Android SDKs)
- API endpoints (HTTP calls work on mobile)
- Authentication logic (Firebase Auth supports mobile)
- Data schema (platform-agnostic)

🔄 **Needs adaptation:**
- React components → Native UI (iOS UIKit/SwiftUI or Android Jetpack Compose)
- Gesture handling (swipe, long-press → native gesture recognizers)
- Navigation (React Router → Native navigation stacks)
- Styling (CSS → Native stylesheets)
- Offline sync (Firebase Realtime Database handles this well)

❌ **Web-specific (won't transfer):**
- Progressive Web App features (web manifests)
- Search Well modal (will be native)
- YouTube embedding (native video player)

### API Compatibility

Mobile apps can call the exact same Vercel APIs:

```swift
// iOS example (pseudocode)
URLSession.shared.dataTask(with: 
  URL(string: "https://api.equip-daily.vercel.app/api/bible-chapter?bibleId=x&chapterId=GEN.1")
).resume()
```

```kotlin
// Android example (pseudocode)
val client = OkHttpClient()
val request = Request.Builder()
  .url("https://api.equip-daily.vercel.app/api/bible-chapter?bibleId=x&chapterId=GEN.1")
  .build()
client.newCall(request).enqueue(...)
```

---

## 🔐 Security Considerations

### Authentication Flow

1. **Sign Up** - User creates account via Firebase Auth UI
2. **Login** - Firebase emits `currentUser` object
3. **Persistence** - Firebase stores session in localStorage
4. **Firestore Rules** - Enforces user-only data access

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Notes are per-user
    match /userNotes/{userId}/notes/{noteId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Highlights are per-user
    match /userHighlights/{userId}/highlights/{highlightId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Reflections are public read, auth user write
    match /reflections/{book}/{chapter}/{reflectionId} {
      allow read: if true;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### API Key Management

- Bible API key stored in `process.env.BIBLE_API_KEY` (server-side only)
- Never exposed to client
- Vercel functions act as proxy to hide key

---

## 🚀 Performance Optimization

### Lazy Loading
- Bible books load on-demand (not all 66 at startup)
- Community reflections paginated
- Images lazy-loaded

### Caching
- API responses cached (using headers)
- User profile cached in component state
- Firestore subscriptions cache locally

### Code Splitting
- Route-based: Each view is a lazy-loaded component
- Component-based: Heavy components (BibleTracker) lazy-load

---

## 🧪 Testing Strategy

### Currently Passing
- `src/__tests__/services/firestoreService.test.js` (23 tests)
  - Tests Firestore operations
  - Tests error handling
  - Tests data structure validation

### Planned
- API integration tests (after middleware mocking fixed)
- End-to-end flows (reading plan completion, note sharing)
- Mobile app platform-specific tests (after iOS/Android apps created)

---

## 🛣️ Future Enhancements

### Planned Features
1. **Note Sharing** - Share notes with community, make visible to others
2. **Reading Plans** - Multi-week plans, group challenges
3. **Collaborative Notes** - Study groups can annotate together
4. **Offline Mode** - Service worker caches Bible chapters
5. **Search History** - Remember past searches
6. **Verse Bookmarks** - Quick access to favorite verses

### Platform Expansion
1. **iOS App** - Native or React Native
2. **Android App** - Native or React Native
3. **API Documentation** - Public REST API for third-party apps
4. **Desktop Apps** - Electron (Windows/Mac)

---

**Last Updated:** January 31, 2026
**Architecture Version:** 2.0 (Multi-platform ready)
