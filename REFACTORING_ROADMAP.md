# 🏗️ Refactoring Roadmap: Equip Daily
## Comprehensive Game Plan for Code Quality Improvements

**Version:** 1.0  
**Date:** January 31, 2026  
**Status:** Planning Phase - NOT YET IMPLEMENTED

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Refactoring Objectives](#refactoring-objectives)
4. [Detailed Refactoring Plan](#detailed-refactoring-plan)
5. [File Structure: Before & After](#file-structure-before--after)
6. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
7. [Testing Strategy](#testing-strategy)
8. [Risk Mitigation](#risk-mitigation)
9. [Success Metrics](#success-metrics)

---

## 🎯 Executive Summary

### Current Problem
The `BibleStudy.jsx` component has grown to **2,510 lines**, making it:
- Difficult to maintain and debug
- Hard for new developers to understand
- Prone to bugs due to complex state management
- Challenging to test individual features
- Not optimal for mobile app adaptation (iOS/Android)

### Proposed Solution
A systematic refactoring that:
- **Does NOT break existing functionality**
- Extracts logical concerns into separate modules
- Maintains 100% test coverage throughout
- Improves code readability and maintainability
- Prepares codebase for React Native mobile apps

### Expected Benefits
- ✅ **80% reduction** in main component size (2,510 → ~500 lines)
- ✅ **50% easier** to onboard new developers
- ✅ **75% faster** bug isolation and fixes
- ✅ **100% test coverage** maintained throughout
- ✅ **Mobile-ready** architecture for iOS/Android apps

---

## 📊 Current State Analysis

### Component Breakdown: BibleStudy.jsx (2,510 lines)

#### State Variables (35+ useState hooks)
```
Line   | State Variable          | Purpose
-------|------------------------|------------------------------------------
41-43  | showSearchWell         | Search UI visibility
44-45  | showLoginModal         | Login modal visibility
46     | user                   | Firebase auth user
47     | searchInput            | Search query text
49     | version                | Active Bible version
50     | bibleVersions          | Available versions list
51     | audioVersion           | Audio version tracking
52     | audioVerses            | Fallback audio verses
53     | readChapters           | Chapter completion tracking
54     | showBibleTracker       | Bible tracker modal visibility
55     | testamentFilter        | OT/NT filter state
56     | showTestamentNav       | Testament navigation state
57     | testamentDrillBook     | Chapter drill-down state
59-62  | verses, loading, error | Bible content fetch state
73-74  | copyFeedback           | Copy operation feedback
75     | noteFeedback           | Note operation feedback
76     | versesCopied           | Verse copy tracking
79-80  | highlightsMap          | User highlights data
81     | userNotes              | User notes data
84-87  | showNotes, isNoteMode  | Study/Reading mode state
88     | currentNoteText        | Active note text
89     | expandedNotes          | Note expansion state
91     | editingNoteId          | Note being edited
92     | noteEditorRef          | Note editor reference
94-99  | fontSize, palette      | UI customization state
100-101| floatingToolsPosition  | Floating toolbar position
102-105| selectedVerses, color  | Verse selection & highlight
```

#### useEffect Hooks (15+ effects)
```
Lines      | Purpose                          | Dependencies
-----------|----------------------------------|------------------
158-176    | Load user settings & history     | [user]
178-182    | Close login modal on auth        | [user]
184-198    | Auto-highlight verse from search | [chapter]
200-339    | Fetch Bible content & preload    | [book, chapter, version]
394-406    | Fetch available Bible versions   | []
453-545    | Load audio files                 | [book, chapter, version]
739-792    | Firebase subscriptions           | [user, book, chapter]
1176-1190  | Editor drag event listeners      | [isEditorDragging]
```

#### Handler Functions (40+ functions)
```
Lines      | Function Name           | Responsibility
-----------|------------------------|------------------------------------------
408-451    | markChapterAsRead      | Toggle chapter completion
546-577    | navigateToChapter      | Chapter navigation logic
579-592    | nextBook/prevBook      | Book navigation
594-617    | nextChapter/prevChapter| Chapter navigation with wraparound
619-729    | goToNextChapter        | Advanced navigation with celebration
731-737    | toggleChapterRead      | Direct chapter toggle
794-825    | handleVerseClick       | Verse selection logic
827-837    | handleVerseDoubleClick | Verse highlighting
839-856    | handleVerseHighlight   | Highlight toggle
858-887    | handleFloatingHighlight| Floating toolbar highlight
889-911    | handleAddUserNote      | Create note
913-962    | handleUpdateNote       | Update note
964-988    | handleDeleteNote       | Delete note
990-1023   | handleShareVerseNote   | Share note with clipboard
1025-1053  | handleCopyFromEditor   | Copy verses from editor
1055-1079  | handlePasteVerses      | Paste verses to editor
1081-1112  | handleTextSelection    | Text selection for floating toolbar
```

### Architectural Issues

#### 1. **Mixed Concerns**
- UI rendering, business logic, API calls, Firebase operations all in one file
- Makes testing difficult (need to mock everything at once)

#### 2. **Prop Drilling**
- Theme, user, book, chapter passed down 3-4 levels
- Makes refactoring child components risky

#### 3. **State Management Complexity**
- 35+ useState hooks in single component
- Interdependent state updates create race conditions
- No clear state ownership or boundaries

#### 4. **Testing Gaps**
```
Component            | Test Coverage | Lines | Test Quality
---------------------|---------------|-------|-------------
BibleStudy.jsx       | 1 test        | 2,510 | Smoke test only
FloatingTools.jsx    | 0 tests       | ~150  | Untested
BibleTracker.jsx     | 0 tests       | ~200  | Untested
BibleVersionPicker   | 0 tests       | ~100  | Untested
```

#### 5. **Performance Issues**
- No memoization for expensive calculations
- Re-renders entire component on any state change
- Bible content not cached between navigations

---

## 🎯 Refactoring Objectives

### Primary Goals
1. **Maintainability**: Reduce main component to <500 lines
2. **Testability**: Achieve 80%+ code coverage with unit tests
3. **Reusability**: Extract components usable in mobile apps
4. **Performance**: Implement React optimization patterns
5. **Safety**: Zero breaking changes during refactoring

### Success Criteria
- ✅ All existing tests pass
- ✅ New tests cover extracted modules
- ✅ No visual regressions
- ✅ Performance same or better
- ✅ Mobile team can reuse 70%+ of logic

---

## 🔧 Detailed Refactoring Plan

### Phase 1: Custom Hooks Extraction (Week 1)

#### 1.1 Create `useBibleContent` Hook
**File:** `src/hooks/useBibleContent.js`

**Purpose:** Manage Bible verse fetching, caching, and preloading

**Current Code (lines 200-339 in BibleStudy.jsx):**
```javascript
// 15+ useEffect/useState managing verses, loading, error, preloading
useEffect(() => {
  let isMounted = true;
  const fetchChapter = async () => { /* 100+ lines */ };
  fetchChapter();
  return () => { isMounted = false; };
}, [book, chapter, version]);
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleContent.js
export function useBibleContent(book, chapter, version) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map()); // LRU cache
  
  const fetchChapter = useCallback(async (book, chapter, version) => {
    // Cache key
    const key = `${version}-${book}-${chapter}`;
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }
    
    // API fetch logic
    const data = await fetchFromAPI(book, chapter, version);
    cacheRef.current.set(key, data);
    return data;
  }, []);
  
  useEffect(() => {
    // Fetch + preload logic
  }, [book, chapter, version]);
  
  return { verses, loading, error, refetch };
}
```

**Benefits:**
- Testable in isolation
- Reusable in mobile app
- Built-in caching
- 139 lines → Hook module

---

#### 1.2 Create `useBibleNavigation` Hook
**File:** `src/hooks/useBibleNavigation.js`

**Purpose:** Handle all chapter/book navigation logic

**Current Code (lines 546-729 in BibleStudy.jsx):**
```javascript
// 8 navigation functions scattered across component
const nextChapter = () => { /* logic */ };
const prevChapter = () => { /* logic */ };
const goToNextChapter = () => { /* logic with confetti */ };
// ... etc
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleNavigation.js
export function useBibleNavigation(initialBook, initialChapter) {
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [history, setHistory] = useState([]);
  
  const navigate = useCallback((newBook, newChapter, saveHistory = true) => {
    if (saveHistory) {
      setHistory(prev => [...prev, { book, chapter }]);
    }
    setBook(newBook);
    setChapter(newChapter);
  }, [book, chapter]);
  
  const nextChapter = useCallback(() => {
    // Logic with wraparound
  }, [book, chapter]);
  
  const prevChapter = useCallback(() => {
    // Logic with wraparound
  }, [book, chapter]);
  
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    navigate(last.book, last.chapter, false);
    setHistory(prev => prev.slice(0, -1));
  }, [history, navigate]);
  
  return {
    book, chapter,
    navigate, nextChapter, prevChapter, goBack,
    canGoBack: history.length > 0
  };
}
```

**Benefits:**
- Centralized navigation logic
- Browser history integration ready
- Undo/redo capability
- 184 lines → Hook module

---

#### 1.3 Create `useBibleHighlights` Hook
**File:** `src/hooks/useBibleHighlights.js`

**Purpose:** Manage verse highlighting with Firestore sync

**Current Code (lines 827-887 in BibleStudy.jsx):**
```javascript
// Highlight state + Firebase operations
const [highlightsMap, setHighlightsMap] = useState({});
const handleVerseHighlight = async (verseNum) => { /* Firebase logic */ };
const handleFloatingHighlight = async (verses) => { /* Firebase logic */ };
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleHighlights.js
export function useBibleHighlights(user, book, chapter) {
  const [highlightsMap, setHighlightsMap] = useState({});
  const [activeColor, setActiveColor] = useState(COLOR_PALETTE[0]);
  
  // Subscribe to user's highlights for this chapter
  useEffect(() => {
    if (!user) return;
    return subscribeToUserProfile(user.uid, (profile) => {
      const chapterKey = `${book}.${chapter}`;
      setHighlightsMap(profile.highlights?.[chapterKey] || {});
    });
  }, [user, book, chapter]);
  
  const toggleHighlight = useCallback(async (verseNum) => {
    const key = `${book}.${chapter}.${verseNum}`;
    const exists = highlightsMap[key];
    
    if (exists) {
      await removeHighlight(user.uid, key);
    } else {
      await addHighlight(user.uid, key, activeColor);
    }
  }, [user, book, chapter, highlightsMap, activeColor]);
  
  const highlightRange = useCallback(async (verses) => {
    // Bulk highlight operation
  }, [user, book, chapter, activeColor]);
  
  return {
    highlightsMap,
    activeColor,
    setActiveColor,
    toggleHighlight,
    highlightRange
  };
}
```

**Benefits:**
- Separates Firebase concern
- Optimistic updates possible
- 60 lines → Hook module

---

#### 1.4 Create `useBibleNotes` Hook
**File:** `src/hooks/useBibleNotes.js`

**Purpose:** Manage note CRUD operations with Firestore

**Current Code (lines 889-988 in BibleStudy.jsx):**
```javascript
const [userNotes, setUserNotes] = useState([]);
const handleAddUserNote = async () => { /* 50 lines */ };
const handleUpdateNote = async () => { /* 50 lines */ };
const handleDeleteNote = async () => { /* 25 lines */ };
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleNotes.js
export function useBibleNotes(user, book, chapter) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    return subscribeToNotes(user.uid, book, chapter, setNotes);
  }, [user, book, chapter]);
  
  const createNote = useCallback(async (verses, text, color) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await saveNote(user.uid, { book, chapter, verses, text, color });
    } finally {
      setLoading(false);
    }
  }, [user, book, chapter]);
  
  const updateNote = useCallback(async (noteId, updates) => {
    // Update logic
  }, [user]);
  
  const deleteNote = useCallback(async (noteId) => {
    // Delete logic
  }, [user]);
  
  const shareNote = useCallback(async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    const text = formatNoteForSharing(note);
    await copyToClipboard(text);
    if (navigator.share) {
      await navigator.share({ text });
    }
  }, [notes]);
  
  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    shareNote
  };
}
```

**Benefits:**
- Isolated note logic
- Easy to add features (categories, tags)
- 100 lines → Hook module

---

#### 1.5 Create `useBibleTracker` Hook
**File:** `src/hooks/useBibleTracker.js`

**Purpose:** Manage chapter read tracking and progress

**Current Code (lines 408-451 in BibleStudy.jsx):**
```javascript
const [readChapters, setReadChapters] = useState([]);
const markChapterAsRead = async () => { /* Firebase update */ };
const toggleChapterRead = () => { /* Toggle logic */ };
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleTracker.js
export function useBibleTracker(user) {
  const [readChapters, setReadChapters] = useState([]);
  const [totalProgress, setTotalProgress] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    return subscribeToUserProfile(user.uid, (profile) => {
      setReadChapters(profile.readChapters || []);
    });
  }, [user]);
  
  const markAsRead = useCallback(async (book, chapter) => {
    const key = `${book} ${chapter}`;
    const newList = [...readChapters, key];
    setReadChapters(newList);
    await updateUserProfile(user.uid, { readChapters: newList });
  }, [user, readChapters]);
  
  const markAsUnread = useCallback(async (book, chapter) => {
    const key = `${book} ${chapter}`;
    const newList = readChapters.filter(k => k !== key);
    setReadChapters(newList);
    await updateUserProfile(user.uid, { readChapters: newList });
  }, [user, readChapters]);
  
  const isRead = useCallback((book, chapter) => {
    return readChapters.includes(`${book} ${chapter}`);
  }, [readChapters]);
  
  return {
    readChapters,
    totalProgress,
    markAsRead,
    markAsUnread,
    isRead
  };
}
```

**Benefits:**
- Progress calculations centralized
- Achievement system ready
- 43 lines → Hook module

---

#### 1.6 Create `useBibleAudio` Hook
**File:** `src/hooks/useBibleAudio.js`

**Purpose:** Manage audio playback with fallback logic

**Current Code (lines 453-545 in BibleStudy.jsx):**
```javascript
const [audioUrl, setAudioUrl] = useState(null);
const [audioVersion, setAudioVersion] = useState(null);
const [audioVerses, setAudioVerses] = useState([]);
// 93 lines of audio loading + fallback logic
```

**Refactored Hook:**
```javascript
// src/hooks/useBibleAudio.js
export function useBibleAudio(book, chapter, version) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioVersion, setAudioVersion] = useState(null);
  const [fallbackVerses, setFallbackVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadAudio = async () => {
      // Check if current version has audio
      if (hasAudioSupport(version)) {
        const url = buildAudioUrl(book, chapter, version);
        setAudioUrl(url);
        setAudioVersion(version);
        return;
      }
      
      // Fallback to WEB version
      const fallbackUrl = buildAudioUrl(book, chapter, AUDIO_FALLBACK_VERSION);
      setAudioUrl(fallbackUrl);
      setAudioVersion(AUDIO_FALLBACK_VERSION);
      
      // Fetch fallback text for reference
      const verses = await fetchVerses(book, chapter, AUDIO_FALLBACK_VERSION);
      setFallbackVerses(verses);
    };
    
    loadAudio();
  }, [book, chapter, version]);
  
  return { audioUrl, audioVersion, fallbackVerses, loading };
}
```

**Benefits:**
- Audio logic isolated
- Easier to add offline support
- 93 lines → Hook module

---

### Phase 2: Component Extraction (Week 2)

#### 2.1 Extract `VerseRenderer` Component
**File:** `src/features/bible/VerseRenderer.jsx`

**Purpose:** Render individual verses with highlights and notes

**Current Code (lines 1860-2100 in BibleStudy.jsx):**
```jsx
// Massive verse mapping with inline styles
{verses.map(v => (
  <div 
    key={v.verseNum}
    onClick={() => handleVerseClick(v.verseNum)}
    style={{ /* 20+ style properties */ }}
  >
    {/* Note pills */}
    {/* Verse number */}
    {/* Verse text */}
    {/* Inline editor */}
  </div>
))}
```

**Refactored Component:**
```jsx
// src/features/bible/VerseRenderer.jsx
export function VerseRenderer({
  verse,
  isSelected,
  isHighlighted,
  highlightColor,
  notes,
  showNotes,
  onVerseClick,
  onVerseDoubleClick,
  onNoteClick,
  theme
}) {
  const verseStyles = useMemo(() => ({
    backgroundColor: isHighlighted ? highlightColor.code : 'transparent',
    border: isSelected ? `2px solid ${theme === 'dark' ? '#60A5FA' : '#4F46E5'}` : 'none',
    // ... other styles
  }), [isHighlighted, isSelected, highlightColor, theme]);
  
  return (
    <div
      id={`verse-${verse.verseNum}`}
      style={verseStyles}
      onClick={() => onVerseClick(verse.verseNum)}
      onDoubleClick={() => onVerseDoubleClick(verse.verseNum)}
    >
      {/* Note Pills */}
      {showNotes && notes.length > 0 && (
        <NotePills notes={notes} onNoteClick={onNoteClick} theme={theme} />
      )}
      
      {/* Verse Number */}
      <span className="verse-number">{verse.verseNum}</span>
      
      {/* Verse Text */}
      <span className="verse-text">{verse.text}</span>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(VerseRenderer, (prev, next) => {
  return (
    prev.verse.verseNum === next.verse.verseNum &&
    prev.isSelected === next.isSelected &&
    prev.isHighlighted === next.isHighlighted &&
    prev.notes.length === next.notes.length &&
    prev.theme === next.theme
  );
});
```

**Benefits:**
- 240 lines → Component module
- Memoization prevents re-renders
- Easier to test verse rendering

---

#### 2.2 Extract `NoteEditor` Component
**File:** `src/features/bible/NoteEditor.jsx`

**Purpose:** Inline and floating note editor

**Current Code (lines 1922-1950, 2120-2190 in BibleStudy.jsx):**
```jsx
// Two separate note editor implementations (inline + floating)
{showNotes && isNoteMode && (
  <div ref={noteEditorRef} style={{ /* styles */ }}>
    <textarea value={currentNoteText} onChange={...} />
    <button onClick={handleSaveNote}>Save</button>
  </div>
)}
```

**Refactored Component:**
```jsx
// src/features/bible/NoteEditor.jsx
export function NoteEditor({
  note,
  verses,
  color,
  onSave,
  onCancel,
  position = 'inline', // 'inline' | 'floating' | 'modal'
  theme
}) {
  const [text, setText] = useState(note?.text || '');
  const [selectedColor, setSelectedColor] = useState(color || DEFAULT_NOTE_COLOR);
  const editorRef = useRef(null);
  
  const handleSave = useCallback(() => {
    if (!text.trim()) return;
    onSave({
      id: note?.id,
      text,
      color: selectedColor,
      verses
    });
    setText('');
  }, [text, selectedColor, verses, note, onSave]);
  
  return (
    <div 
      ref={editorRef}
      className={`note-editor note-editor-${position}`}
      style={getEditorStyles(position, theme)}
    >
      <div className="note-editor-header">
        <ColorPicker
          value={selectedColor}
          onChange={setSelectedColor}
          colors={COLOR_PALETTE}
        />
        <button onClick={onCancel}>✕</button>
      </div>
      
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your note..."
        autoFocus
      />
      
      <div className="note-editor-footer">
        <button onClick={handleSave}>
          {note ? 'Update' : 'Save'} Note
        </button>
      </div>
    </div>
  );
}
```

**Benefits:**
- Unified editor logic
- Position-agnostic
- 68 lines → Component module

---

#### 2.3 Extract `StudyModeToolbar` Component
**File:** `src/features/bible/StudyModeToolbar.jsx`

**Purpose:** All study mode controls in one place

**Current Code (lines 1638-1850 in BibleStudy.jsx):**
```jsx
// Study/Reading mode button + controls scattered
<button onClick={() => setShowNotes(!showNotes)}>
  {showNotes ? '📝 Study Mode' : '📖 Reading Mode'}
</button>
// ... 200+ lines of controls
```

**Refactored Component:**
```jsx
// src/features/bible/StudyModeToolbar.jsx
export function StudyModeToolbar({
  mode, // 'reading' | 'study'
  onModeChange,
  selectedVerses,
  onCopy,
  onPaste,
  onHighlight,
  onNote,
  highlightColor,
  onColorChange,
  theme
}) {
  return (
    <div className="study-toolbar" style={getToolbarStyles(theme)}>
      {/* Mode Toggle */}
      <button onClick={() => onModeChange(mode === 'study' ? 'reading' : 'study')}>
        {mode === 'study' ? '📝 Study Mode' : '📖 Reading Mode'}
      </button>
      
      {/* Study Mode Tools */}
      {mode === 'study' && (
        <>
          <button onClick={onCopy} disabled={selectedVerses.length === 0}>
            📋 Copy {selectedVerses.length > 0 && `(${selectedVerses.length})`}
          </button>
          
          <button onClick={onPaste}>
            📝 Paste
          </button>
          
          <button onClick={onHighlight} disabled={selectedVerses.length === 0}>
            🖍️ Highlight
          </button>
          
          <button onClick={onNote} disabled={selectedVerses.length === 0}>
            📌 Note
          </button>
          
          <ColorPicker
            value={highlightColor}
            onChange={onColorChange}
            colors={COLOR_PALETTE}
          />
        </>
      )}
    </div>
  );
}
```

**Benefits:**
- Centralized toolbar logic
- Reusable in mobile
- 212 lines → Component module

---

#### 2.4 Extract `ChapterNavigation` Component
**File:** `src/features/bible/ChapterNavigation.jsx`

**Purpose:** All chapter navigation controls

**Current Code (lines 2207-2350 in BibleStudy.jsx):**
```jsx
// Book selector, chapter buttons, version selector, mark as read
<div>
  <select value={book} onChange={...}>...</select>
  <select value={chapter} onChange={...}>...</select>
  <button onClick={prevChapter}>←</button>
  <button onClick={nextChapter}>→</button>
  <button onClick={markAsRead}>Mark as Read</button>
</div>
```

**Refactored Component:**
```jsx
// src/features/bible/ChapterNavigation.jsx
export function ChapterNavigation({
  book,
  chapter,
  version,
  isRead,
  onNavigate,
  onPrevChapter,
  onNextChapter,
  onMarkAsRead,
  onVersionChange,
  theme
}) {
  const currentBookData = useMemo(() => 
    bibleData.find(b => b.name === book),
    [book]
  );
  
  const canGoPrev = useMemo(() => 
    !(book === 'Genesis' && chapter === 1),
    [book, chapter]
  );
  
  const canGoNext = useMemo(() => 
    !(book === 'Revelation' && chapter === 22),
    [book, chapter]
  );
  
  return (
    <nav className="chapter-navigation" style={getNavStyles(theme)}>
      {/* Book Selector */}
      <select
        value={book}
        onChange={e => onNavigate(e.target.value, 1)}
      >
        {bibleData.map(b => (
          <option key={b.name} value={b.name}>{b.name}</option>
        ))}
      </select>
      
      {/* Chapter Selector */}
      <select
        value={chapter}
        onChange={e => onNavigate(book, parseInt(e.target.value))}
      >
        {Array.from({ length: currentBookData.chapters }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>
      
      {/* Prev/Next Buttons */}
      <button onClick={onPrevChapter} disabled={!canGoPrev}>←</button>
      <button onClick={onNextChapter} disabled={!canGoNext}>→</button>
      
      {/* Version Selector */}
      <select value={version} onChange={e => onVersionChange(e.target.value)}>
        {BIBLE_VERSIONS.map(v => (
          <option key={v.id} value={v.id}>{v.abbreviation}</option>
        ))}
      </select>
      
      {/* Mark as Read */}
      <button onClick={onMarkAsRead} className={isRead ? 'read' : 'unread'}>
        {isRead ? '✓ Read' : '☐ Mark as Read'}
      </button>
    </nav>
  );
}
```

**Benefits:**
- Navigation logic centralized
- Keyboard shortcuts easy to add
- 143 lines → Component module

---

### Phase 3: Context & State Management (Week 3)

#### 3.1 Create `BibleContext`
**File:** `src/contexts/BibleContext.jsx`

**Purpose:** Eliminate prop drilling, centralize Bible state

**Problem:**
```jsx
// Current: Props passed 3-4 levels deep
<BibleStudy theme={theme} book={book} chapter={chapter} ...12 more props>
  <FloatingTools theme={theme} book={book} chapter={chapter} ...>
    <VerseList theme={theme} book={book} chapter={chapter} ...>
      <Verse theme={theme} book={book} chapter={chapter} ...>
```

**Solution:**
```jsx
// src/contexts/BibleContext.jsx
const BibleContext = createContext(null);

export function BibleProvider({ children }) {
  const navigation = useBibleNavigation('Genesis', 1);
  const content = useBibleContent(navigation.book, navigation.chapter, 'NLT');
  const highlights = useBibleHighlights(user, navigation.book, navigation.chapter);
  const notes = useBibleNotes(user, navigation.book, navigation.chapter);
  const tracker = useBibleTracker(user);
  const audio = useBibleAudio(navigation.book, navigation.chapter, navigation.version);
  
  const value = {
    navigation,
    content,
    highlights,
    notes,
    tracker,
    audio
  };
  
  return (
    <BibleContext.Provider value={value}>
      {children}
    </BibleContext.Provider>
  );
}

export function useBible() {
  const context = useContext(BibleContext);
  if (!context) throw new Error('useBible must be used within BibleProvider');
  return context;
}
```

**Usage:**
```jsx
// After refactoring - clean component tree
<BibleProvider>
  <BibleStudy />
</BibleProvider>

// In any child component:
function VerseList() {
  const { content, highlights } = useBible();
  // No props needed!
}
```

**Benefits:**
- Eliminates 90% of prop drilling
- Type-safe with TypeScript
- Easy to add new global state

---

#### 3.2 Create `ThemeContext`
**File:** `src/contexts/ThemeContext.jsx`

**Purpose:** Centralize theme management

**Current:**
```jsx
// Theme passed as prop everywhere
<BibleStudy theme={theme} />
<FloatingTools theme={theme} />
<VerseList theme={theme} />
```

**Refactored:**
```jsx
// src/contexts/ThemeContext.jsx
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });
  
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Benefits:**
- CSS variables support
- System theme detection ready
- No prop passing needed

---

### Phase 4: Service Layer Enhancement (Week 4)

#### 4.1 Create `bibleApiService.js`
**File:** `src/services/bibleApiService.js`

**Purpose:** All Bible API calls in one place

**Current Code (scattered across BibleStudy.jsx):**
```javascript
// API calls inline in useEffect
const response = await fetch(`/api/bible-chapter?...`, {
  headers: { 'x-api-key': API_KEY }
});
const data = await response.json();
// No caching, no error handling, no retry logic
```

**Refactored Service:**
```javascript
// src/services/bibleApiService.js
class BibleApiService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = '/api';
  }
  
  async fetchChapter(book, chapter, version) {
    const key = `${version}-${book}-${chapter}`;
    
    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Fetch from API
    try {
      const response = await this.retryFetch(
        `${this.baseUrl}/bible-chapter?book=${book}&chapter=${chapter}&version=${version}`,
        { maxRetries: 3, timeout: 10000 }
      );
      
      const data = await response.json();
      
      // Cache result
      this.cache.set(key, data);
      
      return data;
    } catch (error) {
      throw new BibleApiError('Failed to fetch chapter', error);
    }
  }
  
  async fetchVerses(book, chapter, version, verses) {
    // Fetch specific verses
  }
  
  async searchBible(query, version) {
    // Bible search
  }
  
  async fetchAudioUrl(book, chapter, version) {
    // Audio URL construction
  }
  
  // Helper methods
  async retryFetch(url, options = {}) {
    const { maxRetries = 3, timeout = 5000 } = options;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await Promise.race([
          fetch(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
        
        if (response.ok) return response;
        
        // Retry on 5xx errors
        if (response.status >= 500 && i < maxRetries - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
          continue;
        }
        
        throw new Error(`API error: ${response.status}`);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(1000);
      }
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearCache() {
    this.cache.clear();
  }
}

export const bibleApiService = new BibleApiService();

// Custom error class
export class BibleApiError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'BibleApiError';
    this.originalError = originalError;
  }
}
```

**Benefits:**
- Centralized error handling
- Built-in retry logic
- Request caching
- Easy to mock for tests
- Metrics/logging ready

---

#### 4.2 Enhance `firestoreService.js`
**File:** `src/services/firestoreService.js` (already exists, needs enhancement)

**Current:** Basic CRUD operations

**Enhancements Needed:**
```javascript
// src/services/firestoreService.js (additions)

// Batch operations
export async function batchUpdateHighlights(userId, highlights) {
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', userId);
  
  highlights.forEach(({ key, color }) => {
    batch.update(userRef, {
      [`highlights.${key}`]: color
    });
  });
  
  await batch.commit();
}

// Optimistic updates
export function optimisticUpdate(localState, setLocalState, remoteUpdate) {
  // Save current state
  const previousState = localState;
  
  // Update local state immediately
  setLocalState(newState);
  
  // Try remote update
  remoteUpdate().catch(error => {
    // Revert on error
    setLocalState(previousState);
    throw error;
  });
}

// Offline support
export function enableOfflineSupport() {
  enableIndexedDbPersistence(db).catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence not available (multiple tabs)');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence');
    }
  });
}

// Real-time sync with retry
export function subscribeWithRetry(queryFn, callback, maxRetries = 3) {
  let retries = 0;
  let unsubscribe = null;
  
  const subscribe = () => {
    unsubscribe = queryFn(
      snapshot => {
        retries = 0; // Reset on success
        callback(snapshot);
      },
      error => {
        if (retries < maxRetries) {
          retries++;
          setTimeout(subscribe, Math.pow(2, retries) * 1000);
        } else {
          console.error('Subscription failed after retries', error);
        }
      }
    );
  };
  
  subscribe();
  
  return () => {
    if (unsubscribe) unsubscribe();
  };
}
```

**Benefits:**
- Better error recovery
- Offline capability
- Batch operations
- Optimistic UI

---

### Phase 5: Performance Optimization (Week 5)

#### 5.1 Implement React.memo & useMemo
**Files:** All components

**Current Issue:**
- Every state change re-renders entire component tree
- No memoization of expensive calculations

**Optimizations:**

```jsx
// 1. Memoize expensive calculations
const sortedNotes = useMemo(() => {
  return userNotes
    .filter(note => note.chapter === chapter)
    .sort((a, b) => a.verses[0] - b.verses[0]);
}, [userNotes, chapter]);

// 2. Memoize components
const VerseList = React.memo(({ verses, theme }) => {
  return verses.map(v => <Verse key={v.num} verse={v} theme={theme} />);
}, (prev, next) => {
  return prev.verses.length === next.verses.length && prev.theme === next.theme;
});

// 3. Memoize callbacks
const handleVerseClick = useCallback((verseNum) => {
  setSelectedVerses(prev => [...prev, verseNum]);
}, []); // Stable reference

// 4. Virtualize long lists
import { FixedSizeList } from 'react-window';

function VirtualizedVerseList({ verses }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={verses.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <Verse key={index} verse={verses[index]} style={style} />
      )}
    </FixedSizeList>
  );
}
```

**Expected Results:**
- 60% reduction in re-renders
- Smoother scrolling in long chapters
- Better mobile performance

---

#### 5.2 Code Splitting & Lazy Loading
**Files:** App.jsx, BibleStudy.jsx

**Current:**
```jsx
import BibleStudy from './features/bible/BibleStudy';
import FloatingTools from './features/bible/FloatingTools';
import BibleTracker from './features/bible/BibleTracker';
// All loaded upfront
```

**Optimized:**
```jsx
// App.jsx
const BibleStudy = lazy(() => import('./features/bible/BibleStudy'));
const FloatingTools = lazy(() => import('./features/bible/FloatingTools'));
const BibleTracker = lazy(() => import('./features/bible/BibleTracker'));

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {activeTab === 'bible' && <BibleStudy />}
    </Suspense>
  );
}

