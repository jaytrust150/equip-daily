import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { bibleData } from './bibleData'; 
import BibleTracker from './BibleTracker'; 
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

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
  const [topNavMode, setTopNavMode] = useState(null);
  const [fontSize, setFontSize] = useState(1.1); 

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

  useEffect(() => {
    const chapterKey = `${book} ${chapter}`;
    setIsChapterRead(readChapters.includes(chapterKey));
  }, [book, chapter, readChapters]);

  const toggleChapterRead = async (e) => {
    if (!user) { alert("Please log in!"); return; }
    const chapterKey = `${book} ${chapter}`;
    const newStatus = e.target.checked;
    setIsChapterRead(newStatus);
    let updatedList = newStatus ? [...new Set([...readChapters, chapterKey])] : readChapters.filter(key => key !== chapterKey);
    setReadChapters(updatedList); 
    try { await setDoc(doc(db, "users", user.uid), { readChapters: updatedList }, { merge: true }); } catch (err) { console.error("Error saving:", err); }
  };

  const handleTrackerNavigation = useCallback((newBook, newChapter) => {
      setBook(newBook); 
      setChapter(newChapter);
  }, []);

  // 📖 MAIN FETCH LOGIC (EXACT RANGE FIX)
  useEffect(() => {
    setLoading(true);
    
    const readerElement = document.getElementById("bible-reader-top");
    if (readerElement) {
        readerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 🛠️ NUCLEAR FIX: Hard-code exact verse counts for single-chapter books
    const singleChapterConfig = {
        "Obadiah": 21,
        "Philemon": 25,
        "2 John": 13,
        "3 John": 14,
        "Jude": 25
    };
    
    let query;
    if (singleChapterConfig[book]) {
        // If it's a special book, request "Book 1:1-[LastVerse]"
        // Example: "Jude 1:1-25"
        const lastVerse = singleChapterConfig[book];
        query = `${book} 1:1-${lastVerse}`; 
    } else {
        // Standard behavior for everything else
        query = `${book}+${chapter}`;
    }

    // encodeURIComponent handles spaces safely (e.g. "3 John 1:1-15")
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
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    let refString = "";
    if (sorted.length > 0) {
      let ranges = []; let start = sorted[0]; let end = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === end + 1) end = sorted[i]; 
          else { ranges.push(start === end ? `${start}` : `${start}-${end}`); start = sorted[i]; end = sorted[i]; }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      refString = ranges.join(', ');
    }
    return `"${textBlock}" (${book} ${chapter}:${refString} ${version.toUpperCase()})`;
  };

  const handleShare = async () => {
    let shareData = {};
    if (selectedVerses.length > 0) { const formatted = formatCitation(); shareData = { title: 'Scripture', text: formatted }; } 
    else { shareData = { title: 'Equip Daily', text: `Reading ${book} ${chapter}`, url: window.location.href }; }
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
    const currentBookData = bibleData[currentBookIndex];
    if (parseInt(chapter) < currentBookData.chapters) {
        setChapter(parseInt(chapter) + 1);
    } else if (currentBookIndex < bibleData.length - 1) {
        const nextBook = bibleData[currentBookIndex + 1];
        setBook(nextBook.name);
        setChapter(1);
    }
  };

  const handlePrev = () => {
    if (parseInt(chapter) > 1) {
        setChapter(parseInt(chapter) - 1);
    } else {
        const currentBookIndex = bibleData.findIndex(b => b.name === book);
        if (currentBookIndex > 0) {
            const prevBook = bibleData[currentBookIndex - 1];
            setBook(prevBook.name);
            setChapter(prevBook.chapters); 
        }
    }
  };

  const getChapterCount = () => {
      const currentBook = bibleData.find(b => b.name === book);
      return currentBook ? currentBook.chapters : 50; 
  };

  const compactSelectStyle = {
    border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.75rem', 
    color: theme === 'dark' ? '#aaa' : '#2c3e50', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', 
    outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0, textAlign: 'left', maxWidth: '70px', textOverflow: 'ellipsis'
  };

  const ControlBar = () => (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40px' }}>
        <div style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }} style={compactSelectStyle}>
                {bibleData.map(b => <option key={b.name} value={b.name} style={{color: '#333'}}>{b.name}</option>)}
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
        <div style={{ display: 'flex', gap: '8px' }}>
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

  const MemoizedTracker = useMemo(() => {
      return user ? <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} sectionFilter={topNavMode} /> : null;
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
      `}</style>

      <div style={{ marginBottom: '20px', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setTopNavMode(topNavMode === 'OT' ? null : 'OT')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', backgroundColor: topNavMode === 'OT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : 'white'), fontWeight: 'bold', color: topNavMode === 'OT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555'), cursor: 'pointer' }}>
                {topNavMode === 'OT' ? 'Hide Books' : 'Old Testament'}
            </button>
            <button onClick={() => setTopNavMode(topNavMode === 'NT' ? null : 'NT')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', backgroundColor: topNavMode === 'NT' ? (theme === 'dark' ? '#1e3a5f' : '#e3f2fd') : (theme === 'dark' ? '#111' : 'white'), fontWeight: 'bold', color: topNavMode === 'NT' ? (theme === 'dark' ? '#fff' : '#1976d2') : (theme === 'dark' ? '#ccc' : '#555'), cursor: 'pointer' }}>
                {topNavMode === 'NT' ? 'Hide Books' : 'New Testament'}
            </button>
        </div>
        
        {topNavMode && ( <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}> {MemoizedTracker} </div> )}

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
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', paddingBottom: '20px' }}>
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