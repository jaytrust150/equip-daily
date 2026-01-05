import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MemberCard from './MemberCard';
import BibleReader from './BibleReader';
import './App.css';
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore"; 

function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('devotional');
  const [theme, setTheme] = useState('light'); 

  const [devotional, setDevotional] = useState("Loading the Word...");
  const [dayOffset, setDayOffset] = useState(0); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [communityReflections, setCommunityReflections] = useState([]);
  
  // ⚡ FONT SIZE STATE FOR FRONT PORCH
  const [fontSize, setFontSize] = useState(1.1);

  const provider = new GoogleAuthProvider();
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 🔍 Font Size Handlers
  const increaseFont = () => setFontSize(prev => Math.min(prev + 0.1, 2.0));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));

  const appStyle = {
    display: 'flex', 
    flexDirection: 'column', 
    minHeight: '100vh',
    backgroundColor: theme === 'dark' ? '#222222' : '#ffffff',
    color: theme === 'dark' ? '#f0f0f0' : '#333',
    transition: 'all 0.3s ease',
    '--devotional-font-size': `${fontSize}rem` // CSS Variable for performance
  };

  const buttonStyle = {
    background: theme === 'dark' ? '#333' : '#f0f0f0',
    color: theme === 'dark' ? '#fff' : '#333',
    borderRadius: '20px', padding: '8px 15px', 
    border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', 
    fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    setCurrentDate(targetDate);
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const fileName = `${month}.${day}-devotional.txt`;

    fetch(`/${fileName}`)
      .then(res => { if (!res.ok) throw new Error("File not found"); return res.text(); })
      .then(text => { setDevotional(text); setHasShared(false); setReflection(""); })
      .catch(() => { setDevotional(`<div style="text-align: center; padding: 20px;"><p>Edits in Progress for ${targetDate.toLocaleDateString()}</p></div>`); });
  }, [dayOffset]);

  useEffect(() => {
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    const q = query(collection(db, "reflections"), where("date", "==", dateKey));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReflections = [];
      querySnapshot.forEach((doc) => { fetchedReflections.push(doc.data()); });
      setCommunityReflections(fetchedReflections);
      if (user) {
        const myPost = fetchedReflections.find(r => r.userId === user.uid);
        if (myPost) { setHasShared(true); setReflection(myPost.text); }
      }
    });
    return () => unsubscribe();
  }, [currentDate, user]);

  const saveReflection = async () => {
    if (!reflection.trim()) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    try {
      await setDoc(doc(db, "reflections", `${user.uid}_${dateKey}`), {
        userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
        text: reflection, date: dateKey, timestamp: serverTimestamp(), location: "Sebastian"
      });
    } catch (e) { console.error("Error saving reflection: ", e); }
  };

  const handleShare = async () => {
    const shareData = { title: 'Equip Daily', text: `Reading the devotional for ${currentDate.toDateString()}.`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } 
    else { try { await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`); alert("Copied!"); } catch (err) {} }
  };

  const handleMonthChange = (e) => {
    const newDate = new Date(currentDate); newDate.setMonth(parseInt(e.target.value)); updateOffset(newDate);
  };
  const handleDayChange = (e) => {
    const newDate = new Date(currentDate); newDate.setDate(parseInt(e.target.value)); updateOffset(newDate);
  };
  const updateOffset = (selectedDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((selectedDate - today) / (1000 * 60 * 60 * 24));
    setDayOffset(diffDays);
  };

  if (loading) return <div className="app-container"><h3>Loading...</h3></div>;

  const secretSelectStyle = {
    border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1.25rem',
    color: theme === 'dark' ? '#f0f0f0' : '#2c3e50', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
    outline: 'none', fontFamily: 'inherit', padding: 0, margin: 0
  };

  return (
    <div className="app-container" style={appStyle}>
      <header style={{ position: 'relative', textAlign: 'center', paddingTop: '20px' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
           <button onClick={() => setActiveTab(activeTab === 'devotional' ? 'bible' : 'devotional')} style={{ ...buttonStyle, backgroundColor: activeTab === 'bible' ? '#2196F3' : buttonStyle.background, color: activeTab === 'bible' ? 'white' : buttonStyle.color }}>
            {activeTab === 'devotional' ? '📖 Bible' : '🙏 Daily'}
          </button>
        </div>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
           <button onClick={toggleTheme} style={buttonStyle}>
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>

        <h1>Equip Daily</h1>
        <p>For the equipping of the saints.</p>
        <hr style={{ width: '50%', margin: '20px auto', borderColor: theme === 'dark' ? '#444' : '#eee' }} />

        {user && (
          <div className="user-profile" style={{ marginBottom: '5px' }}>
            <p style={{ margin: '0', color: theme === 'dark' ? '#aaa' : '#555', fontStyle: 'italic' }}>Grace and peace, {user.displayName}</p>
          </div>
        )}
      </header>
      
      <main style={{ flex: 1 }}>
        {activeTab === 'bible' ? (
          <BibleReader theme={theme} />
        ) : (
          <>
            <section className="devotional-porch" style={{ textAlign: 'center', padding: '0 20px 20px 20px' }}>
              <div style={{ marginBottom: '30px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: '15px' }}>
                    <select value={currentDate.getMonth()} onChange={handleMonthChange} style={{ ...secretSelectStyle, textAlign: 'right', width: '120px', paddingRight: '5px' }}>
                      {months.map((m, i) => <option key={m} value={i} style={{color: '#333'}}>{m}</option>)}
                    </select>
                    <select value={currentDate.getDate()} onChange={handleDayChange} style={{ ...secretSelectStyle, width: currentDate.getDate() > 9 ? '35px' : '20px', textAlign: 'right', paddingRight: '2px' }}>
                      {[...Array(31)].map((_, i) => <option key={i+1} value={i+1} style={{color: '#333'}}>{i+1}</option>)}
                    </select><span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: theme === 'dark' ? '#f0f0f0' : '#2c3e50' }}>, {currentDate.getFullYear()}</span>
                </div>
                
                {/* 🔘 NAVIGATION BUTTONS WITH FONT CONTROLS */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                  <button onClick={handleShare} className="nav-btn" style={{ backgroundColor: '#e3f2fd', color: '#1976d2', border: '1px solid #bbdefb' }}>Share</button>
                  <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn">← Prior</button>
                  <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333' }}>Today</button>
                  <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn">Next →</button>
                  
                  {/* ⚡ MIRRORED FONT CONTROLS FROM BIBLE APP */}
                  <button onClick={decreaseFont} className="nav-btn" style={{ padding: '5px 12px', fontSize: '0.9rem', fontWeight: 'bold' }}>-</button>
                  <button onClick={increaseFont} className="nav-btn" style={{ padding: '5px 10px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
                </div>
              </div>

              <div 
                className="devotional-content" 
                style={{ 
                  fontSize: 'var(--devotional-font-size)', 
                  lineHeight: '1.7', 
                  textAlign: 'left', 
                  color: theme === 'dark' ? '#ccc' : '#333', 
                  backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                  padding: '25px', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'font-size 0.2s ease' // Smooth scaling
                }} 
                dangerouslySetInnerHTML={{ __html: devotional }} 
              />
              
              <div style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto' }}>
                {user && !hasShared ? (
                  <div style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                      <textarea placeholder="What is the Spirit saying to you today?" value={reflection} onChange={(e) => setReflection(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>Share with the Body</button>
                        <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>
                      </div>
                  </div>
                ) : hasShared ? (
                  <div style={{ padding: '20px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: '#276749' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body!</p>
                  </div>
                ) : null}
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>There are <strong>{communityReflections.length > 0 ? communityReflections.length - 1 : 0} others</strong> in Sebastian reading this today.</p>
            </section>

            {user ? (
              <section className="directory" style={{ marginTop: '40px' }}>
                <h2 style={{ textAlign: 'center' }}>Sebastian Body Directory</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {communityReflections.length === 0 ? <p style={{ textAlign: 'center', color: '#888' }}>No reflections yet. Be the first to share!</p> : communityReflections.map((post) => <MemberCard key={post.userId} user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} />)}
                </div>
              </section>
            ) : (
              <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}>
                <p>Ready to join the local Body?</p>
                <button onClick={login} className="login-btn">Login to Join the Directory</button>
              </section>
            )}
          </>
        )}
      </main>
      {user && (
        <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px', borderTop: '1px solid #eee' }}>
          <button onClick={logout} className="secondary-btn" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Logout</button>
        </footer>
      )}
    </div>
  );
}

export default App;