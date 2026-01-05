import React, { useState, useEffect } from 'react';
import { bibleData } from './bibleData'; 
import BibleTracker from './BibleTracker'; 
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

function BibleReader() {
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

  // 🆕 TOP NAV STATE
  const [topNavMode, setTopNavMode] = useState(null);

  // 🔄 Listen to Firebase
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

  // 👀 Check Read Status
  useEffect(() => {
    const chapterKey = `${book} ${chapter}`;
    setIsChapterRead(readChapters.includes(chapterKey));
  }, [book, chapter, readChapters]);

  // 💾 Toggle Read Status
  const toggleChapterRead = async (e) => {
    if (!user) { alert("Please log in!"); return; }
    
    const chapterKey = `${book} ${chapter}`;
    const newStatus = e.target.checked;
    
    // 1. Update UI Immediately
    setIsChapterRead(newStatus);
    
    // 2. Calculate New List
    let updatedList;
    if (newStatus) {
        updatedList = [...new Set([...readChapters, chapterKey])];
    } else {
        updatedList = readChapters.filter(key => key !== chapterKey);
    }

    // 3. Update Tracker UI Immediately
    setReadChapters(updatedList); 

    // 4. Save to Firebase
    try {
        await setDoc(doc(db, "users", user.uid), { readChapters: updatedList }, { merge: true });
    } catch (err) { console.error("Error saving:", err); }
  };

  // 🧭 Navigation Handler
  const handleTrackerNavigation = (newBook, newChapter) => {
      setBook(newBook);
      setChapter(newChapter);
      // setTopNavMode(null);  <-- I REMOVED THIS LINE! The menu will now stay open.
  };

  // 📖 Fetch Scripture
  useEffect(() => {
    setLoading(true);
    fetch(`https://bible-api.com/${book}+${chapter}?translation=${version}`)
      .then(res => res.json())
      .then(data => {
        setVerses(data.verses || []);
        setSelectedVerses([]); 
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [book, chapter, version]);

  const toggleVerse = (verseNum) => {
    if (selectedVerses.includes(verseNum)) {
      setSelectedVerses(selectedVerses.filter(v => v !== verseNum));
    } else {
      setSelectedVerses([...selectedVerses, verseNum].sort((a, b) => a - b)); 
    }
  };

  const formatCitation = () => {
    const textBlock = selectedVerses.map(num => {
      const verseObj = verses.find(v => v.verse === num);
      return verseObj ? verseObj.text.trim() : "";
    }).join(' ');
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    let refString = "";
    if (sorted.length > 0) {
      let ranges = [];
      let start = sorted[0];
      let end = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === end + 1) end = sorted[i]; 
          else { ranges.push(start === end ? `${start}` : `${start}-${end}`); start = sorted[i]; end = sorted[i]; }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      refString = ranges.join(', ');
    }
    const reference = `${book} ${chapter}:${refString}`;
    return `"${textBlock}" (${reference} ${version.toUpperCase()})`;
  };

  const handleShare = async () => {
    let shareData = {};
    if (selectedVerses.length > 0) {
      const formatted = formatCitation();
      shareData = { title: 'Scripture', text: formatted };
    } else {
      shareData = { title: 'Equip Daily', text: `Reading ${book} ${chapter}`, url: window.location.href };
    }
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Skipped', err); }
    } else {
      alert("Sharing is not supported. Use Copy!");
    }
  };

  const handleCopy = async () => {
    if (selectedVerses.length === 0) { alert("Select verses first!"); return; }
    try {
      const formatted = formatCitation();
      await navigator.clipboard.writeText(formatted);
      setCopyBtnText("Copied!");
      setTimeout(() => setCopyBtnText("Copy"), 2000);
    } catch (err) { console.error('Failed to copy', err); }
  };

  // 🤏 COMPACT STYLES
  const compactSelectStyle = {
    border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.75rem', 
    color: '#2c3e50', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', 
    outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0, 
    textAlign: 'left', maxWidth: '70px', textOverflow: 'ellipsis'
  };

  // 🧩 REUSABLE CONTROL BAR
  const ControlBar = () => (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40px' }}>
            
        {/* 👈 LEFT: Book / Chapter / Version (Compact & Inline) */}
        <div style={{ position: 'absolute', left: 0, display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <select value={book} onChange={(e) => setBook(e.target.value)} style={compactSelectStyle}>
                {bibleData.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <span style={{ fontSize: '0.75rem', color: '#ccc' }}>|</span>
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ ...compactSelectStyle, width: 'auto' }}>
                {[...Array(150)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
            <select value={version} onChange={(e) => setVersion(e.target.value)} style={{ fontSize: '0.65rem', color: '#999', marginLeft: '2px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <option value="web">WEB</option>
                <option value="kjv">KJV</option>
                <option value="asv">ASV</option>
                <option value="bbe">BBE</option>
            </select>
        </div>

        {/* 🎯 CENTER: Share / Prev / Next / Copy */}
        <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleShare} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Share</button>
            <button onClick={() => setChapter(Math.max(1, parseInt(chapter) - 1))} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>← Prev</button>
            <button onClick={() => setChapter(parseInt(chapter) + 1)} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.85rem' }}>Next →</button>
            <button onClick={handleCopy} className="nav-btn" style={{ backgroundColor: selectedVerses.length > 0 ? '#ff9900' : '#f5f5f5', color: selectedVerses.length > 0 ? 'white' : '#aaa', border: selectedVerses.length > 0 ? 'none' : '1px solid #ddd', padding: '5px 10px', fontSize: '0.85rem' }}>
                {copyBtnText}
            </button>
        </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
      
      {/* 🏗️ HEADER LAYOUT */}
      <div style={{ marginBottom: '20px', padding: '0 20px' }}>
        
        {/* ROW 1: THE BIG BUTTONS (OT / NT) */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
                onClick={() => setTopNavMode(topNavMode === 'OT' ? null : 'OT')}
                style={{ 
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #eee',
                    backgroundColor: topNavMode === 'OT' ? '#e3f2fd' : 'white', 
                    fontWeight: 'bold', color: topNavMode === 'OT' ? '#1976d2' : '#555',
                    cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
            >
                Old Testament
            </button>
            <button 
                onClick={() => setTopNavMode(topNavMode === 'NT' ? null : 'NT')}
                style={{ 
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #eee',
                    backgroundColor: topNavMode === 'NT' ? '#e3f2fd' : 'white',
                    fontWeight: 'bold', color: topNavMode === 'NT' ? '#1976d2' : '#555',
                    cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
            >
                New Testament
            </button>
        </div>

        {/* 🔻 CONDITIONAL TOP TRACKER */}
        {topNavMode && (
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <BibleTracker 
                    readChapters={readChapters} 
                    onNavigate={handleTrackerNavigation} 
                    sectionFilter={topNavMode} 
                />
            </div>
        )}

        {/* ROW 2: TOP CONTROLS (Mirrored) */}
        <ControlBar />

      </div>

      {/* VERSE DISPLAY */}
      <div id="answerDisplay" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
        {loading ? <p style={{ textAlign: 'center' }}>Loading the Word...</p> : verses.map((v, index) => {
            const isSelected = selectedVerses.includes(v.verse);
            return (
              <div key={index} className={`verse-container ${isSelected ? 'highlighted' : ''}`} onClick={() => toggleVerse(v.verse)} style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="verse-checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span className="verse-number">{v.verse}</span>
                <span className="verse-text">{v.text}</span>
              </div>
            );
        })}
      </div>

      {/* BOTTOM LAYOUT */}
      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px', textAlign: 'center' }}>
        
        {/* ROW: BOTTOM CONTROLS (Mirrored) */}
        <div style={{ marginBottom: '25px' }}>
            <ControlBar />
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', paddingBottom: '20px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 25px', backgroundColor: isChapterRead ? '#e6fffa' : '#f9f9f9', border: isChapterRead ? '1px solid #38b2ac' : '1px solid #eee', borderRadius: '30px', transition: 'all 0.3s ease' }}>
                <input type="checkbox" checked={isChapterRead} onChange={toggleChapterRead} style={{ width: '20px', height: '20px', accentColor: '#276749', cursor: 'pointer' }} />
                <span style={{ fontWeight: 'bold', color: isChapterRead ? '#276749' : '#555', fontSize: '1rem' }}>{isChapterRead ? "✓ Tracked as Read" : "Track Read for Daily Bible Plan"}</span>
            </label>
        </div>

        {/* 📊 BOTTOM TRACKER (Full View) */}
        {user && <BibleTracker readChapters={readChapters} onNavigate={handleTrackerNavigation} />}

      </div>

    </div>
  );
}

export default BibleReader;