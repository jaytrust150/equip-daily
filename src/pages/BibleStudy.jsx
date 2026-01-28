import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";

// --- IMPORTS ---
import { bibleData } from '../data/bibleData'; 
import { BIBLE_BOOK_IDS } from '../bibleData';
import Login from '../components/Auth/Login'; 
import BibleVersionPicker from '../components/BibleVersionPicker';
import CommunityFeed from '../components/Shared/CommunityFeed';
import FloatingTools from '../components/Bible/FloatingTools';
import { auth } from "../config/firebase"; 
import { 
  BIBLE_VERSIONS, 
  COLOR_PALETTE, 
  DEFAULT_NOTE_COLOR, 
  DEFAULT_HIGHLIGHT_DATA, 
  AUDIO_BASE_PATH,
  DEFAULT_BIBLE_VERSION,
  AUDIO_FALLBACK_VERSION
} from '../config/constants'; 
import { 
  subscribeToNotes, saveNote, deleteNote,
  subscribeToUserProfile, updateUserHighlight
} from '../services/firestoreService';

// 🎨 COLORS
const NOTE_BUTTON_COLOR = '#2196F3'; 
const COPY_BUTTON_COLOR = '#ff9800'; 
const SAVE_BUTTON_COLOR = '#4caf50'; 
const DELETE_BUTTON_COLOR = '#f44336'; 

