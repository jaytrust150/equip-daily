import React, { useState, useEffect, useMemo } from 'react';
import BibleReader from './BibleReader';
import MemberCard from './MemberCard';
import Login from './Login';
import SearchWell from './SearchWell'; 
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import './App.css';

function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('devotional');
  const [theme, setTheme] = useState('light');

  // --- 📖 BIBLE STATE ---
  const [bibleBook, setBibleBook] = useState('Genesis');
  const [bibleChapter, setBibleChapter] = useState(1);

  // --- 💧 THE WELL STATE ---
  const [isWellOpen, setIsWellOpen] = useState(false);
  const [wellQuery, setWellQuery] = useState("");

  const [devotional, setDevotional] = useState("Loading the Word...");
  const [dayOffset, setDayOffset] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // --- 🚀 NAVIGATION HELPER ---
  const jumpToVerse = (book, chapter) => {
    setBibleBook(book);
    setBibleChapter(parseInt(chapter));
    setActiveTab('bible');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 🔍 SEARCH HELPER (Passed down to Reader) ---
  const triggerSearch = (query) => {
    if (!query) return;
    setWellQuery(query);
    setIsWellOpen(true);
  };

  // --- 🔗 HYPERLINK LOGIC ---
  const processDevotionalText = (text) => {
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+)\s(\d+):(\d+)(-\d+)?/g;
    return text.replace(verseRegex, (match) => {
      return `<span class="verse-link" style="color: #2196F3; cursor: pointer; text-decoration: underline; font-weight: bold;">${match}</span>`;
    });
  };

  const processedDevotional = useMemo(() => {
    return processDevotionalText(devotional);
  }, [devotional]);

  const handleDevotionalInteraction = (e) => {
    if (e.target.classList.contains('verse-link')) {
      const verseRef = e.target.innerText;
      setWellQuery(verseRef);
      if (e.type === 'click' || e.type === 'mouseover') {
         setIsWellOpen(true);
      }
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    setCurrentDate(targetDate);
    
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const fileName = `${month}.${day}-devotional.txt`;

    setEditingId(null); 

    fetch(`/${fileName}`)
      .then(res => { if (!res.ok) throw new Error("File not found"); return res.text(); })
      .then(text => { setDevotional(text); setHasShared(false); setReflection(""); })
      .catch(() => { setDevotional(`<div style="text-align: center; padding: 20px;"><p>Edits in Progress for ${targetDate.toLocaleDateString()}</p></div>`); });
  }, [dayOffset]);

  // --- FETCH REFLECTIONS ---
  useEffect(() => {
    if (!db) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    const q = query(collection(db, "reflections"), where("date", "==", dateKey));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReflections = [];
        querySnapshot.forEach((doc) => { 
            fetchedReflections.push({ id: doc.id, ...doc.data() }); 
        });
        setCommunityReflections(fetchedReflections);
        if (user) {
          const myPost = fetchedReflections.find(r => r.userId === user.uid);
          if (myPost) { 
              setHasShared(true); 
              if (!editingId) setReflection(myPost.text); 
          } else {
              setHasShared(false); 
              if (!editingId) setReflection("");
          }
        }
    });
    return () => unsubscribe();
  }, [currentDate, user, editingId]);

  // --- ACTIONS ---
  const saveReflection = async () => {
    if (!reflection.trim() || !user || !db) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    try {
      if (editingId) {
         const refDoc = doc(db, "reflections", editingId);
         await updateDoc(refDoc, { text: reflection, timestamp: serverTimestamp(), isEdited: true });
         setEditingId(null);
         setReflection("");
      } else {
         await setDoc(doc(db, "reflections", `${user.uid}_${dateKey}`), { userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, text: reflection, date: dateKey, timestamp: serverTimestamp(), location: "Sebastian" });
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
      if (window.confirm("Are you sure you want to delete this reflection?")) {
          try {
              await deleteDoc(doc(db, "reflections", id));
              if (editingId === id) { setEditingId(null); setReflection(""); }
          } catch (e) { console.error("Error deleting:", e); }
      }
  };

  const handleShareItem = async (text) => {
    const shareData = { title: 'Equip Daily', text: text, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} }
    else { try { await navigator.clipboard.writeText(text); alert("Text copied to clipboard!"); } catch (err) {} }
  };

  // STYLES
  const appStyle = { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme === 'dark' ? '#222222' : '#ffffff', color: theme === 'dark' ? '#f0f0f0' : '#333', transition: 'all 0.3s ease', '--devotional-font-size': `${fontSize}rem` };
  const buttonStyle = { background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', borderRadius: '20px', padding: '5px 12px', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
  const navBtnStyle = { padding: '5px 10px', fontSize: '0.85rem' };
  const secretSelectStyle = { border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1.25rem', color: theme === 'dark' ? '#f0f0f0' : '#2c3e50', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0 };

  if (loading) return <div className="app-container"><h3>Loading User Data...</h3></div>;

  return (
    <div className="app-container" style={appStyle}>
      <header style={{ position: 'relative', textAlign: 'center', paddingTop: '20px' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
           <button onClick={() => setActiveTab(activeTab === 'devotional' ? 'bible' : 'devotional')} style={buttonStyle}>
            {activeTab === 'devotional' ? '📖 Bible' : '🙏 Daily'}
           </button>
        </div>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
           <button onClick={toggleTheme} style={buttonStyle}>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</button>
        </div>
        
        <h1>Equip Daily</h1>
        
        {/* ✨ UPDATED SUBTITLE WITH QUOTES & REFERENCE ✨ */}
        <p style={{ marginTop: '5px', marginBottom: '20px', fontStyle: 'italic', opacity: 0.8 }}>
          "For the equipping of the saints." - Eph 4:12
        </p>

        <hr style={{ width: '50%', margin: '0px auto 20px auto', borderColor: theme === 'dark' ? '#444' : '#eee' }} />
        {user && (<div className="user-profile" style={{ marginBottom: '5px' }}><p style={{ margin: '0', color: theme === 'dark' ? '#aaa' : '#555', fontStyle: 'italic' }}>Grace and peace, {user.displayName}</p></div>)}
      </header>

      <main style={{ flex: 1 }}>
        {activeTab === 'bible' ? (
          <BibleReader 
            theme={theme} 
            book={bibleBook} setBook={setBibleBook} 
            chapter={bibleChapter} setChapter={setBibleChapter} 
            onSearch={triggerSearch}
          />
        ) : (
          <>
            <section className="devotional-porch" style={{ textAlign: 'center', padding: '0 20px 20px 20px' }}>
              <div style={{ marginBottom: '30px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: '15px' }}>
                  <select value={currentDate.getMonth()} onChange={(e) => { const d = new Date(currentDate); d.setMonth(parseInt(e.target.value)); setDayOffset(Math.round((d - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))); }} style={{ ...secretSelectStyle, textAlign: 'right', width: '120px', paddingRight: '5px' }}>{months.map((m, i) => <option key={m} value={i} style={{color: '#333'}}>{m}</option>)}</select>
                  <select value={currentDate.getDate()} onChange={(e) => { const d = new Date(currentDate); d.setDate(parseInt(e.target.value)); setDayOffset(Math.round((d - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))); }} style={{ ...secretSelectStyle, width: currentDate.getDate() > 9 ? '35px' : '20px', textAlign: 'right', paddingRight: '2px' }}>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>)}</select>
                  <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: theme === 'dark' ? '#f0f0f0' : '#2c3e50' }}>, {currentDate.getFullYear()}</span>
                </div>
                
                {/* 🎮 DEVOTIONAL TOOLBAR */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn" style={navBtnStyle}>← Prior</button>
                  <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ ...navBtnStyle, backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333' }}>Today</button>
                  <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn" style={navBtnStyle}>Next →</button>
                  <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
                  <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
                  
                  {/* 🔍 THE PILL */}
                  <button onClick={() => setIsWellOpen(!isWellOpen)} 
                      style={{ 
                          padding: '6px 15px', borderRadius: '20px', 
                          backgroundColor: isWellOpen ? '#2196F3' : 'transparent', 
                          color: isWellOpen ? 'white' : '#2196F3', 
                          border: '1px solid #2196F3', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' 
                      }}
                  >
                      🔍 Bible Search & Concordance
                  </button>
                </div>
              </div>

              <div className="devotional-content" 
                   onClick={handleDevotionalInteraction} 
                   onMouseOver={handleDevotionalInteraction}
                   style={{ fontSize: 'var(--devotional-font-size)', lineHeight: '1.7', textAlign: 'left', color: theme === 'dark' ? '#ccc' : '#333', backgroundColor: theme === 'dark' ? '#111' : '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'font-size 0.2s ease' }} 
                   dangerouslySetInnerHTML={{ __html: processedDevotional }} 
              />
              
              <div style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto' }}>
                {user && (!hasShared || editingId) ? (
                  <div id="devotional-input" style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #333' : '1px solid #eee' }}>
                    <textarea placeholder="What is the Spirit saying to you today?" value={reflection} onChange={(e) => setReflection(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>{editingId ? "Update Reflection" : "Share with the Body"}</button>
                      {editingId ? <button onClick={handleCancelEdit} className="secondary-btn" style={{backgroundColor: '#e53e3e', color: 'white', border: 'none'}}>Cancel</button> : <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>}
                    </div>
                  </div>
                ) : hasShared && !editingId ? (
                  <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#0f2f21' : '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: theme === 'dark' ? '#81e6d9' : '#276749' }}><p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body!</p></div>
                ) : null}
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>There are <strong>{communityReflections.length > 0 ? communityReflections.length - 1 : 0} others</strong> in Sebastian reading this today.</p>
            </section>

            {user ? (
              <section className="directory" style={{ marginTop: '40px' }}>
                <h2 style={{ textAlign: 'center' }}>Sebastian Body Directory</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {communityReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : communityReflections.map((post) => (
                    <div key={post.id || post.userId} style={{ position: 'relative' }}>
                      <MemberCard user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} />
                      {user && user.uid === post.userId && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleEditClick(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#888' : '#666', textDecoration: 'underline' }}>Edit</button>
                          <span style={{color: '#ccc'}}>|</span>
                          <button onClick={() => handleDeleteClick(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#e53e3e', textDecoration: 'underline' }}>Delete</button>
                          <span style={{color: '#ccc'}}>|</span>
                          <button onClick={() => handleShareItem(post.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: theme === 'dark' ? '#888' : '#666', textDecoration: 'underline' }}>Share</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}><p>Ready to join the local Body?</p><Login theme={theme} /></section>
            )}
          </>
        )}
      </main>
      
      {user && <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px', borderTop: '1px solid #eee' }}><button onClick={logout} className="secondary-btn" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Logout</button></footer>}

      {/* 💧 RENDER THE WELL with the JUMP Function! */}
      <SearchWell 
        theme={theme} 
        isOpen={isWellOpen} 
        onClose={() => setIsWellOpen(false)} 
        initialQuery={wellQuery}
        onJumpToVerse={jumpToVerse} 
      />
    </div>
  );
}

export default App;