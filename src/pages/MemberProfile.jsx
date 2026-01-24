import React, { useState, useEffect } from 'react';
// ✅ FIXED IMPORTS
import { auth, db } from "../config/firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import MemberCard from '../components/Shared/MemberCard';

function MemberProfile({ theme, viewingUid, onNavigate, onJumpToHistory, previousTab }) {
  const [currentUser] = useAuthState(auth);
  
  // Decide WHOSE profile we are looking at (Mine vs. Others)
  const targetUid = viewingUid || (currentUser ? currentUser.uid : null);
  const isMyProfile = currentUser && targetUid === currentUser.uid;

  // --- PROFILE DATA ---
  const [profileData, setProfileData] = useState(null);
  const [location, setLocation] = useState("");
  const [homeChurch, setHomeChurch] = useState(""); 
  const [isHistoryPublic, setIsHistoryPublic] = useState(true); 
  
  // --- EDITING STATE ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // --- HISTORY STATE ---
  const [myReflections, setMyReflections] = useState([]);
  const [fruitStats, setFruitStats] = useState({ total: 0, breakdown: {} });

  // 1. FETCH PROFILE INFO
  useEffect(() => {
    if (!targetUid || !db) return; // ✅ Check if db exists
    const fetchProfile = async () => {
      const docRef = doc(db, "users", targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setLocation(data.location || "Sebastian");
        setHomeChurch(data.homeChurch || ""); 
        setIsHistoryPublic(data.isHistoryPublic !== undefined ? data.isHistoryPublic : true);
      } else {
        setLocation("Sebastian"); 
      }
    };
    fetchProfile();
  }, [targetUid]);

  // 2. FETCH HISTORY & STATS
  useEffect(() => {
    if (!targetUid || !db) return; // ✅ Check if db exists
    
    if (!isMyProfile && !isHistoryPublic) {
        setMyReflections([]);
        return; 
    }

    const q = query(
      collection(db, "reflections"), 
      where("userId", "==", targetUid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = [];
      let totalFruit = 0;
      let fruitCounts = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({ id: doc.id, ...data });

        if (data.reactions) {
          Object.keys(data.reactions).forEach(fruitKey => {
            const count = data.reactions[fruitKey]?.length || 0;
            totalFruit += count;
            fruitCounts[fruitKey] = (fruitCounts[fruitKey] || 0) + count;
          });
        }
      });

      setMyReflections(fetchedPosts);
      setFruitStats({ total: totalFruit, breakdown: fruitCounts });
    });

    return () => unsubscribe();
  }, [targetUid, isMyProfile, isHistoryPublic]);

  // --- ACTIONS ---
  const handleSaveProfile = async () => {
    if (!isMyProfile || !db) return; // ✅ Check if db exists
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { 
        location: location,
        homeChurch: homeChurch, 
        isHistoryPublic: isHistoryPublic,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        email: currentUser.email
      }, { merge: true });
      
      setSaveMessage("✓ Saved!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (e) {
      console.error("Error saving profile:", e);
      setSaveMessage("❌ Error");
    }
    setIsSaving(false);
  };

  const getFruitIcon = (id) => {
    const map = { love: '❤️', joy: '😊', peace: '🕊️', patience: '⏳', kindness: '🤲', goodness: '🌟', faithfulness: '🤝', gentleness: '🧸', selfControl: '🛑' };
    return map[id] || '🍎';
  };

  if (!targetUid) return <div style={{textAlign:'center', padding:'40px'}}>Loading...</div>;

  const displayPhoto = profileData?.photoURL || (isMyProfile ? currentUser.photoURL : "");
  const displayName = profileData?.displayName || (isMyProfile ? currentUser.displayName : "Member");
  const displayEmail = profileData?.email || (isMyProfile ? currentUser.email : "");
  
  const displayChurch = isMyProfile ? homeChurch : (profileData?.homeChurch || "");
  const displayLocation = isMyProfile ? location : (profileData?.location || "Sebastian");

  // 🔙 DYNAMIC BACK BUTTON LABEL
  const backLabel = previousTab === 'bible' ? 'Return to Bible' : 'Back to Directory';

  return (
    <div className="profile-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', color: theme === 'dark' ? '#fff' : '#333' }}>
      
      {/* 🔙 BACK BUTTON (SMART NAV) */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
        <button 
            onClick={() => onNavigate(previousTab || 'devotional')} 
            style={{ 
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', 
                color: '#2196F3', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' 
            }}
        >
            <span>←</span> {backLabel}
        </button>
      </div>

      {/* 👤 TOP CARD */}
      <div style={{ 
        backgroundColor: theme === 'dark' ? '#222' : '#fff', padding: '25px', borderRadius: '12px', 
        border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', marginBottom: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <img src={displayPhoto} alt={displayName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2196F3', marginBottom: '10px' }} />
        <h2 style={{ margin: '0 0 5px 0' }}>{displayName}</h2>
        <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '0.9rem' }}>{displayEmail}</p>

        {/* ✏️ EDIT MODE (It's Me) */}
        {isMyProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', width: '90px', textAlign: 'right' }}>My City:</span>
                        <input 
                            type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
                            placeholder="e.g. Sebastian"
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', width: '180px', backgroundColor: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} 
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', width: '90px', textAlign: 'right' }}>Home Church:</span>
                        <input 
                            type="text" value={homeChurch} onChange={(e) => setHomeChurch(e.target.value)} 
                            placeholder="e.g. Coastal Church" 
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', width: '180px', backgroundColor: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} 
                        />
                    </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#555' }}>
                    <input 
                        type="checkbox" checked={isHistoryPublic} onChange={(e) => setIsHistoryPublic(e.target.checked)}
                        style={{ accentColor: '#2196F3', width: '16px', height: '16px' }}
                    />
                    Make my History Public?
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                    <button onClick={handleSaveProfile} disabled={isSaving} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                    {saveMessage && <span style={{ color: '#276749', fontWeight: 'bold', fontSize: '0.9rem' }}>{saveMessage}</span>}
                </div>
            </div>
        ) : (
            // 👀 VIEW MODE (Viewing Others)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📍 {displayLocation} Body
                </span>
                
                {displayChurch && (
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayChurch + " " + displayLocation)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ textDecoration: 'none' }}
                    >
                        <span style={{ 
                            backgroundColor: theme === 'dark' ? '#333' : '#fff3cd', 
                            color: theme === 'dark' ? '#ffd700' : '#856404', 
                            border: theme === 'dark' ? '1px solid #555' : '1px solid #ffeeba',
                            padding: '4px 12px', borderRadius: '15px', 
                            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            ⛪ {displayChurch} (Map)
                        </span>
                    </a>
                )}
            </div>
        )}
      </div>

      {/* 🍇 FRUIT BASKET STATS */}
      {(isMyProfile || isHistoryPublic) && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Spiritual Fruit Basket</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {Object.entries(fruitStats.breakdown).length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No reactions received yet.</p>
            ) : (
                Object.entries(fruitStats.breakdown).map(([key, count]) => (
                <div key={key} style={{ background: theme === 'dark' ? '#333' : '#e3f2fd', padding: '8px 12px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    <span>{getFruitIcon(key)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{key}</span>
                    <strong style={{ marginLeft: '4px' }}>{count}</strong>
                </div>
                ))
            )}
            </div>
          </div>
      )}

      {/* 📜 HISTORY LOG */}
      <div>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Reflection History</h3>
        {(!isMyProfile && !isHistoryPublic) ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: theme === 'dark' ? '#222' : '#f9f9f9', borderRadius: '12px', color: '#888' }}>
                🔒 This member has kept their history private.
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {myReflections.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888' }}>No reflections shared yet.</p>
            ) : (
                myReflections.map((post) => (
                <div key={post.id}>
                    <div 
                        onClick={() => onJumpToHistory && onJumpToHistory(post)}
                        style={{ fontSize: '0.75rem', color: '#2196F3', marginBottom: '5px', textAlign: 'right', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                        {post.chapter ? `↪ Reflecting on ${post.chapter}` : `↪ Daily Devotional (${post.date})`}
                    </div>
                    <MemberCard 
                        user={{ displayName: post.userName, photoURL: post.userPhoto }} 
                        thought={post.text} reactions={post.reactions} location={post.location} 
                        currentUserId={currentUser ? currentUser.uid : null}
                    />
                </div>
                ))
            )}
            </div>
        )}
      </div>
    </div>
  );
}

export default MemberProfile;