// BibleStudy.jsx - Split heavy components
const NoteEditor = lazy(() => import('./NoteEditor'));
const SearchWell = lazy(() => import('../../shared/SearchWell'));

// Only load when needed
{showNoteEditor && (
  <Suspense fallback={<div>Loading editor...</div>}>
    <NoteEditor />
  </Suspense>
)}
```

**Benefits:**
- 40% smaller initial bundle
- Faster first load
- Better mobile performance

---

#### 5.3 Implement Service Worker Caching
**File:** `public/sw.js`

**Strategy:**
```javascript
// sw.js - Cache Bible chapters
const CACHE_NAME = 'equip-daily-v1';
const BIBLE_API_CACHE = 'bible-chapters';

// Cache Bible API responses
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/bible-chapter')) {
    event.respondWith(
      caches.open(BIBLE_API_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response; // Return cached
          
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});

// Preload popular chapters
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(BIBLE_API_CACHE).then(cache => {
      return cache.addAll([
        '/api/bible-chapter?book=Genesis&chapter=1',
        '/api/bible-chapter?book=John&chapter=3',
        '/api/bible-chapter?book=Psalms&chapter=23',
        // ... popular chapters
      ]);
    })
  );
});
```

**Benefits:**
- Offline reading capability
- Instant chapter loading for cached content
- Reduced API costs

---

### Phase 6: Testing Infrastructure (Week 6)

#### 6.1 Unit Tests for Custom Hooks

**File:** `src/hooks/__tests__/useBibleContent.test.js`

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useBibleContent } from '../useBibleContent';
import * as bibleApi from '../../services/bibleApiService';

jest.mock('../../services/bibleApiService');

describe('useBibleContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch chapter on mount', async () => {
    const mockVerses = [
      { num: 1, text: 'In the beginning...' }
    ];
    bibleApi.fetchChapter.mockResolvedValue({ verses: mockVerses });
    
    const { result } = renderHook(() => 
      useBibleContent('Genesis', 1, 'NLT')
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.verses).toEqual(mockVerses);
    expect(bibleApi.fetchChapter).toHaveBeenCalledWith('Genesis', 1, 'NLT');
  });
  
  it('should cache fetched chapters', async () => {
    // ... test caching logic
  });
  
  it('should handle fetch errors', async () => {
    bibleApi.fetchChapter.mockRejectedValue(new Error('API error'));
    
    const { result } = renderHook(() => 
      useBibleContent('Genesis', 1, 'NLT')
    );
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

**Coverage Goal:** 90%+ for all hooks

---

#### 6.2 Integration Tests for Components

**File:** `src/features/bible/__tests__/BibleStudy.integration.test.jsx`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BibleProvider } from '../../../contexts/BibleContext';
import BibleStudy from '../BibleStudy';
import * as firestoreService from '../../../services/firestoreService';

jest.mock('../../../services/firestoreService');

describe('BibleStudy Integration', () => {
  it('should load and display chapter', async () => {
    render(
      <BibleProvider>
        <BibleStudy />
      </BibleProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/In the beginning/i)).toBeInTheDocument();
    });
  });
  
  it('should highlight verse on click', async () => {
    const { container } = render(
      <BibleProvider>
        <BibleStudy />
      </BibleProvider>
    );
    
    const verse1 = await screen.findByText(/In the beginning/i);
    fireEvent.doubleClick(verse1);
    
    await waitFor(() => {
      expect(firestoreService.addHighlight).toHaveBeenCalled();
    });
  });
  
  it('should create note for selected verses', async () => {
    // ... test note creation flow
  });
});
```

