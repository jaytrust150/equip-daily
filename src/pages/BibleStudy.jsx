import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";

// --- IMPORTS ---
import { bibleData } from '../data/bibleData'; 
import { BIBLE_BOOK_IDS } from '../bibleData';
import Login from '../components/Auth/Login'; 
import BibleVersionPicker from '../components/BibleVersionPicker';
import { auth } from "../config/firebase"; 
import { 
  BIBLE_VERSIONS, 
  COLOR_PALETTE, 
  DEFAULT_NOTE_COLOR, 
  DEFAULT_HIGHLIGHT_DATA, 
  AUDIO_BASE_PATH,
  DEFAULT_BIBLE_VERSION
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

function BibleStudy({ theme, book, setBook, chapter, setChapter, onSearch }) {
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  
  // ✅ Default to NLT from constants
  const [version, setVersion] = useState(DEFAULT_BIBLE_VERSION);

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
  const [_showNotes, _setShowNotes] = useState(false); 
  const [_isNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [_editingNoteId, _setEditingNoteId] = useState(null);
  
  const [fontSize, setFontSize] = useState(1.1);
  const [_showHighlightPalette, _setShowHighlightPalette] = useState(false);
  // ✅ Safe default color (prevents crash if COLOR_PALETTE is undefined)
  const [activeHighlightColor, setActiveHighlightColor] = useState(() => {
    return (COLOR_PALETTE && COLOR_PALETTE.length > 0) ? COLOR_PALETTE[0] : { code: '#ffff00', border: '#e6e600', name: 'Yellow' };
  });

  // --- AUDIO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

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
        const url = `https://api.scripture.api.bible/v1/bibles/${version}/chapters/${bookId}.${chapter}?content-type=json`;

        const apiKey = import.meta.env.VITE_BIBLE_API_KEY?.trim();
        if (!apiKey) throw new Error("Configuration Error: Missing Bible API Key.");

        const response = await fetch(url, {
          headers: { 'api-key': apiKey }
        });

        if (response.status === 401) {
            // 🔄 Fallback to KJV if the default version is unauthorized (likely permission issue)
            if (version !== 'de4e12af7f28f599-01') {
                console.warn("Unauthorized on current version. Switching to KJV...");
                setVersion('de4e12af7f28f599-01');
                isSwitching = true;
                return; 
            }

            const domain = window.location.origin;
            console.error("API Authorization Failed. Ensure this domain is whitelisted:", domain);
            throw new Error(`Unauthorized. Please whitelist this domain in API.Bible: ${domain}`);
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
  const parseBibleContent = (content) => {
    let extractedVerses = [];
    
    // Recursive function to walk through the JSON tree
    const traverse = (node) => {
      if (node.type === 'verse' && node.number) {
        // Found a verse start
        extractedVerses.push({ 
          id: node.number, 
          number: node.number, 
          text: "" // Will accumulate text
        });
      } else if (node.text && extractedVerses.length > 0) {
        // Append text to the current verse
        extractedVerses[extractedVerses.length - 1].text += node.text;
      }
      
      if (node.items) {
        node.items.forEach(traverse);
      }
    };

    content.forEach(traverse);
    return extractedVerses;
  };

  // 2. 🎧 Audio Player Effect
  useEffect(() => {
    if (!book || !chapter) return;
    
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
  }, [book, chapter]);

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
             {bibleData && Object.keys(bibleData).map(b => <option key={b} value={b}>{b}</option>)}
           </select>

           <select 
             value={chapter} 
             onChange={(e) => setChapter(Number(e.target.value))}
             className={`p-2 rounded-lg border w-20 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
           >
             {bibleData && bibleData[book] && [...Array(bibleData[book]).keys()].map(i => (
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

            <button 
                onClick={toggleAudio}
                className={`p-2 rounded-full text-white transition ${audioError ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                title={audioError ? "Audio not available" : (isPlaying ? "Pause Audio" : "Play Audio")}
                disabled={audioError}
            >
                {audioError ? "⚠️" : (isPlaying ? "⏸️" : "▶️")}
            </button>
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
        </div>
      </div>

      {/* 🔴 COLOR PALETTE */}
      <div className="flex gap-2 justify-center mb-6">
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

      {/* 📖 MAIN CONTENT */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        
        {/* LEFT: Bible Text */}
        <div className={`p-6 rounded-2xl shadow-sm border min-h-[500px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}>
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
                <div style={{ fontSize: `${fontSize}rem`, lineHeight: '1.8' }}>
                    {verses.map((verse) => {
                        const style = highlightsMap[verse.number] 
                            ? { backgroundColor: highlightsMap[verse.number].bg, cursor: 'pointer' }
                            : { cursor: 'pointer' };
                        
                        return (
                            <span 
                                key={verse.id}
                                onClick={() => handleVerseClick(verse.number)}
                                onDoubleClick={() => handleCopyVerse(verse.text, verse.number)}
                                className={`inline hover:underline decoration-indigo-300 decoration-2 px-1 rounded transition-colors`}
                                style={style}
                                title="Click to Highlight | Double Click to Copy"
                            >
                                <sup className="text-xs font-bold mr-1 text-gray-400 select-none">{verse.number}</sup>
                                {verse.text}
                            </span>
                        );
                    })}
                </div>
            )}
            
            {/* Copy Feedback Toast */}
            {copyFeedback && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full shadow-lg z-50 animate-bounce">
                    {copyFeedback}
                </div>
            )}
        </div>

        {/* RIGHT: Notes & Tools */}
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
      </div>
    </div>
  );
}

export default BibleStudy;