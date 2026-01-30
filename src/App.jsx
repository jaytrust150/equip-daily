import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import './App.css';

// ✅ FIXED IMPORTS: Pointing to new folder structure
const BibleStudy = lazy(() => import('./features/bible/BibleStudy'));
const MemberProfile = lazy(() => import('./shared/MemberProfile'));
import MemberCard from './shared/MemberCard';
import Login from './shared/Login';
const SearchWell = lazy(() => import('./shared/SearchWell'));
import { auth, db } from "./config/firebase"; 

// 📍 DEFAULT CITY
const CITY_NAME = "Sebastian";

function App() {
  const [user, loading] = useAuthState(auth);
  
  // 🧭 NAV STATE
  const [activeTab, setActiveTab] = useState('devotional');
  const [previousTab, setPreviousTab] = useState('devotional');
  const [viewingProfileUid, setViewingProfileUid] = useState(null); 
  
  const [theme, setTheme] = useState('light');

  // --- 📖 BIBLE STATE ---
  const [bibleBook, setBibleBook] = useState('Genesis');
  const [bibleChapter, setBibleChapter] = useState(1);
  const [bibleHistory, setBibleHistory] = useState([]); 

  // --- 💧 THE WELL STATE ---
  const [isWellOpen, setIsWellOpen] = useState(false);
  const [wellQuery, setWellQuery] = useState("");
  
  // 🛡️ SMART LOCK: Tracks the specific verse you just closed
  const ignoredVerseRef = useRef(null); 

  const [devotional, setDevotional] = useState("Loading the Word...");
  const [dayOffset, setDayOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 🎧 AUDIO & VIDEO STATE ---
  const [showAudio, setShowAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  const [sleepMinutes, setSleepMinutes] = useState(null); 
  const [sleepTimeLeft, setSleepTimeLeft] = useState(null); 
  
  // 📺 NEW: YouTube Video State (derived from devotional)
  const youtubeIds = useMemo(() => {
    if (!devotional) return [];
    const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/g;
    const matches = Array.from(devotional.matchAll(ytRegex))
      .map((m) => m[1])
      .filter(Boolean);
    return [...new Set(matches)];
  }, [devotional]);

  // --- REFLECTION / EDITING STATE ---
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [communityReflections, setCommunityReflections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [fontSize, setFontSize] = useState(1.1);

  const logout = () => signOut(auth);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const increaseFont = () => setFontSize(prev => Math.min(prev + 0.1, 2.0));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));

  // --- 👤 PROFILE NAV ---
  const goToProfile = (uid) => {
      setPreviousTab(activeTab);
      setViewingProfileUid(uid);
      setActiveTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 🚀 SMART BIBLE JUMP ---
  const jumpToVerse = (book, chapter, verseNum = null) => {
    setBibleHistory(prev => [...prev, { book: bibleBook, chapter: bibleChapter }]);
    setBibleBook(book);
    setBibleChapter(parseInt(chapter));
    setActiveTab('bible');
    // If verse number provided, pass it to BibleStudy via props
    if (verseNum) {
      // Store verse to highlight in state so BibleStudy can access it
      sessionStorage.setItem('jumpToVerse', verseNum);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- ↩️ GO BACK ---
  const goBackInBible = () => {
    if (bibleHistory.length === 0) return;
    const lastLocation = bibleHistory[bibleHistory.length - 1];
    setBibleBook(lastLocation.book);
    setBibleChapter(lastLocation.chapter);
    setBibleHistory(prev => prev.slice(0, -1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 🛡️ SMART CLOSE LOGIC ---
  const handleWellClose = () => {
    setIsWellOpen(false);
    ignoredVerseRef.current = wellQuery;
  };

  const jumpToHistoryItem = (post) => {
    if (post.date) {
        const [m, d] = post.date.split('.');
        const targetDate = new Date();
        targetDate.setMonth(parseInt(m) - 1);
        targetDate.setDate(parseInt(d));
        const diffTime = targetDate - new Date().setHours(0,0,0,0);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        setDayOffset(diffDays);
        setActiveTab('devotional');
    }
    else if (post.chapter) {
        const match = post.chapter.match(/^(.+)\s(\d+)$/);
        if (match) jumpToVerse(match[1], match[2]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerSearch = (query) => {
    if (!query) return;
    setWellQuery(query);
    setIsWellOpen(true);
  };

  // 🎨 Apply theme to document element so [data-theme="dark"] CSS rules work
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const handleReaction = async (postId, fruitId) => {
    if (!user) return;
    const postRef = doc(db, "reflections", postId);
    const post = communityReflections.find(p => p.id === postId);
    if (!post) return;
    const currentReactions = post.reactions?.[fruitId] || [];
    const hasReacted = currentReactions.includes(user.uid);

    try {
      if (hasReacted) await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayRemove(user.uid) });
      else await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayUnion(user.uid) });
    } catch (e) { console.error("Error updating fruit:", e); }
  };

  const processDevotionalText = (text) => {
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+)\s(\d+):(\d+)(-\d+)?/g;
    return text.replace(verseRegex, (match) => {
      return `<span class="verse-link" style="color: #2196F3; cursor: pointer; text-decoration: underline; font-weight: bold;">${match}</span>`;
    });
  };

  const processedDevotional = useMemo(() => { return processDevotionalText(devotional); }, [devotional]);

  const handleDevotionalInteraction = (e) => {
    if (e.target.classList.contains('verse-link')) {
      const verseRef = e.target.innerText;
      if (e.type === 'mouseover' && ignoredVerseRef.current === verseRef) return;
      if (wellQuery !== verseRef) {
          setWellQuery(verseRef);
      }
      
      if (e.type === 'click' || e.type === 'mouseover') {
        if (!isWellOpen) {
            setIsWellOpen(true);
            if (ignoredVerseRef.current !== verseRef) ignoredVerseRef.current = null;
        }
      }
    }
  };

  const handleMouseOut = (e) => {
    if (e.target.classList.contains('verse-link')) {
        ignoredVerseRef.current = null;
    }
  };

  useEffect(() => {
    if (sleepTimeLeft === null) return;
    const interval = setInterval(() => {
      setSleepTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (audioRef.current) audioRef.current.pause();
          setSleepMinutes(null);
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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

  useEffect(() => {
    setTimeout(() => setAudioError(false), 0);
    if (showAudio && audioRef.current) {
        audioRef.current.load();
        setTimeout(() => {
             if (audioRef.current && audioRef.current.textTracks[0]) audioRef.current.textTracks[0].mode = 'showing';
        }, 500);
    }
  }, [currentDate, showAudio]);

  const handleTrackLoad = () => {
      if (audioRef.current && audioRef.current.textTracks && audioRef.current.textTracks.length > 0) {
          audioRef.current.textTracks[0].mode = 'showing';
      }
  };

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(targetDate);
    const fileName = `${targetDate.getMonth() + 1}.${targetDate.getDate()}-devotional.txt`;
    setEditingId(null); 
    fetch(`/${fileName}`)
      .then(res => { if (!res.ok) throw new Error("File not found"); return res.text(); })
      .then(text => { setDevotional(text); setHasShared(false); setReflection(""); })
      .catch(() => { setDevotional(`<div style="text-align: center; padding: 20px;"><p>Edits in Progress for ${targetDate.toLocaleDateString()}</p></div>`); });
  }, [dayOffset]);

  useEffect(() => {
    if (!db) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    const q = query(collection(db, "reflections"), where("date", "==", dateKey));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReflections = [];
        querySnapshot.forEach((doc) => { fetchedReflections.push({ id: doc.id, ...doc.data() }); });
        setCommunityReflections(fetchedReflections);
        if (user) {
          const myPost = fetchedReflections.find(r => r.userId === user.uid);
          if (myPost) { setHasShared(true); if (!editingId) setReflection(myPost.text); } 
          else { setHasShared(false); if (!editingId) setReflection(""); }
        }
    });
    return () => unsubscribe();
  }, [currentDate, user, editingId]);

  const saveReflection = async () => {
    if (!reflection.trim() || !user || !db) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    try {
      if (editingId) {
         await updateDoc(doc(db, "reflections", editingId), { text: reflection, timestamp: serverTimestamp(), isEdited: true });
         setEditingId(null); setReflection("");
      } else {
         await setDoc(doc(db, "reflections", `${user.uid}_${dateKey}`), { 
             userId: user.uid, 
             userName: user.displayName, 
             userPhoto: user.photoURL, 
             text: reflection, 
             date: dateKey, 
             timestamp: serverTimestamp(), 
             location: CITY_NAME, 
             reactions: {} 
         });
      }
    } catch (e) { console.error("Error saving reflection:", e); }
  };

  const handleEditClick = (post) => {
      setEditingId(post.id);
      setReflection(post.text);
      document.getElementById('devotional-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const handleCancelEdit = () => { setEditingId(null); setReflection(""); };
  const handleDeleteClick = async (id) => {
      if (window.confirm("Delete reflection?")) {
          try { await deleteDoc(doc(db, "reflections", id)); if (editingId === id) { setEditingId(null); setReflection(""); } } catch (e) { console.error(e); }
      }
  };
  const handleShareItem = async (text) => {
    const shareData = { title: 'Equip Daily', text: text, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch { /* Share cancelled */ } }
    else { try { await navigator.clipboard.writeText(text); alert("Text copied!"); } catch (err) { console.error('Failed to copy:', err); alert('Failed to copy text'); } }
  };

  const appStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: theme === 'dark' ? '#222222' : '#ffffff',
    color: theme === 'dark' ? '#f0f0f0' : '#333',
    transition: 'all 0.3s ease',
    '--devotional-font-size': `${fontSize}rem`,
    '--nav-btn-bg': theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    '--nav-btn-text': theme === 'dark' ? '#e5e7eb' : '#333',
    '--nav-btn-border': theme === 'dark' ? '#444' : '#ddd',
    '--nav-btn-hover-bg': theme === 'dark' ? '#333' : '#e2e6ea',
    '--card-bg': theme === 'dark' ? '#1f2937' : '#ffffff',
    '--card-border': theme === 'dark' ? '#374151' : '#e5e7eb',
    '--card-text': theme === 'dark' ? '#e5e7eb' : '#333',
    '--card-text-muted': theme === 'dark' ? '#cbd5f5' : '#555',
    '--chip-bg': theme === 'dark' ? '#1e3a8a' : '#e3f2fd',
    '--chip-text': theme === 'dark' ? '#bfdbfe' : '#1976d2',
    '--chip-border': theme === 'dark' ? '#1d4ed8' : '#1976d2',
    '--pill-bg': theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
    '--pill-border': theme === 'dark' ? '#444' : '#ddd',
    '--verse-bg': theme === 'dark' ? '#1f2937' : '#ffffff',
    '--verse-border': theme === 'dark' ? '#374151' : '#eee',
    '--verse-hover-border': theme === 'dark' ? '#4b5563' : '#ccc',
  };
  const buttonStyle = { background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', borderRadius: '20px', padding: '5px 12px', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
  const navBtnStyle = { padding: '5px 10px', fontSize: '0.85rem' };
  const secretSelectStyle = { border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1.25rem', color: theme === 'dark' ? '#f0f0f0' : '#2c3e50', cursor: 'pointer', appearance: 'none', outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0 };

  if (loading) return <div className="app-container"><h3>Loading User Data...</h3></div>;

  return (
    <div className="app-container" style={appStyle}>
      <style>{`
        video::cue {
            font-size: 1.25rem;
            color: #ffeb3b;
            background-color: transparent;
            font-family: sans-serif;
            text-shadow: 2px 2px 3px #000;
        }
      `}</style>
      <header style={{ position: 'relative', textAlign: 'center', paddingTop: '20px' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px' }}>
           {activeTab === 'profile' ? (
             <>
                <button onClick={() => setActiveTab('devotional')} style={buttonStyle}>🙏 Daily</button>
                <button onClick={() => setActiveTab('bible')} style={buttonStyle}>📖 Bible</button>
             </>
           ) : (
             <button 
               onClick={() => setActiveTab(activeTab === 'devotional' ? 'bible' : 'devotional')} 
               style={buttonStyle}
             >
               {activeTab === 'devotional' ? '📖 Bible' : '🙏 Daily Devotional'}
             </button>
           )}
        </div>

        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
            <a href="https://www.youtube.com/@EquipDaily" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button style={{ ...buttonStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="red">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                    Equip Daily
                </button>
            </a>
            <button onClick={toggleTheme} style={buttonStyle}>
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
        </div>
        
        <h1>Equip Daily</h1>
        <p style={{ marginTop: '5px', marginBottom: '20px', fontStyle: 'italic', opacity: 0.8 }}>"For the equipping of the saints." - Eph 4:12</p>
        <hr style={{ width: '50%', margin: '0px auto 20px auto', borderColor: theme === 'dark' ? '#444' : '#eee' }} />
        
        {user && (
            <div className="user-profile" style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', color: theme === 'dark' ? '#aaa' : '#555' }}>
                <span style={{ fontStyle: 'italic' }}>Grace and peace,</span>
                <button 
                    onClick={() => goToProfile(user.uid)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 'inherit', fontWeight: 'bold',
                        color: theme === 'dark' ? '#90caf9' : '#1565c0',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '2px 6px', borderRadius: '4px',
                        transition: 'background-color 0.2s'
                    }}
                    title="Go to Profile"
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    👤 {user.displayName}
                </button>
            </div>
        )}
      </header>

      <main 
        style={{ flex: 1 }}
        onClick={handleDevotionalInteraction} 
        onMouseOver={handleDevotionalInteraction} 
        onMouseOut={handleMouseOut}
      >
        {activeTab === 'profile' ? (
          <Suspense fallback={<div className="app-container"><h3>Loading Profile...</h3></div>}>
            <MemberProfile 
              theme={theme} 
              viewingUid={viewingProfileUid} 
              onNavigate={setActiveTab}
              onJumpToHistory={jumpToHistoryItem} 
              previousTab={previousTab} 
            />
          </Suspense>
        ) : activeTab === 'bible' ? (
          <Suspense fallback={<div className="app-container"><h3>Loading Bible...</h3></div>}>
            <BibleStudy 
              theme={theme} 
              book={bibleBook} setBook={setBibleBook} 
              chapter={bibleChapter} setChapter={setBibleChapter} 
              onSearch={triggerSearch} 
              onProfileClick={goToProfile}
              historyStack={bibleHistory}
              onGoBack={goBackInBible}
            />
          </Suspense>
        ) : (
          /* DEVOTIONAL TAB CONTENT */
          <>
            <section className="devotional-porch" style={{ textAlign: 'center', padding: '0 20px 20px 20px' }}>
              <div style={{ marginBottom: '30px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: '15px' }}>
                  <select value={currentDate.getMonth()} onChange={(e) => { const d = new Date(currentDate); d.setMonth(parseInt(e.target.value)); setDayOffset(Math.round((d - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))); }} style={{ ...secretSelectStyle, textAlign: 'right', width: '120px', paddingRight: '5px' }}>{months.map((m, i) => <option key={m} value={i} style={{color: '#333'}}>{m}</option>)}</select>
                  <select value={currentDate.getDate()} onChange={(e) => { const d = new Date(currentDate); d.setDate(parseInt(e.target.value)); setDayOffset(Math.round((d - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))); }} style={{ ...secretSelectStyle, width: currentDate.getDate() > 9 ? '35px' : '20px', textAlign: 'right', paddingRight: '2px' }}>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>)}</select>
                  <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: theme === 'dark' ? '#f0f0f0' : '#2c3e50' }}>, {currentDate.getFullYear()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => setShowAudio(!showAudio)} style={{ ...navBtnStyle, fontSize: '1.2rem', padding: '0 5px', background: 'none', border: 'none', cursor: 'pointer' }} title={showAudio ? "Hide Audio" : "Listen to Devotional"}>
                    {showAudio ? '🔊' : '🔇'}
                  </button>

                  <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn" style={navBtnStyle}>← Prior</button>
                  <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ ...navBtnStyle, backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333' }}>Today</button>
                  <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn" style={navBtnStyle}>Next →</button>
                  
                  <button onClick={() => setDayOffset(0)} style={{ ...navBtnStyle, fontSize: '1.2rem', padding: '0 5px', background: 'none', border: 'none', cursor: 'pointer' }} title="Calendar">
                    📅
                  </button>

                  <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
                  <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
                  <button onClick={() => setIsWellOpen(!isWellOpen)} style={{ padding: '6px 15px', borderRadius: '20px', backgroundColor: isWellOpen ? '#2196F3' : 'transparent', color: isWellOpen ? 'white' : '#2196F3', border: '1px solid #2196F3', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>🔍 Bible Search & Concordance</button>
                </div>
              </div>

              {showAudio && (
                <div style={{ margin: '0 auto 20px auto', maxWidth: '600px', padding: '10px', backgroundColor: theme === 'dark' ? '#222' : '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.5s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <video key={`${currentDate.getMonth() + 1}.${currentDate.getDate()}`} controls ref={audioRef} onLoadedMetadata={handleTrackLoad} style={{ flex: 1, height: '140px', backgroundColor: '#2c3e50', borderRadius: '4px' }} onError={() => setAudioError(true)} playsInline>
                            <source src={`/audio/${currentDate.getMonth() + 1}.${currentDate.getDate()}-devotional.mp3`} type="audio/mpeg" />
                            <track 
                                key={`track-${currentDate.getMonth() + 1}.${currentDate.getDate()}`}
                                kind="captions" 
                                src={`/audio/${currentDate.getMonth() + 1}.${currentDate.getDate()}-devotional.vtt`} 
                                srcLang="en" 
                                label="English" 
                                default 
                            />
                            Your browser does not support the audio element.
                        </video>
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
                    {audioError && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', marginBottom: 0, textAlign: 'center' }}>Audio not available for this date yet.</p>}
                </div>
              )}

              <div className="devotional-content" style={{ fontSize: 'var(--devotional-font-size)', lineHeight: '1.7', textAlign: 'left', color: theme === 'dark' ? '#ccc' : '#333', backgroundColor: theme === 'dark' ? '#111' : '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'font-size 0.2s ease' }} dangerouslySetInnerHTML={{ __html: processedDevotional }} />
              
              {youtubeIds.length > 0 && (
                <div className="youtube-container" style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto 0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {youtubeIds.map((id, index) => (
                    <iframe
                      key={`${id}-${index}`}
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${id}`}
                      title={`Devotional Video ${index + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    ></iframe>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto' }}>
                {user && (!hasShared || editingId) ? (
                  <div id="devotional-input" style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #333' : '1px solid #eee' }}>
                    <textarea placeholder="What is the Spirit saying to you today?" value={reflection} onChange={(e) => setReflection(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>{editingId ? "Update Reflection" : "Share with the Body"}</button>
                      {editingId ? <button onClick={handleCancelEdit} className="secondary-btn" style={{backgroundColor: '#e53e3e', color: 'white', border: 'none'}}>Cancel</button> : <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>}
                    </div>
                  </div>
                ) : hasShared && !editingId ? <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#0f2f21' : '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: theme === 'dark' ? '#81e6d9' : '#276749' }}><p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body!</p></div> : null}
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>There are <strong>{communityReflections.length > 0 ? communityReflections.length - 1 : 0} others</strong> in {CITY_NAME} reading this today.</p>
            </section>

            {user ? (
              <section className="directory" style={{ marginTop: '40px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0px' }}>{CITY_NAME} Body Directory</h2>
                <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.75rem', color: '#888', maxWidth: '90%', margin: '5px auto 25px auto', lineHeight: '1.4' }}>"But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." <span style={{fontWeight:'bold'}}>— Gal 5:22-23</span></p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {communityReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : communityReflections.map((post) => (
                    <MemberCard 
                        key={post.id || post.userId}
                        user={{ displayName: post.userName, photoURL: post.userPhoto }} 
                        thought={post.text} 
                        reactions={post.reactions}
                        location={post.location} 
                        onReact={(fruitId) => handleReaction(post.id, fruitId)}
                        onSearch={triggerSearch}
                        onProfileClick={() => goToProfile(post.userId)} 
                        currentUserId={user.uid}
                        isOwner={user && user.uid === post.userId}
                        onEdit={() => handleEditClick(post)}
                        onDelete={() => handleDeleteClick(post.id)}
                        onShare={() => handleShareItem(post.text)}
                    />
                  ))}
                </div>
              </section>
            ) : <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}><p>Ready to join the local Body?</p><Login theme={theme} /></section>}
          </>
        )}
      </main>
      
      {user && <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px', borderTop: '1px solid #eee' }}><button onClick={logout} className="secondary-btn" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Logout</button></footer>}
      <Suspense fallback={null}>
        <SearchWell 
          theme={theme} 
          isOpen={isWellOpen} 
          onClose={handleWellClose} 
          initialQuery={wellQuery} 
          onJumpToVerse={jumpToVerse}
          historyStack={bibleHistory}
          onGoBack={goBackInBible}
          user={user}
        />
      </Suspense>
    </div>
  );
}
export default App;