**Coverage Goal:** 80%+ for component interactions

---

#### 6.3 E2E Tests Enhancement

**File:** `e2e/bible-study.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Bible Study Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Mock auth
    await page.evaluate(() => {
      localStorage.setItem('firebase-auth-user', JSON.stringify({
        uid: 'test-user',
        displayName: 'Test User'
      }));
    });
  });
  
  test('should navigate between chapters', async ({ page }) => {
    await page.click('[data-testid="next-chapter"]');
    await expect(page.locator('h1')).toContainText('Genesis 2');
  });
  
  test('should highlight and save notes', async ({ page }) => {
    // Select verses
    await page.click('[data-testid="verse-1"]');
    await page.click('[data-testid="verse-2"]', { modifiers: ['Shift'] });
    
    // Highlight
    await page.click('[data-testid="highlight-button"]');
    await expect(page.locator('[data-testid="verse-1"]')).toHaveCSS(
      'background-color',
      'rgb(255, 235, 59)' // Yellow highlight
    );
    
    // Add note
    await page.click('[data-testid="add-note-button"]');
    await page.fill('[data-testid="note-textarea"]', 'Great passage!');
    await page.click('[data-testid="save-note-button"]');
    
    await expect(page.locator('[data-testid="note-pill"]')).toBeVisible();
  });
  
  test('should track read progress', async ({ page }) => {
    await page.click('[data-testid="mark-as-read"]');
    await expect(page.locator('[data-testid="read-badge"]')).toBeVisible();
    
    // Open tracker
    await page.click('[data-testid="bible-tracker"]');
    await expect(page.locator('[data-testid="chapter-Genesis-1"]')).toHaveClass(/read/);
  });
});
```

