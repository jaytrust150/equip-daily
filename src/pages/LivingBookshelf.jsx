import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from '../components/Auth/Login'; // Import your Login component

function LivingBookshelf({ theme }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen for User Login Status
  useEffect(() => {
    // ✅ Guard against undefined auth
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    // Optional: reload to clear state cleanly
    window.location.reload();
  };

  // 2. Loading State (prevents flickering)
  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  // 3. IF LOGGED OUT: Show Login Screen
  if (!user) {
    return (
      <div style={{ 
        padding: '30px 10px', 
        textAlign: 'center', 
        background: theme === 'dark' ? '#222' : '#f9f9f9',
        borderTop: '1px solid #ddd',
        marginTop: '40px'
      }}>
        <h3 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>Track Your Progress</h3>
        <p style={{ color: '#666', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
           Join the local Body to unlock your <strong>Living Bookshelf</strong>, save your reading history, and track your daily walk.
        </p>
        <Login theme={theme} />
      </div>
    );
  }

  // 4. IF LOGGED IN: Show The Bookshelf
  // (Paste your existing Bookshelf buttons/code inside the return below)
  return (
    <div style={{ 
      marginTop: '40px', 
      padding: '20px', 
      borderTop: '1px solid #eee' 
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: theme === 'dark' ? '#fff' : '#333', margin: 0 }}>Your Living Bookshelf</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span style={{ fontSize: '0.9rem', color: '#888' }}>
               👤 {user.displayName || "Member"}
             </span>
             <button 
               onClick={handleLogout} 
               style={{ 
                 background: 'none', border: '1px solid #ccc', 
                 padding: '5px 10px', borderRadius: '4px', cursor: 'pointer',
                 color: theme === 'dark' ? '#ccc' : '#333'
               }}>
               Sign Out
             </button>
          </div>
        </div>

        {/* --- 📚 PASTE YOUR EXISTING BOOKSHELF CODE HERE --- */}
        <div style={{ textAlign: 'center', padding: '40px', background: '#f0f0f0', borderRadius: '8px' }}>
           <p><strong>[Your Bookshelf Buttons Go Here]</strong></p>
           <p>Example: Genesis [ ] | Exodus [ ]</p>
           <p>Total Progress: 0%</p>
        </div>
        {/* -------------------------------------------------- */}
        
    </div>
  );
}

export default LivingBookshelf;