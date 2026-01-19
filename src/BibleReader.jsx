import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { bibleData } from './bibleData';
import BibleTracker from './BibleTracker';
import MemberCard from './MemberCard'; 
import Login from './Login'; 
import { auth, db } from "./firebase";
import confetti from 'canvas-confetti';
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, 
  onSnapshot, collection, query, where, serverTimestamp, addDoc, getDoc 
} from "firebase/firestore";

// 🎨 COLORS
const NOTE_BUTTON_COLOR = '#2196F3'; 
const CITY_NAME = "Sebastian"; 

// 🌈 PALETTE
const COLOR_PALETTE = [
    { name: 'Yellow', code: '#ffeb3b', border: '#fbc02d' },
    { name: 'Green', code: '#a5d6a7', border: '#66bb6a' },
    { name: 'Blue', code: '#90caf9', border: '#42a5f5' },
    { name: 'Pink', code: '#f48fb1', border: '#ec407a' },
    { name: 'Orange', code: '#ffcc80', border: '#ffa726' },
    { name: 'White', code: '#ffffff', border: '#b0bec5' } 
];

const DEFAULT_NOTE_COLOR = '#2196F3'; 
const DEFAULT_HIGHLIGHT_DATA = { bg: '#ffeb3b', border: '#fbc02d' };

// 🎧 AUDIO BASE URL
const AUDIO_BASE_PATH = "/audio/";