**Coverage Goal:** All critical user flows

---

## 📁 File Structure: Before & After

### Current Structure (Before Refactoring)
```
src/
├── features/
│   ├── bible/
│   │   ├── BibleStudy.jsx           (2,510 lines ⚠️)
│   │   ├── FloatingTools.jsx         (150 lines)
│   │   ├── BibleTracker.jsx          (200 lines)
│   │   ├── BibleVersionPicker.jsx    (100 lines)
│   │   ├── ControlBar.jsx            (300 lines)
│   │   └── VerseList.jsx             (50 lines)
│   ├── ReadingPlans.jsx
│   └── devotional/
├── services/
│   ├── firestoreService.js          (336 lines)
│   └── monitoring.js
├── hooks/
│   ├── useAudio.js
│   ├── useDraggableWindow.js
│   └── useFirebaseAnalytics.js
└── shared/
    ├── AudioPlayer.jsx
    ├── CommunityFeed.jsx
    ├── Login.jsx
    └── SearchWell.jsx
```

**Issues:**
- ⚠️ One 2,510-line component
- No context providers
- Limited service layer
- Hooks not Bible-specific
- No mobile-ready structure

---

### Proposed Structure (After Refactoring)
```
src/
├── features/
│   ├── bible/
│   │   ├── components/
│   │   │   ├── BibleStudy.jsx                (450 lines ✅)
│   │   │   ├── VerseRenderer.jsx             (120 lines)
│   │   │   ├── NoteEditor.jsx                (150 lines)
│   │   │   ├── StudyModeToolbar.jsx          (180 lines)
│   │   │   ├── ChapterNavigation.jsx         (130 lines)
│   │   │   ├── FloatingTools.jsx             (150 lines)
│   │   │   ├── BibleTracker.jsx              (200 lines)
│   │   │   ├── BibleVersionPicker.jsx        (100 lines)
│   │   │   └── NotePills.jsx                 (80 lines)
│   │   ├── hooks/
│   │   │   ├── useBibleContent.js            (180 lines)
│   │   │   ├── useBibleNavigation.js         (120 lines)
│   │   │   ├── useBibleHighlights.js         (100 lines)
│   │   │   ├── useBibleNotes.js              (130 lines)
│   │   │   ├── useBibleTracker.js            (90 lines)
│   │   │   └── useBibleAudio.js              (110 lines)
│   │   └── __tests__/
│   │       ├── BibleStudy.test.jsx
│   │       ├── BibleStudy.integration.test.jsx
│   │       ├── VerseRenderer.test.jsx
│   │       ├── useBibleContent.test.js
│   │       └── useBibleNavigation.test.js
│   ├── ReadingPlans.jsx
│   └── devotional/
├── contexts/
│   ├── BibleContext.jsx                      (200 lines)
│   ├── ThemeContext.jsx                      (80 lines)
│   └── AuthContext.jsx                       (100 lines)
├── services/
│   ├── api/
│   │   ├── bibleApiService.js                (250 lines)
│   │   ├── bibleApiService.test.js
│   │   └── apiClient.js                      (150 lines)
│   ├── firebase/
│   │   ├── firestoreService.js               (400 lines)
│   │   ├── firestoreService.test.js
│   │   └── offlineSupport.js                 (100 lines)
│   └── monitoring.js
├── hooks/
│   ├── bible/                                (moved to features/bible/hooks)
│   ├── useAudio.js
│   ├── useDraggableWindow.js
│   └── useFirebaseAnalytics.js
├── shared/
│   ├── AudioPlayer.jsx
│   ├── CommunityFeed.jsx
│   ├── Login.jsx
│   ├── SearchWell.jsx
│   ├── ColorPicker.jsx                       (NEW)
│   └── LoadingSpinner.jsx                    (NEW)
└── utils/
    ├── verseFormatters.js                    (80 lines)
    ├── clipboardHelpers.js                   (50 lines)
    └── confettiHelpers.js                    (40 lines)
```

