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
  const [displayDate, setDisplayDate] = useState("");
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const fileName = `${month}.${day}-devotional.txt`;

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    setDisplayDate(targetDate.toLocaleDateString(undefined, options));

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

  if (loading) {
    return <div className="app-container"><h3>Loading...</h3></div>;
  }

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
          
          {/* 📅 UPDATED TOP NAVIGATION SECTION */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2c3e50', marginBottom: '10px' }}>
              {displayDate}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn">
                ← Prior Day
              </button>
              
              <button 
                onClick={() => setDayOffset(0)} 
                className="nav-btn" 
                style={{ backgroundColor: '#f0f0f0', color: '#333' }}
              >
                Today
              </button>

              <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn">
                Next Day →
              </button>
            </div>
          </div>

          <div 
            className="devotional-content"
            style={{ 
              fontSize: '1.1rem', 
              maxWidth: '700px', 
              margin: '0 auto', 
              lineHeight: '1.7',
              textAlign: 'left',
              color: '#333',
              backgroundColor: '#fff',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
            dangerouslySetInnerHTML={{ __html: devotional }} 
          />
          
          {/* 📅 BOTTOM NAVIGATION */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={() => setDayOffset(dayOffset - 1)} className="nav-btn">
              ← Prior Day
            </button>
            <button onClick={() => setDayOffset(0)} className="nav-btn" style={{ backgroundColor: '#f0f0f0', color: '#333' }}>
              Today
            </button>
            <button onClick={() => setDayOffset(dayOffset + 1)} className="nav-btn">
              Next Day →
            </button>
          </div>
          
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '40px' }}>
            There are <strong>14 others</strong> in Sebastian reading this today.
          </p>
        </section>

        {user ? (
          <section className="directory" style={{ marginTop: '40px' }}>
            <h2 style={{ textAlign: 'center' }}>Church Directory</h2>
            <MemberCard user={user} />
          </section>
        ) : (
          <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>Ready to join the local Body?</p>
            <button onClick={login} className="login-btn">
              Login to Join the Directory
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;