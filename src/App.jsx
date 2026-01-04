import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import './App.css';
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

function App() {
  const [user, loading] = useAuthState(auth);
  const [devotional, setDevotional] = useState("Loading the Word...");
  const [dayOffset, setDayOffset] = useState(0); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
      .then(text => setDevotional(text))
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
    border: 'none',
    background: 'transparent',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    color: '#2c3e50',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    padding: '0',
    margin: '0',
    display: 'inline-block',
    fontFamily: 'inherit'
  };

  return (
    <div className="app-container">
      <header style={{ textAlign: 'center', paddingTop: '20px' }}>
        <h1>Equip Daily</h1>
        <p>For the equipping of the saints.</p>
        <hr style={{ width: '50%', margin: '20px auto', borderColor: '#eee' }} />
      </header>
      
      <main>
        <section className="devotional-porch" style={{ textAlign: 'center', padding: '20px' }}>
          
          <div style={{ marginBottom: '30px' }}>
            {/* 🎯 LEFT-ALIGNED DATE NAVIGATION */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', // This keeps the group centered, but...
              alignItems: 'baseline',
              marginBottom: '15px',
              width: '100%',
              paddingLeft: '0px' // Adjusted to keep the whole block naturally aligned
            }}>
              <div style={{ display: 'flex', gap: '0px', alignItems: 'baseline' }}>
                <select 
                  value={currentDate.getMonth()} 
                  onChange={handleMonthChange} 
                  style={{ ...secretSelectStyle, textAlign: 'right', paddingRight: '8px' }}
                >
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>

                <select 
                  value={currentDate.getDate()} 
                  onChange={handleDayChange} 
                  style={{ 
                    ...secretSelectStyle, 
                    width: currentDate.getDate() > 9 ? '26px' : '15px',
                    textAlign: 'center'
                  }}
                >
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>

                <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2c3e50' }}>, {currentDate.getFullYear()}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn">← Prior Day</button>
              <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ backgroundColor: '#f0f0f0', color: '#333' }}>Today</button>
              <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn">Next Day →</button>
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
          
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>
            There are <strong>14 others</strong> in Sebastian reading this today.
          </p>
        </section>

        {!user && (
          <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>Ready to join the local Body?</p>
            <button onClick={login} className="login-btn">Login to Join the Directory</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;