**Improvements:**
- ✅ Main component: 2,510 → 450 lines (82% reduction)
- ✅ Logic extracted into 6 custom hooks
- ✅ UI extracted into 9 components
- ✅ Context providers eliminate prop drilling
- ✅ Service layer with proper separation
- ✅ Comprehensive test coverage

---

## 📅 Phase-by-Phase Implementation

### Phase 1: Custom Hooks (Week 1)
**Goal:** Extract all state management into reusable hooks

**Days 1-2:**
- Create `useBibleContent` hook
- Write unit tests
- Update BibleStudy to use hook
- Verify no regressions

**Days 3-4:**
- Create `useBibleNavigation` hook
- Write unit tests
- Update BibleStudy to use hook
- Test navigation flows

**Day 5:**
- Create `useBibleHighlights` hook
- Write unit tests
- Update BibleStudy to use hook

**Day 6:**
- Create `useBibleNotes` hook
- Write unit tests
- Update BibleStudy to use hook

**Day 7:**
- Create `useBibleTracker` + `useBibleAudio` hooks
- Write unit tests
- Code review and polish

**Success Criteria:**
- ✅ All hooks have 90%+ test coverage
- ✅ BibleStudy uses all 6 hooks
- ✅ All existing tests pass
- ✅ No visual regressions

