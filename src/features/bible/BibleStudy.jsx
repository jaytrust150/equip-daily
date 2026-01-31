import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import confetti from 'canvas-confetti';

// --- IMPORTS ---
import { bibleData } from '../../data/bibleData'; 
import { BIBLE_BOOK_IDS } from '../../bibleData';
import Login from '../../shared/Login'; 
import BibleVersionPicker from './BibleVersionPicker';
import CommunityFeed from '../../shared/CommunityFeed';
import FloatingTools from './FloatingTools';
import BibleTracker from './BibleTracker';
import AudioPlayer from '../../shared/AudioPlayer';
import { auth } from "../../config/firebase";
import { db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { 
  COLOR_PALETTE, 
  DEFAULT_NOTE_COLOR, 
  DEFAULT_HIGHLIGHT_DATA, 
  AUDIO_BASE_PATH,
  DEFAULT_BIBLE_VERSION,
  AUDIO_FALLBACK_VERSION,
  USFM_MAPPING,
  hasAudioSupport,
  AUDIO_BIBLE_MAP
} from '../../config/constants'; 
import { 
  subscribeToNotes, saveNote, deleteNote,
  subscribeToUserProfile, updateUserHighlight
} from '../../services/firestoreService';

// 🎨 COLORS
const NOTE_BUTTON_COLOR = '#2196F3'; 
const COPY_BUTTON_COLOR = '#ff9800'; 
const SAVE_BUTTON_COLOR = '#4caf50'; 
const DELETE_BUTTON_COLOR = '#f44336'; 

function BibleStudy({ theme, book, setBook, chapter, setChapter, onSearch, onProfileClick }) {
    // Search well visibility state
    const [showSearchWell, setShowSearchWell] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  
  // ✅ Load user's default Bible version or use constant default
  const [version, setVersion] = useState(DEFAULT_BIBLE_VERSION);
  const [bibleVersions, setBibleVersions] = useState([]);
  const [audioVersion, setAudioVersion] = useState(null); // Track which version audio is from
  const [audioVerses, setAudioVerses] = useState([]); // Store fallback version text
  const [readChapters, setReadChapters] = useState([]); // Track read chapters
  const [showBibleTracker, setShowBibleTracker] = useState(false); // Show/hide Bible tracker modal
  const [testamentFilter, setTestamentFilter] = useState(null); // 'OT' or 'NT' or null
  const [showTestamentNav, setShowTestamentNav] = useState(null); // 'OT' or 'NT' or null - for compact navigation
  const [testamentDrillBook, setTestamentDrillBook] = useState(null); // For showing chapters when book clicked

  const [verses, setVerses] = useState([]);
  const [_selectedVerses, _setSelectedVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate if current chapter is read
  const isChapterRead = readChapters.includes(`${book} ${chapter}`);

  const drillReadCount = testamentDrillBook
    ? readChapters.filter(entry => entry.startsWith(`${testamentDrillBook.name} `)).length
    : 0;
  const drillPercent = testamentDrillBook
    ? Math.round((drillReadCount / testamentDrillBook.chapters) * 100)
    : 0;
  
  // ✅ FEEDBACK STATES
  // eslint-disable-next-line no-unused-vars
  const [copyFeedback, setCopyFeedback] = useState("");
  const [noteFeedback, setNoteFeedback] = useState({}); 
  const [versesCopied, setVersesCopied] = useState(false); // Track if verses are copied

  // Highlights Map & Notes
  const [highlightsMap, setHighlightsMap] = useState({});
  const [userNotes, setUserNotes] = useState([]);
  
  // NOTE & STUDY MODES
  const [showNotes, setShowNotes] = useState(false); // Default to Reading Mode
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({}); // Track which notes are expanded in reading mode
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const noteEditorRef = useRef(null);
  
  const [fontSize, setFontSize] = useState(1.1);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [floatingToolsPosition, setFloatingToolsPosition] = useState(null);
  const [selectedVerses, setSelectedVerses] = useState([]);
  // ✅ Safe default color (prevents crash if COLOR_PALETTE is undefined)
  const [activeHighlightColor, setActiveHighlightColor] = useState(() => {
    return (COLOR_PALETTE && COLOR_PALETTE.length > 0) ? COLOR_PALETTE[0] : { code: '#ffff00', border: '#e6e600', name: 'Yellow' };
  });

  // 📊 Memoized Testament Books Calculations (for future optimizations)
   
  const _oldTestamentBooks = useMemo(() => {
    return bibleData ? bibleData.filter(bookData => bookData.section === 'OT') : [];
  }, []);

   
  const _newTestamentBooks = useMemo(() => {
    return bibleData ? bibleData.filter(bookData => bookData.section === 'NT') : [];
  }, []);

   
  const _totalReadCount = useMemo(() => {
    return readChapters.length;
  }, [readChapters]);

   
  const _totalChapters = useMemo(() => {
    return bibleData ? bibleData.reduce((sum, book) => sum + book.chapters, 0) : 0;
  }, []);

   
  const _readPercent = useMemo(() => {
    return _totalChapters > 0 ? Math.round((_totalReadCount / _totalChapters) * 100) : 0;
  }, [_totalReadCount, _totalChapters]);

  // --- CHAPTER PRELOADING ---
  const [preloadedChapters, setPreloadedChapters] = useState({});
  const preloadTimeoutRef = useRef(null);

  // --- AUDIO STATE ---
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // --- LONG PRESS STATE ---
  const longPressTimer = useRef(null);
  const [longPressVerse, setLongPressVerse] = useState(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  
  // --- CLICK DETECTION STATE (for chapter/book navigation vs marking) ---
  // eslint-disable-next-line no-unused-vars
  const chapterClickTimeouts = useRef({}); // Maps chapter to timeout ID
  const bookClickTimeouts = useRef({}); // Maps book to timeout ID
  
  // --- MODAL POSITIONING & DRAGGING ---
  // eslint-disable-next-line no-unused-vars
  const modalRef = useRef(null);
  const [editorPosition, setEditorPosition] = useState({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 });
  const [isEditorDragging, setIsEditorDragging] = useState(false);
  const editorDragStart = useRef({ x: 0, y: 0 });
  
  // --- DOUBLE CLICK TRACKING ---
  // eslint-disable-next-line no-unused-vars
  const doubleClickFlags = useRef({}); // Prevents click handler from running after double-click

  // 0️⃣ LOAD USER'S DEFAULT BIBLE VERSION & READ HISTORY
  useEffect(() => {
    if (!user || !db) return;
    const loadUserSettings = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.defaultBibleVersion) {
          setVersion(data.defaultBibleVersion);
        }
        if (data.readChapters && Array.isArray(data.readChapters)) {
          setReadChapters(data.readChapters);
        }
      }
    };
    loadUserSettings();
  }, [user]);

  // ✅ CLOSE LOGIN MODAL WHEN USER SIGNS IN
  useEffect(() => {
    if (user) {
      setShowLoginModal(false);
    }
  }, [user]);

  // AUTO-HIGHLIGHT VERSE FROM SEARCH
  useEffect(() => {
    const verseNum = sessionStorage.getItem('jumpToVerse');
    if (verseNum) {
      setTimeout(() => {
        const verseEl = document.getElementById(`verse-${verseNum}`);
        if (verseEl) {
          verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Temporarily highlight the verse with a golden background
          verseEl.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
          setTimeout(() => {
            verseEl.style.backgroundColor = '';
          }, 2000);
        }
      }, 100);
      sessionStorage.removeItem('jumpToVerse');
    }
  }, [chapter]); // Trigger when chapter changes from search

  // 1. 🔄 Fetch Bible Content from API
  useEffect(() => {
    async function fetchBibleText() {
      if (!book || !chapter) return;
      
      const cacheKey = `${book}-${chapter}-${version}`;
      
      // If we have preloaded data, use it immediately without loading state
      if (preloadedChapters[cacheKey]) {
        setVerses(preloadedChapters[cacheKey]);
        setError(null);
        return; // Skip API call and loading state - use preloaded data
      }
      
      // No preloaded data, show loading state and fetch
      setLoading(true);
      setError(null);
      let isSwitching = false;

      try {
        const bookId = BIBLE_BOOK_IDS[book] || 'GEN';
        
        // 🔒 Use serverless proxy (production) or direct API (development)
        const isDev = import.meta.env.DEV;
        const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
        
        let response;
        if (isDev && apiKey) {
          // Development mode: direct API call
          const params = new URLSearchParams({
            'content-type': 'json',
            'include-verse-numbers': 'true',
            'include-titles': 'true',
            'include-chapter-numbers': 'true',
            'include-verse-spans': 'true'
          });
          const url = `https://rest.api.bible/v1/bibles/${version}/chapters/${bookId}.${chapter}?${params}`;
          response = await fetch(url, {
            headers: { 'api-key': apiKey.trim() }
          });
        } else {
          // Production mode: use serverless proxy
          const url = `/api/bible-chapter?bibleId=${version}&bookId=${bookId}&chapter=${chapter}`;
          response = await fetch(url);
        }

        if (response.status === 401 || response.status === 403 || (response.ok && (await response.clone().json()).unauthorized)) {
            // 🔄 Fallback to KJV if the default version is unauthorized (likely permission issue)
            if (version !== 'de4e12af7f28f599-01') {
                console.warn("Unauthorized on current version. Switching to KJV...");
                setVersion('de4e12af7f28f599-01');
                isSwitching = true;
                return; 
            }

            console.error("API Authorization Failed. Check Vercel environment variables and API.Bible configuration");
            throw new Error(`Unauthorized. Check API key configuration in Vercel.`);
        }
        if (!response.ok) throw new Error(`Error ${response.status}: Failed to load Bible text.`);

        const data = await response.json();
        
        // Parse the nested JSON structure from API.Bible
        if (data && data.data && data.data.content) {
            const parsedVerses = parseBibleContent(data.data.content);
            setVerses(parsedVerses);
            
            // 📖 Track this chapter as read
            // trackChapterRead(book, chapter);
        } else {
            setVerses([]);
        }

      } catch (err) {
        console.error("Bible API Error:", err);
        setError(err.message);
      } finally {
        if (!isSwitching) {
            setLoading(false);
        }
      }
    }

    fetchBibleText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, version]);

  // 1a. 🔄 Preload adjacent chapters (next & previous) silently
  useEffect(() => {
    // Clear previous timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Debounce preloading to avoid excessive API calls during rapid navigation
    preloadTimeoutRef.current = setTimeout(() => {
      const preloadChapter = async (bookName, chapterNum) => {
        if (!bookName || !chapterNum) return;
        
        const cacheKey = `${bookName}-${chapterNum}-${version}`;
        
        // Skip if already preloaded
        if (preloadedChapters[cacheKey]) return;
        
        try {
          const bookId = BIBLE_BOOK_IDS[bookName] || 'GEN';
          const isDev = import.meta.env.DEV;
          const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
          
          let response;
          if (isDev && apiKey) {
            const params = new URLSearchParams({
              'content-type': 'json',
              'include-verse-numbers': 'true',
              'include-titles': 'true',
              'include-chapter-numbers': 'true',
              'include-verse-spans': 'true'
            });
            const url = `https://rest.api.bible/v1/bibles/${version}/chapters/${bookId}.${chapterNum}?${params}`;
            response = await fetch(url, { headers: { 'api-key': apiKey.trim() } });
          } else {
            const url = `/api/bible-chapter?bibleId=${version}&bookId=${bookId}&chapter=${chapterNum}`;
            response = await fetch(url);
          }
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.data && data.data.content) {
              const parsedVerses = parseBibleContent(data.data.content);
              setPreloadedChapters(prev => ({
                ...prev,
                [cacheKey]: parsedVerses
              }));
            }
          }
        } catch {
          // Preload failed, ignore
        }
      };
      
      // Helper to get next book/chapter with wraparound
      const getNextChapterInfo = () => {
        const bookIndex = bibleData.findIndex(b => b.name === book);
        const chapterCount = bibleData[bookIndex]?.chapters || 1;
        if (chapter < chapterCount) {
          return { book, chapter: chapter + 1 };
        }
        if (bookIndex < bibleData.length - 1) {
          return { book: bibleData[bookIndex + 1].name, chapter: 1 };
        }
        // Wrap to Genesis 1
        return { book: bibleData[0].name, chapter: 1 };
      };
      
      // Helper to get previous book/chapter with wraparound
      const getPrevChapterInfo = () => {
        const bookIndex = bibleData.findIndex(b => b.name === book);
        if (chapter > 1) {
          return { book, chapter: chapter - 1 };
        }
        if (bookIndex > 0) {
          const prevBook = bibleData[bookIndex - 1];
          return { book: prevBook.name, chapter: prevBook.chapters };
        }
        // Wrap to Revelation last chapter
        const lastBook = bibleData[bibleData.length - 1];
        return { book: lastBook.name, chapter: lastBook.chapters };
      };
      
      // Preload next chapter
      const nextInfo = getNextChapterInfo();
      preloadChapter(nextInfo.book, nextInfo.chapter);
      
      // Preload previous chapter
      const prevInfo = getPrevChapterInfo();
      preloadChapter(prevInfo.book, prevInfo.chapter);
    }, 800); // Debounce 800ms to avoid hammer API during fast clicking
    
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, version]);

  // 1b. 📚 Fetch Bible Versions from API (no filtering)
  useEffect(() => {
    let isMounted = true;

    async function fetchBibleVersions() {
      try {
        const isDev = import.meta.env.DEV;
        const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
        let response;

        if (isDev && apiKey) {
          response = await fetch('https://rest.api.bible/v1/bibles', {
            headers: { 'api-key': apiKey.trim() }
          });
        } else {
          response = await fetch('/api/bibles');
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch versions: ${response.status}`);
        }

        const data = await response.json();
        const versions = (data.data || []).map((bible) => ({
          id: bible.id,
          name: bible.name,
          abbreviation: bible.abbreviation || bible.abbreviationLocal || bible.name,
          language: bible.language?.id || bible.language?.name || 'other',
          hasAudio: Array.isArray(bible.audioBibles) && bible.audioBibles.length > 0
        }));

        if (isMounted) {
          setBibleVersions(versions);
          if (versions.length > 0) {
            setVersion((prev) => versions.find((v) => v.id === prev) ? prev : versions[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load Bible versions:', err);
      }
    }

    fetchBibleVersions();
    return () => { isMounted = false; };
  }, []);

  // Function to toggle chapter read status
  const markChapterAsRead = async (bookName = book, chapterNum = chapter) => {
    if (!user) {
      alert('Please sign in to track your reading progress.');
      return;
    }
    
    const chapterKey = `${bookName} ${chapterNum}`;
    const isCurrentlyRead = readChapters.includes(chapterKey);
    
    // Toggle: if already read, remove it; otherwise add it
    const updatedChapters = isCurrentlyRead
      ? readChapters.filter(key => key !== chapterKey)
      : [...readChapters, chapterKey];
    
    setReadChapters(updatedChapters);
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { readChapters: updatedChapters });
      
      // 🎉 Trigger confetti only when marking as read (not when unmarking)
      if (!isCurrentlyRead) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
    } catch (err) {
      console.error('Error updating chapter read status:', err);
    }
  };

  // Function to toggle chapter read status (for Bible Tracker double-click)
  const toggleChapterRead = async (chapterKey) => {
    if (!user) return;
    
    const isCurrentlyRead = readChapters.includes(chapterKey);
    const updatedChapters = isCurrentlyRead
      ? readChapters.filter(key => key !== chapterKey)
      : [...readChapters, chapterKey];
    
    setReadChapters(updatedChapters);
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { readChapters: updatedChapters });
      
      // 🎉 Trigger confetti when marking as read
      if (!isCurrentlyRead) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
    } catch (err) {
      console.error('Error toggling chapter read status:', err);
    }
  };

  // 📖 Track chapter as read in Firestore (keeping as infrastructure for future use)
  // eslint-disable-next-line no-unused-vars
  const trackChapterRead = async (bookName, chapterNum) => {
    if (!user || !db) return;
    const chapterKey = `${bookName} ${chapterNum}`;
    if (readChapters.includes(chapterKey)) return; // Already tracked
    
    const updatedChapters = [...readChapters, chapterKey];
    setReadChapters(updatedChapters);
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { readChapters: updatedChapters });
    } catch (err) {
      console.error("Error tracking read chapter:", err);
    }
  };

  // Helper to parse the complex JSON from API.Bible
  // API.Bible returns nested structure: para → verse (with attrs) → text nodes
  const parseBibleContent = (content) => {
    const verses = [];
    let currentVerseNumber = null;
    let currentVerseTexts = [];

    const processNode = (node) => {
      // Check if this is a verse marker (node.name === 'verse' with attrs.number)
      if (node.name === 'verse' && node.attrs?.number) {
        // Save previous verse if any
        if (currentVerseNumber !== null && currentVerseTexts.length > 0) {
          verses.push({
            number: currentVerseNumber,
            text: currentVerseTexts.join('').trim(),
            id: currentVerseNumber
          });
        }
        // Start new verse
        currentVerseNumber = node.attrs.number;
        currentVerseTexts = [];
      }
      // If node has text, add to current verse
      else if (node.text && currentVerseNumber !== null) {
        currentVerseTexts.push(node.text);
      }
      // Recursively process child items
      else if (node.items && Array.isArray(node.items)) {
        node.items.forEach(processNode);
      }
    };

    // Process all content items (typically paragraphs)
    if (Array.isArray(content)) {
      content.forEach(para => {
        if (para.items && Array.isArray(para.items)) {
          para.items.forEach(processNode);
        }
      });
    }

    // Save final verse if any
    if (currentVerseNumber !== null && currentVerseTexts.length > 0) {
      verses.push({
        number: currentVerseNumber,
        text: currentVerseTexts.join('').trim(),
        id: currentVerseNumber
      });
    }

    return verses;
  };

  // 2. 🎧 Audio Player Effect with Fallback to WEB
  useEffect(() => {
    if (!book || !chapter) return;
    
    // For NLT, audio is not available - use WEB as fallback
    const needsAudioFallback = version === DEFAULT_BIBLE_VERSION;
    
    // If using fallback, fetch the audio version text
    if (needsAudioFallback) {
      setAudioVersion('WEB'); // Set display name
      
      // Fetch WEB text for audio synchronization
      async function fetchAudioVersionText() {
        try {
          const bookId = BIBLE_BOOK_IDS[book] || 'GEN';
          const isDev = import.meta.env.DEV;
          const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
          
          let response;
          if (isDev && apiKey) {
            const params = new URLSearchParams({
              'content-type': 'json',
              'include-verse-numbers': 'true',
              'include-titles': 'true',
              'include-chapter-numbers': 'true',
              'include-verse-spans': 'true'
            });
            const url = `https://rest.api.bible/v1/bibles/${AUDIO_FALLBACK_VERSION}/chapters/${bookId}.${chapter}?${params}`;
            response = await fetch(url, {
              headers: { 'api-key': apiKey.trim() }
            });
          } else {
            response = await fetch(`/api/bible-chapter?bibleId=${AUDIO_FALLBACK_VERSION}&bookId=${bookId}&chapter=${chapter}`);
          }
          
          if (response.ok) {
            const data = await response.json();
            const extractedVerses = parseBibleContent(data.data.content);
            setAudioVerses(extractedVerses);
          }
        } catch (err) {
          console.warn('Failed to fetch audio version text:', err);
          setAudioVerses([]);
        }
      }
      
      fetchAudioVersionText();
    } else {
      setAudioVersion(null);
      setAudioVerses([]);
    }
    
    // Reset audio state when chapter changes
    setAudioUrl(null);
    setAudioError(false);
    setAudioLoading(false);
    
    // Fetch audio from API.Bible if supported
    async function loadAudioFromAPI() {
      setAudioLoading(true);
      setAudioError(false);
      
      // Check if this Bible version has audio support
      const audioBibleId = AUDIO_BIBLE_MAP[version];
      if (!audioBibleId) {
        setAudioError(true);
        setAudioLoading(false);
        return;
      }
      
      try {
        const bookId = BIBLE_BOOK_IDS[book] || 'GEN';
        const chapterId = `${bookId}.${chapter}`;
        
        const isDev = import.meta.env.DEV;
        const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
        
        let response;
        if (isDev && apiKey) {
          // Direct API call in development
          const url = `https://rest.api.bible/v1/audio-bibles/${audioBibleId}/chapters/${chapterId}`;
          response = await fetch(url, {
            headers: { 'api-key': apiKey.trim() }
          });
          
          if (response.ok) {
            const data = await response.json();
            const fetchedAudioUrl = data.data?.resourceUrl;
            
            if (fetchedAudioUrl) {
              setAudioUrl(fetchedAudioUrl);
              setAudioLoading(false);
            } else {
              setAudioError(true);
              setAudioLoading(false);
            }
          } else {
            setAudioError(true);
            setAudioLoading(false);
          }
        } else {
          // Use serverless function in production
          response = await fetch(`/api/bible-audio?bibleId=${audioBibleId}&chapterId=${chapterId}`);
          
          if (response.ok) {
            const data = await response.json();
            const fetchedAudioUrl = data.audioUrl;
            
            if (fetchedAudioUrl) {
              setAudioUrl(fetchedAudioUrl);
              setAudioLoading(false);
            } else {
              setAudioError(true);
              setAudioLoading(false);
            }
          } else {
            setAudioError(true);
            setAudioLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        setAudioError(true);
        setAudioLoading(false);
      }
    }
    
    // Only load audio if version has support
    if (hasAudioSupport(version)) {
      loadAudioFromAPI();
    } else {
      setAudioError(true);
    }
  }, [book, chapter, version]);

  // eslint-disable-next-line no-unused-vars
  const toggleAudio = () => {
    if (audioError || audioLoading) return;
    // Toggle showing the audio player
    setAudioUrl(audioUrl ? null : audioUrl);
  };

  const getBookIndex = () => bibleData.findIndex(b => b.name === book);
  const getChapterCount = () => bibleData.find(b => b.name === book)?.chapters || 1;

  const goToPrevChapter = () => {
    const bookIndex = getBookIndex();
    if (chapter > 1) {
      setChapter(chapter - 1);
      return;
    }
    if (bookIndex > 0) {
      const prevBook = bibleData[bookIndex - 1];
      setBook(prevBook.name);
      setChapter(prevBook.chapters);
    } else {
      // Wrap around: Genesis 1 previous → Revelation last chapter
      const lastBook = bibleData[bibleData.length - 1];
      setBook(lastBook.name);
      setChapter(lastBook.chapters);
    }
  };

  const goToNextChapter = () => {
    const chapterCount = getChapterCount();
    const bookIndex = getBookIndex();
    if (chapter < chapterCount) {
      setChapter(chapter + 1);
      return;
    }
    if (bookIndex < bibleData.length - 1) {
      const nextBook = bibleData[bookIndex + 1];
      setBook(nextBook.name);
      setChapter(1);
    } else {
      // Wrap around: Revelation last chapter next → Genesis 1
      const firstBook = bibleData[0];
      setBook(firstBook.name);
      setChapter(1);
    }
  };

  // 3. 🔥 Firebase Subscriptions (Notes & Highlights)
  useEffect(() => {
    if (!user) return;
    
    // ✅ Guard against undefined imports (prevents white screen)
    // Wrap in try-catch to handle permission errors gracefully
    let unsubscribeNotes = () => {};
    let unsubscribeProfile = () => {};
    
    try {
      if (typeof subscribeToNotes === 'function') {
        unsubscribeNotes = subscribeToNotes(user.uid, book, chapter, setUserNotes);
      }
    } catch (error) {
      console.warn('Could not subscribe to notes:', error.message);
    }

    try {
      if (typeof subscribeToUserProfile === 'function') {
        unsubscribeProfile = subscribeToUserProfile(user.uid, (data) => {
          if (data?.highlights && data.highlights[book] && data.highlights[book][chapter]) {
            setHighlightsMap(data.highlights[book][chapter]);
          } else {
            setHighlightsMap({});
          }
        });
      }
    } catch (error) {
      console.warn('Could not subscribe to profile:', error.message);
    }

    return () => {
      try {
        if (typeof unsubscribeNotes === 'function') unsubscribeNotes();
      } catch (error) {
        console.warn('Error unsubscribing notes:', error.message);
      }
      try {
        if (typeof unsubscribeProfile === 'function') unsubscribeProfile();
      } catch (error) {
        console.warn('Error unsubscribing profile:', error.message);
      }
    };
  }, [user, book, chapter]);


  // 4. 🖱️ Interaction Handlers
  const handleVerseClick = async (verseNum, allowHighlight = true) => {
    // 🔍 Check if in Study Mode (for selection) or Reading Mode
    const inStudyMode = showNotes || isNoteMode || showNotebook;
    
    // In reading mode, only allow highlighting if explicitly allowed
    if (!inStudyMode) {
      if (!allowHighlight) return;
      await handleVerseHighlight(verseNum);
      return;
    }
    
    // ✅ In study mode: Single click selects verses (does NOT open editor)
    // Long press will open the inline editor
    setSelectedVerses((prev) =>
      prev.includes(verseNum)
        ? prev.filter((v) => v !== verseNum)
        : [...prev, verseNum]
    );
  };

  const handleVerseHighlight = async (verseNum) => {
    // Toggle Highlight logic
    const currentHighlight = highlightsMap[verseNum];
    let newHighlight = null;

    if (!currentHighlight) {
        // Apply current active color
        newHighlight = { bg: activeHighlightColor.code, border: activeHighlightColor.border };
    } else if (currentHighlight.bg !== activeHighlightColor.code) {
        // Change color
        newHighlight = { bg: activeHighlightColor.code, border: activeHighlightColor.border };
    } else {
        // Remove highlight
        newHighlight = null;
    }

    // Update Local State immediately for speed
    setHighlightsMap(prev => {
        const next = { ...prev };
        if (newHighlight) next[verseNum] = newHighlight;
        else delete next[verseNum];
        return next;
    });

    // Save to Firebase (only if user is logged in)
    if (user) {
      await updateUserHighlight(user.uid, book, chapter, verseNum, newHighlight);
    }
  };

  const handleCopyFromEditor = async () => {
    // If verses are selected, copy all of them with proper formatting
    // Otherwise, copy just the verse being edited
    const versesToCopy = selectedVerses.length > 0 ? selectedVerses : (longPressVerse ? [longPressVerse] : []);
    
    if (versesToCopy.length === 0) return;
    
    try {
      const verseRefs = formatVerseReference(versesToCopy);
      const verseTexts = versesToCopy
        .map(v => verses?.find(vrs => vrs.number === v)?.text || '')
        .filter(t => t)
        .join(' ');
      
      const textToCopy = `${verseTexts}\n\n— ${verseRefs}`;
      await navigator.clipboard.writeText(textToCopy);
      
      setVersesCopied(true); // Mark as copied
      setNoteFeedback({ type: 'success', msg: `Copied ${versesToCopy.length} verse${versesToCopy.length !== 1 ? 's' : ''}` });
      setTimeout(() => setNoteFeedback({}), 2000);
    } catch (err) {
      console.error('Copy from editor failed:', err);
      setNoteFeedback({ type: 'error', msg: 'Failed to copy verses' });
      setTimeout(() => setNoteFeedback({}), 2000);
    }
  };

  // Long press handlers for inline note editor
  const handleMouseDown = (verseNum) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressVerse(verseNum);
      setCurrentNoteText(""); // Clear any existing text
    }, 500); // 500ms = long press threshold
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancelNote = () => {
    setLongPressVerse(null);
    setCurrentNoteText("");
  };

  // eslint-disable-next-line no-unused-vars
  const handleApplyColor = (color) => {
    if (color) setActiveHighlightColor(color);
    setShowHighlightPalette(false);
  };

  const handleSaveSelectedNote = async () => {
    if (!user || selectedVerses.length === 0 || !currentNoteText.trim()) {
      return;
    }
    try {
      await saveNote(user, book, chapter, selectedVerses, currentNoteText);
      setSelectedVerses([]);
      setShowNotebook(false);
      setIsNoteMode(false);
      setCurrentNoteText("");
      setNoteFeedback({ type: 'success', msg: 'Note Saved!' });
      setTimeout(() => setNoteFeedback({}), 2000);
    } catch (error) {
      console.error('Error saving note:', error);
      setNoteFeedback({ type: 'error', msg: 'Failed to save note: ' + error.message });
      setTimeout(() => setNoteFeedback({}), 3000);
    }
  };

  const handleCopyVerses = async () => {
    if (selectedVerses.length === 0) return;
    try {
      const verseRefs = formatVerseReference(selectedVerses);
      const verseTexts = selectedVerses
        .map(v => verses?.find(vrs => vrs.number === v)?.text || '')
        .filter(t => t)
        .join(' ');
      
      const textToCopy = `${verseTexts}\n\n— ${verseRefs}`;
      await navigator.clipboard.writeText(textToCopy);
      
      setVersesCopied(true); // Mark as copied
      setNoteFeedback({ type: 'success', msg: `Copied ${selectedVerses.length} verse${selectedVerses.length !== 1 ? 's' : ''}` });
      setTimeout(() => setNoteFeedback({}), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setNoteFeedback({ type: 'error', msg: 'Failed to copy verses' });
      setTimeout(() => setNoteFeedback({}), 2000);
    }
  };

  const formatVerseReference = (verses, useAbbrev = false) => {
    if (!verses || verses.length === 0) return '';
    const sorted = [...new Set(verses)].sort((a, b) => a - b);
    const segments = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      if (current === end + 1) {
        end = current;
      } else {
        segments.push(start === end ? `${start}` : `${start}-${end}`);
        start = current;
        end = current;
      }
    }
    segments.push(start === end ? `${start}` : `${start}-${end}`);

    const bookLabel = useAbbrev ? (USFM_MAPPING[book] || book) : book;
    return `${bookLabel} ${chapter}:${segments.join(', ')}`;
  };

  const handlePasteVerses = () => {
    if (selectedVerses.length === 0) {
      setNoteFeedback({ type: 'error', msg: 'No verses selected' });
      setTimeout(() => setNoteFeedback({}), 2000);
      return;
    }
    const verseRefs = formatVerseReference(selectedVerses);
    setNoteFeedback({ type: 'info', msg: `Reference: ${verseRefs}` });
    setTimeout(() => setNoteFeedback({}), 3000);
  };

  const handleClearNote = () => {
    setCurrentNoteText("");
    setSelectedVerses([]);
    setShowNotebook(false);
    setIsNoteMode(false);
    setNoteFeedback({ type: 'success', msg: 'Note cleared' });
    setTimeout(() => setNoteFeedback({}), 2000);
  };

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) goToNextChapter();
      else goToPrevChapter();
    }
  };

  const handleSaveNote = async () => {
    if (!user) {
      alert('Please sign in to save notes.');
      return;
    }
    if (!currentNoteText.trim()) return;
    if (!longPressVerse) return;
    
    try {
      await saveNote(user, book, chapter, [longPressVerse], currentNoteText);
      setCurrentNoteText("");
      setLongPressVerse(null); // Close the inline editor
      setIsNoteMode(false);
      setEditingNoteId(null);
      setNoteFeedback({ type: 'success', msg: 'Note Saved!' });
      setTimeout(() => setNoteFeedback({}), 2000);
    } catch (error) {
      console.error('Error saving long-press note:', error);
      setNoteFeedback({ type: 'error', msg: 'Failed to save note: ' + error.message });
      setTimeout(() => setNoteFeedback({}), 3000);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setCurrentNoteText(note.text);
    setIsNoteMode(true);
  };

  const handleDeleteNote = async () => {
    if (!editingNoteId || !user) return;
    await deleteNote(editingNoteId);
    setEditingNoteId(null);
    setCurrentNoteText("");
    setIsNoteMode(false);
  };

  const handleDeleteNoteById = async (noteId) => {
    if (!noteId || !user) return;
    try {
      await deleteNote(noteId);
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setCurrentNoteText("");
        setIsNoteMode(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatNoteDate = (note) => {
    const dateValue = note?.createdAt?.seconds
      ? new Date(note.createdAt.seconds * 1000)
      : note?.createdAt?.toDate
        ? note.createdAt.toDate()
        : note?.timestamp?.seconds
          ? new Date(note.timestamp.seconds * 1000)
          : note?.timestamp?.toDate
            ? note.timestamp.toDate()
            : null;

    if (!dateValue || Number.isNaN(dateValue.getTime())) return 'Just now';
    return dateValue.toLocaleDateString();
  };

  const handleShareVerseNote = async (note) => {
    const versesArray = Array.isArray(note?.verses) ? note.verses : [];
    const verseRefs = versesArray.length > 0
      ? versesArray.map((v) => `${book} ${chapter}:${v}`).join(', ')
      : `${book} ${chapter}`;
    const verseTexts = versesArray.length > 0
      ? versesArray
          .map((v) => verses?.find((vrs) => vrs.number === v)?.text || '')
          .filter(Boolean)
          .join(' ')
      : '';
    const text = `${verseTexts ? `${verseTexts}\n\n` : ''}Note: ${note.text}\n— ${verseRefs}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Equip Daily', text, url: window.location.href });
      } catch {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setNoteFeedback({ type: 'success', msg: 'Note copied for sharing' });
        setTimeout(() => setNoteFeedback({}), 2000);
      } catch (error) {
        console.error('Share copy failed:', error);
      }
    }
  };

  const getNoteReferenceLabel = (fallbackVerse) => {
    const verses = selectedVerses.length > 0 ? selectedVerses : (fallbackVerse ? [fallbackVerse] : []);
    if (verses.length === 0) return `${book} ${chapter}`;

    const sorted = [...new Set(verses)].sort((a, b) => a - b);
    const segments = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      if (current === end + 1) {
        end = current;
      } else {
        segments.push(start === end ? `${start}` : `${start}-${end}`);
        start = current;
        end = current;
      }
    }
    segments.push(start === end ? `${start}` : `${start}-${end}`);

    return `${book} ${chapter}:${segments.join(';')}`;
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setCurrentNoteText("");
    setIsNoteMode(false);
    setLongPressVerse(null); // Close long-press inline editor
  };

  // Auto-focus note editor and position modal correctly
  useEffect(() => {
    if (noteEditorRef.current && (longPressVerse || (editingNoteId && !showNotes))) {
      noteEditorRef.current.focus();
    }
  }, [longPressVerse, editingNoteId, showNotes]);
  
  // Handle editor dragging (keeping as infrastructure for future drag-to-reposition)
  // eslint-disable-next-line no-unused-vars
  const handleEditorMouseDown = (e) => {
    setIsEditorDragging(true);
    editorDragStart.current = { x: e.clientX - editorPosition.x, y: e.clientY - editorPosition.y };
    e.preventDefault();
  };

  const handleEditorMouseMove = useCallback((e) => {
    if (!isEditorDragging) return;
    setEditorPosition({ x: e.clientX - editorDragStart.current.x, y: e.clientY - editorDragStart.current.y });
  }, [isEditorDragging]);

  const handleEditorMouseUp = useCallback(() => {
    setIsEditorDragging(false);
  }, []);

  useEffect(() => {
    if (isEditorDragging) {
      window.addEventListener('mousemove', handleEditorMouseMove);
      window.addEventListener('mouseup', handleEditorMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleEditorMouseMove);
        window.removeEventListener('mouseup', handleEditorMouseUp);
      };
    }
  }, [isEditorDragging, handleEditorMouseMove, handleEditorMouseUp]);

  // --- RENDER ---
  // ✅ Allow Bible reading without login - only require login for saving features

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* ⚠️ Login Banner for Guest Users - Top Priority */}
      {!user && (
        <div className={`max-w-4xl mx-auto mb-3 p-3 rounded-lg ${
          theme === 'dark' 
            ? 'bg-blue-900/40 border border-blue-600/70' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-xs text-center mb-3 ${
            theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
          }`}>
            👋 You're reading as a guest. <strong>Sign in to save highlights, notes & join the community.</strong>
          </p>
          <div className="flex justify-center items-center w-full">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2.5 font-semibold rounded-lg transition shadow-md text-sm whitespace-nowrap"
              style={{
                backgroundColor: theme === 'dark' ? '#3B82F6' : '#4F46E5',
                color: '#FFFFFF',
                border: theme === 'dark' ? '2px solid #60A5FA' : '1px solid #4F46E5'
              }}
            >
              🔐 Sign In
            </button>
          </div>
        </div>
      )}
      
      {/* 🟢 TOP CONTROLS */}
      <div className="mb-6 bg-white/5 p-3 rounded-xl shadow-sm border border-gray-200/20" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Testament Navigation Buttons + Version Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {/* Left side - Bible Version Picker */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <select
              name="bibleVersionTop"
              value={version}
              onChange={e => setVersion(e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '4px 8px',
                borderRadius: '10px',
                border: '1px solid #ccc',
                background: theme === 'dark' ? '#333' : '#f5f5f5',
                color: theme === 'dark' ? '#aaa' : '#666',
                fontWeight: 600,
                minWidth: '90px',
                height: '30px',
                lineHeight: 1,
                textAlign: 'center',
                appearance: 'none',
                outline: 'none',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Bible Version"
            >
              {bibleVersions.map(v => (
                <option key={v.id} value={v.id} style={{fontSize: '0.7rem'}}>{v.abbreviation}</option>
              ))}
            </select>
          </div>
          
          {/* Center - Testament Buttons (Dead Center) */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setShowTestamentNav(showTestamentNav === 'OT' ? null : 'OT');
                setTestamentDrillBook(null);
              }}
              style={{ 
                background: showTestamentNav === 'OT' ? '#6366f1' : (theme === 'dark' ? '#333' : '#f0f0f0'),
                color: showTestamentNav === 'OT' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
                border: showTestamentNav === 'OT' ? '1px solid #6366f1' : (theme === 'dark' ? '1px solid #444' : '1px solid #ccc'),
                padding: '6px 14px', 
                fontSize: '0.85rem', 
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
              title="Browse Old Testament"
            >
              📖 Old Testament
            </button>
            <button
              onClick={() => {
                setShowTestamentNav(showTestamentNav === 'NT' ? null : 'NT');
                setTestamentDrillBook(null);
              }}
              style={{ 
                background: showTestamentNav === 'NT' ? '#6366f1' : (theme === 'dark' ? '#333' : '#f0f0f0'),
                color: showTestamentNav === 'NT' ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
                border: showTestamentNav === 'NT' ? '1px solid #6366f1' : (theme === 'dark' ? '1px solid #444' : '1px solid #ccc'),
                padding: '6px 14px', 
                fontSize: '0.85rem', 
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
              title="Browse New Testament"
            >
              ✝️ New Testament
            </button>
          </div>
          
          {/* Right side - Search */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!showSearchWell ? (
              <button
                onClick={() => setShowSearchWell(v => !v)}
                style={{ 
                  background: theme === 'dark' ? '#333' : '#f0f0f0',
                  color: theme === 'dark' ? '#fff' : '#333',
                  border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc',
                  padding: '6px 14px', 
                  fontSize: '0.85rem', 
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                title="Search"
              >
                🔍
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="bibleSearch"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && onSearch && searchInput.trim()) {
                      onSearch(searchInput);
                      setSearchInput('');  // Clear after searching
                      setShowSearchWell(false);
                    }
                    if (e.key === 'Escape') {
                      setSearchInput('');  // Clear on cancel
                      setShowSearchWell(false);
                    }
                  }}
                  placeholder="Search scripture or keywords..."
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '0.85rem', 
                    borderRadius: '10px', 
                    border: '1px solid #ccc', 
                    width: '200px',
                    background: theme === 'dark' ? '#333' : '#f5f5f5',
                    color: theme === 'dark' ? '#fff' : '#333'
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (onSearch && searchInput.trim()) {
                      onSearch(searchInput);
                      setSearchInput('');  // Clear after searching
                      setShowSearchWell(false);
                    }
                  }}
                  disabled={!searchInput.trim()}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #ccc', background: searchInput.trim() ? (theme === 'dark' ? '#2196F3' : '#2196F3') : '#ddd', color: searchInput.trim() ? '#fff' : '#999', cursor: searchInput.trim() ? 'pointer' : 'not-allowed' }}
                  title="Search"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setSearchInput('');  // Clear on cancel
                    setShowSearchWell(false);
                  }}
                  style={{ padding: '6px 10px', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid #ccc', background: theme === 'dark' ? '#333' : '#f5f5f5', color: '#c00', cursor: 'pointer' }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compact Testament Navigation */}
        {showTestamentNav && bibleData && (
          <div
            className="mb-3 p-3 rounded-lg"
            style={{
              background: theme === 'dark' ? '#1a1a1a' : 'white',
              border: theme === 'dark' ? '1px solid #444' : '1px solid #eee'
            }}
          >
            
            {/* Book Drill-Down: Show Chapters */}
            {testamentDrillBook ? (
              <div>
                {/* Back Button & Book Title with Progress */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setTestamentDrillBook(null)}
                    className="text-sm font-medium px-3 py-1 rounded transition"
                    style={{
                      background: theme === 'dark' ? '#2a2a2a' : '#e5e5e5',
                      color: theme === 'dark' ? '#aaa' : '#555'
                    }}
                  >
                    ← Back
                  </button>
                  <div className="text-sm font-bold" style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
                    {testamentDrillBook.name}{' '}
                    <span className="ml-2 text-xs font-normal" style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                      {drillPercent}%
                    </span>
                  </div>
                </div>

                {/* Book Progress Bar (Match Bottom Tracker) */}
                <div style={{ marginBottom: '16px', padding: '0 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme === 'dark' ? '#999' : '#888', marginBottom: '5px' }}>
                    <span>Progress</span>
                    <span>{drillPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: theme === 'dark' ? '#333' : '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${drillPercent}%`,
                        height: '100%',
                        background: drillPercent === 100 ? '#ffd700' : '#4caf50',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Chapter Pills - Compact Grid Layout */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px', width: '100%', alignItems: 'flex-start' }}>
                  {Array.from({ length: testamentDrillBook.chapters }, (_, i) => i + 1).map(chapterNum => {
                    const isRead = readChapters.includes(`${testamentDrillBook.name} ${chapterNum}`);
                    
                    const handleChapterClick = (e) => {
                      e.stopPropagation();
                      setBook(testamentDrillBook.name);
                      setChapter(chapterNum);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    };

                    const handleChapterDoubleClick = (e) => {
                      e.stopPropagation();
                      if (!user) return;
                      const chapterKey = `${testamentDrillBook.name} ${chapterNum}`;
                      toggleChapterRead(chapterKey);
                    };
                    
                    return (
                      <button
                        key={chapterNum}
                        onClick={handleChapterClick}
                        onDoubleClick={handleChapterDoubleClick}
                        className="font-bold transition flex-shrink-0"
                        title={`Chapter ${chapterNum}${isRead ? ' (✓ Read)' : ''}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: isRead ? '2px solid #4caf50' : `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                          backgroundColor: isRead ? '#4caf50' : (theme === 'dark' ? '#2a2a2a' : '#f0f0f0'),
                          color: isRead ? 'white' : (theme === 'dark' ? '#aaa' : '#555'),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isRead ? '0 2px 5px rgba(76, 175, 80, 0.3)' : 'none',
                          fontSize: '0.75rem'
                        }}
                      >
                        {chapterNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Book Pills with Progress */
              <div className="flex flex-wrap gap-2 justify-center">
                {bibleData
                  .filter(bookData => {
                    return showTestamentNav === 'OT' ? bookData.section === 'OT' : bookData.section === 'NT';
                  })
                  .map(bookData => {
                    const readCount = readChapters.filter(entry => entry.startsWith(`${bookData.name} `)).length;
                    const percent = Math.round((readCount / bookData.chapters) * 100);
                    const isComplete = percent === 100;
                    
                    const handleBookClick = () => {
                      if (bookClickTimeouts.current[bookData.name]) return;
                      bookClickTimeouts.current[bookData.name] = setTimeout(() => {
                        setTestamentDrillBook(bookData);
                        delete bookClickTimeouts.current[bookData.name];
                      }, 250);
                    };
                    
                    return (
                      <button
                        key={bookData.name}
                        onClick={handleBookClick}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg transition"
                        style={{
                          background: isComplete 
                            ? '#ffd700' 
                            : theme === 'dark'
                              ? `linear-gradient(to right, #4b7fa3 ${percent}%, #2a2a2a ${percent}%)`
                              : `linear-gradient(to right, #b3e5fc ${percent}%, #f5f5f5 ${percent}%)`,
                          border: isComplete ? '1px solid #e6c200' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'),
                          color: isComplete ? '#555' : (theme === 'dark' ? '#ccc' : '#333'),
                          fontWeight: isComplete ? 'bold' : 'normal',
                          cursor: 'pointer',
                          minWidth: '80px',
                          textAlign: 'center',
                          boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        {isComplete ? `🏆 ${bookData.name}` : percent > 0 ? `${bookData.name} ${percent}%` : bookData.name}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {/* Audio and other controls - Book and Chapter selectors moved to bottom */}


        </div>

        {/* Hint Text Below */}
        <p className="text-xs text-gray-500 text-center mt-2" style={{ fontStyle: 'italic' }}>💡 Tip: Swipe left/right to change chapters • Double click to highlight • Long-press verses to add notes</p>
      </div>

      {/* 📚 BIBLE TRACKER MODAL */}
      {showBibleTracker && (
        <div className="mb-6 bg-white/5 p-4 rounded-xl shadow-sm border border-gray-200/20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold" style={{ color: theme === 'dark' ? '#fff' : '#333' }}>Bible Reading Tracker</h3>
            <button 
              onClick={() => setShowBibleTracker(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          {/* Testament Tabs */}
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setTestamentFilter(testamentFilter === 'OT' ? null : 'OT')}
              style={{ padding: '5px 15px', fontSize: '0.85rem', borderRadius: '8px' }}
              className={`font-medium transition ${
                testamentFilter === 'OT' 
                  ? 'bg-indigo-600 text-white' 
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              Old Testament
            </button>
            <button
              onClick={() => setTestamentFilter(testamentFilter === 'NT' ? null : 'NT')}
              style={{ padding: '5px 15px', fontSize: '0.85rem', borderRadius: '8px' }}
              className={`font-medium transition ${
                testamentFilter === 'NT' 
                  ? 'bg-indigo-600 text-white' 
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              New Testament
            </button>
          </div>

          {/* Bible Tracker Component */}
          <BibleTracker
            readChapters={readChapters}
            onNavigate={(bookName, chapterNum) => {
              setBook(bookName);
              setChapter(chapterNum);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleRead={toggleChapterRead}
            sectionFilter={testamentFilter}
            theme={theme}
          />
        </div>
      )}

        

      {/* 🔴 COLOR PALETTE - Only show when highlight mode is active */}
      {showHighlightPalette && (
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {(COLOR_PALETTE || []).map((color) => (
              <button
                  key={color.name}
                  onClick={() => setActiveHighlightColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${activeHighlightColor.name === color.name ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: color.code, borderColor: color.border }}
                  title={color.name}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">Tip: Double-click to highlight.</p>
        </div>
      )}

      {/* 📖 MAIN CONTENT */}
      <div className={`mx-auto grid grid-cols-1 ${showNotes ? 'md:grid-cols-[1fr_300px]' : ''} gap-6`} style={{ maxWidth: '960px', width: '100%' }}>
        
        {/* LEFT: Bible Text */}
        <div 
          className={`p-6 rounded-2xl shadow-sm border min-h-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
            {/* Audio Player - Show when audio is available */}
            {audioUrl && hasAudioSupport(version) && (
              <div className="mb-4">
                <AudioPlayer src={audioUrl} theme={theme} />
              </div>
            )}
            
            {/* Show loading or error state */}
            {audioLoading && hasAudioSupport(version) && (
              <div className="mb-4 text-center py-2">
                <span>⏳ Loading audio...</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: '6px' }}>
              {/* Study/Reading Mode Button - background color always matches highlight color */}
              <button 
                onClick={(e) => {
                  if (!user) {
                    alert('Please sign in to use Study mode tools.');
                    return;
                  }
                  
                  // Capture button position for FloatingTools
                  const rect = e.currentTarget.getBoundingClientRect();
                  setFloatingToolsPosition({
                    x: rect.right + 10, // 10px to the right of the button
                    y: rect.top
                  });
                  
                  setShowNotes((prev) => {
                    const next = !prev;
                    if (next) {
                      setShowNotebook(true);
                      setShowHighlightPalette(false);
                    } else {
                      setShowNotebook(false);
                      setSelectedVerses([]);
                    }
                    return next;
                  });
                }}
                style={{ 
                  padding: '5px 10px', 
                  fontSize: '0.85rem', 
                  borderRadius: '8px', 
                  border: '1px solid',
                  background: activeHighlightColor.code,
                  color: theme === 'dark' ? '#222' : '#fff',
                  fontWeight: 'bold',
                  transition: 'background 0.2s, color 0.2s',
                }}
                className={`font-medium transition border-indigo-600`}
                title={showNotes ? `Switch to Reading Mode • Background shows current highlighter color` : `Switch to Study Mode • Enable selecting multiple verses & floating tool palette`}
              >
                {showNotes ? '📖' : '📝'}
              </button>
              {/* Font Size Controls (shrunk) */}
              <button onClick={() => setFontSize(f => Math.max(0.8, f - 0.1))} style={{ 
                background: theme === 'dark' ? '#333' : '#f0f0f0',
                color: theme === 'dark' ? '#fff' : '#333',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc',
                padding: '2px 6px', 
                fontSize: '0.85rem', 
                borderRadius: '6px', 
                marginRight: '2px', 
                minWidth: '22px', 
                height: '22px', 
                opacity: loading ? 0.5 : 1, 
                transition: 'opacity 0.3s ease',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>-</button>
              <button onClick={() => setFontSize(f => Math.min(2.0, f + 0.1))} style={{ 
                background: theme === 'dark' ? '#333' : '#f0f0f0',
                color: theme === 'dark' ? '#fff' : '#333',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc',
                padding: '2px 6px', 
                fontSize: '0.85rem', 
                borderRadius: '6px', 
                marginRight: '8px', 
                minWidth: '22px', 
                height: '22px', 
                opacity: loading ? 0.5 : 1, 
                transition: 'opacity 0.3s ease',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>+</button>
              {/* Prev Button - Matched to Next button size */}
              <button onClick={goToPrevChapter} style={{ 
                padding: '3px 7px', 
                fontSize: '0.82rem', 
                borderRadius: '6px', 
                marginRight: '6px',
                minWidth: '38px', 
                height: '26px', 
                opacity: loading ? 0.5 : 1, 
                transition: 'opacity 0.3s ease',
                backgroundColor: theme === 'dark' ? '#0ea5a4' : '#059669',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: theme === 'dark' ? '0 2px 6px rgba(14, 165, 164, 0.25)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>← Prev</button>
              {/* Book Selector (inline, styled as title) */}
              <select
                name="bookSelectHeader"
                value={book}
                onChange={(e) => { setBook(e.target.value); setChapter(1); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  color: theme === 'dark' ? '#f0f0f0' : '#2c3e50',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  padding: 0,
                  margin: 0,
                  textAlign: 'center',
                  minWidth: '80px',
                  lineHeight: 1
                }}
                className="focus:ring-0 focus:outline-none"
                aria-label="Select book"
              >
                {bibleData && bibleData.map(bookData => (
                  <option key={bookData.name} value={bookData.name} style={{color: '#333', fontSize: '1.1rem'}}>{bookData.name}</option>
                ))}
              </select>
              {/* Chapter Selector (inline, styled as title) */}
              <select
                name="chapterSelectHeader"
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value))}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  color: theme === 'dark' ? '#f0f0f0' : '#2c3e50',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  padding: 0,
                  margin: 0,
                  width: chapter > 99 ? '45px' : (chapter > 9 ? '35px' : '25px'),
                  textAlign: 'center',
                  lineHeight: 1
                }}
                className="focus:ring-0 focus:outline-none"
                aria-label="Select chapter"
              >
                {bibleData && bibleData.find(b => b.name === book) && [...Array(bibleData.find(b => b.name === book).chapters).keys()].map(i => (
                  <option key={i+1} value={i+1} style={{color: '#333', fontSize: '1.1rem'}}>{i+1}</option>
                ))}
              </select>
              {/* Next Button */}
              <button onClick={goToNextChapter} style={{ 
                padding: '3px 7px', 
                fontSize: '0.82rem', 
                borderRadius: '6px', 
                marginLeft: '6px', 
                minWidth: '38px', 
                height: '26px', 
                opacity: loading ? 0.5 : 1, 
                transition: 'opacity 0.3s ease',
                backgroundColor: theme === 'dark' ? '#0ea5a4' : '#059669',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: theme === 'dark' ? '0 2px 6px rgba(14, 165, 164, 0.25)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>Next →</button>
              {/* Mark as Read Button (tight, full label) - Positioned right of Next button */}
              {user && (
                <button
                  onClick={() => markChapterAsRead(book, chapter)}
                  style={{ 
                    background: isChapterRead ? '#16a34a' : (theme === 'dark' ? '#333' : '#f0f0f0'),
                    color: isChapterRead ? '#fff' : (theme === 'dark' ? '#fff' : '#333'),
                    border: isChapterRead ? '1px solid #16a34a' : (theme === 'dark' ? '1px solid #444' : '1px solid #ccc'),
                    padding: '2px 5px', 
                    fontSize: '0.72rem', 
                    borderRadius: '5px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '3px', 
                    marginLeft: '4px', 
                    minWidth: '60px', 
                    height: '24px', 
                    opacity: loading ? 0.5 : 1, 
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                  title={isChapterRead ? "Chapter marked as read" : "Mark chapter as read"}
                >
                  <span style={{ fontSize: '0.9em' }}>{isChapterRead ? '✓' : '☐'}</span>
                  <span style={{ fontSize: '0.9em' }}>{isChapterRead ? 'Read' : 'Mark Read'}</span>
                </button>
              )}
            </div>
            
            {error && (
                <div className="text-center py-10">
                    <p className="text-red-500 font-bold mb-2">Error: {error}</p>
                    {error.includes("whitelist") && (
                        <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded inline-block">
                            👆 Copy the URL above and add it to your API.Bible Dashboard.
                        </p>
                    )}
                </div>
            )}

            {!error && (
                <>
                    {/* Loading overlay - shows on top of verses */}
                    {loading && (
                        <div style={{ position: 'relative', opacity: 0.6, pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(200, 200, 200, 0.9)', padding: '15px 25px', borderRadius: '8px', zIndex: 10, color: '#333', fontWeight: 'bold' }}>⏳ Loading scripture...</div>
                        </div>
                    )}
                    {/* Main Version Text - Verse by Line */}
                    <div style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8', opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
                        {verses.map((verse) => {
                          const isSelected = selectedVerses.includes(verse.number);
                          const showSelectionCheckbox = showNotebook || isNoteMode;
                            const highlight = highlightsMap[verse.number];
                            const style = { cursor: 'pointer' };
                            
                            // Apply highlight with dark mode adjustments
                            if (highlight) {
                              if (theme === 'dark') {
                                // Dark mode: reduce opacity and ensure text readability
                                style.backgroundColor = highlight.bg + '40'; // ~25% opacity
                                style.color = '#e5e7eb'; // Force light gray text
                                style.borderLeft = `4px solid ${highlight.border}`;
                                style.paddingLeft = '12px';
                              } else {
                                // Light mode: full color
                                style.backgroundColor = highlight.bg;
                                style.borderLeft = `4px solid ${highlight.border}`;
                                style.paddingLeft = '12px';
                              }
                            }
                            
                            const selectionStyle = isSelected ? { outline: '2px solid #6366f1', borderRadius: '6px' } : {};
                            const verseNotes = userNotes.filter(n => n.verses && n.verses.includes(verse.number));
                            const showEditorHere = (longPressVerse === verse.number) ||
                                                   (editingNoteId && verseNotes.some(n => n.id === editingNoteId) && verse.number === verseNotes[0]?.verses?.[0]);
                            
                            return (
                                <div key={verse.id} style={{ marginBottom: '1rem' }} id={`verse-${verse.number}`}>
                                    <div
                                      onClick={() => handleVerseClick(verse.number, false)}
                                      onDoubleClick={() => handleVerseHighlight(verse.number)}
                                        onMouseDown={() => handleMouseDown(verse.number)}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        onTouchStart={() => handleMouseDown(verse.number)}
                                        onTouchEnd={handleMouseUp}
                                        className={`block hover:bg-opacity-80 p-2 rounded transition-colors`}
                                        style={{ ...style, ...selectionStyle }}
                                      title="Double-click to highlight • Long press verses to add notes"
                                    >
                                        <span style={{ display: 'block', textAlign: 'left' }}>
                                            {showSelectionCheckbox && (
                                              <span
                                                className="mr-2 text-xs font-bold select-none"
                                                style={{ color: isSelected ? '#4f46e5' : '#9ca3af' }}
                                                aria-label={isSelected ? 'Selected verse' : 'Unselected verse'}
                                              >
                                                {isSelected ? '☑' : '☐'}
                                              </span>
                                            )}
                                            <sup className="text-xs font-bold mr-2 text-gray-400 select-none">{verse.number}</sup>
                                            {verse.text}
                                        </span>
                                    </div>

                                    {/* Inline Note Editor */}
                                    {showEditorHere && (
                                      <div
                                        className={`mt-3 p-4 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-800 border-indigo-500' : 'bg-blue-50 border-blue-400'}`}
                                        style={{ width: '100%' }}
                                      >
                                            <div className="text-xs font-semibold mb-2 text-gray-500">
                                          {editingNoteId ? `Editing Note on ${getNoteReferenceLabel(verse.number)}` : `Note on ${getNoteReferenceLabel(verse.number)}`}
                                            </div>
                                            <textarea
                                              name="inlineNote"
                                                ref={noteEditorRef}
                                                value={currentNoteText}
                                                onChange={(e) => setCurrentNoteText(e.target.value)}
                                          placeholder={`Type your note on ${getNoteReferenceLabel(verse.number)} here...`}
                                              className={`w-full p-3 rounded border resize-y focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                              style={{ minHeight: '100px', maxHeight: '300px' }}
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                                              <div className="flex flex-wrap gap-2 ml-auto">
                                                <button onClick={() => handleCopyFromEditor()} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm">📋 Copy</button>
                                                <button onClick={handlePasteVerses} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 font-medium transition shadow-sm">📌 Paste</button>
                                                <button onClick={handleSaveNote} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium transition shadow-sm">💾 Save</button>
                                                {editingNoteId && <button onClick={handleDeleteNote} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 font-medium transition shadow-sm">🗑️ Delete</button>}
                                                <button onClick={handleCancelEditNote} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
                                              </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Inline Notes Below Verse */}
                                    {verseNotes.length > 0 && (
                                      <>
                                        {/* STUDY MODE: Always show notes */}
                                        {showNotes && verseNotes.map(note => (
                                            note.id !== editingNoteId && (
                                                <div 
                                                  key={note.id} 
                                                  className={`mt-2 p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-800 border-indigo-500' : 'bg-yellow-50 border-yellow-400'}`}
                                                    style={{ fontSize: '0.9rem' }}
                                                >
                                                    <p className="text-sm mb-1 whitespace-pre-wrap">{note.text}</p>
                                                  <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                                                    <button 
                                                      onClick={() => handleEditNote(note)}
                                                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                                    >
                                                      Edit
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteNoteById(note.id)}
                                                      className="text-red-600 hover:text-red-800 font-semibold"
                                                      title="Delete note"
                                                    >
                                                      🗑️
                                                    </button>
                                                    <button
                                                      onClick={() => handleShareVerseNote(note)}
                                                      className="text-emerald-600 hover:text-emerald-800 font-semibold"
                                                      title="Share verse & note"
                                                    >
                                                      🔗 Share
                                                    </button>
                                                    <span className="text-gray-500 ml-auto">{formatNoteDate(note)}</span>
                                                  </div>
                                                </div>
                                            )
                                        ))}

                                        {/* READING MODE: Show note pills */}
                                        {!showNotes && verseNotes.map(note => (
                                            note.id !== editingNoteId && (
                                                <div key={note.id} className="mt-2">
                                                    <button
                                                        onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                          expandedNotes[note.id] 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')
                                                        }`}
                                                    >
                                                        📌 Note: {book} {chapter}:{note.verses.join(',')}
                                                    </button>

                                                    {/* Note Peek View */}
                                                    {expandedNotes[note.id] && (
                                                        <div className={`mt-2 p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-800 border-indigo-500' : 'bg-yellow-50 border-yellow-400'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <p className="text-sm whitespace-pre-wrap flex-1">{note.text}</p>
                                                                <button
                                                                    onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: false }))}
                                                                    className="text-gray-500 hover:text-gray-700 ml-2 text-lg leading-none"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                          <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                                                            <button
                                                              onClick={() => handleShareVerseNote(note)}
                                                              className="text-emerald-600 hover:text-emerald-800 font-semibold"
                                                              title="Share verse & note"
                                                            >
                                                              🔗 Share
                                                            </button>
                                                            <button
                                                              onClick={() => handleDeleteNoteById(note.id)}
                                                              className="text-red-600 hover:text-red-800 font-semibold"
                                                              title="Delete note"
                                                            >
                                                              🗑️
                                                            </button>
                                                            <span className="text-gray-500 ml-auto">{formatNoteDate(note)}</span>
                                                          </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        ))}
                                      </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Audio Version Text (Fallback) - Only show for logged-in users */}
                    {user && audioVersion && audioVerses.length > 0 && (
                        <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm font-semibold text-indigo-600">🎧 Audio Version ({audioVersion})</span>
                                <span className="text-xs text-gray-500">- Audio not available for NLT</span>
                            </div>
                            <div style={{ fontSize: `${fontSize * 0.95}rem`, lineHeight: '1.8' }} className="text-gray-600">
                                {audioVerses.map((verse) => (
                                    <span 
                                        key={verse.id}
                                        className="inline"
                                    >
                                        <sup className="text-xs font-bold mr-1 text-gray-400 select-none">{verse.number}</sup>
                                        {verse.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {/* Copy Feedback Toast */}
            {copyFeedback && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full shadow-lg z-50 animate-bounce">
                    {copyFeedback}
                </div>
            )}
        </div>

        {/* RIGHT: Notes & Tools */}
        {showNotes && !longPressVerse && (
        <div className="space-y-4">
            
            {/* Note Editor */}
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    ✏️ Personal Notes
                </h3>
                
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">Sign in to save personal notes and track your study progress.</p>
                    <Login theme={theme} />
                  </div>
                ) : (
                  <>
                    <textarea
                      name="personalNote"
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                        placeholder="Type a reflection here..."
                        className={`w-full p-3 rounded-lg border h-32 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    />
                    <button 
                        onClick={handleSaveNote}
                        disabled={!currentNoteText.trim()}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition"
                    >
                        Save Note
                    </button>
                    {noteFeedback.msg && <p className="text-green-500 text-sm mt-2 text-center">{noteFeedback.msg}</p>}
                  </>
                )}
            </div>

        </div>
        )}
      </div>

      {/* Mark as Read Button */}
      <div className="max-w-4xl mx-auto mt-10 flex justify-center">
        <button
          onClick={() => {
            const chapterKey = `${book} ${chapter}`;
            if (!readChapters.includes(chapterKey)) {
              toggleChapterRead(chapterKey);
            }
            goToNextChapter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-6 py-3 font-semibold rounded-lg transition shadow-md flex items-center gap-2"
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            fontSize: '1rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          title="Mark this chapter as read, track your progress, and advance to the next chapter 🎉"
        >
          <span>✓</span>
          Mark as Read
        </button>
      </div>

      {/* Chapter Navigation Buttons */}
      <div className="max-w-4xl mx-auto flex justify-center gap-3 mt-8 mb-10 flex-wrap items-center">
        {/* Bible Version Selector - Small and Compact */}
        <select
          name="bibleVersionBottom"
          value={version}
          onChange={e => setVersion(e.target.value)}
          style={{
            fontSize: '0.85rem',
            padding: '6px 10px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            background: theme === 'dark' ? '#333' : '#f5f5f5',
            color: theme === 'dark' ? '#aaa' : '#666',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            minWidth: '70px',
            textAlign: 'center'
          }}
          title="Bible Version"
        >
          {bibleVersions.map(v => (
            <option key={v.id} value={v.id} style={{color: '#333'}}>{v.abbreviation}</option>
          ))}
        </select>

        {/* Book and Chapter Selectors */}
        <select 
          name="bookSelectBottom"
          value={book} 
          onChange={(e) => { setBook(e.target.value); setChapter(1); }}
          style={{ 
            border: '1px solid #ccc',
            background: theme === 'dark' ? '#333' : '#f5f5f5',
            fontWeight: 600, 
            fontSize: '0.85rem', 
            color: theme === 'dark' ? '#aaa' : '#666', 
            cursor: 'pointer', 
            appearance: 'none', 
            outline: 'none', 
            fontFamily: 'inherit', 
            padding: '6px 10px',
            borderRadius: '10px',
            minWidth: '90px'
          }}
        >
          {bibleData && bibleData.map(bookData => (
            <option key={bookData.name} value={bookData.name} style={{color: '#333'}}>{bookData.name}</option>
          ))}
        </select>

        <select 
          name="chapterSelectBottom"
          value={chapter} 
          onChange={(e) => setChapter(Number(e.target.value))}
          style={{ 
            border: '1px solid #ccc',
            background: theme === 'dark' ? '#333' : '#f5f5f5',
            fontWeight: 600, 
            fontSize: '0.85rem', 
            color: theme === 'dark' ? '#aaa' : '#666', 
            cursor: 'pointer', 
            appearance: 'none', 
            outline: 'none', 
            fontFamily: 'inherit', 
            padding: '6px 10px',
            borderRadius: '10px',
            minWidth: '60px',
            textAlign: 'center'
          }}
        >
          {bibleData && bibleData.find(b => b.name === book) && [...Array(bibleData.find(b => b.name === book).chapters).keys()].map(i => (
            <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>
          ))}
        </select>

        <button 
          onClick={goToPrevChapter}
          style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid' }}
          className={`font-medium transition shadow-sm ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          ← Prev
        </button>
        <button 
          onClick={goToNextChapter}
          style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '10px', border: '1px solid' }}
          className={`font-medium transition shadow-sm ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next →
        </button>
      </div>

      {/* Navigation Tips */}
      <div 
        className="max-w-4xl mx-auto mt-6 mb-10"
        style={{ 
          padding: '20px',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
          borderRadius: '12px',
          borderLeft: `4px solid ${theme === 'dark' ? '#6366f1' : '#4f46e5'}`
        }}
      >
        <ul style={{ 
          fontSize: '0.9rem', 
          lineHeight: '1.8',
          color: theme === 'dark' ? '#d1d5db' : '#4b5563',
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li>• Click <strong>✓ Mark as Read</strong> to track progress and advance to next chapter</li>
          <li>• <strong>💡 Tip:</strong> Swipe left/right to change chapters • Double click to highlight • Long-press verses to add notes</li>
        </ul>
      </div>

      {/* Reflections */}
      <div className="max-w-4xl mx-auto mt-10">
        <CommunityFeed
          queryField="chapter"
          queryValue={`${book} ${chapter}`}
          user={user}
          theme={theme}
          onSearch={onSearch}
          onProfileClick={onProfileClick}
          title={`Reflections for ${book} ${chapter}`}
          placeholder={`What is the Spirit saying to you about ${book} ${chapter}?`}
        />
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: theme === 'dark' ? '#aaa' : '#666',
              }}
              title="Close"
            >
              ×
            </button>
            <Login theme={theme} />
          </div>
        </div>
      )}

      {/* 📚 Bible Tracker */}
      {user && (
        <div className="max-w-4xl mx-auto mt-10 mb-10">
          <BibleTracker 
            theme={theme}
            readChapters={readChapters} 
            onNavigate={(bookName, chapterNum) => {
              setBook(bookName);
              setChapter(chapterNum);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* 📚 Your Living Bookshelf - Bible Reading Tracker */}
      {user && showBibleTracker && (
        <div className="max-w-4xl mx-auto mt-10 mb-10 bg-white/5 p-4 rounded-xl shadow-sm border border-gray-200/20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold" style={{ color: theme === 'dark' ? '#fff' : '#333' }}>📚 Your Living Bookshelf</h3>
            <button 
              onClick={() => setShowBibleTracker(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          {/* Testament Tabs */}
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setTestamentFilter(testamentFilter === 'OT' ? null : 'OT')}
              style={{ padding: '5px 15px', fontSize: '0.85rem', borderRadius: '8px' }}
              className={`font-medium transition ${
                testamentFilter === 'OT' 
                  ? 'bg-indigo-600 text-white' 
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              Old Testament
            </button>
            <button
              onClick={() => setTestamentFilter(testamentFilter === 'NT' ? null : 'NT')}
              style={{ padding: '5px 15px', fontSize: '0.85rem', borderRadius: '8px' }}
              className={`font-medium transition ${
                testamentFilter === 'NT' 
                  ? 'bg-indigo-600 text-white' 
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              New Testament
            </button>
          </div>

          {/* Bible Tracker Component */}
          <BibleTracker
            readChapters={readChapters}
            onNavigate={(bookName, chapterNum) => {
              setBook(bookName);
              setChapter(chapterNum);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleRead={toggleChapterRead}
            sectionFilter={testamentFilter}
            theme={theme}
          />
        </div>
      )}

      <FloatingTools
        showNotebook={showNotebook}
        setShowNotebook={setShowNotebook}
        selectedVerses={selectedVerses}
        book={book}
        chapter={chapter}
        versesCopied={versesCopied}
        setVersesCopied={setVersesCopied}
        onSaveNote={handleSaveSelectedNote}
        onCopyVerses={handleCopyVerses}
        onPasteVerses={handlePasteVerses}
        onDeleteNote={handleClearNote}
        theme={theme}
        activeColor={activeHighlightColor}
        setActiveHighlightColor={setActiveHighlightColor}
        initialPosition={floatingToolsPosition}
      />
    </div>
  );
}

export default BibleStudy;
