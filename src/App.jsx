import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import './App.css';
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; 

function App() {
  const [user, loading] = useAuthState(auth);
  const [devotional, setDevotional] = useState("Loading the Word...");
  const [dayOffset, setDayOffset] = useState(0); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Reflection States
  const [reflection, setReflection] = useState("");
  const [hasShared, setHasShared] = useState(false); // 🌟 Confirmation Trigger
  
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 📖 Fetch Devotional based on Date
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    setCurrentDate(targetDate);
    
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const fileName = `${month}.${day}-devotional.txt`;

    fetch(`/${fileName}`)
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.text();
      })
      .then(text => {
        setDevotional(text);
        // Reset everything for the new day
        setHasShared(false); 
        setReflection("");
      })
      .catch(() => {
        setDevotional(`
          <div style="text-align: center; padding: 20px;">
            <p>Edits in Progress for ${targetDate.toLocaleDateString()}</p>
            <p>May God bless your heart for seeking Him!</p>
            <p>Just say a prayer for today to Him! In Jesus' name, Amen!</p>
          </div>
        `);
      });
  }, [dayOffset]);

  // 🔥 Save Reflection to Firebase & Show Confirmation
  const saveReflection = async () => {
    if (!reflection.trim()) return;
    const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
    
    try {
      const docRef = doc(db, "reflections", `${user.uid}_${dateKey}`);
      await setDoc(docRef, {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: reflection,
        date: dateKey,
        timestamp: serverTimestamp(),
        location: "Sebastian"
      });
      
      // 🚀 SUCCESS: Update state to show the green "Amen" box
      setHasShared(true); 
      
    } catch (e) {
      console.error("Error saving reflection: ", e);
      alert("Something went wrong saving your reflection. Please try again!");
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);
    updateOffset(newDate);
  };

  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    const newDate = new Date(currentDate);
    newDate.setDate(newDay);
    updateOffset(newDate);
  };

  const updateOffset = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = selectedDate - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    setDayOffset(diffDays);
  };

  if (loading) return <div className="app-container"><h3>Loading...</h3></div>;

  const secretSelectStyle = {
    border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1.25rem',
    color: '#2c3e50', cursor: 'pointer', appearance: 'none', outline: 'none', fontFamily: 'inherit'
  };

  return (
    <div className="app-container">
      <header style={{ textAlign: 'center', paddingTop: '20px' }}>
        <h1>Equip Daily</h1>
        <p>For the equipping of the saints.</p>
        <hr style={{ width: '50%', margin: '20px auto', borderColor: '#eee' }} />
        {user && (
          <div className="user-profile" style={{ marginBottom: '20px' }}>
            <p>Grace and peace, {user.displayName}</p>
            <button onClick={logout} className="secondary-btn">Logout</button>
          </div>
        )}
      </header>
      
      <main>
        <section className="devotional-porch" style={{ textAlign: 'center', padding: '20px' }}>
          
          {/* 📅 Date Navigation Bar (Dynamic Spacing Fix) */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: '15px' }}>
                <select value={currentDate.getMonth()} onChange={handleMonthChange} style={{ ...secretSelectStyle, textAlign: 'right', width: '110px', paddingRight: '5px' }}>
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                
                {/* 🌟 THE FIX: Dynamic width based on digit count */}
                <select 
                  value={currentDate.getDate()} 
                  onChange={handleDayChange} 
                  style={{ 
                    ...secretSelectStyle, 
                    width: currentDate.getDate() > 9 ? '28px' : '16px', // Tightens if single digit
                    textAlign: 'center' 
                  }}
                >
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>

                <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2c3e50' }}>, {currentDate.getFullYear()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn">← Prior</button>
              <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ backgroundColor: '#f0f0f0', color: '#333' }}>Today</button>
              <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn">Next →</button>
            </div>
          </div>

          <div 
            className="devotional-content"
            style={{ 
              fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.7',
              textAlign: 'left', color: '#333', backgroundColor: '#fff', padding: '25px',
              borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
            dangerouslySetInnerHTML={{ __html: devotional }} 
          />
          
          {/* ✍️ Reflection Logic */}
          <div style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto' }}>
            {user && !hasShared ? (
              <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                  <textarea 
                    placeholder="What is the Spirit saying to you today?"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={saveReflection} className="login-btn" style={{ margin: 0 }}>Share with the Body</button>
                    <button onClick={() => setReflection("")} className="secondary-btn">Clear</button>
                  </div>
              </div>
            ) : hasShared ? (
              <div style={{ padding: '20px', backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', color: '#276749' }}>
                <p style={{ fontWeight: 'bold', margin: 0 }}>✓ Shared with the Body!</p>
                <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Your brothers and sisters can now see your reflection in the directory.</p>
              </div>
            ) : null}
          </div>

          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>
            There are <strong>14 others</strong> in Sebastian reading this today.
          </p>
        </section>

        {user && (
          <section className="directory" style={{ marginTop: '40px' }}>
            <h2 style={{ textAlign: 'center' }}>Sebastian Body Directory</h2>
            {/* 🛡️ Passing shared thought down to card */}
            <MemberCard user={user} thought={hasShared ? reflection : null} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;