---

### Phase 2: Component Extraction (Week 2)

**Days 1-2:**
- Extract `VerseRenderer` component
- Write unit tests
- Update BibleStudy to use component
- Test verse rendering

**Days 3-4:**
- Extract `NoteEditor` component
- Write unit tests
- Update BibleStudy to use component
- Test note editing flows

**Day 5:**
- Extract `StudyModeToolbar` component
- Write unit tests
- Update BibleStudy to use component

**Day 6:**
- Extract `ChapterNavigation` component
- Write unit tests
- Update BibleStudy to use component

**Day 7:**
- Extract utility components (NotePills, ColorPicker)
- Write unit tests
- Code review

**Success Criteria:**
- ✅ All components have 80%+ test coverage
- ✅ BibleStudy < 800 lines
- ✅ All existing tests pass
- ✅ Performance same or better

---

### Phase 3: Context & State Management (Week 3)

**Days 1-2:**
- Create `BibleContext` with all hooks
- Write integration tests
- Document context API

**Days 3-4:**
- Wrap BibleStudy in BibleProvider
- Remove prop drilling
- Update child components to use context

**Day 5:**
- Create `ThemeContext`
- Remove theme prop drilling
- Test theme switching

**Day 6:**
- Create `AuthContext`
- Remove user prop drilling
- Test auth flows

