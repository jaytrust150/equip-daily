import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import './App.css';
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

function App() {
  const [user, loading] = useAuthState(auth);
  const [devotional, setDevotional] = useState("Loading today's Word...");
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // 📝 Fetch the daily devotional based on Month.Day format (e.g., 1.4-devotional.txt)
  useEffect(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    // Matches your specific naming convention
    const filePath = `/${month}.${day}-devotional.txt`;

    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error("Devotional not found");
        return res.text();
      })
      .then(text => setDevotional(text))
      .catch(err => {
        console.error("Devotional fetch error:", err);
        // Fallback message if the specific file isn't found
        setDevotional(`
          <p>Edits in Progress</p>
          <p>May God bless your heart for seeking Him!</p>
          <p>Just say a prayer for today to Him! In Jesus' name, Amen!</p>
        `);
      });
  }, []);

  if (loading) {
    return <div className="app-container"><h3>Loading...</h3></div>;
  }

  return (
    <div className="app-container">
      {/* 🏠 Header Section (Your Original Branding & Layout) */}
      <header style={{ textAlign: 'center', paddingTop: '20px' }}>
        <h1>Equip Daily</h1>
        <p>For the equipping of the saints.</p>
        
        {/* ➖ Your Original Separator Line */}
        <hr style={{ width: '50%', margin: '20px auto', borderColor: '#eee' }} />

        {/* Logout Profile - Only visible when logged in */}
        {user && (
          <div className="user-profile" style={{ marginBottom: '20px' }}>
            <p>Grace and peace, {user.displayName}</p>
            <button onClick={logout} className="secondary-btn">Logout</button>
          </div>
        )}
      </header>
      
      <main>
        {/* 🌿 THE FRONT PORCH (Public Devotional - Now using your date-based files) */}
        <section className="devotional-porch" style={{ textAlign: 'center', padding: '20px' }}>
          {/* dangerouslySetInnerHTML allows the HTML tags in your .txt files to render (like <p> or <b>) */}
          <div 
            className="devotional-content"
            style={{ 
              fontSize: '1.1rem', 
              maxWidth: '700px', 
              margin: '0 auto', 
              lineHeight: '1.7',
              textAlign: 'left', // Aligns text for easier reading of paragraphs
              color: '#333'
            }}
            dangerouslySetInnerHTML={{ __html: devotional }} 
          />
          
          {/* Locality Pulse - Placeholder */}
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '30px' }}>
            There are <strong>14 others</strong> in Sebastian reading this today.
          </p>
        </section>

        {/* 📖 MEMBERS AREA (Login Conditional) */}
        {user ? (
          <section className="directory" style={{ marginTop: '40px' }}>
            <h2 style={{ textAlign: 'center' }}>Church Directory</h2>
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px' }}>
              The body is one, yet has many members...
            </p>
            
            {/* 🛡️ Your Personal Member Card */}
            <MemberCard user={user} />
          </section>
        ) : (
          <section className="welcome" style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>Ready to join the local Body?</p>
            
            {/* 🟦 The Login Button */}
            <button 
              onClick={login} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#4285F4', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Login to Join the Directory
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App;