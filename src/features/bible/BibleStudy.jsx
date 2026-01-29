import React, { useState, useEffect, useRef } from 'react';
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
import { auth } from "../../config/firebase";
import { db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { 
  COLOR_PALETTE, 
  DEFAULT_NOTE_COLOR, 
  DEFAULT_HIGHLIGHT_DATA, 
  AUDIO_BASE_PATH,
  DEFAULT_BIBLE_VERSION,
  AUDIO_FALLBACK_VERSION
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
  
  // ✅ FEEDBACK STATES
  const [copyFeedback, setCopyFeedback] = useState("");
  const [noteFeedback, setNoteFeedback] = useState({}); 
  const [versesCopied, setVersesCopied] = useState(false); // Track if verses are copied

  // Highlights Map & Notes
  const [highlightsMap, setHighlightsMap] = useState({});
  const [userNotes, setUserNotes] = useState([]);
  
  // NOTE & STUDY MODES
  const [showNotes, setShowNotes] = useState(true); 
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({}); // Track which notes are expanded in reading mode
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const noteEditorRef = useRef(null);
  
  const [fontSize, setFontSize] = useState(1.1);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState([]);
  // ✅ Safe default color (prevents crash if COLOR_PALETTE is undefined)
  const [activeHighlightColor, setActiveHighlightColor] = useState(() => {
    return (COLOR_PALETTE && COLOR_PALETTE.length > 0) ? COLOR_PALETTE[0] : { code: '#ffff00', border: '#e6e600', name: 'Yellow' };
  });

  // --- AUDIO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  // --- LONG PRESS STATE ---
  const longPressTimer = useRef(null);
  const [longPressVerse, setLongPressVerse] = useState(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

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
      
      setLoading(true);
      setError(null);
      setVerses([]);
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
            trackChapterRead(book, chapter);
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
  const markChapterAsRead = async (bookName, chapterNum) => {
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
      
      console.log(`✅ Chapter ${isCurrentlyRead ? 'unmarked' : 'marked'} as read: ${chapterKey}`);
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
      console.log(`${isCurrentlyRead ? '❌ Unmarked' : '✅ Marked'} as read: ${chapterKey}`);
    } catch (err) {
      console.error('Error toggling chapter read status:', err);
    }
  };

  // 📖 Track chapter as read in Firestore
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
            response = await fetch(`/api/bible-chapter?bibleId=${AUDIO_FALLBACK_VERSION}&chapterId=${bookId}.${chapter}`);
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
    
    // Construct local audio path (e.g., /audio/Genesis/1.mp3)
    const sanitizedBook = book.replace(/\s+/g, '_'); 
    const audioSrc = `${AUDIO_BASE_PATH}${sanitizedBook}/${chapter}.mp3`;
    
    if (!audioRef.current) audioRef.current = new Audio();

    audioRef.current.src = audioSrc;
    audioRef.current.load();
    
    // Reset play state when chapter changes
    setIsPlaying(false);
    setAudioError(false);

    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
        // console.warn("Audio file not found:", audioSrc);
        setIsPlaying(false);
        setAudioError(true);
    };

    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, [book, chapter, version]);

  const toggleAudio = () => {
    if (audioError) return;
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Play failed (file might be missing):", e));
    }
    setIsPlaying(!isPlaying);
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
  const handleVerseClick = async (verseNum) => {
    // ✅ Allow verse selection for notebooks without login
    if (showNotebook) {
      setSelectedVerses((prev) =>
        prev.includes(verseNum)
          ? prev.filter((v) => v !== verseNum)
          : [...prev, verseNum]
      );
      return;
    }

    // ⚠️ Highlighting requires login
    if (!user) {
      alert('Please sign in to highlight verses and save your progress.');
      return;
    }

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

    // Save to Firebase
    await updateUserHighlight(user.uid, book, chapter, verseNum, newHighlight);
  };

  const handleCopyVerse = (text, verseNum) => {
    const textToCopy = `${book} ${chapter}:${verseNum} - ${text}`;
    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback(`Copied Verse ${verseNum}!`);
    if (!user) return; // ⚠️ Notes require login
    
    setTimeout(() => setCopyFeedback(""), 2000);
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

  const handleCancelNote = () => {
    setLongPressVerse(null);
    setCurrentNoteText("");
  };

  const handleApplyColor = (color) => {
    if (color) setActiveHighlightColor(color);
    setShowHighlightPalette(false);
  };

  const handleSaveSelectedNote = async () => {
    if (!user || selectedVerses.length === 0 || !currentNoteText.trim()) {
      console.log('Save blocked:', { user: !!user, versesCount: selectedVerses.length, hasText: !!currentNoteText.trim() });
      return;
    }
    try {
      console.log('Saving note:', { book, chapter, verses: selectedVerses, text: currentNoteText });
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
      const verseRefs = selectedVerses.map(v => `${book} ${chapter}:${v}`).join(', ');
      const verseTexts = selectedVerses
        .map(v => chapter_data?.verses?.find(vrs => vrs.number === v)?.text || '')
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

  const handlePasteVerses = () => {
    if (selectedVerses.length === 0) {
      setNoteFeedback({ type: 'error', msg: 'No verses selected' });
      setTimeout(() => setNoteFeedback({}), 2000);
      return;
    }
    const verseRefs = selectedVerses.map(v => `${book} ${chapter}:${v}`).join(', ');
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
      console.log('Saving long-press note:', { book, chapter, verse: longPressVerse, text: currentNoteText });
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

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setCurrentNoteText("");
    setIsNoteMode(false);
  };

  // Auto-focus note editor (only for inline editing, not sidebar)
  useEffect(() => {
    if (noteEditorRef.current && (longPressVerse || (editingNoteId && !showNotes))) {
      noteEditorRef.current.focus();
      noteEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [longPressVerse, editingNoteId, showNotes]);

  // --- RENDER ---
  // ✅ Allow Bible reading without login - only require login for saving features

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* ⚠️ Login Banner for Guest Users */}
      {!user && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            👋 <strong>Welcome!</strong> You're reading as a guest. You can read the Bible, but 
            <strong> sign in to save highlights, notes, and join the community</strong>.
          </p>
        </div>
      )}
      
      {/* 🟢 TOP CONTROLS */}
      <div className="mb-6 bg-white/5 p-3 rounded-xl shadow-sm border border-gray-200/20">
        {/* Testament Navigation Buttons */}
        <div className="flex gap-2 mb-3 justify-center">
          <button
            onClick={() => {
              setShowTestamentNav(showTestamentNav === 'OT' ? null : 'OT');
              setTestamentDrillBook(null);
            }}
            style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '10px', border: '1px solid' }}
            className={`font-medium transition shadow-sm ${
              showTestamentNav === 'OT'
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
            }`}
            title="Browse Old Testament"
          >
            📖 Old Testament
          </button>
          <button
            onClick={() => {
              setShowTestamentNav(showTestamentNav === 'NT' ? null : 'NT');
              setTestamentDrillBook(null);
            }}
            style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '10px', border: '1px solid' }}
            className={`font-medium transition shadow-sm ${
              showTestamentNav === 'NT'
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
            }`}
            title="Browse New Testament"
          >
            ✝️ New Testament
          </button>
        </div>

        {/* Compact Testament Navigation */}
        {showTestamentNav && bibleData && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }}>
            
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
                    {testamentDrillBook.name}
                    <span className="ml-2 text-xs font-normal" style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                      {(() => {
                        const readCount = readChapters.filter(entry => entry.startsWith(`${testamentDrillBook.name} `)).length;
                        const percent = Math.round((readCount / testamentDrillBook.chapters) * 100);
                        return `${percent}% complete`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Chapter Pills - Compact Grid Layout */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px', width: '100%', alignItems: 'flex-start' }}>
                  {Array.from({ length: testamentDrillBook.chapters }, (_, i) => i + 1).map(chapterNum => {
                    const isRead = readChapters.includes(`${testamentDrillBook.name} ${chapterNum}`);
                    let clickTimeoutRef;
                    
                    const handleChapterClick = (e) => {
                      // Prevent double-click from triggering single-click navigation
                      if (clickTimeoutRef) return;
                      
                      clickTimeoutRef = setTimeout(() => {
                        setBook(testamentDrillBook.name);
                        setChapter(chapterNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        clickTimeoutRef = null;
                      }, 250);
                    };
                    
                    const handleChapterDoubleClick = async (e) => {
                      e.stopPropagation();
                      // Cancel the pending single click
                      if (clickTimeoutRef) {
                        clearTimeout(clickTimeoutRef);
                        clickTimeoutRef = null;
                      }
                      
                      if (user) {
                        await markChapterAsRead(testamentDrillBook.name, chapterNum);
                      } else {
                        alert('Please sign in to mark chapters as read.');
                      }
                    };
                    
                    return (
                      <button
                        key={chapterNum}
                        onClick={handleChapterClick}
                        onDoubleClick={handleChapterDoubleClick}
                        className="font-bold transition flex-shrink-0"
                        title={`Chapter ${chapterNum}${isRead ? ' (✓ Read)' : ''} - Double-click to ${isRead ? 'unmark' : 'mark'} read`}
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
                    let bookClickTimeoutRef;
                    
                    const handleBookClick = () => {
                      if (bookClickTimeoutRef) return;
                      bookClickTimeoutRef = setTimeout(() => {
                        setTestamentDrillBook(bookData);
                        bookClickTimeoutRef = null;
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
                            : `linear-gradient(to right, #b3e5fc ${percent}%, ${theme === 'dark' ? '#2a2a2a' : '#f5f5f5'} ${percent}%)`,
                          border: isComplete ? '1px solid #e6c200' : `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                          color: isComplete ? '#555' : (theme === 'dark' ? '#ddd' : '#333'),
                          fontWeight: isComplete ? 'bold' : 'normal',
                          cursor: 'pointer',
                          minWidth: '80px',
                          textAlign: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
          
          {/* 1. Audio Button */}
          <button 
            onClick={toggleAudio}
            style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px' }} className={`text-white transition font-medium ${audioError ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'}`}
            title={audioError ? "Audio not available" : (isPlaying ? "Pause Audio" : "Play Audio")}
          >
            {audioError ? "🔇" : (isPlaying ? "⏸️" : "🔊")}
          </button>

          {/* 2. Book Selector */}
          <select 
            value={book} 
            onChange={(e) => { setBook(e.target.value); setChapter(1); }}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              fontWeight: 'bold', 
              fontSize: '1.25rem', 
              color: theme === 'dark' ? '#f0f0f0' : '#2c3e50', 
              cursor: 'pointer', 
              appearance: 'none', 
              outline: 'none', 
              fontFamily: 'inherit', 
              padding: 0, 
              margin: 0,
              textAlign: 'center'
            }}
          >
            {bibleData && bibleData.map(bookData => (
              <option key={bookData.name} value={bookData.name} style={{color: '#333'}}>{bookData.name}</option>
            ))}
          </select>

          {/* 3. Chapter Selector */}
          <select 
            value={chapter} 
            onChange={(e) => setChapter(Number(e.target.value))}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              fontWeight: 'bold', 
              fontSize: '1.25rem', 
              color: theme === 'dark' ? '#f0f0f0' : '#2c3e50', 
              cursor: 'pointer', 
              appearance: 'none', 
              outline: 'none', 
              fontFamily: 'inherit', 
              padding: 0, 
              margin: 0,
              width: chapter > 99 ? '45px' : (chapter > 9 ? '35px' : '25px'),
              textAlign: 'center'
            }}
          >
            {bibleData && bibleData.find(b => b.name === book) && [...Array(bibleData.find(b => b.name === book).chapters).keys()].map(i => (
              <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>
            ))}
          </select>

          {/* 4. Version Pill */}
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: theme === 'dark' ? '#555' : '#ccc',
              backgroundColor: theme === 'dark' ? '#333' : '#f5f5f5',
              color: theme === 'dark' ? '#aaa' : '#666',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
              fontWeight: '600'
            }}
            title="Bible Version"
          >
            {bibleVersions && bibleVersions.map(v => (
              <option key={v.id} value={v.id} style={{color: '#333'}}>{v.abbreviation || v.name}</option>
            ))}
          </select>

          {/* 5. Prev/Next Buttons */}
          <button onClick={goToPrevChapter} style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px' }} className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium">← Prev</button>
          <button onClick={goToNextChapter} style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px' }} className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium">Next →</button>

          {/* 6. Font Size Controls */}
          <button onClick={() => setFontSize(f => Math.max(0.8, f - 0.1))} style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px' }} className="bg-gray-200 text-black font-bold">-</button>
          <button onClick={() => setFontSize(f => Math.min(2.0, f + 0.1))} style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px' }} className="bg-gray-200 text-black font-bold">+</button>

          {/* 7. Highlight Button */}
          <button
            onClick={() => setShowHighlightPalette((open) => !open)}
            style={{ backgroundColor: activeHighlightColor.code, borderColor: showHighlightPalette ? '#4f46e5' : activeHighlightColor.border, padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid' }}
            className={`transition ${showHighlightPalette ? 'border-indigo-600' : (theme === 'dark' ? 'border-gray-700' : 'border-gray-300')}`}
            title={`Highlight Tools - Current: ${activeHighlightColor.name}`}
          >
            🎨
          </button>

          {/* 8. Study/Reading Mode Button */}
          <button 
            onClick={() => {
              if (!user) {
                alert('Please sign in to use Study mode tools.');
                return;
              }

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
            style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid' }}
            className={`font-medium transition ${showNotes ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700')}`}
            title={showNotes ? "Switch to Reading Mode (highlights only)" : "Switch to Study Mode (long press verses to add notes)"}
          >
            {showNotes ? '📖' : '📝'}
          </button>

          {/* 9. Search Box */}
          <div className="relative">
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch(searchInput)}
              placeholder="Search..."
              style={{ padding: '5px 8px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid' }}
              className={`pr-7 w-24 focus:w-36 transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer" onClick={() => onSearch && onSearch(searchInput)}>🔍</span>
          </div>

          {/* 10. Mark Chapter as Read Button */}
          {user && (
            <button
              onClick={markChapterAsRead}
              style={{ padding: '5px 10px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid' }}
              className={`font-medium transition ${isChapterRead ? 'bg-green-600 text-white border-green-600' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700')}`}
              title={isChapterRead ? "Chapter marked as read" : "Mark chapter as read"}
            >
              {isChapterRead ? '✓' : '☐'}
            </button>
          )}

        </div>

        {/* Hint Text Below */}
        <p className="text-xs text-gray-500 text-center mt-2">Tip: Swipe left/right to change chapters • Long press verses to add notes</p>
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
          <div className="flex gap-2 justify-center">
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
          <p className="text-xs text-gray-500">Tip: Double click to highlight.</p>
        </div>
      )}

      {/* 📖 MAIN CONTENT */}
      <div className={`max-w-4xl mx-auto grid grid-cols-1 ${showNotes ? 'md:grid-cols-[1fr_300px]' : ''} gap-6`}>
        
        {/* LEFT: Bible Text */}
        <div 
          className={`p-6 rounded-2xl shadow-sm border min-h-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
            <h1 className="text-2xl font-bold mb-4">{book} {chapter}</h1>
            
            {loading && <p className="text-center py-10">Loading scripture...</p>}
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

            {!loading && !error && (
                <>
                    {/* Main Version Text - Verse by Line */}
                    <div style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8' }}>
                        {verses.map((verse) => {
                            const isSelected = selectedVerses.includes(verse.number);
                            const style = highlightsMap[verse.number] 
                              ? { backgroundColor: highlightsMap[verse.number].bg, cursor: 'pointer' }
                              : { cursor: 'pointer' };
                            const selectionStyle = isSelected ? { outline: '2px solid #6366f1', borderRadius: '6px' } : {};
                            const verseNotes = userNotes.filter(n => n.verses && n.verses.includes(verse.number));
                            const showEditorHere = ((showNotes || showNotebook) && !editingNoteId && selectedVerses.length > 0 && selectedVerses[0] === verse.number) ||
                                                   (isNoteMode && !editingNoteId && selectedVerses.length > 0 && selectedVerses[0] === verse.number) ||
                                                   (editingNoteId && verseNotes.some(n => n.id === editingNoteId) && verse.number === verseNotes[0]?.verses?.[0]) ||
                                                   (longPressVerse === verse.number);
                            
                            return (
                                <div key={verse.id} style={{ marginBottom: '1rem' }} id={`verse-${verse.number}`}>
                                    <div 
                                        onClick={() => handleVerseClick(verse.number)}
                                        onDoubleClick={() => handleCopyVerse(verse.text, verse.number)}
                                        onMouseDown={() => handleMouseDown(verse.number)}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        onTouchStart={() => handleMouseDown(verse.number)}
                                        onTouchEnd={handleMouseUp}
                                        className={`block hover:bg-opacity-80 p-2 rounded transition-colors`}
                                        style={{ ...style, ...selectionStyle }}
                                        title="Click to highlight • Double-click to copy • Long press to add a note"
                                    >
                                        <span style={{ display: 'block', textAlign: 'left' }}>
                                            <sup className="text-xs font-bold mr-2 text-gray-400 select-none">{verse.number}</sup>
                                            {verse.text}
                                        </span>
                                    </div>

                                    {/* Inline Note Editor */}
                                    {showEditorHere && (
                                        <div className={`ml-6 mt-3 p-4 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-800 border-indigo-500' : 'bg-blue-50 border-blue-400'}`}>
                                            <div className="text-xs font-semibold mb-2 text-gray-500">
                                                {editingNoteId ? "Editing Note" : "New Note"}
                                            </div>
                                            <textarea
                                                ref={noteEditorRef}
                                                value={currentNoteText}
                                                onChange={(e) => setCurrentNoteText(e.target.value)}
                                                placeholder="Type your note here..."
                                                className={`w-full h-20 p-2 rounded border resize-none focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            />
                                            <div className="flex gap-2 mt-2 justify-end">
                                                <button onClick={handleSaveNote} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Save</button>
                                                {editingNoteId && <button onClick={handleDeleteNote} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Delete</button>}
                                                <button onClick={handleCancelEditNote} className="px-3 py-1 border border-gray-400 text-gray-600 text-sm rounded hover:bg-gray-100">Cancel</button>
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
                                                    className={`ml-6 mt-2 p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-800 border-indigo-500' : 'bg-yellow-50 border-yellow-400'}`}
                                                    style={{ fontSize: '0.9rem' }}
                                                >
                                                    <p className="text-sm mb-1 whitespace-pre-wrap">{note.text}</p>
                                                    <div className="flex justify-between items-center text-xs mt-2">
                                                        <button 
                                                            onClick={() => handleEditNote(note)}
                                                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                                        >
                                                            Edit
                                                        </button>
                                                        <span className="text-gray-500">{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            )
                                        ))}

                                        {/* READING MODE: Show note pills */}
                                        {!showNotes && verseNotes.map(note => (
                                            note.id !== editingNoteId && (
                                                <div key={note.id} className="ml-6 mt-2">
                                                    <button
                                                        onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                          expandedNotes[note.id] 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')
                                                        }`}
                                                    >
                                                        📌 Note: {book} {chapter}:{verseNotes[0].verses.join(',')}
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
                                                            <span className="text-xs text-gray-500">{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</span>
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

                    {/* Audio Version Text (Fallback) */}
                    {audioVersion && audioVerses.length > 0 && (
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
            
            {/* Long Press Note Editor */}
            {longPressVerse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelNote}>
                    <div 
                        className={`w-full max-w-3xl rounded-xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">✏️ Note for {book} {chapter}:{longPressVerse}</h3>
                            <button onClick={handleCancelNote} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        

                        <textarea
                            ref={noteEditorRef}
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                            placeholder={`Write your note for ${book} ${chapter}:${longPressVerse}...`}
                            className={`w-full p-3 rounded-lg border mb-3 focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            style={{ height: '200px', minHeight: '200px' }}
                            autoFocus
                        />
                        
                        {/* Color Palette - Small, inline with buttons */}
                        <div className="mb-3 p-2 rounded-lg flex flex-wrap gap-2 items-center justify-center" style={{ background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }}>
                            {COLOR_PALETTE.map(c => {
                                const isSelected = activeHighlightColor && activeHighlightColor.code === c.code;
                                return (
                                    <button 
                                        key={c.code} 
                                        onClick={() => handleApplyColor(c)} 
                                        title={c.name}
                                        style={{ 
                                            width: '20px', 
                                            height: '20px', 
                                            background: c.code, 
                                            borderRadius: '50%', 
                                            border: isSelected ? '2px solid #000' : '1px solid #666',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                            boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.3)' : 'none'
                                        }}
                                    />
                                );
                            })}
                            <button 
                                onClick={() => handleApplyColor(null)}
                                title="Remove highlight"
                                style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    borderRadius: '50%', 
                                    border: '1px solid #666',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Study Mode Buttons - Same as FloatingTools */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button 
                                onClick={handleCopyVerses}
                                style={{ 
                                    padding: '8px 12px', 
                                    fontSize: '0.85rem',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                                title={`Copy ${book} ${chapter}:${longPressVerse}`}
                            >
                                📋 Copy Verse
                            </button>
                            
                            <button 
                                onClick={handlePasteVerses}
                                disabled={!versesCopied}
                                style={{ 
                                    padding: '8px 12px', 
                                    fontSize: '0.85rem',
                                    background: versesCopied ? '#9c27b0' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: versesCopied ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                                title={versesCopied ? 'Paste reference to note' : 'Copy verses first'}
                            >
                                📌 Paste Ref
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    handleSaveNote();
                                    setLongPressVerse(null);
                                }}
                                disabled={!currentNoteText.trim()}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition"
                            >
                                💾 Save Note
                            </button>
                            <button 
                                onClick={() => {
                                    handleDeleteNote();
                                    setLongPressVerse(null);
                                }}
                                style={{ 
                                    padding: '8px 12px',
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                🗑️ Delete
                            </button>
                            <button 
                                onClick={handleCancelNote}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
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
        showPalette={showHighlightPalette}
        setShowPalette={setShowHighlightPalette}
        showNotebook={showNotebook}
        setShowNotebook={setShowNotebook}
        onApplyColor={handleApplyColor}
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
      />
    </div>
  );
}

export default BibleStudy;