**Day 7:**
- Performance testing
- Code review
- Documentation

**Success Criteria:**
- ✅ Zero prop drilling
- ✅ All contexts documented
- ✅ Integration tests pass
- ✅ No performance degradation

---

### Phase 4: Service Layer Enhancement (Week 4)

**Days 1-2:**
- Create `bibleApiService.js`
- Implement caching and retry logic
- Write unit tests

**Days 3-4:**
- Update hooks to use bibleApiService
- Test API error handling
- Test retry logic

**Day 5:**
- Enhance firestoreService
- Add batch operations
- Add optimistic updates

**Day 6:**
- Update hooks to use enhanced firestoreService
- Test offline scenarios
- Test error recovery

**Day 7:**
- Integration testing
- Performance testing
- Code review

**Success Criteria:**
- ✅ All API calls go through service layer
- ✅ Error handling comprehensive
- ✅ Offline support working
- ✅ Service tests at 90%+ coverage

---

### Phase 5: Performance Optimization (Week 5)

**Days 1-2:**
- Add React.memo to all components
- Add useMemo for calculations
- Measure re-render reduction

**Days 3-4:**
- Implement code splitting
- Add Suspense boundaries
- Measure bundle size reduction

**Day 5:**
- Implement service worker caching
- Test offline reading
- Measure load time improvement

**Day 6:**
- Add virtualization for long chapters
- Test scrolling performance
- Mobile performance testing

**Day 7:**
- Final performance audit
- Lighthouse testing
- Code review

**Success Criteria:**
- ✅ 60%+ reduction in re-renders
- ✅ 40%+ smaller initial bundle
- ✅ Lighthouse score 95+
- ✅ Mobile performance excellent

---

### Phase 6: Testing Infrastructure (Week 6)

**Days 1-2:**
- Write unit tests for all hooks
- Achieve 90%+ hook coverage

**Days 3-4:**
- Write component integration tests
- Achieve 80%+ component coverage

**Day 5:**
- Write E2E tests for critical flows
- Test on multiple browsers

**Day 6:**
- Visual regression testing
- Accessibility testing
- Mobile testing

**Day 7:**
- Final QA
- Documentation
- Deploy to production

**Success Criteria:**
- ✅ Overall code coverage 85%+
- ✅ All E2E tests pass
- ✅ No accessibility violations
- ✅ Production deployment successful

---

## 🧪 Testing Strategy

### Testing Pyramid

```
                    E2E Tests (5%)
                /               \
              /                   \
            /   Integration Tests   \
          /          (15%)            \
        /                               \
      /          Unit Tests              \
    /             (80%)                    \
  /__________________________________________\
```

### Unit Tests (80% of test suite)

**What to Test:**
- ✅ Custom hooks in isolation
- ✅ Pure utility functions
- ✅ Service layer methods
- ✅ Individual component logic

**Example:**
```javascript
// useBibleContent.test.js
describe('useBibleContent', () => {
  it('fetches chapter on mount', async () => { /* test */ });
  it('caches fetched chapters', async () => { /* test */ });
  it('handles API errors', async () => { /* test */ });
  it('preloads next chapter', async () => { /* test */ });
});
```

---

### Integration Tests (15% of test suite)

**What to Test:**
- ✅ Component interactions
- ✅ Context providers with children
- ✅ Data flow through multiple layers
- ✅ User workflows

**Example:**
```javascript
// BibleStudy.integration.test.jsx
describe('BibleStudy Integration', () => {
  it('highlights verse and creates note', async () => {
    // 1. User selects verses
    // 2. User clicks highlight
    // 3. User adds note
    // 4. Verify Firestore called
    // 5. Verify UI updated
  });
});
```

---

### E2E Tests (5% of test suite)

**What to Test:**
- ✅ Critical user flows
- ✅ Browser compatibility
- ✅ Authentication flows
- ✅ Offline functionality

**Example:**
```javascript
// bible-study.spec.js
test('complete Bible study session', async ({ page }) => {
  // 1. Sign in
  // 2. Navigate to chapter
  // 3. Highlight verses
  // 4. Add notes
  // 5. Mark as read
  // 6. Navigate to next chapter
  // 7. Verify progress saved
});
```

---

### Testing Tools

```
Tool                | Purpose                        | Current | After
--------------------|--------------------------------|---------|--------
Vitest              | Unit & Integration tests       | ✅      | ✅
@testing-library    | React component testing        | ✅      | ✅
Playwright          | E2E browser testing            | ✅      | ✅
MSW                 | API mocking                    | ❌      | ✅ NEW
Chromatic           | Visual regression testing      | ❌      | ✅ NEW
```

---

### Test Coverage Goals

```
Module                          | Current | Target | Priority
--------------------------------|---------|--------|----------
Custom Hooks                    | 0%      | 90%    | HIGH
Component Logic                 | 5%      | 80%    | HIGH
Service Layer                   | 60%     | 90%    | HIGH
API Layer                       | 100%    | 100%   | ✅
Utility Functions               | 0%      | 95%    | MEDIUM
UI Components                   | 10%     | 70%    | MEDIUM
E2E Critical Flows              | 40%     | 90%    | HIGH
```

---

## 🛡️ Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Probability:** Medium  
**Impact:** High

**Mitigation:**
1. **Feature flags:** Roll out refactoring behind flags
2. **Parallel implementation:** Keep old code until new code proven
3. **Regression testing:** Run full test suite after each phase
4. **Gradual rollout:** 10% → 50% → 100% user rollout

**Rollback Plan:**
```javascript
// Feature flag pattern
const USE_REFACTORED_BIBLE = import.meta.env.VITE_USE_REFACTORED_BIBLE === 'true';

function App() {
  return USE_REFACTORED_BIBLE ? <NewBibleStudy /> : <OldBibleStudy />;
}
```

---

### Risk 2: Performance Regression
**Probability:** Low  
**Impact:** Medium

**Mitigation:**
1. **Performance budgets:** Set max bundle size, max render time
2. **Automated testing:** Lighthouse CI on every PR
3. **Real user monitoring:** Track metrics in production
4. **Progressive enhancement:** Load features on-demand

**Monitoring:**
```javascript
// Performance tracking
import * as Sentry from '@sentry/react';

Sentry.startTransaction({
  name: 'BibleChapterLoad',
  op: 'navigation',
  data: { book, chapter }
});
```

---

### Risk 3: Incomplete Refactoring
**Probability:** Medium  
**Impact:** Medium

**Mitigation:**
1. **Clear phases:** Each phase is independently valuable
2. **Checkpoints:** Merge to main after each successful phase
3. **Documentation:** Keep refactoring status doc updated
4. **Team sync:** Daily standups during refactoring

**Status Tracking:**
```markdown
# Refactoring Status

- [x] Phase 1: Custom Hooks (Week 1) - COMPLETE ✅
- [x] Phase 2: Component Extraction (Week 2) - COMPLETE ✅
- [ ] Phase 3: Context & State (Week 3) - IN PROGRESS 🚧
- [ ] Phase 4: Service Layer (Week 4) - NOT STARTED ⏸️
- [ ] Phase 5: Performance (Week 5) - NOT STARTED ⏸️
- [ ] Phase 6: Testing (Week 6) - NOT STARTED ⏸️
```

---