function BibleStudy({ theme, book, setBook, chapter, setChapter, onSearch, onProfileClick }) {
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  
  // ✅ Default to NLT from constants
  const [version, setVersion] = useState(DEFAULT_BIBLE_VERSION);
  const [audioVersion, setAudioVersion] = useState(null); // Track which version audio is from
  const [audioVerses, setAudioVerses] = useState([]); // Store fallback version text

  const [verses, setVerses] = useState([]);
  const [_selectedVerses, _setSelectedVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_isChapterRead, _setIsChapterRead] = useState(false);
  
  // ✅ FEEDBACK STATES
  const [copyFeedback, setCopyFeedback] = useState("");
  const [noteFeedback, setNoteFeedback] = useState({}); 

  // Highlights Map & Notes
  const [highlightsMap, setHighlightsMap] = useState({});
  const [userNotes, setUserNotes] = useState([]);
  
  // NOTE & STUDY MODES
  const [showNotes, setShowNotes] = useState(true); 
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  
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

            const domain = window.location.origin;
            console.error("API Authorization Failed. Check Vercel environment variables and API.Bible configuration");
            throw new Error(`Unauthorized. Check API key configuration in Vercel.`);
        }
        if (!response.ok) throw new Error(`Error ${response.status}: Failed to load Bible text.`);

        const data = await response.json();
        
        // Parse the nested JSON structure from API.Bible
        if (data && data.data && data.data.content) {
            const parsedVerses = parseBibleContent(data.data.content);
            setVerses(parsedVerses);
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
    const effectiveAudioVersion = needsAudioFallback ? AUDIO_FALLBACK_VERSION : version;
    
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
    const unsubscribeNotes = (typeof subscribeToNotes === 'function') 
      ? subscribeToNotes(user.uid, book, chapter, setUserNotes)
      : () => {};

    const unsubscribeProfile = (typeof subscribeToUserProfile === 'function')
      ? subscribeToUserProfile(user.uid, (data) => {
          if (data?.highlights && data.highlights[book] && data.highlights[book][chapter]) {
              setHighlightsMap(data.highlights[book][chapter]);
          } else {
              setHighlightsMap({});
          }
      })
      : () => {};

    return () => {
        if (typeof unsubscribeNotes === 'function') unsubscribeNotes();
        if (typeof unsubscribeProfile === 'function') unsubscribeProfile();
    };
  }, [user, book, chapter]);


  // 4. 🖱️ Interaction Handlers
  const handleVerseClick = async (verseNum) => {
    if (!user) return;

    if (showNotebook) {
      setSelectedVerses((prev) =>
        prev.includes(verseNum)
          ? prev.filter((v) => v !== verseNum)
          : [...prev, verseNum]
      );
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
    if (!user || selectedVerses.length === 0 || !currentNoteText.trim()) return;
    await saveNote(user, book, chapter, selectedVerses, currentNoteText);
    setSelectedVerses([]);
    setShowNotebook(false);
    setCurrentNoteText("");
    setNoteFeedback({ type: 'success', msg: 'Note Saved!' });
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
    if (!currentNoteText.trim() || !user) return;
    
    await saveNote(user.uid, book, chapter, currentNoteText, DEFAULT_NOTE_COLOR);
    setCurrentNoteText("");
    setIsNoteMode(false);
    setNoteFeedback({ type: 'success', msg: 'Note Saved!' });
    setTimeout(() => setNoteFeedback({}), 2000);
  };

  // --- RENDER ---
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* 🟢 TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4 bg-white/5 p-4 rounded-xl shadow-sm border border-gray-200/20">
        
        {/* Book/Chapter Selector */}
        <div className="flex items-center gap-2">
           <select 
             value={book} 
             onChange={(e) => { setBook(e.target.value); setChapter(1); }}
             className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
           >
             {bibleData && bibleData.map(bookData => (
               <option key={bookData.name} value={bookData.name}>{bookData.name}</option>
             ))}
           </select>

           <select 
             value={chapter} 
             onChange={(e) => setChapter(Number(e.target.value))}
             className={`p-2 rounded-lg border w-20 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
           >
             {bibleData && bibleData.find(b => b.name === book) && [...Array(bibleData.find(b => b.name === book).chapters).keys()].map(i => (
               <option key={i+1} value={i+1}>{i+1}</option>
             ))}
           </select>
        </div>

        {/* Version & Audio */}
        <div className="flex items-center gap-3">
            <BibleVersionPicker
                selectedVersion={version}
                onVersionChange={setVersion}
                theme={theme}
            />

            <div className="flex flex-col items-center">
                <button 
                    onClick={toggleAudio}
                    className={`p-2 rounded-full text-white transition ${audioError ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                    title={audioError ? "Audio not available" : (isPlaying ? "Pause Audio" : "Play Audio")}
                    disabled={audioError}
                >
                    {audioError ? "⚠️" : (isPlaying ? "⏸️" : "▶️")}
                </button>
                {audioVersion && (
                    <span className="text-xs text-gray-500 mt-1">{audioVersion} Audio</span>
                )}
            </div>
        </div>

        {/* Font Size & Search */}
        <div className="flex items-center gap-2">
            <div className="relative">
                <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch(searchInput)}
                    placeholder="Search..."
                    className={`pl-2 pr-7 py-1 rounded-lg border w-32 text-sm focus:w-48 transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer" onClick={() => onSearch && onSearch(searchInput)}>🔍</span>
            </div>
            <button onClick={() => setFontSize(f => Math.max(0.8, f - 0.1))} className="px-2 py-1 bg-gray-200 rounded text-black">-A</button>
            <button onClick={() => setFontSize(f => Math.min(2.0, f + 0.1))} className="px-2 py-1 bg-gray-200 rounded text-black">+A</button>
            <button
              onClick={() => setShowHighlightPalette((open) => !open)}
              className={`px-2 py-1 rounded-lg border text-sm font-medium transition ${showHighlightPalette ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700')}`}
              title="Highlight Tools"
            >
              🎨
            </button>
            <button
              onClick={() => { setShowNotebook((open) => !open); if (!showNotebook) setSelectedVerses([]); }}
              className={`px-2 py-1 rounded-lg border text-sm font-medium transition ${showNotebook ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700')}`}
              title="Note Tools"
            >
              📌
            </button>
          <button 
            onClick={() => setShowNoteMenu((open) => !open)}
            className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${showNoteMenu ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-700')}`}
            title="Notes & Modes"
          >
            📝
          </button>
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevChapter} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">← Previous</button>
          <button onClick={goToNextChapter} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Next →</button>
        </div>
        <p className="text-xs text-gray-500">Tip: Swipe left/right to change chapters.</p>
      </div>

        {/* Floating Notes / Modes Panel */}
        {showNoteMenu && (
        <div className={`fixed right-4 top-24 z-50 w-56 p-4 rounded-xl shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
          <div className="text-xs uppercase tracking-wide font-semibold mb-3 text-gray-400">Reading & Study</div>
          <div className="flex gap-2 mb-3">
            <button 
              onClick={() => { setShowNotes(false); setShowNoteMenu(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${!showNotes ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700')}`}
            >
              Reading Mode
            </button>
            <button 
              onClick={() => { setShowNotes(true); setShowNoteMenu(false); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${showNotes ? 'bg-indigo-600 text-white border-indigo-600' : (theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700')}`}
            >
              Study Mode
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">Tip: Study mode shows notes + reflections.</p>
          <button 
            onClick={() => setShowNoteMenu(false)}
            className={`w-full py-2 rounded-lg text-xs font-semibold border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
          >
            Close
          </button>
        </div>
        )}

      {/* 🔴 COLOR PALETTE */}
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

      {/* 📖 MAIN CONTENT */}
      <div className={`max-w-4xl mx-auto grid grid-cols-1 ${showNotes ? 'md:grid-cols-[1fr_300px]' : ''} gap-6`}>
        
        {/* LEFT: Bible Text */}
        <div 
          className={`p-6 rounded-2xl shadow-sm border min-h-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
            <h1 className="text-2xl font-bold mb-4 text-center">{book} {chapter}</h1>
            
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
                    {/* Main Version Text */}
                    <div style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8' }}>
                        {verses.map((verse) => {
                            const isSelected = selectedVerses.includes(verse.number);
                            const style = highlightsMap[verse.number] 
                              ? { backgroundColor: highlightsMap[verse.number].bg, cursor: 'pointer' }
                              : { cursor: 'pointer' };
                            const selectionStyle = isSelected ? { outline: '2px solid #6366f1', borderRadius: '6px' } : {};
                            
                            return (
                                <span 
                                    key={verse.id}
                                    onClick={() => handleVerseClick(verse.number)}
                                    onDoubleClick={() => handleCopyVerse(verse.text, verse.number)}
                                    onMouseDown={() => handleMouseDown(verse.number)}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={() => handleMouseDown(verse.number)}
                                    onTouchEnd={handleMouseUp}
                                    className={`inline hover:underline decoration-indigo-300 decoration-2 px-1 rounded transition-colors`}
                                    style={{ ...style, ...selectionStyle }}
                                    title="Click to Highlight | Double Click to Copy | Long Press for Note"
                                >
                                    <sup className="text-xs font-bold mr-1 text-gray-400 select-none">{verse.number}</sup>
                                    {verse.text}
                                </span>
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
                        className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">✏️ Note for Verse {longPressVerse}</h3>
                            <button onClick={handleCancelNote} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <textarea
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                            placeholder={`Write your note for ${book} ${chapter}:${longPressVerse}...`}
                            className={`w-full p-3 rounded-lg border h-40 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    handleSaveNote();
                                    setLongPressVerse(null);
                                }}
                                disabled={!currentNoteText.trim()}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition"
                            >
                                Save Note
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
        {showNotes && (
        <div className="space-y-4">
            
            {/* Note Editor */}
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    ✏️ Personal Notes
                </h3>
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
            </div>

            {/* Saved Notes List */}
            <div className="space-y-3">
                {userNotes.map(note => (
                    <div key={note.id} className={`p-3 rounded-lg border relative group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-yellow-50 border-yellow-200'}`}>
                        <p className="text-sm mb-2">{note.text}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            <button 
                                onClick={() => deleteNote(user.uid, book, chapter, note.id)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
        )}
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
          title="Reflections from the Body"
        />
      </div>

      <FloatingTools
        showPalette={showHighlightPalette}
        setShowPalette={setShowHighlightPalette}
        showNotebook={showNotebook}
        setShowNotebook={setShowNotebook}
        onApplyColor={handleApplyColor}
        selectedVerses={selectedVerses}
        onSaveNote={handleSaveSelectedNote}
      />
    </div>
  );
}

export default BibleStudy;