import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { bibleData } from './bibleData'; 
import BibleTracker from './BibleTracker'; 
import MemberCard from './MemberCard'; 
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  doc, 
  setDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";

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
  
  // ⚡ NAV STATE: null = Closed, 'MENU' = Show Buttons, 'OT'/'NT' = Show List
  const [topNavMode, setTopNavMode] = useState(null);
  
  const [fontSize, setFontSize] = useState(1.1); 
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [chapterReflections, setChapterReflections] = useState([]);

  // --- 1. Fetch User Progress ---
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setReadChapters(docSnap.data().readChapters || []);
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
      querySnapshot.forEach((doc) => fetched.push(doc.data()));
      setChapterReflections(fetched || []);
      
      if (user) {
        const myPost = fetched.find(r => r.userId === user.uid);
        if (myPost) {
          setHasShared(true);
          setReflection(myPost.text);
        } else {
          setHasShared(false);
          setReflection("");
        }
      }
    });
    return () => unsubscribe();
  }, [book, chapter, user]);

  useEffect(() => {
    const chapterKey = `${book} ${chapter}`;
    setIsChapterRead(readChapters.includes(chapterKey));
  }, [book, chapter, readChapters]);

  // --- Saving Logic ---
  const toggleChapterRead = async (e) => {
    if (!user) { alert("Please log in to track progress!"); return; }
    
    const chapterKey = `${book} ${chapter}`;
    const isNowChecked = e.target.checked;
    const userRef = doc(db, "users", user.uid);

    setIsChapterRead(isNowChecked);
    setReadChapters(prev => 
      isNowChecked ? [...prev, chapterKey] : prev.filter(k => k !== chapterKey)
    );

    try {
      await setDoc(userRef, {
        readChapters: isNowChecked ? arrayUnion(chapterKey) : arrayRemove(chapterKey)
      }, { merge: true });
    } catch (err) {
      console.error("Error saving progress:", err);
      setIsChapterRead(!isNowChecked);
    }
  };

  const saveReflection = async () => {
    if (!reflection.trim() || !user) return;
    const chapterKey = `${book} ${chapter}`;
    try {
      await setDoc(doc(db, "reflections", `${user.uid}_${chapterKey}`), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: reflection,
        chapter: chapterKey, 
        timestamp: serverTimestamp(),
        location: "Sebastian"
      });
    } catch (e) { console.error("Error saving reflection:", e); }
  };

  const handleTrackerNavigation = useCallback((newBook, newChapter) => {
      setBook(newBook); 
      setChapter(newChapter);
      setTopNavMode(null); // Close everything when a chapter is picked
  }, []);

  // --- Bible Data Fetching ---
  useEffect(() => {
    setLoading(true);
    const readerElement = document.getElementById("bible-reader-top");
    if (readerElement) {
        readerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const singleChapterConfig = { "Obadiah": 21, "Philemon": 25, "2 John": 13, "3 John": 14, "Jude": 25 };
    
    let query;
    if (singleChapterConfig[book]) {
        query = `${book} 1:1-${singleChapterConfig[book]}`; 
    } else {
        query = `${book}+${chapter}`;
    }

    fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=${version}`)
      .then(res => res.json())
      .then(data => { setVerses(data.verses || []); setSelectedVerses([]); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [book, chapter, version]);

  const toggleVerse = (verseNum) => {
    if (selectedVerses.includes(verseNum)) setSelectedVerses(selectedVerses.filter(v => v !== verseNum));
    else setSelectedVerses([...selectedVerses, verseNum].sort((a, b) => a - b)); 
  };

  const formatCitation = () => {
    const textBlock = selectedVerses.map(num => {
      const verseObj = verses.find(v => v.verse === num); return verseObj ? verseObj.text.trim() : "";
    }).join(' ');
    return `"${textBlock}" (${book} ${chapter} ${version.toUpperCase()})`;
  };

  const handleShare = async () => {
    let shareData = { title: 'Equip Daily', text: `Reading ${book} ${chapter}`, url: window.location.href };
    if (selectedVerses.length > 0) { shareData.text = formatCitation(); }
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } 
    else { alert("Sharing is not supported. Use Copy!"); }
  };

  const handleCopy = async () => {
    if (selectedVerses.length === 0) { alert("Select verses first!"); return; }
    try { const formatted = formatCitation(); await navigator.clipboard.writeText(formatted); setCopyBtnText("Copied!"); setTimeout(() => setCopyBtnText("Copy"), 2000); } catch (err) { console.error('Failed to copy', err); }
  };

  const increaseFont = () => setFontSize(prev => Math.min(prev + 0.1, 2.0));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));
  
  const handleNext = () => {
    const currentBookIndex = bibleData.findIndex(b => b.name === book);
    if (parseInt(chapter) < bibleData[currentBookIndex].chapters) { setChapter(parseInt(chapter) + 1); } 
    else if (currentBookIndex < bibleData.length - 1) { setBook(bibleData[currentBookIndex + 1].name); setChapter(1); }
  };

  const handlePrev = () => {
    if (parseInt(chapter) > 1) { setChapter(parseInt(chapter) - 1); } 
    else { 
        const currentBookIndex = bibleData.findIndex(b => b.name === book);
        if (currentBookIndex > 0) { setBook(bibleData[currentBookIndex - 1].name); setChapter(bibleData[currentBookIndex - 1].chapters); }
    }
  };

  const getChapterCount = () => {
      if (!bibleData) return 50; 
      const currentBook = bibleData.find(b => b.name === book);
      return currentBook ? currentBook.chapters : 50; 
  };

  // --- UI Components ---
  const compactSelectStyle = {
    border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.75rem', 
    color: theme === 'dark' ? '#aaa' : '#2c3e50', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', 
    outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0, textAlign: 'left', maxWidth: '70px', textOverflow: 'ellipsis'
  };

  const ControlBar = () => (
    <div style={{ 
        position: 'relative', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '10px',              // Adds space between the two groups
        flexWrap: 'wrap',         // ⚡ ALLOWS WRAPPING ON MOBILE
        padding: '10px 0',        // Adds breathing room
        minHeight: '40px'         // Changed height to minHeight so it grows
    }}>
        {/* Group 1: Selectors (Book, Chapter, Version) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }} style={compactSelectStyle}>
                {bibleData && bibleData.map(b => <option key={b.name} value={b.name} style={{color: '#333'}}>{b.name}</option>)}
            </select>
            <span style={{ fontSize: '0.75rem', color: '#555' }}>|</span>
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ ...compactSelectStyle, width: 'auto' }}>
                {[...Array(getChapterCount())].map((_, i) => (
                    <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>
                ))}
            </select>
            <select value={version} onChange={(e) => setVersion(e.target.value)} style={{ fontSize: '0.65rem', color: theme === 'dark' ? '#888' : '#999', marginLeft: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <option value="web" style={{color: '#333'}}>WEB</option>
                <option value="kjv" style={{color: '#333'}}>KJV</option>
                <option value="asv" style={{color: '#333'}}>ASV</option>
                <option value="bbe" style={{color: '#333'}}>BBE</option>
            </select>
        </div>

        {/* Group 2: Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={handleShare} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Share</button>
            <button onClick={handlePrev} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>← Prev</button>
            <button onClick={handleNext} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Next →</button>
            <button onClick={handleCopy} className="nav-btn" style={{ backgroundColor: selectedVerses.length > 0 ? '#ff9900' : (theme === 'dark' ? '#333' : '#f5f5f5'), color: selectedVerses.length > 0 ? 'white' : (theme === 'dark' ? '#ccc' : '#aaa'), border: selectedVerses.length > 0 ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #ddd'), padding: '5px 10px', fontSize: '0.85rem' }}>
                {copyBtnText}
            </button>
            <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
            <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
        </div>
    </div>
  );

  // ⚡ MEMOIZED TRACKER: Renders ONLY if we selected OT or NT
  const MemoizedTracker = useMemo(() => {
      if (topNavMode === 'OT' || topNavMode === 'NT') {
          return user ? <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} sectionFilter={topNavMode} /> : null;
      }
      return null;
  }, [user, readChapters, handleTrackerNavigation, topNavMode]);

  const MemoizedFullTracker = useMemo(() => {
      return user ? <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} /> : null;
  }, [user, readChapters, handleTrackerNavigation]);

  return (
    <div id="bible-reader-top" className="container" style={{ maxWidth: '100%', padding: '0', boxShadow: 'none', '--verse-font-size': `${fontSize}rem` }}>
      <style>{`
        .verse-box { padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: background-color 0.2s ease; }
        .verse-text { font-size: var(--verse-font-size); line-height: 1.6; transition: font-size 0.2s ease; }
        .verse-box.light { background-color: #fff; color: #333; border: 1px solid #eee; }
        .verse-box.light:hover { background-color: #f1f1f1; } 
        .verse-box.light.selected { background-color: #e3f2fd; border: 1px solid #2196F3; }
        .verse-box.dark { background-color: #000; color: #ccc; border: 1px solid #333; }
        .verse-box.dark:hover { background-color: #333; } 
        .verse-box.dark.selected { background-color: #1e3a5f; border: 1px solid #4a90e2; }
        /* Nav Button Styles */
        .nav-toggle-btn { padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%; border: 1px solid #eee; background-color: #fff; color: #555; transition: all 0.2s ease; }
        .nav-toggle-btn.active { background-color: #e3f2fd; color: #1976d2; border: 1px solid #2196F3; }
      `}</style>

      <div style={{ marginBottom: '20px', padding: '0 20px' }}>
        
        {/* ⚡ NAVIGATION LOGIC START */}
        <div style={{ marginBottom: '15px' }}>
            {/* 1. Main Browse Button (Shows if Menu is Closed) */}
            {topNavMode === null && (
                <button 
                    onClick={() => setTopNavMode('MENU')} 
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', 
                        backgroundColor: theme === 'dark' ? '#111' : 'white', 
                        fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                        color: theme === 'dark' ? '#ccc' : '#555',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                    📖 Browse Bible Books
                </button>
            )}

            {/* 2. The Menu (Shows if Menu, OT, or NT is active) */}
            {topNavMode !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        
                        {/* ⚡ UPDATE: Clicking active button returns to 'MENU' (keeps buttons, hides list) */}
                        <button 
                            onClick={() => setTopNavMode(topNavMode === 'OT' ? 'MENU' : 'OT')} 
                            className={`nav-toggle-btn ${topNavMode === 'OT' ? 'active' : ''}`}
                            style={{ flex: 1, backgroundColor: topNavMode === 'OT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : '#fff'), color: topNavMode === 'OT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555') }}
                        >
                            {topNavMode === 'OT' ? 'Close Old Testament' : 'Old Testament'}
                        </button>

                        <button 
                            onClick={() => setTopNavMode(topNavMode === 'NT' ? 'MENU' : 'NT')} 
                            className={`nav-toggle-btn ${topNavMode === 'NT' ? 'active' : ''}`}
                            style={{ flex: 1, backgroundColor: topNavMode === 'NT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : '#fff'), color: topNavMode === 'NT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555') }}
                        >
                            {topNavMode === 'NT' ? 'Close New Testament' : 'New Testament'}
                        </button>
                    </div>

                    {/* ⚡ Added "Close Menu" so you can fully collapse if you want to */}
                    <button 
                        onClick={() => setTopNavMode(null)}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', alignSelf: 'center', textDecoration: 'underline' }}
                    >
                        Collapse Menu
                    </button>
                </div>
            )}
        </div>
        
        {/* The List (Only shows if topNavMode is OT or NT) */}
        {MemoizedTracker && ( <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}> {MemoizedTracker} </div> )}

        <ControlBar />
      </div>

      <div id="answerDisplay" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        {verses.length === 0 && loading ? (
             <p style={{ textAlign: 'center' }}>Loading the Word...</p>
        ) : (
            verses.map((v, index) => {
                const isSelected = selectedVerses.includes(v.verse);
                const themeClass = theme === 'dark' ? 'dark' : 'light';
                const selectedClass = isSelected ? 'selected' : '';

                return (
                <div key={index} className={`verse-box ${themeClass} ${selectedClass}`} onClick={() => toggleVerse(v.verse)}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: 'pointer', marginTop: '4px' }} />
                    <span style={{ fontWeight: 'bold', marginRight: '5px', fontSize: '0.8rem', color: theme === 'dark' ? '#888' : '#999' }}>{v.verse}</span>
                    <span className="verse-text">{v.text}</span>
                </div>
                );
            })
        )}
      </div>

      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '25px' }}> <ControlBar /> </div>
        
        <div style={{ marginTop: '30px' }}>
          {user && !hasShared ? (
            <div style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #333' : '1px solid #eee' }}>
                <textarea placeholder={`What is the Spirit saying through ${book} ${chapter}?`} value={reflection} onChange={(e) => setReflection(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>Share with the Body</button>
                  <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>
                </div>
            </div>
          ) : hasShared ? (
            <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#0f2f21' : '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: theme === 'dark' ? '#81e6d9' : '#276749' }}>
              <p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body for this chapter!</p>
            </div>
          ) : null}
        </div>

        <section className="directory" style={{ marginTop: '40px' }}>
          <h2 style={{ textAlign: 'center', color: theme === 'dark' ? '#fff' : '#333' }}>Reflections on {book} {chapter}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            {chapterReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : chapterReflections.map((post, i) => (
              <MemberCard key={i} user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} />
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid #eee', marginTop: '40px', paddingTop: '20px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 25px', backgroundColor: isChapterRead ? (theme === 'dark' ? '#0f2f21' : '#e6fffa') : (theme === 'dark' ? '#111' : '#f9f9f9'), border: isChapterRead ? '1px solid #38b2ac' : (theme === 'dark' ? '1px solid #333' : '1px solid #eee'), borderRadius: '30px', transition: 'all 0.3s ease' }}>
                <input type="checkbox" checked={isChapterRead} onChange={toggleChapterRead} style={{ width: '20px', height: '20px', accentColor: '#276749', cursor: 'pointer' }} />
                <span style={{ fontWeight: 'bold', color: isChapterRead ? '#276749' : (theme === 'dark' ? '#888' : '#555'), fontSize: '1rem' }}>{isChapterRead ? "✓ Tracked as Read" : "Track Read for Daily Bible Plan"}</span>
            </label>
        </div>
        
        {MemoizedFullTracker}
      </div>
    </div>
  );
}

export default BibleReader;