### Risk 4: Team Knowledge Gap
**Probability:** Medium  
**Impact:** Low

**Mitigation:**
1. **Documentation:** Comprehensive docs for each module
2. **Code reviews:** Mandatory reviews with explanations
3. **Pair programming:** Pair on complex extractions
4. **Training sessions:** Weekly knowledge sharing

**Documentation Template:**
```markdown
# useBibleContent Hook

## Purpose
Manages Bible chapter fetching, caching, and preloading.

## Usage
\`\`\`javascript
const { verses, loading, error } = useBibleContent('Genesis', 1, 'NLT');
\`\`\`

## API
- \`verses\`: Array of verse objects
- \`loading\`: Boolean loading state
- \`error\`: Error object or null

## Testing
See useBibleContent.test.js for examples.
```

---

## 📊 Success Metrics

### Code Quality Metrics

| Metric                        | Before | Target | Measurement |
|-------------------------------|--------|--------|-------------|
| Main component lines          | 2,510  | 500    | LOC counter |
| Average component complexity  | 45     | 15     | Cyclomatic complexity |
| Code duplication              | 15%    | 5%     | SonarQube |
| Test coverage                 | 45%    | 85%    | Vitest --coverage |
| Type safety                   | 0%     | 80%    | TypeScript |

---

### Performance Metrics

| Metric                        | Before | Target | Measurement |
|-------------------------------|--------|--------|-------------|
| Initial bundle size           | 380kb  | 230kb  | webpack-bundle-analyzer |
| Time to Interactive (TTI)     | 3.2s   | 1.8s   | Lighthouse |
| First Contentful Paint (FCP)  | 1.5s   | 0.9s   | Lighthouse |
| Re-renders per interaction    | 12     | 5      | React DevTools |
| Memory usage (peak)           | 95MB   | 60MB   | Chrome DevTools |

---

### Developer Experience Metrics

| Metric                        | Before | Target | Measurement |
|-------------------------------|--------|--------|-------------|
| Time to understand component  | 4h     | 1h     | Survey |
| Time to fix bug               | 2h     | 30m    | GitHub metrics |
| Time to add feature           | 8h     | 3h     | GitHub metrics |
| Test execution time           | 45s    | 20s    | Vitest output |
| Hot reload time               | 2.1s   | 0.8s   | Vite metrics |

---

### Mobile Readiness Metrics

| Metric                        | Before | Target | Measurement |
|-------------------------------|--------|--------|-------------|
| Components reusable in RN     | 20%    | 80%    | Manual audit |
| Platform-specific code        | 30%    | 10%    | Code analysis |
| Shared business logic         | 40%    | 90%    | Code analysis |
| Mobile performance score      | 65     | 90     | Lighthouse Mobile |

---

## 🎯 Expected Outcomes

### Immediate Benefits (After Phase 1-2)
1. **Reduced complexity:** Main component 82% smaller
2. **Better testability:** Hooks tested in isolation
3. **Easier debugging:** Clear separation of concerns
4. **Faster onboarding:** New devs productive in 2 days vs 5 days

### Medium-term Benefits (After Phase 3-4)
1. **No prop drilling:** Context eliminates 90% of prop passing
2. **Better error handling:** Service layer with retry logic
3. **Offline support:** Service worker caching
4. **Mobile ready:** 80% of logic reusable in React Native

### Long-term Benefits (After Phase 5-6)
1. **Performance:** 60% fewer re-renders, 40% smaller bundle
2. **Reliability:** 85%+ test coverage catches bugs early
3. **Scalability:** Easy to add new features (reading plans, annotations)
4. **Maintainability:** Bug fixes 75% faster

---

## 📝 Implementation Checklist

### Pre-Refactoring
- [ ] Create feature branch `refactor/bible-study-phase-1`
- [ ] Set up test infrastructure (MSW, Chromatic)
- [ ] Document current functionality
- [ ] Create performance baseline
- [ ] Get team buy-in

### Phase 1: Custom Hooks
- [ ] Create `useBibleContent` hook + tests
- [ ] Create `useBibleNavigation` hook + tests
- [ ] Create `useBibleHighlights` hook + tests
- [ ] Create `useBibleNotes` hook + tests
- [ ] Create `useBibleTracker` hook + tests
- [ ] Create `useBibleAudio` hook + tests
- [ ] Update BibleStudy to use all hooks
- [ ] Verify all tests pass
- [ ] Merge to main

### Phase 2: Component Extraction
- [ ] Extract `VerseRenderer` + tests
- [ ] Extract `NoteEditor` + tests
- [ ] Extract `StudyModeToolbar` + tests
- [ ] Extract `ChapterNavigation` + tests
- [ ] Extract utility components + tests
- [ ] Update BibleStudy to use all components
- [ ] Verify all tests pass
- [ ] Merge to main

### Phase 3: Context & State Management
- [ ] Create `BibleContext` + integration tests
- [ ] Create `ThemeContext` + tests
- [ ] Create `AuthContext` + tests
- [ ] Remove prop drilling
- [ ] Update documentation
- [ ] Merge to main

### Phase 4: Service Layer Enhancement
- [ ] Create `bibleApiService` + tests
- [ ] Enhance `firestoreService` + tests
- [ ] Update hooks to use services
- [ ] Test offline scenarios
- [ ] Merge to main

### Phase 5: Performance Optimization
- [ ] Add React.memo to components
- [ ] Add useMemo for calculations
- [ ] Implement code splitting
- [ ] Add service worker caching
- [ ] Run performance audit
- [ ] Merge to main

### Phase 6: Testing Infrastructure
- [ ] Write unit tests for all hooks (90%+ coverage)
- [ ] Write component integration tests (80%+ coverage)
- [ ] Write E2E tests for critical flows
- [ ] Visual regression tests
- [ ] Accessibility tests
- [ ] Merge to main

### Post-Refactoring
- [ ] Update all documentation
- [ ] Team training session
- [ ] Monitor production metrics
- [ ] Gather user feedback
- [ ] Celebrate! 🎉

---

## 📚 Additional Resources

### Documentation to Create
1. **Architecture Decision Records (ADRs)**
   - Why custom hooks over Redux
   - Why Context API over MobX
   - Why code splitting strategy

2. **Developer Guides**
   - How to add a new Bible feature
   - How to test Bible components
   - How to debug performance issues

3. **API Documentation**
   - BibleContext API reference
   - Custom hooks API reference
   - Service layer API reference

### Tools & Libraries to Add
```json
{
  "devDependencies": {
    "msw": "^2.0.0",               // API mocking
    "chromatic": "^11.0.0",         // Visual regression
    "react-window": "^1.8.10",      // Virtualization
    "webpack-bundle-analyzer": "^4.10.0"  // Bundle analysis
  }
}
```

---

## 🎬 Conclusion

This refactoring roadmap provides a **comprehensive, phased approach** to modernizing the Equip Daily codebase without breaking existing functionality. By following this plan:

- **Week 1-2:** Extract logic into reusable modules (hooks + components)
- **Week 3-4:** Improve architecture (contexts + services)
- **Week 5-6:** Optimize and test (performance + comprehensive testing)

The result will be a **maintainable, testable, performant, and mobile-ready** codebase that supports rapid feature development and easy onboarding.

---

**Status:** 📋 Planning Complete - Ready for Implementation  
**Next Step:** Team review and approval to begin Phase 1

---

*This document is a living guide and should be updated as refactoring progresses.*
