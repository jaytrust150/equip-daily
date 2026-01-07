import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { bibleData } from './bibleData'; 
import BibleTracker from './BibleTracker'; 
import MemberCard from './MemberCard'; 
import Login from './Login'; 
import { auth, db } from "./firebase";
import confetti from 'canvas-confetti'; 
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  doc, 
  setDoc,
  deleteDoc, 
  updateDoc,
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  serverTimestamp,
  addDoc 
} from "firebase/firestore";

// 🎨 COLORS
const HIGHLIGHT_COLOR = '#ffeb3b'; 
const NOTE_BUTTON_COLOR = '#2196F3'; // Material Blue

function BibleReader({ theme }) {
  const [user] = useAuthState(auth);
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [version, setVersion] = useState('web');
  const [verses, setVerses] = useState([]);
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [readChapters, setReadChapters] = useState([]); 
  const [isChapterRead, setIsChapterRead] = useState(false);
  const [copyBtnText, setCopyBtnText] = useState("Copy"); 
  
  const [highlights, setHighlights] = useState([]);
  
  // 📝 NOTE STATE
  const [userNotes, setUserNotes] = useState([]); 
  const [showNotes, setShowNotes] = useState(true); // Toggle View
  // Editor State (Inline)
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null); 
  const editorRef = useRef(null); 

  // NAV STATE
  const [topNavMode, setTopNavMode] = useState(null);
  const [fontSize, setFontSize] = useState(1.1); 
  
  // REFLECTION STATE
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [chapterReflections, setChapterReflections] = useState([]);
  const [editingId, setEditingId] = useState(null); 

  // --- 1. Fetch User Progress & Highlights ---
  useEffect(() => {
    if (!user) {
        setReadChapters([]); 
        setHighlights([]); 
        return;
    }
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReadChapters(data.readChapters || []);
        
        const rawHighlights = data.highlights || [];
        // Safety check to ensure we only split strings
        const cleanHighlights = rawHighlights
            .filter(h => typeof h === 'string')
            .map(h => h.split('|')[0]);
        setHighlights(cleanHighlights); 
      }
    });
    return () => unsubscribe();
  }, [user]);

  // --- 2. Fetch Reflections ---
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

  // --- 📝 3. FETCH USER NOTES ---
  useEffect(() => {
    if (!user) { setUserNotes([]); return; }
    
    const q = query(
        collection(db, "notes"), 
        where("userId", "==", user.uid),
        where("book", "==", book),
        where("chapter", "==", parseInt(chapter))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = [];
        snapshot.forEach(doc => fetchedNotes.push({ id: doc.id, ...doc.data() }));
        setUserNotes(fetchedNotes);
    });
    return () => unsubscribe();
  }, [book, chapter, user]);

  useEffect(() => {
    const chapterKey = `${book} ${chapter}`;
    setIsChapterRead(readChapters.includes(chapterKey));
  }, [book, chapter, readChapters]);

  // --- TRACKING ---
  const toggleChapterRead = useCallback(async (e) => {
    if (!user) { 
        if(e && e.preventDefault) e.preventDefault(); 
        alert("Please log in to track your progress."); 
        document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
        return; 
    }
    const isNowChecked = (e && e.target && e.target.type === 'checkbox') ? e.target.checked : !isChapterRead;
    if (isNowChecked) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#276749', '#38b2ac', '#ffffff', '#FFD700'] });
    }
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
  }, [book, chapter, user, toggleChapterRead]);

  // --- 🖍 HIGHLIGHT ---
  const handleHighlightButton = async () => {
    if (!user) { alert("Please log in to highlight."); return; }
    if (selectedVerses.length === 0) { 
        alert("Select verses to highlight first!\n\n💡 Tip: You can also double-click any verse to highlight it instantly."); 
        return; 
    }
    const userRef = doc(db, "users", user.uid);
    const selectedKeys = selectedVerses.map(v => `${book} ${chapter}:${v}`);
    const allSelectedAreHighlighted = selectedKeys.every(k => highlights.includes(k));
    try {
        if (allSelectedAreHighlighted) await updateDoc(userRef, { highlights: arrayRemove(...selectedKeys) });
        else await updateDoc(userRef, { highlights: arrayUnion(...selectedKeys) });
        setSelectedVerses([]); 
    } catch (e) { console.error("Error highlights:", e); }
  };

  const handleVerseDoubleClick = async (verseNum) => {
      if (!user) return;
      const verseKey = `${book} ${chapter}:${verseNum}`;
      const isCurrentlyHighlighted = highlights.includes(verseKey);
      const userRef = doc(db, "users", user.uid);
      try {
          if (isCurrentlyHighlighted) await updateDoc(userRef, { highlights: arrayRemove(verseKey) });
          else await updateDoc(userRef, { highlights: arrayUnion(verseKey) });
          setSelectedVerses(prev => prev.filter(v => v !== verseNum));
      } catch (e) { console.error("Highlight toggle error:", e); }
  };

  // --- 📝 NOTE ACTIONS ---
  const handleNoteButtonClick = () => {
      if (!user) { alert("Please log in to add notes."); return; }
      if (selectedVerses.length === 0) { alert("Select verses to attach a note to!"); return; }
      
      setCurrentNoteText("");
      setEditingNoteId(null);
      setIsNoteMode(true);
      
      setTimeout(() => {
          if (editorRef.current) {
              editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              editorRef.current.focus();
          }
      }, 100);
  };

  const cancelNote = () => {
      setIsNoteMode(false);
      setEditingNoteId(null);
      setCurrentNoteText("");
  };

  const saveNote = async () => {
      if (!currentNoteText.trim()) return;
      try {
          if (editingNoteId) {
              const noteRef = doc(db, "notes", editingNoteId);
              await updateDoc(noteRef, { text: currentNoteText, timestamp: serverTimestamp() });
          } else {
              await addDoc(collection(db, "notes"), {
                  userId: user.uid, book: book, chapter: parseInt(chapter),
                  verses: selectedVerses.sort((a,b) => a-b),
                  text: currentNoteText, timestamp: serverTimestamp(), color: 'blue' 
              });
          }
          setIsNoteMode(false);
          setEditingNoteId(null);
          setSelectedVerses([]); 
      } catch (e) { console.error("Error saving note:", e); }
  };

  const deleteNote = async (noteId) => {
      if (window.confirm("Are you sure you want to delete this note?")) {
          try { await deleteDoc(doc(db, "notes", noteId)); } 
          catch (e) { console.error("Error deleting note:", e); }
      }
  };

  const startEditingNote = (note) => {
      setCurrentNoteText(note.text);
      setEditingNoteId(note.id);
      setIsNoteMode(true);
  };

  // --- 🔗 SHARE LOGIC (UPDATED) ---
  const handleShareItem = async (text) => {
      // General share for reflections
      const shareData = { title: 'Equip Daily', text: text, url: window.location.href };
      if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } 
      else { try { await navigator.clipboard.writeText(text); alert("Text copied to clipboard!"); } catch (err) {} }
  };

  // 🚀 NEW: Smart Note Sharing (Includes Verses)
  const handleShareNote = async (note) => {
      // 1. Reconstruct Verse Text
      const noteVerseText = note.verses.map(vNum => {
          const vObj = verses.find(v => v.verse === vNum);
          return vObj ? vObj.text : "";
      }).join(' ');
      
      // 2. Format Citation (e.g., Genesis 1:1-2)
      const citation = `${book} ${chapter}:${note.verses[0]}${note.verses.length > 1 ? '-' + note.verses[note.verses.length-1] : ''} (${version.toUpperCase()})`;
      
      // 3. Build Message
      const fullShareText = `"${noteVerseText}" ${citation}\n\nMy Note: ${note.text}`;
      
      // 4. Share
      const shareData = { title: 'Equip Daily Note', text: fullShareText, url: window.location.href };
      
      if (navigator.share) { 
          try { await navigator.share(shareData); } catch (err) {} 
      } else { 
          try { await navigator.clipboard.writeText(fullShareText); alert("Note & Verses copied to clipboard!"); } catch (err) {} 
      }
  };

  // --- REFLECTION ACTIONS ---
  const saveReflection = async () => {
    if (!reflection.trim() || !user) return;
    const chapterKey = `${book} ${chapter}`;
    try {
      if (editingId) {
        await updateDoc(doc(db, "reflections", editingId), { text: reflection, timestamp: serverTimestamp(), isEdited: true });
        setEditingId(null); setReflection("");
      } else {
        await setDoc(doc(db, "reflections", `${user.uid}_${chapterKey}`), {
            userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
            text: reflection, chapter: chapterKey, timestamp: serverTimestamp(), location: "Sebastian" 
        });
      }
    } catch (e) { console.error("Error saving reflection:", e); }
  };
  const handleEditClick = (post) => { setEditingId(post.id); setReflection(post.text); document.getElementById('reflection-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const handleCancelEdit = () => { setEditingId(null); setReflection(""); };
  const handleDeleteClick = async (id) => { if (window.confirm("Delete reflection?")) { try { await deleteDoc(doc(db, "reflections", id)); if (editingId === id) handleCancelEdit(); } catch (e) { console.error(e); } } };

  // --- DATA FETCHING ---
  useEffect(() => {
    setLoading(true);
    const singleChapterConfig = { "Obadiah": 21, "Philemon": 25, "2 John": 13, "3 John": 14, "Jude": 25 };
    let q = singleChapterConfig[book] ? `${book} 1:1-${singleChapterConfig[book]}` : `${book}+${chapter}`;
    fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=${version}`)
      .then(res => res.json()).then(data => { setVerses(data.verses || []); setSelectedVerses([]); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [book, chapter, version]);

  const toggleVerse = (verseNum) => {
    if (selectedVerses.includes(verseNum)) setSelectedVerses(selectedVerses.filter(v => v !== verseNum));
    else setSelectedVerses([...selectedVerses, verseNum].sort((a, b) => a - b)); 
  };
  const formatCitation = () => {
    const textBlock = selectedVerses.map(num => { const v = verses.find(v => v.verse === num); return v ? v.text.trim() : ""; }).join(' ');
    return `"${textBlock}" (${book} ${chapter} ${version.toUpperCase()})`;
  };
  const handleShare = async () => {
    let shareData = { title: 'Equip Daily', text: `Reading ${book} ${chapter}`, url: window.location.href };
    if (selectedVerses.length > 0) shareData.text = formatCitation();
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } else { alert("Use Copy!"); }
  };
  const handleCopy = async () => {
    if (selectedVerses.length === 0) { alert("Select verses first!"); return; }
    try { await navigator.clipboard.writeText(formatCitation()); setCopyBtnText("Copied!"); setTimeout(() => setCopyBtnText("Copy"), 2000); } catch (err) {}
  };
  const increaseFont = () => setFontSize(prev => Math.min(prev + 0.1, 2.0));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));
  const handleNext = () => {
    const idx = bibleData.findIndex(b => b.name === book);
    if (parseInt(chapter) < bibleData[idx].chapters) setChapter(parseInt(chapter) + 1); 
    else if (idx < bibleData.length - 1) { setBook(bibleData[idx + 1].name); setChapter(1); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handlePrev = () => {
    if (parseInt(chapter) > 1) setChapter(parseInt(chapter) - 1); 
    else { const idx = bibleData.findIndex(b => b.name === book); if (idx > 0) { setBook(bibleData[idx - 1].name); setChapter(bibleData[idx - 1].chapters); } }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const getChapterCount = () => { const b = bibleData.find(d => d.name === book); return b ? b.chapters : 50; };

  // --- UI Components ---
  const compactSelectStyle = { border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.75rem', color: theme === 'dark' ? '#aaa' : '#2c3e50', cursor: 'pointer', appearance: 'none', outline: 'none', fontFamily: 'inherit', maxWidth: '70px' };

  const ControlBar = () => (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 0', minHeight: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }} style={compactSelectStyle}>{bibleData && bibleData.map(b => <option key={b.name} value={b.name} style={{color: '#333'}}>{b.name}</option>)}</select>
            <span style={{ fontSize: '0.75rem', color: '#555' }}>|</span>
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ ...compactSelectStyle, width: 'auto' }}>{[...Array(getChapterCount())].map((_, i) => <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>)}</select>
            <select value={version} onChange={(e) => setVersion(e.target.value)} style={{ fontSize: '0.65rem', color: theme === 'dark' ? '#888' : '#999', marginLeft: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }}><option value="web" style={{color: '#333'}}>WEB</option><option value="kjv" style={{color: '#333'}}>KJV</option><option value="asv" style={{color: '#333'}}>ASV</option><option value="bbe" style={{color: '#333'}}>BBE</option></select>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={handleShare} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Share</button>
            <button onClick={handlePrev} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>← Prev</button>
            <button onClick={handleNext} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Next →</button>
            
            <button onClick={handleCopy} className="nav-btn" style={{ backgroundColor: selectedVerses.length > 0 ? '#ff9900' : (theme === 'dark' ? '#333' : '#f5f5f5'), color: selectedVerses.length > 0 ? 'white' : (theme === 'dark' ? '#ccc' : '#aaa'), border: selectedVerses.length > 0 ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), padding: '5px 10px', fontSize: '0.85rem' }}>{copyBtnText}</button>
            
            <button onClick={handleHighlightButton} className="nav-btn" style={{ backgroundColor: selectedVerses.length > 0 ? HIGHLIGHT_COLOR : (theme === 'dark' ? '#333' : '#f5f5f5'), color: selectedVerses.length > 0 ? 'white' : (theme === 'dark' ? '#ccc' : '#aaa'), border: selectedVerses.length > 0 ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), textShadow: selectedVerses.length > 0 ? '0px 1px 2px rgba(0,0,0,0.3)' : 'none', padding: '5px 10px', fontSize: '0.85rem' }}>Highlight</button>
            
            <button onClick={handleNoteButtonClick} className="nav-btn" style={{ backgroundColor: selectedVerses.length > 0 ? NOTE_BUTTON_COLOR : (theme === 'dark' ? '#333' : '#f5f5f5'), color: selectedVerses.length > 0 ? 'white' : (theme === 'dark' ? '#ccc' : '#aaa'), border: selectedVerses.length > 0 ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), padding: '5px 10px', fontSize: '0.85rem' }}>Note</button>
            
            {/* 👁️ TOGGLE VISIBILITY BUTTON */}
            {userNotes.length > 0 && (
                <button 
                    onClick={() => setShowNotes(!showNotes)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginLeft: '5px', color: theme === 'dark' ? '#888' : '#555' }} 
                    title={showNotes ? "Hide Notes" : "Show Notes"}
                >
                    {showNotes ? "👁️" : "🙈"}
                </button>
            )}

            <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
            <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '5px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s ease', marginLeft: '5px', backgroundColor: isChapterRead ? (theme === 'dark' ? '#0f2f21' : '#e6fffa') : (theme === 'dark' ? '#333' : '#f0f0f0'), border: isChapterRead ? '1px solid #38b2ac' : (theme === 'dark' ? '1px solid #444' : '1px solid #ccc'), color: isChapterRead ? '#276749' : (theme === 'dark' ? '#fff' : '#333'), boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <input type="checkbox" checked={isChapterRead} onChange={toggleChapterRead} style={{ width: '16px', height: '16px', accentColor: '#276749', cursor: 'pointer', backgroundColor: 'white' }} />
                <span style={{ whiteSpace: 'nowrap' }}>Track Read for Daily Bible Plan</span>
            </label>
        </div>
    </div>
  );

  const MemoizedTracker = useMemo(() => {
      if (topNavMode === 'OT' || topNavMode === 'NT') return <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} sectionFilter={topNavMode} />;
      return null;
  }, [user, readChapters, handleTrackerNavigation, topNavMode]);

  return (
    <div id="bible-reader-top" className="container" style={{ maxWidth: '100%', padding: '0', boxShadow: 'none', '--verse-font-size': `${fontSize}rem` }}>
      <style>{`
        /* 🫧 BUBBLE LAYOUT */
        .verse-box { padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: all 0.2s ease; user-select: none; position: relative; }
        .verse-text { font-size: var(--verse-font-size); line-height: 1.6; transition: font-size 0.2s ease; }
        .verse-box.light { background-color: #fff; color: #333; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .verse-box.light:hover { background-color: #f8f9fa; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-1px); } 
        .verse-box.light.selected { background-color: #e3f2fd; border: 1px solid #2196F3; }
        .verse-box.dark { background-color: #000; color: #ccc; border: 1px solid #333; }
        .verse-box.dark:hover { background-color: #333; } 
        .verse-box.dark.selected { background-color: #1e3a5f; border: 1px solid #4a90e2; }
        
        .nav-btn { background-color: ${theme === 'dark' ? '#333' : '#f0f0f0'}; color: ${theme === 'dark' ? '#fff' : '#333'}; border: ${theme === 'dark' ? '1px solid #444' : '1px solid #ccc'}; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; font-weight: bold; }
        .nav-btn:hover { opacity: 0.9; }
        .nav-toggle-btn { padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%; border: 1px solid #eee; background-color: #fff; color: #555; transition: all 0.2s ease; }
        .nav-toggle-btn.active { background-color: #e3f2fd; color: #1976d2; border: 1px solid #2196F3; }
        
        .inline-editor-container { animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; transform-origin: top; overflow: hidden; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px) scaleY(0.95); max-height: 0; } to { opacity: 1; transform: translateY(0) scaleY(1); max-height: 300px; } }
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
        
        {MemoizedTracker && ( <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}> {MemoizedTracker} </div> )}
        <ControlBar />
      </div>

      <div id="answerDisplay" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        {verses.length === 0 && loading ? <p style={{ textAlign: 'center' }}>Loading the Word...</p> : verses.map((v, index) => {
                const verseKey = `${book} ${chapter}:${v.verse}`;
                const isHighlighted = highlights.includes(verseKey);
                const isSelected = selectedVerses.includes(v.verse);
                const themeClass = theme === 'dark' ? 'dark' : 'light';
                const selectedClass = isSelected ? 'selected' : '';
                const highlightStyle = isHighlighted ? { backgroundColor: HIGHLIGHT_COLOR, border: `1px solid #fdd835`, color: '#333' } : {};
                
                // 🛡️ SAFETY SHIELD + FILTER NOTES
                const attachedNotes = showNotes ? userNotes.filter(n => {
                    if (!n.verses || !Array.isArray(n.verses) || n.verses.length === 0) return false;
                    const lastVerse = n.verses[n.verses.length - 1]; 
                    return lastVerse === v.verse;
                }) : [];

                const isEditingHere = isNoteMode && editingNoteId && attachedNotes.some(n => n.id === editingNoteId);
                const isCreatingHere = isNoteMode && !editingNoteId && selectedVerses.length > 0 && selectedVerses[selectedVerses.length - 1] === v.verse;
                const showEditor = isEditingHere || isCreatingHere;

                return (
                <div key={index}>
                    <div 
                        className={`verse-box ${themeClass} ${selectedClass}`} 
                        style={highlightStyle}
                        onClick={() => toggleVerse(v.verse)}
                        onDoubleClick={() => handleVerseDoubleClick(v.verse)} 
                    >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: 'pointer', marginTop: '4px' }} />
                        <span style={{ fontWeight: 'bold', marginRight: '5px', fontSize: '0.8rem', color: isHighlighted ? '#444' : (theme === 'dark' ? '#888' : '#999') }}>{v.verse}</span>
                        <span className="verse-text">{v.text}</span>
                    </div>

                    {showEditor && (
                        <div className="inline-editor-container" style={{ marginLeft: '30px', marginRight: '10px', marginBottom: '15px' }}>
                            <div style={{ backgroundColor: theme === 'dark' ? '#222' : '#f0f4f8', padding: '15px', borderRadius: '8px', border: `1px solid ${NOTE_BUTTON_COLOR}` }}>
                                <textarea 
                                    ref={editorRef}
                                    value={currentNoteText} 
                                    onChange={(e) => setCurrentNoteText(e.target.value)} 
                                    placeholder="Write your note..." 
                                    style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit', marginBottom: '10px', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => { setIsNoteMode(false); setEditingNoteId(null); setCurrentNoteText(""); }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#ccc' : '#555' }}>Cancel</button>
                                    <button onClick={saveNote} style={{ padding: '6px 12px', backgroundColor: NOTE_BUTTON_COLOR, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showNotes && attachedNotes.length > 0 && attachedNotes.map(note => {
                        if (editingNoteId === note.id && isNoteMode) return null;
                        return (
                            <div key={note.id} style={{ marginLeft: '30px', marginRight: '10px', marginBottom: '15px', backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e3f2fd', borderLeft: `4px solid ${NOTE_BUTTON_COLOR}`, padding: '10px 15px', borderRadius: '4px', fontSize: '0.9rem', color: theme === 'dark' ? '#fff' : '#333', position: 'relative' }}>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{note.text}</p>
                                {/* 🔗 NOTES TOOLBAR (SHARE) */}
                                <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                                    <button onClick={() => startEditingNote(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: NOTE_BUTTON_COLOR, fontWeight: 'bold', padding: 0 }}>Edit</button>
                                    <span style={{color: '#ccc'}}>|</span>
                                    <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold', padding: 0 }}>Delete</button>
                                    <span style={{color: '#ccc'}}>|</span>
                                    {/* 🚀 CALLING NEW SHARE FUNCTION */}
                                    <button onClick={() => handleShareNote(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#ccc' : '#555', fontWeight: 'bold', padding: 0 }}>Share</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                );
            })
        }
      </div>

      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '25px' }}> <ControlBar /> </div>
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
          <h2 style={{ textAlign: 'center', color: theme === 'dark' ? '#fff' : '#333' }}>Reflections on {book} {chapter}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            {chapterReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : chapterReflections.map((post, i) => (
              <div key={post.id || i} style={{ position: 'relative' }}>
                  <MemberCard user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} />
                  {user && user.uid === post.userId && <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleEditClick(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#888' : '#666', textDecoration: 'underline' }}>Edit</button>
                      <span style={{color: '#ccc'}}>|</span>
                      <button onClick={() => handleDeleteClick(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#e53e3e', textDecoration: 'underline' }}>Delete</button>
                      <span style={{color: '#ccc'}}>|</span>
                      <button onClick={() => handleShareItem(post.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#888' : '#666', textDecoration: 'underline' }}>Share</button>
                  </div>}
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