function BibleReader({ theme, book, setBook, chapter, setChapter, onSearch, onProfileClick, historyStack, onGoBack }) {
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  const [version, setVersion] = useState('web');
  const [verses, setVerses] = useState([]);
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readChapters, setReadChapters] = useState([]);
  const [isChapterRead, setIsChapterRead] = useState(false);
  
  // ✅ FEEDBACK STATES (Restored)
  const [copyFeedback, setCopyFeedback] = useState("");
  const [noteFeedback, setNoteFeedback] = useState({}); 

  // Highlights Map
  const [highlightsMap, setHighlightsMap] = useState({});
  const [userNotes, setUserNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false); // Default: Reading Mode
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const editorRef = useRef(null);
  const [topNavMode, setTopNavMode] = useState(null);
  const [fontSize, setFontSize] = useState(1.1);
  
  // 💡 HINT & PALETTE STATE
  const [hintText, setHintText] = useState("");
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState(COLOR_PALETTE[0]); // Default Yellow

  // 🖱️ DRAGGABLE PALETTE STATE
  const [palettePos, setPalettePos] = useState({ x: 0, y: 0 });
  const isDraggingPalette = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 🖱️ DRAGGABLE NOTEBOOK STATE (Restored)
  const [notebookPos, setNotebookPos] = useState({ x: 0, y: 0 });
  const isDraggingNotebook = useRef(false);
  const dragStartNotebookPos = useRef({ x: 0, y: 0 });

  // ⚡ PEEK NOTE STATE
  const [hoveredNoteId, setHoveredNoteId] = useState(null);
  const [quickNoteVerse, setQuickNoteVerse] = useState(null);

  // --- AUDIO STATE ---
  const [showAudio, setShowAudio] = useState(false); 
  const audioRef = useRef(null);
  const [audioError, setAudioError] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(null); 
  const [sleepTimeLeft, setSleepTimeLeft] = useState(null); 

  // --- LONG PRESS STATE ---
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  // --- SWIPE NAV STATE ---
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  const minSwipeDistance = 75; 

  // --- REFLECTION STATE ---
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [chapterReflections, setChapterReflections] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // --- NOTE SETTINGS ---
  const [noteSettings, setNoteSettings] = useState({});

  const toggleNoteSetting = (noteId, setting) => {
      setNoteSettings(prev => ({
          ...prev,
          [noteId]: {
              ...prev[noteId],
              [setting]: !prev[noteId]?.[setting]
          }
      }));
  };

  // --- 🪄 AUTO-HIDE HINT TIMER ---
  useEffect(() => {
    if (hintText) {
      const timer = setTimeout(() => { setHintText(""); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hintText]);

  // --- 🍓 FRUIT REACTION HANDLER ---
  const handleReaction = async (postId, fruitId) => {
    if (!user) return;
    const postRef = doc(db, "reflections", postId);
    const post = chapterReflections.find(p => p.id === postId);
    if (!post) return;
    const currentReactions = post.reactions?.[fruitId] || [];
    const hasReacted = currentReactions.includes(user.uid);
    try {
      if (hasReacted) await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayRemove(user.uid) });
      else await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayUnion(user.uid) });
    } catch (e) { console.error("Error updating fruit:", e); }
  };

  // --- USER DATA LISTENER ---
  useEffect(() => {
    if (!user) { setReadChapters([]); setHighlightsMap({}); return; }
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReadChapters(data.readChapters || []);
        
        const rawHighlights = data.highlights || [];
        const newMap = {};
        rawHighlights.forEach(h => {
            if (typeof h === 'string') {
                const parts = h.split('|');
                const key = parts[0];
                const colorCode = parts[1] || DEFAULT_HIGHLIGHT_DATA.bg;
                const paletteEntry = COLOR_PALETTE.find(p => p.code === colorCode);
                const borderColor = paletteEntry ? paletteEntry.border : '#ccc';
                newMap[key] = { bg: colorCode, border: borderColor };
            }
        });
        setHighlightsMap(newMap);
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const chapterKey = `${book} ${chapter}`;
    const q = query(collection(db, "reflections"), where("chapter", "==", chapterKey));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => { fetched.push({ id: doc.id, ...doc.data() }); });
      setChapterReflections(fetched || []);
      if (user) {
        const myPost = fetched.find(r => r.userId === user.uid);
        if (myPost) { setHasShared(true); if (!editingId) setReflection(myPost.text); }
        else { setHasShared(false); if (!editingId) setReflection(""); }
      }
    });
    return () => unsubscribe();
  }, [book, chapter, user, editingId]);

  useEffect(() => {
    if (!user) { setUserNotes([]); return; }
    const q = query(collection(db, "notes"), where("userId", "==", user.uid), where("book", "==", book), where("chapter", "==", parseInt(chapter)));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = [];
        snapshot.forEach(doc => fetchedNotes.push({ id: doc.id, ...doc.data() }));
        setUserNotes(fetchedNotes);
    });
    return () => unsubscribe();
  }, [book, chapter, user]);

  useEffect(() => { const chapterKey = `${book} ${chapter}`; setIsChapterRead(readChapters.includes(chapterKey)); }, [book, chapter, readChapters]);

  // --- AUDIO RESET & SLEEP TIMER ---
  useEffect(() => {
      setAudioError(false);
      if (showAudio && audioRef.current) {
          audioRef.current.load();
      }
  }, [book, chapter, showAudio]);

  useEffect(() => {
    if (sleepTimeLeft === null) return;
    if (sleepTimeLeft <= 0) {
        if (audioRef.current) audioRef.current.pause();
        setSleepMinutes(null);
        setSleepTimeLeft(null);
        return;
    }
    const interval = setInterval(() => { setSleepTimeLeft((prev) => prev - 1); }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimeLeft]);

  const toggleSleepTimer = () => {
      let newMinutes = null;
      if (sleepMinutes === null) newMinutes = 15;
      else if (sleepMinutes === 15) newMinutes = 30;
      else if (sleepMinutes === 30) newMinutes = 60;
      else newMinutes = null;
      setSleepMinutes(newMinutes);
      setSleepTimeLeft(newMinutes ? newMinutes * 60 : null);
  };

  const formatTimeLeft = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleChapterRead = useCallback(async (e) => {
    if (!user) { if (e && e.preventDefault) e.preventDefault(); alert("Please log in to track your progress."); document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' }); return; }
    const isNowChecked = (e && e.target && e.target.type === 'checkbox') ? e.target.checked : !isChapterRead;
    if (isNowChecked) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#276749', '#38b2ac', '#ffffff', '#FFD700'] });
    const chapterKey = `${book} ${chapter}`;
    const userRef = doc(db, "users", user.uid);
    setIsChapterRead(isNowChecked);
    setReadChapters(prev => isNowChecked ? [...prev, chapterKey] : prev.filter(k => k !== chapterKey));
    try { await setDoc(userRef, { readChapters: isNowChecked ? arrayUnion(chapterKey) : arrayRemove(chapterKey) }, { merge: true }); } 
    catch (err) { console.error("Error saving progress:", err); setIsChapterRead(!isNowChecked); }
  }, [user, book, chapter, isChapterRead]);

  const handleTrackerNavigation = useCallback((newBook, newChapter) => {
      setBook(newBook); setChapter(newChapter); window.scrollTo({ top: 0, behavior: 'smooth' });
      setEditingId(null); setReflection(""); setSelectedVerses([]);
      if (user && newBook === book && newChapter === parseInt(chapter)) { toggleChapterRead(); }
  }, [book, chapter, user, toggleChapterRead, setBook, setChapter]);

  const handleSearchSubmit = (e) => { e.preventDefault(); if(onSearch && searchInput.trim()) onSearch(searchInput); };

  // --- 🎨 CLOSE PALETTE (Resets pos, clears selection) ---
  const closePalette = () => {
    setShowHighlightPalette(false);
    setPalettePos({ x: 0, y: 0 }); // Reset position
    setSelectedVerses([]);         // ✅ Clears selection ONLY on close
  };

  // --- 🎨 APPLY HIGHLIGHT COLOR (Handles Removal) ---
  const applyHighlightColor = async (colorObj) => {
    // If colorObj is null, we treat it as a removal
    const isRemoval = !colorObj; 
    
    if (!isRemoval) setActiveHighlightColor(colorObj);

    if (selectedVerses.length > 0) {
        const userRef = doc(db, "users", user.uid);
        const selectedKeys = selectedVerses.map(v => `${book} ${chapter}:${v}`);
        
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const currentData = docSnap.data().highlights || [];
                // Remove existing highlights for these verses
                const toRemove = currentData.filter(h => {
                    const key = h.split('|')[0];
                    return selectedKeys.includes(key);
                });
                if (toRemove.length > 0) {
                    await updateDoc(userRef, { highlights: arrayRemove(...toRemove) });
                }
            }
            // Only add back if it's NOT a removal action
            if (!isRemoval) {
                const toAdd = selectedKeys.map(k => `${k}|${colorObj.code}`);
                await updateDoc(userRef, { highlights: arrayUnion(...toAdd) });
            }
        } catch (e) { console.error("Error applying highlight:", e); }
    }
  };

  // --- 🎨 HIGHLIGHT BUTTON CLICK HANDLER ---
  const handleHighlightButton = () => {
    if (!user) { alert("Please log in to highlight."); return; }
    
    // Always Open/Toggle Palette
    setShowHighlightPalette(!showHighlightPalette);

    // If verses selected, apply current color immediately
    if (selectedVerses.length > 0) {
        applyHighlightColor(activeHighlightColor);
    }
  };
  
  const handleVerseDoubleClick = async (verseNum) => {
      if (!user) return;
      
      // ✅ NEW: Automatically open the palette
      setShowHighlightPalette(true);

      const verseKey = `${book} ${chapter}:${verseNum}`;
      const isCurrentlyHighlighted = highlightsMap.hasOwnProperty(verseKey);
      const userRef = doc(db, "users", user.uid);
      try {
          if (isCurrentlyHighlighted) {
              const docSnap = await getDoc(userRef);
              if (docSnap.exists()) {
                  const currentData = docSnap.data().highlights || [];
                  const toRemove = currentData.find(h => h.startsWith(verseKey));
                  if (toRemove) await updateDoc(userRef, { highlights: arrayRemove(toRemove) });
              }
          } else {
              // Use currently active color for double tap
              await updateDoc(userRef, { highlights: arrayUnion(`${verseKey}|${activeHighlightColor.code}`) });
          }
          setSelectedVerses(prev => prev.filter(v => v !== verseNum));
      } catch (e) { console.error("Highlight toggle error:", e); }
  };

  // ✅ NOTES BUTTON LOGIC (Toggle vs Editor)
  const handleNoteButtonClick = () => {
      if (!user) { alert("Please log in to add notes."); return; }
      
      // 1. If verses are selected -> OPEN EDITOR (Always)
      if (selectedVerses.length > 0) {
          // If we are in Reading Mode, switch to Study Mode first so they can see what they are doing
          if (!showNotes) setShowNotes(true);
          
          setCurrentNoteText(""); 
          setEditingNoteId(null); 
          setIsNoteMode(true);
          setTimeout(() => { if (editorRef.current) { editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); editorRef.current.focus(); } }, 100);
          return;
      }

      // 2. If NO verses selected -> TOGGLE MODES (Reading vs Study)
      const nextState = !showNotes;
      setShowNotes(nextState);
      
      // Reset any editing state if we toggle off
      if (!nextState) {
          setIsNoteMode(false);
          setEditingNoteId(null);
      }

      setHintText(nextState 
          ? "📝 Study Mode: Notes Visible. Tap verses to select." 
          : "📖 Reading Mode: Clean View. Long press a verse to add a note.");
  };

  const saveNote = async () => {
      if (!currentNoteText.trim()) return;
      try {
          const noteData = { 
              userId: user.uid, book: book, chapter: parseInt(chapter), 
              verses: selectedVerses.sort((a,b) => a-b), 
              text: currentNoteText, 
              timestamp: serverTimestamp(), 
              color: DEFAULT_NOTE_COLOR 
          };

          if (editingNoteId) { await updateDoc(doc(db, "notes", editingNoteId), { text: currentNoteText, timestamp: serverTimestamp() }); } 
          else { await addDoc(collection(db, "notes"), noteData); }
          
          setIsNoteMode(false); setEditingNoteId(null); setSelectedVerses([]); 
          setHintText(""); 
          
      } catch (e) { console.error("Error saving note:", e); }
  };

  const handleNoteColorChange = async (note, newColor) => {
      if (!user) return;
      try {
          await updateDoc(doc(db, "notes", note.id), { color: newColor });
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
              const currentHighlights = docSnap.data().highlights || [];
              const verseKeys = note.verses.map(v => `${book} ${chapter}:${v}`);
              const toRemove = currentHighlights.filter(h => verseKeys.includes(h.split('|')[0]));
              const toAdd = verseKeys.map(k => `${k}|${newColor}`);
              if (toRemove.length > 0) await updateDoc(userRef, { highlights: arrayRemove(...toRemove) });
              await updateDoc(userRef, { highlights: arrayUnion(...toAdd) });
          }
      } catch(e) { console.error("Error changing color", e); }
  };

  // ✅ HANDLE EDITOR DELETE BUTTON (Garbage Can in Palette)
  const handleEditorDelete = async () => {
    if (editingNoteId) {
        // Deleting an existing note
        if (window.confirm("Are you sure you want to delete this note?")) {
            try {
                await deleteDoc(doc(db, "notes", editingNoteId));
                setIsNoteMode(false);
                setEditingNoteId(null);
                setCurrentNoteText("");
            } catch (e) { console.error(e); }
        }
    } else {
        // Discarding a new draft (same as Cancel)
        setIsNoteMode(false);
        setEditingNoteId(null);
        setCurrentNoteText("");
    }
  };

  const deleteNote = async (noteId) => { if (window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "notes", noteId)); } catch (e) { console.error(e); } } };
  const startEditingNote = (note) => { setCurrentNoteText(note.text); setEditingNoteId(note.id); setIsNoteMode(true); };
  
  // ⚡ HELPER: TRIGGER NOTE FEEDBACK (Visual only)
  const triggerNoteFeedback = (noteId, type) => {
      setNoteFeedback(prev => ({ ...prev, [noteId]: type }));
      setTimeout(() => {
          setNoteFeedback(prev => {
              const newState = { ...prev };
              delete newState[noteId];
              return newState;
          });
      }, 2000);
  };

  const handleShareNote = async (note, type) => {
      const noteVerseText = note.verses.map(vNum => { 
          const v = verses.find(v => v.verse === vNum); 
          return v ? `[${vNum}] ${v.text}` : ""; 
      }).join(' ');
      const citation = `${book} ${chapter}:${note.verses[0]}${note.verses.length > 1 ? '-' + note.verses[note.verses.length-1] : ''} (${version.toUpperCase()})`;
      
      let fullShareText = "";
      
      const settings = noteSettings[note.id] || { showDate: false, showTime: false };
      let timestampText = "";
      
      if (settings.showTime || settings.showDate) {
          const dateObj = note.timestamp?.toDate ? note.timestamp.toDate() : new Date(note.timestamp);
          if (settings.showTime) timestampText += dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " ";
          if (settings.showDate) timestampText += dateObj.toLocaleDateString();
          timestampText = `\n\n— ${timestampText.trim()}`;
      }

      if (type === 'verse') {
          fullShareText = `"${noteVerseText}" ${citation}`;
      } else if (type === 'note') {
          fullShareText = `${note.text}${timestampText}`;
      } else { 
          fullShareText = `"${noteVerseText}" ${citation}\n\n${note.text}${timestampText}`;
      }

      const shareData = { title: 'Equip Daily Note', text: fullShareText, url: window.location.href };
      if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } else { try { await navigator.clipboard.writeText(fullShareText); alert("Copied to clipboard!"); } catch (err) {} }
  };

  // ✅ SYSTEM PASTE BUTTON
  const handleSystemPaste = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (editorRef.current) {
            const start = editorRef.current.selectionStart;
            const end = editorRef.current.selectionEnd;
            const current = currentNoteText;
            const newText = current.substring(0, start) + text + current.substring(end);
            setCurrentNoteText(newText);
            
            setTimeout(() => {
                if(editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + text.length;
                    editorRef.current.focus();
                }
            }, 0);
        } else {
            setCurrentNoteText(prev => prev + text);
        }
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        alert("Clipboard permission denied or empty.");
    }
  };

  // ✅ NEW: COPY NOTE TEXT (No Alert)
  const handleCopyNote = async (note) => {
      try { 
          await navigator.clipboard.writeText(note.text); 
          triggerNoteFeedback(note.id, 'text'); // Trigger visual feedback
      } catch (err) {}
  };

  const saveReflection = async () => {
    if (!reflection.trim() || !user) return;
    const chapterKey = `${book} ${chapter}`;
    try {
      if (editingId) { await updateDoc(doc(db, "reflections", editingId), { text: reflection, timestamp: serverTimestamp(), isEdited: true }); setEditingId(null); setReflection(""); } 
      else { 
        await setDoc(doc(db, "reflections", `${user.uid}_${chapterKey}`), { 
          userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, 
          text: reflection, chapter: chapterKey, timestamp: serverTimestamp(), 
          location: CITY_NAME, 
          reactions: {} 
        }); 
      }
    } catch (e) { console.error("Error saving reflection:", e); }
  };
  const handleEditClick = (post) => { setEditingId(post.id); setReflection(post.text); document.getElementById('reflection-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const handleCancelEdit = () => { setEditingId(null); setReflection(""); };
  const handleDeleteClick = async (id) => { if (window.confirm("Delete reflection?")) { try { await deleteDoc(doc(db, "reflections", id)); if (editingId === id) handleCancelEdit(); } catch (e) { console.error(e); } } };
  const handleShareItem = async (text) => { const shareData = { title: 'Equip Daily', text: text, url: window.location.href }; if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } else { try { await navigator.clipboard.writeText(text); alert("Text copied!"); } catch (err) {} } };

  useEffect(() => {
    setLoading(true);
    const singleChapterConfig = { "Obadiah": 21, "Philemon": 25, "2 John": 13, "3 John": 14, "Jude": 25 };
    let q = singleChapterConfig[book] ? `${book} 1:1-${singleChapterConfig[book]}` : `${book}+${chapter}`;
    fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=${version}`)
      .then(res => res.json()).then(data => { setVerses(data.verses || []); setSelectedVerses([]); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [book, chapter, version]);
  
  // --- 👆 LONG PRESS LOGIC (PC + Mobile) ---
  const startLongPress = (verseNum) => {
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true; 
          setSelectedVerses([verseNum]);
          
          // ✅ DIRECTLY OPEN EDITOR (Bypass checks, always allow note via Long Press)
          setCurrentNoteText(""); 
          setEditingNoteId(null); 
          setIsNoteMode(true);
          setTimeout(() => { if (editorRef.current) { editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); editorRef.current.focus(); } }, 100);

          if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
  };

  const endLongPress = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const toggleVerse = (verseNum) => { 
      if (!isLongPress.current) {
          // ✅ ALWAYS ALLOW SELECTION (For Highlight/Copy)
          if (selectedVerses.includes(verseNum)) setSelectedVerses(selectedVerses.filter(v => v !== verseNum)); 
          else setSelectedVerses([...selectedVerses, verseNum].sort((a, b) => a - b)); 
          
          // If in Reading Mode, ensure hint tells them what they can do
          if (!showNotes) setHintText("💡 Selection active. Use Highlight above, or Long Press to Note.");
          else setHintText("");
      }
  };
  
  // ✅ COPY SELECTED VERSE TEXT (Editor Context)
  const handleCopyVerseText = async (targetVerses = selectedVerses) => {
    if (!targetVerses || targetVerses.length === 0) return;

    try { 
        const textBlock = targetVerses.map(num => { const v = verses.find(v => v.verse === num); return v ? v.text.trim() : ""; }).join(' ');
        const citation = `${book} ${chapter}:${targetVerses[0]}${targetVerses.length > 1 ? '-' + targetVerses[targetVerses.length-1] : ''} (${version.toUpperCase()})`;
        await navigator.clipboard.writeText(`"${textBlock}" ${citation}`); 
        
        if (targetVerses === selectedVerses) {
            setCopyFeedback("Copied!"); 
            setTimeout(() => setCopyFeedback(""), 2000); 
        } else {
            alert("Scripture copied!");
        }
    } catch (err) {}
  };

  // ✅ APPLY HIGHLIGHT FROM EDITOR (Handles removal via null)
  // 🛠️ UPDATED: Syncs with global Active Highlight Color
  const handleEditorHighlight = async (colorCode) => {
      if (selectedVerses.length === 0) return;
      
      // 1. Sync global state so next highlight uses this color
      if (colorCode) {
          const colorObj = COLOR_PALETTE.find(c => c.code === colorCode);
          if (colorObj) setActiveHighlightColor(colorObj);
      }
      
      const userRef = doc(db, "users", user.uid);
      const selectedKeys = selectedVerses.map(v => `${book} ${chapter}:${v}`);
      
      try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
              const currentData = docSnap.data().highlights || [];
              // Remove highlights regardless of adding new one
              const toRemove = currentData.filter(h => {
                  const key = h.split('|')[0];
                  return selectedKeys.includes(key);
              });
              if (toRemove.length > 0) {
                  await updateDoc(userRef, { highlights: arrayRemove(...toRemove) });
              }
          }
          // Only add if not removal (null)
          if (colorCode) {
              const toAdd = selectedKeys.map(k => `${k}|${colorCode}`);
              await updateDoc(userRef, { highlights: arrayUnion(...toAdd) });
          }
      } catch (e) { console.error("Editor highlight error:", e); }
  };

  const increaseFont = () => setFontSize(prev => Math.min(prev + 0.1, 2.0));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));
  
  // --- 📖 NAV HANDLERS ---
  const handleNext = () => { 
      const idx = bibleData.findIndex(b => b.name === book); 
      if (parseInt(chapter) < bibleData[idx].chapters) setChapter(parseInt(chapter) + 1); 
      else if (idx < bibleData.length - 1) { setBook(bibleData[idx + 1].name); setChapter(1); } 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHintText("💡 Tip: On mobile, Swipe Left ⬅️ anywhere to go Next.");
  };

  const handlePrev = () => { 
      if (parseInt(chapter) > 1) setChapter(parseInt(chapter) - 1); 
      else { const idx = bibleData.findIndex(b => b.name === book); if (idx > 0) { setBook(bibleData[idx - 1].name); setChapter(bibleData[idx - 1].chapters); } } 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHintText("💡 Tip: On mobile, Swipe Right ➡️ anywhere to go Back.");
  };
  
  // --- SWIPE LOGIC ---
  const onGlobalTouchStart = (e) => {
      touchEndRef.current = { x: 0, y: 0 }; 
      touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onGlobalTouchMove = (e) => {
      touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const onGlobalTouchEnd = () => {
      if (!touchStartRef.current.x || !touchEndRef.current.x) return;
      const distanceX = touchStartRef.current.x - touchEndRef.current.x;
      const distanceY = touchStartRef.current.y - touchEndRef.current.y;
      
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
          if (distanceX > minSwipeDistance) handleNext(); 
          if (distanceX < -minSwipeDistance) handlePrev(); 
      }
  };

  const getChapterCount = () => { const b = bibleData.find(d => d.name === book); return b ? b.chapters : 50; };

  const compactSelectStyle = { border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.75rem', color: theme === 'dark' ? '#aaa' : '#2c3e50', cursor: 'pointer', appearance: 'none', outline: 'none', fontFamily: 'inherit', maxWidth: '70px' };
  
  // --- 🖱️ DRAGGABLE LOGIC (Highlight & Notebook) ---
  const handlePaletteMouseDown = (e) => {
      isDraggingPalette.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      dragStartPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleNotebookMouseDown = (e) => {
      isDraggingNotebook.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      dragStartNotebookPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
      const handleGlobalMouseMove = (e) => {
          if (isDraggingPalette.current) {
              setPalettePos({
                  x: e.clientX - dragStartPos.current.x,
                  y: e.clientY - dragStartPos.current.y
              });
          }
          if (isDraggingNotebook.current) {
               setNotebookPos({
                  x: e.clientX - dragStartNotebookPos.current.x,
                  y: e.clientY - dragStartNotebookPos.current.y
              });
          }
      };
      const handleGlobalMouseUp = () => { 
          isDraggingPalette.current = false; 
          isDraggingNotebook.current = false;
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
  }, []);

  const renderControlBar = () => (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 0', minHeight: '40px' }}>
        
        {/* 🎨 DRAGGABLE HIGHLIGHT PALETTE */}
        {showHighlightPalette && (
            <div 
                onMouseDown={handlePaletteMouseDown}
                style={{ 
                    // Fixed position always (defaulting to left side if not moved)
                    position: 'fixed',
                    top: palettePos.x === 0 && palettePos.y === 0 ? '50%' : `${palettePos.y}px`,
                    left: palettePos.x === 0 && palettePos.y === 0 ? '20px' : `${palettePos.x}px`,
                    transform: palettePos.x === 0 && palettePos.y === 0 ? 'translateY(-50%)' : 'none',
                    backgroundColor: theme === 'dark' ? '#333' : 'white', 
                    border: '1px solid #ccc', borderRadius: '15px', 
                    padding: '4px 2px', // 🛠️ SKINNER PADDING
                    width: '26px',      // 🛠️ FORCED NARROW WIDTH
                    display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', // 🛠️ SMALLER GAP
                    zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    cursor: 'grab'
                }}
            >
                {COLOR_PALETTE.map(color => (
                    <button 
                        key={color.code}
                        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking color
                        onClick={() => applyHighlightColor(color)}
                        title={`Select ${color.name}`}
                        style={{ 
                            width: '16px', height: '16px', borderRadius: '50%', // 🛠️ SLIGHTLY SMALLER DOTS
                            backgroundColor: color.code, border: '1px solid #999', cursor: 'pointer', padding: 0 
                        }}
                    />
                ))}
                
                {/* Horizontal Separator */}
                <span style={{ width: '16px', height: '1px', background: '#ccc', margin: '2px 0' }}></span>

                {/* 🚫 REMOVE HIGHLIGHT BUTTON */}
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => applyHighlightColor(null)} // Sends null to remove
                    title="Remove Highlight"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}
                >
                    🚫
                </button>

                {/* Close Button */}
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={closePalette} 
                    style={{ background: 'none', border: 'none', color: '#888', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '0', padding: '0' }}>✕</button>
            </div>
        )}

        {/* 📝 DRAGGABLE NOTEBOOK (STUDY MODE) */}
        {showNotes && (
            <div 
                onMouseDown={handleNotebookMouseDown}
                style={{ 
                    // Fixed position always (defaulting to left side below highlights)
                    position: 'fixed',
                    top: notebookPos.x === 0 && notebookPos.y === 0 ? '65%' : `${notebookPos.y}px`,
                    left: notebookPos.x === 0 && notebookPos.y === 0 ? '20px' : `${notebookPos.x}px`,
                    transform: notebookPos.x === 0 && notebookPos.y === 0 ? 'translateY(-50%)' : 'none',
                    backgroundColor: theme === 'dark' ? '#333' : 'white', 
                    border: `1px solid ${NOTE_BUTTON_COLOR}`, borderRadius: '20px', 
                    padding: '6px 12px',
                    display: 'flex', gap: '8px', alignItems: 'center',
                    zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    cursor: 'grab'
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>📝</span>
                {/* Close (Exit Study Mode) */}
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => { setShowNotes(false); setHintText("📖 Reading Mode Active"); }} 
                    title="Exit Study Mode"
                    style={{ background: 'none', border: 'none', color: '#888', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', padding: '0' }}>✕</button>
            </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button onClick={() => setShowAudio(!showAudio)} title={showAudio ? "Hide Audio" : "Show Audio"} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 5px' }}>{showAudio ? '🔊' : '🔇'}</button>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }} style={compactSelectStyle}>{bibleData && bibleData.map(b => <option key={b.name} value={b.name} style={{color: '#333'}}>{b.name}</option>)}</select>
            <span style={{ fontSize: '0.75rem', color: '#555' }}>|</span>
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ ...compactSelectStyle, width: 'auto' }}>{[...Array(getChapterCount())].map((_, i) => <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>)}</select>
            <select value={version} onChange={(e) => setVersion(e.target.value)} style={{ fontSize: '0.65rem', color: theme === 'dark' ? '#888' : '#999', marginLeft: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }}><option value="web" style={{color: '#333'}}>WEB</option><option value="kjv" style={{color: '#333'}}>KJV</option><option value="asv" style={{color: '#333'}}>ASV</option><option value="bbe" style={{color: '#333'}}>BBE</option></select>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Bible Search & Concordance" style={{ padding: '6px 10px 6px 15px', borderRadius: '20px 0 0 20px', border: '1px solid #2196F3', borderRight: 'none', fontSize: '0.8rem', width: '210px', outline: 'none', backgroundColor: theme === 'dark' ? '#222' : '#fff', color: theme === 'dark' ? '#fff' : '#333', fontFamily: 'inherit' }} />
                <button type="submit" style={{ padding: '6px 15px 6px 10px', borderRadius: '0 20px 20px 0', border: '1px solid #2196F3', borderLeft: 'none', backgroundColor: '#2196F3', color: 'white', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>🔍</button>
            </form>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={handlePrev} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>← Prev</button>
            <button onClick={handleNext} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Next →</button>
            
            <button 
                onMouseEnter={() => setHintText("💡 Double Tap a verse to highlight instantly! For multiple, select first.")} 
                onMouseLeave={() => setHintText("")}
                onClick={handleHighlightButton} 
                className="nav-btn" 
                style={{ 
                    backgroundColor: selectedVerses.length > 0 ? activeHighlightColor.code : (theme === 'dark' ? '#333' : '#f5f5f5'), 
                    color: selectedVerses.length > 0 && activeHighlightColor.code !== '#ffffff' ? '#333' : (theme === 'dark' ? '#ccc' : '#aaa'), 
                    border: selectedVerses.length > 0 ? `2px solid ${activeHighlightColor.border}` : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), 
                    fontWeight: 'bold', padding: '5px 10px', fontSize: '0.85rem' 
                }}
            >
                Highlight
            </button>
            
            {/* ✅ MERGED NOTE BUTTON (UPDATED HINT) */}
            <button 
                onMouseEnter={() => setHintText(showNotes ? "💡 Switch to Reading Mode (Hide Notes)." : "💡 Switch to Study Mode. (Tip: Long Press a verse to note instantly!)")}
                onMouseLeave={() => setHintText("")}
                onClick={handleNoteButtonClick} 
                className="nav-btn" 
                style={{ 
                    backgroundColor: showNotes ? NOTE_BUTTON_COLOR : (theme === 'dark' ? '#333' : '#f5f5f5'), 
                    color: showNotes ? 'white' : (theme === 'dark' ? '#ccc' : '#aaa'), 
                    border: showNotes ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), 
                    padding: '5px 10px', fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                }}
            >
                Notes
            </button>

            <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
            <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '5px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s ease', marginLeft: '5px', backgroundColor: isChapterRead ? (theme === 'dark' ? '#0f2f21' : '#e6fffa') : (theme === 'dark' ? '#333' : '#f0f0f0'), border: isChapterRead ? '1px solid #38b2ac' : (theme === 'dark' ? '1px solid #444' : '1px solid #ccc'), color: isChapterRead ? '#276749' : (theme === 'dark' ? '#fff' : '#333'), boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <input type="checkbox" checked={isChapterRead} onChange={toggleChapterRead} style={{ width: '16px', height: '16px', accentColor: '#276749', cursor: 'pointer', backgroundColor: 'white' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Track Read for Daily Bible Plan</span>
            </label>
        </div>
        {/* 💡 HINT DISPLAY */}
        {hintText && (
            <p style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem', color: theme === 'dark' ? '#888' : '#666', marginTop: '10px', fontStyle: 'italic', marginBottom: 0, animation: 'fadeIn 0.3s ease' }}>
                {hintText}
            </p>
        )}
    </div>
  );
  const MemoizedTracker = useMemo(() => { if (topNavMode === 'OT' || topNavMode === 'NT') return <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} sectionFilter={topNavMode} />; return null; }, [user, readChapters, handleTrackerNavigation, topNavMode]);

  return (
    <div 
        id="bible-reader-top" 
        className="container" 
        style={{ maxWidth: '100%', padding: '0', boxShadow: 'none', '--verse-font-size': `${fontSize}rem` }}
        // 🌍 GLOBAL TOUCH LISTENERS FOR PAGE SWIPE
        onTouchStart={onGlobalTouchStart}
        onTouchMove={onGlobalTouchMove}
        onTouchEnd={onGlobalTouchEnd}
    >
      <style>{`
        .verse-box { padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: transform 0.1s linear, background-color 0.2s ease; user-select: none; position: relative; touch-action: pan-y; }
        .verse-text { font-size: var(--verse-font-size); line-height: 1.6; transition: font-size 0.2s ease; }
        
        .verse-box.light { background-color: #fff; color: #333; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .verse-box.light:hover { background-color: #f8f9fa; box-shadow: 0 4px 8px rgba(0,0,0,0.1); } 
        /* Touch feedback active state */
        .verse-box.light:active { background-color: #e3f2fd; transform: scale(0.995); }
        .verse-box.light.selected { background-color: #e3f2fd; border: 1px solid #2196F3; }

        .verse-box.dark { background-color: #000; color: #ccc; border: 1px solid #333; }
        .verse-box.dark:hover { background-color: #333; } 
        /* Touch feedback active state */
        .verse-box.dark:active { background-color: #1e3a5f; transform: scale(0.995); }
        .verse-box.dark.selected { background-color: #1e3a5f; border: 1px solid #4a90e2; }

        .nav-btn { background-color: ${theme === 'dark' ? '#333' : '#f0f0f0'}; color: ${theme === 'dark' ? '#fff' : '#333'}; border: ${theme === 'dark' ? '1px solid #444' : '1px solid #ccc'}; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; font-weight: bold; }
        .nav-btn:hover { opacity: 0.9; }
        .nav-toggle-btn { padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%; border: 1px solid #eee; background-color: #fff; color: #555; transition: all 0.2s ease; }
        .nav-toggle-btn.active { background-color: #e3f2fd; color: #1976d2; border: 1px solid #2196F3; }
        .inline-editor-container { animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; transform-origin: top; overflow: hidden; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px) scaleY(0.95); max-height: 0; } to { opacity: 1; transform: translateY(0) scaleY(1); max-height: 300px; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div style={{ marginBottom: '20px', padding: '0 20px' }}>
        <div style={{ marginBottom: '15px' }}>
            {topNavMode === null && <button onClick={() => setTopNavMode('MENU')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', backgroundColor: theme === 'dark' ? '#111' : 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', color: theme === 'dark' ? '#ccc' : '#555', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>📖 Browse Bible Books</button>}
            {topNavMode !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => setTopNavMode(topNavMode === 'OT' ? 'MENU' : 'OT')} className={`nav-toggle-btn ${topNavMode === 'OT' ? 'active' : ''}`} style={{ flex: '1 1 140px', backgroundColor: topNavMode === 'OT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : '#fff'), color: topNavMode === 'OT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555') }}>{topNavMode === 'OT' ? 'Close Old Testament' : 'Old Testament'}</button>
                        <button onClick={() => setTopNavMode(topNavMode === 'NT' ? 'MENU' : 'NT')} className={`nav-toggle-btn ${topNavMode === 'NT' ? 'active' : ''}`} style={{ flex: '1 1 140px', backgroundColor: topNavMode === 'NT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : '#fff'), color: topNavMode === 'NT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555') }}>{topNavMode === 'NT' ? 'Close New Testament' : 'New Testament'}</button>
                    </div>
                    <button onClick={() => setTopNavMode(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'center', textDecoration: 'underline' }}>Collapse Menu</button>
                </div>
            )}
        </div>
        
        {/* 🎧 AUDIO PLAYER + SLEEP TIMER (TOGGLEABLE) */}
        {showAudio && (
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: theme === 'dark' ? '#222' : '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <audio 
                        ref={audioRef} 
                        controls 
                        style={{ flex: 1, height: '40px' }}
                        onError={() => setAudioError(true)}
                    >
                        <source src={`${AUDIO_BASE_PATH}${book}_${chapter}.mp3`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                    <button 
                        onClick={toggleSleepTimer}
                        style={{
                            marginLeft: '10px',
                            background: sleepMinutes ? '#e3f2fd' : 'transparent',
                            color: sleepMinutes ? '#2196F3' : (theme === 'dark' ? '#ccc' : '#555'),
                            border: `1px solid ${sleepMinutes ? '#2196F3' : '#ccc'}`,
                            borderRadius: '20px',
                            padding: '5px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            minWidth: '80px'
                        }}
                    >
                        {sleepMinutes ? `🌙 ${formatTimeLeft(sleepTimeLeft)}` : "🌙 Off"}
                    </button>
                </div>
                {audioError && <span style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>Audio coming soon...</span>}
            </div>
        )}

        {/* 🔙 RETURN BUTTON */}
        {historyStack && historyStack.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <button 
                    onClick={onGoBack}
                    style={{
                        backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e3f2fd',
                        color: theme === 'dark' ? '#90caf9' : '#1976d2',
                        border: theme === 'dark' ? '1px solid #333' : '1px solid #bbdefb',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        margin: '0 auto',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                >
                    <span>↩</span> 
                    Return to {historyStack[historyStack.length - 1].book} {historyStack[historyStack.length - 1].chapter}
                </button>
            </div>
        )}

        {MemoizedTracker && ( <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}> {MemoizedTracker} </div> )}
        {renderControlBar()}
      </div>

      <div id="answerDisplay" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        {verses.length === 0 && loading ? <p style={{ textAlign: 'center' }}>Loading the Word...</p> : verses.map((v, index) => {
                const verseKey = `${book} ${chapter}:${v.verse}`;
                const highlightData = highlightsMap[verseKey];
                const isHighlighted = !!highlightData;
                const isSelected = selectedVerses.includes(v.verse);
                const themeClass = theme === 'dark' ? 'dark' : 'light';
                const selectedClass = isSelected ? 'selected' : '';
                
                // 🎨 DYNAMIC HIGHLIGHT STYLE (BG + BORDER LEFT)
                const highlightStyle = isHighlighted ? { 
                    backgroundColor: highlightData.bg === '#ffffff' ? 'transparent' : highlightData.bg, 
                    color: '#333',
                    borderLeft: `4px solid ${highlightData.border}` 
                } : {};
                
                // ⚡ CALCULATE PEEK HIGHLIGHT
                // Find the note currently being hovered/peeked
                const activePeekNote = hoveredNoteId ? userNotes.find(n => n.id === hoveredNoteId) : null;
                // Check if THIS verse is part of that note
                const isPeeked = activePeekNote && activePeekNote.verses && activePeekNote.verses.includes(v.verse);

                // Modify highlightStyle if peeked
                if (isPeeked) {
                    // Override background with note color to "pop"
                    highlightStyle.backgroundColor = activePeekNote.color === '#ffffff' ? '#e3f2fd' : activePeekNote.color;
                    // Add a border to make it distinct
                    highlightStyle.outline = `2px solid ${activePeekNote.color === '#ffffff' ? '#2196F3' : '#333'}`;
                    highlightStyle.zIndex = 10; // Ensure it sits on top
                }
                
                // ✅ If Selected AND Highlighted -> Dim it + Add Blue Outline (Combined State)
                if (isSelected && isHighlighted && !isPeeked) {
                     // For White highlights, use Light Blue bg so selection is visible
                     if (highlightData.bg === '#ffffff') {
                         highlightStyle.backgroundColor = '#e3f2fd'; 
                         highlightStyle.outline = '2px solid #2196F3';
                     } else {
                         // For colored highlights, use brightness filter
                         highlightStyle.filter = 'brightness(0.85) sepia(0.2)'; 
                         highlightStyle.outline = '2px solid #2196F3';
                     }
                     highlightStyle.zIndex = 1;
                }

                // ✅ SAFELY GET ATTACHED NOTES (Fixing the crash)
                const attachedNotes = showNotes ? userNotes.filter(n => {
                    return n.verses && Array.isArray(n.verses) && n.verses.length > 0 && n.verses[n.verses.length - 1] === v.verse;
                }) : [];
                
                // ✅ GET PEEK NOTES (Shows only on LAST verse)
                const peekNotes = userNotes.filter(n => n.verses && Array.isArray(n.verses) && n.verses.length > 0 && n.verses[n.verses.length - 1] === v.verse);
                const hasPeekNotes = peekNotes.length > 0;

                const isEditingHere = isNoteMode && editingNoteId && attachedNotes.some(n => n.id === editingNoteId);
                const isCreatingHere = isNoteMode && !editingNoteId && selectedVerses.length > 0 && selectedVerses[selectedVerses.length - 1] === v.verse;
                const showEditor = isEditingHere || isCreatingHere;

                // --- 📝 INTERNAL NOTE CARD RENDER LOGIC (Inline) ---
                const renderNote = (note) => {
                    const settings = noteSettings[note.id] || { showDate: false, showTime: false, showShareMenu: false };
                    
                    const getFormattedTimestamp = () => {
                        if (!note.timestamp) return "";
                        const dateObj = note.timestamp.toDate ? note.timestamp.toDate() : new Date(note.timestamp);
                        let str = "";
                        // TIME THEN DATE
                        if (settings.showTime) str += dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " ";
                        if (settings.showDate) str += dateObj.toLocaleDateString();
                        return str.trim();
                    };
                    const timestampStr = getFormattedTimestamp();
                    
                    // ✅ VERSE RANGE LABEL (Replacing "Copy Verse & Note" button)
                    let verseRef = "";
                    if (note.verses && note.verses.length > 0) {
                        const first = note.verses[0];
                        const last = note.verses[note.verses.length - 1];
                        // 🛠️ UPDATED: Uses Book Name + Chapter + Verse Range (Standard Format)
                        verseRef = (first === last) ? `${book} ${chapter}:${first}` : `${book} ${chapter}:${first}-${last}`;
                    }

                    const noteBorderColor = note.color || DEFAULT_NOTE_COLOR;

                    return (
                        <div key={note.id} style={{ 
                            marginLeft: '30px', marginRight: '10px', marginBottom: '15px', 
                            backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e3f2fd', 
                            borderLeft: `4px solid ${noteBorderColor}`, 
                            padding: '12px', borderRadius: '8px', 
                            fontSize: '0.9rem', color: theme === 'dark' ? '#fff' : '#333', 
                            position: 'relative'
                        }}>
                            <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{note.text}</p>

                            {timestampStr && (
                                <p style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#aaa' : '#666', textAlign: 'right', marginTop: '5px', marginBottom: '0', fontStyle: 'italic' }}>
                                    {timestampStr}
                                </p>
                            )}

                            {/* FOOTER ACTIONS - WRAPPED FOR MOBILE */}
                            <div style={{ 
                                display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', 
                                borderTop: theme === 'dark' ? '1px solid #444' : '1px solid #d1e3f6', 
                                paddingTop: '8px' 
                            }}>
                                
                                {/* EDIT */}
                                <button onClick={() => startEditingNote(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: NOTE_BUTTON_COLOR, fontWeight: 'bold', fontSize: '0.75rem', padding: '4px 6px' }}>Edit</button>
                                
                                {/* COPY TEXT (New) */}
                                <button 
                                  onClick={() => handleCopyNote(note)} 
                                  style={{ background: 'none', border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'), borderRadius:'4px', cursor: 'pointer', color: theme === 'dark' ? '#ccc' : '#555', fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                  {noteFeedback[note.id] === 'text' ? '✓ Copied!' : 'Copy Text'}
                                </button>

                                {/* COPY SCRIPTURE (New request) */}
                                <button
                                    onClick={() => {
                                        handleCopyVerseText(note.verses);
                                        // Optional: add visual feedback here too if desired
                                        // triggerNoteFeedback(note.id, 'verse');
                                    }}
                                    style={{ background: 'none', border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'), borderRadius:'4px', cursor: 'pointer', color: theme === 'dark' ? '#ccc' : '#555', fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                    Copy Verse{note.verses.length > 1 ? 's' : ''}
                                </button>

                                {/* COPY REF (New - Replaces Static Text) */}
                                <button 
                                  onClick={() => { 
                                      navigator.clipboard.writeText(verseRef); 
                                      triggerNoteFeedback(note.id, 'ref'); 
                                  }}
                                  style={{ background: 'none', border: '1px solid ' + (theme === 'dark' ? '#555' : '#ccc'), borderRadius:'4px', cursor: 'pointer', color: theme === 'dark' ? '#ccc' : '#555', fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                  {noteFeedback[note.id] === 'ref' ? '✓ Copied!' : `Copy ${verseRef}`}
                                </button>

                                <div style={{ flex: 1 }}></div>

                                {/* COLOR DOTS */}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {COLOR_PALETTE.map(color => (
                                        <button 
                                            key={color.code}
                                            onClick={() => handleNoteColorChange(note, color.code)}
                                            style={{ 
                                                width: '14px', height: '14px', borderRadius: '50%', 
                                                backgroundColor: color.code, border: '1px solid rgba(0,0,0,0.2)',
                                                cursor: 'pointer', padding: 0
                                            }}
                                        />
                                    ))}
                                </div>
                                
                                {/* DELETE */}
                                <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '0.9rem', padding: '0 4px', marginLeft: '5px' }}>🗑️</button>
                            </div>
                        </div>
                    );
                };

                return (
                <div key={index} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div 
                        className={`verse-box ${themeClass} ${selectedClass}`} 
                        style={highlightStyle} 
                        // 🖱️ CLICK VS LONG PRESS LOGIC
                        onMouseDown={() => startLongPress(v.verse)}
                        onMouseUp={endLongPress}
                        onMouseLeave={endLongPress}
                        onTouchStart={() => startLongPress(v.verse)}
                        onTouchMove={endLongPress} // 🛑 CANCEL ON SCROLL
                        onTouchEnd={endLongPress}
                        onClick={() => toggleVerse(v.verse)}
                        onDoubleClick={() => handleVerseDoubleClick(v.verse)}
                    >
                        {/* 🛑 CHECKBOX VISIBILITY TOGGLE (Hidden in Reading Mode) */}
                        <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => {}} 
                            style={{ 
                                cursor: 'pointer', 
                                marginTop: '4px', 
                                display: showNotes ? 'inline-block' : 'none' 
                            }} 
                        />
                        <span style={{ fontWeight: 'bold', marginRight: '5px', fontSize: '0.8rem', color: isHighlighted ? '#444' : (theme === 'dark' ? '#888' : '#999'), position: 'relative' }}>
                            {v.verse}
                        </span>
                        <span className="verse-text">{v.text}</span>
                        
                        {/* ⚡ MULTI-NOTE PEEK INDICATORS (Bottom Right, Stacked Horizontally) */}
                        {!showNotes && hasPeekNotes && (
                            <div style={{ position: 'absolute', bottom: '5px', right: '5px', display: 'flex', gap: '4px' }}>
                                {peekNotes.map((pn, i) => {
                                    // Generate reference string e.g. "v. 2-5"
                                    const start = pn.verses[0];
                                    const end = pn.verses[pn.verses.length-1];
                                    // 🛠️ UPDATED: Uses Full Reference (e.g. Note on Genesis 1:1-2)
                                    const ref = start === end ? `${book} ${chapter}:${start}` : `${book} ${chapter}:${start}-${end}`;

                                    return (
                                    <span 
                                        key={pn.id}
                                        onMouseEnter={() => setHoveredNoteId(pn.id)}
                                        onMouseLeave={() => setHoveredNoteId(null)}
                                        onClick={(e) => { 
                                            // Toggle on click for mobile
                                            e.stopPropagation(); 
                                            setHoveredNoteId(hoveredNoteId === pn.id ? null : pn.id); 
                                        }}
                                        style={{ 
                                            fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', 
                                            color: pn.color === '#ffffff' ? '#999' : pn.color,
                                            background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', 
                                            padding: '2px 6px', borderRadius: '10px', 
                                            border: `1px solid ${pn.color === '#ffffff' ? '#ccc' : pn.color}`,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Note on {ref}
                                    </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ⚡ PEEKED NOTE DISPLAY (Shows specific hovered note) */}
                    {hoveredNoteId && peekNotes.some(n => n.id === hoveredNoteId) && (
                        <div 
                            onMouseEnter={() => setHoveredNoteId(hoveredNoteId)} // Keep open if mouse moves to note
                            onMouseLeave={() => setHoveredNoteId(null)}
                            style={{ 
                                marginLeft: '30px', marginRight: '10px', marginBottom: '15px', padding: '10px', 
                                backgroundColor: theme === 'dark' ? '#222' : '#f9f9f9', 
                                borderLeft: `4px solid ${peekNotes.find(n => n.id === hoveredNoteId)?.color || DEFAULT_NOTE_COLOR}`, 
                                borderRadius: '4px', fontSize: '0.85rem', color: theme === 'dark' ? '#ccc' : '#555', 
                                animation: 'fadeIn 0.2s ease', cursor: 'default'
                            }}
                        >
                            <p style={{ margin: 0 }}>{peekNotes.find(n => n.id === hoveredNoteId)?.text}</p>
                        </div>
                    )}

                    {showEditor && (
                        <div className="inline-editor-container" style={{ marginLeft: '30px', marginRight: '10px', marginBottom: '15px' }}>
                            <div style={{ backgroundColor: theme === 'dark' ? '#222' : '#f0f4f8', padding: '15px', borderRadius: '8px', border: `1px solid ${NOTE_BUTTON_COLOR}` }}>
                                {/* 📝 NEW: EDITOR HEADER (Shows "Note on Gen 1:1-5") */}
                                <div style={{ 
                                    fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', 
                                    color: theme === 'dark' ? '#aaa' : '#555',
                                    fontStyle: 'italic'
                                }}>
                                    Note on {book} {chapter}:{selectedVerses[0]}{selectedVerses.length > 1 ? '-' + selectedVerses[selectedVerses.length-1] : ''}
                                </div>

                                <textarea ref={editorRef} value={currentNoteText} onChange={(e) => setCurrentNoteText(e.target.value)} placeholder="Write your note..." style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit', marginBottom: '10px', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                                
                                {/* 📝 COPY/PASTE VERSE BUTTONS */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {/* 🛠️ UPDATED: SMART COPY BUTTON (Shows "Copy Gen 1:1-5") */}
                                        <button 
                                            onClick={() => handleCopyVerseText(selectedVerses)} 
                                            style={{ 
                                                padding: '5px 10px', 
                                                background: '#f5f5f5', 
                                                color: '#555', 
                                                border: '1px solid #ddd', 
                                                borderRadius: '15px', 
                                                fontSize: '0.75rem', 
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap' 
                                            }}
                                        >
                                            {copyFeedback === "Copied!" ? "Copied!" : `📋 Copy ${book} ${chapter}:${selectedVerses[0]}${selectedVerses.length > 1 ? '-' + selectedVerses[selectedVerses.length-1] : ''}`}
                                        </button>
                                        
                                        {/* ✅ NEW SYSTEM PASTE BUTTON */}
                                        <button 
                                            onClick={handleSystemPaste} 
                                            style={{ 
                                                padding: '5px 10px', 
                                                background: '#e3f2fd', 
                                                color: '#1976d2', 
                                                border: '1px solid #90caf9', 
                                                borderRadius: '15px', 
                                                fontSize: '0.75rem', 
                                                cursor: 'pointer' 
                                            }}
                                            title="Paste from Clipboard"
                                        >
                                            📋 Paste
                                        </button>

                                        {/* 🎨 EDITOR HIGHLIGHT PALETTE */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '5px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#555' }}>Highlight:</span>
                                            {COLOR_PALETTE.map(color => (
                                                <button 
                                                    key={color.code}
                                                    onClick={() => handleEditorHighlight(color.code)}
                                                    title={`Highlight Selection ${color.name}`}
                                                    style={{ 
                                                        width: '14px', height: '14px', borderRadius: '50%', 
                                                        backgroundColor: color.code, border: '1px solid #ccc',
                                                        cursor: 'pointer', padding: 0
                                                    }}
                                                />
                                            ))}
                                            {/* REMOVE BUTTON IN EDITOR PALETTE */}
                                            <button
                                                onClick={() => handleEditorHighlight(null)}
                                                title="Remove Highlight"
                                                style={{
                                                    width: '14px', height: '14px', borderRadius: '50%',
                                                    backgroundColor: 'transparent', border: '1px solid #ccc',
                                                    cursor: 'pointer', padding: 0, fontSize: '0.6rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#555'
                                                }}
                                            >
                                                🚫
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {/* 🔴 NEW DELETE/DISCARD BUTTON */}
                                        <button 
                                            onClick={handleEditorDelete}
                                            title={editingNoteId ? "Delete Note" : "Discard"}
                                            style={{ 
                                                padding: '6px 12px', 
                                                background: 'transparent', 
                                                border: '1px solid #e53e3e', 
                                                borderRadius: '4px', 
                                                cursor: 'pointer', 
                                                fontSize: '0.9rem', 
                                                color: '#e53e3e',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            🗑️
                                        </button>

                                        <button onClick={() => { setIsNoteMode(false); setEditingNoteId(null); setCurrentNoteText(""); }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#ccc' : '#555' }}>Cancel</button>
                                        <button onClick={saveNote} style={{ padding: '6px 12px', backgroundColor: NOTE_BUTTON_COLOR, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* NOTE CARDS RENDER */}
                    {showNotes && attachedNotes.length > 0 && attachedNotes.map(note => {
                        if (editingNoteId === note.id && isNoteMode) return null;
                        return renderNote(note);
                    })}
                </div>
                );
            })
        }
      </div>

      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '25px' }}> {renderControlBar()} </div>
        <div style={{ marginTop: '30px' }}>
          {user && (!hasShared || editingId) ? (
            <div id="reflection-input" style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #333' : '1px solid #eee' }}>
                <textarea placeholder={`What is the Spirit saying through ${book} ${chapter}?`} value={reflection} onChange={(e) => setReflection(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>{editingId ? "Update Reflection" : "Share with the Body"}</button>
                  {editingId && <button onClick={handleCancelEdit} className="secondary-btn" style={{backgroundColor: '#e53e3e', color: 'white', border: 'none'}}>Cancel</button>}
                  {!editingId && <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>}
                </div>
            </div>
          ) : (hasShared && !editingId) ? <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#0f2f21' : '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: theme === 'dark' ? '#81e6d9' : '#276749' }}><p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body for this chapter!</p></div> : null}
        </div>
        
        <section className="directory" style={{ marginTop: '40px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0px', color: theme === 'dark' ? '#fff' : '#333' }}>Reflections on {book} {chapter}</h2>
          <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.75rem', color: '#888', maxWidth: '90%', margin: '5px auto 25px auto', lineHeight: '1.4' }}>
            "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." <span style={{fontWeight:'bold'}}>— Gal 5:22-23</span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            {chapterReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : chapterReflections.map((post, i) => (
              <div key={post.id || i} style={{ position: 'relative' }}>
                  <MemberCard 
                      user={{ displayName: post.userName, photoURL: post.userPhoto }} 
                      thought={post.text} 
                      reactions={post.reactions}
                      location={post.location} 
                      onReact={(fruitId) => handleReaction(post.id, fruitId)}
                      onSearch={onSearch}
                      onProfileClick={() => onProfileClick && onProfileClick(post.userId)}
                      currentUserId={user ? user.uid : null}
                      isOwner={user && user.uid === post.userId}
                      onEdit={() => handleEditClick(post)}
                      onDelete={() => handleDeleteClick(post.id)}
                      onShare={() => handleShareItem(post.text)}
                  />
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid #eee', marginTop: '40px', paddingTop: '20px' }}>
             <div style={{ marginTop: '20px' }}><BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} /></div>
             {!user && <div id="login-section" style={{ textAlign: 'center', background: theme === 'dark' ? '#222' : '#f9f9f9', padding: '30px', borderRadius: '12px', marginTop: '40px' }}><h3 style={{ marginBottom: '10px', color: theme === 'dark' ? '#fff' : '#333' }}>Save Your Progress</h3><p style={{ color: '#666', marginBottom: '20px' }}>Join the Body to activate the tracker above and save your history permanently.</p><Login theme={theme} /></div>}
        </div>
      </div>
    </div>
  );
}

export default BibleReader;