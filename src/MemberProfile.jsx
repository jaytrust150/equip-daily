import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import MemberCard from './MemberCard';

function MemberProfile({ theme, viewingUid, onNavigate }) {
  const [currentUser] = useAuthState(auth);
  
  // Decide WHOSE profile we are looking at (Mine vs. Others)
  const targetUid = viewingUid || (currentUser ? currentUser.uid : null);
  const isMyProfile = currentUser && targetUid === currentUser.uid;

  // --- PROFILE DATA ---
  const [profileData, setProfileData] = useState(null);
  const [location, setLocation] = useState("");
  const [isHistoryPublic, setIsHistoryPublic] = useState(true); // Default to public
  
  // --- EDITING STATE ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // --- HISTORY STATE ---
  const [myReflections, setMyReflections] = useState([]);
  const [fruitStats, setFruitStats] = useState({ total: 0, breakdown: {} });

  // 1. FETCH PROFILE INFO (Location & Privacy Settings)
  useEffect(() => {
    if (!targetUid) return;
    const fetchProfile = async () => {
      const docRef = doc(db, "users", targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setLocation(data.location || "Sebastian");
        // Load privacy setting (default to true if missing)
        setIsHistoryPublic(data.isHistoryPublic !== undefined ? data.isHistoryPublic : true);
      } else {
        setLocation("Sebastian"); // Default
      }
    };
    fetchProfile();
  }, [targetUid]);

  // 2. FETCH HISTORY & STATS (Only if Public OR It's Me)
  useEffect(() => {
    if (!targetUid) return;
    
    // Privacy Check: If it's not me AND history is private, don't fetch.
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
            const count = data.reactions[fruitKey].length;
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
    if (!isMyProfile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { 
        location: location,
        isHistoryPublic: isHistoryPublic, // Save the toggle
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

  // Use profile data from DB if available, otherwise fallback to Auth (if it's me)
  const displayPhoto = profileData?.photoURL || (isMyProfile ? currentUser.photoURL : "");
  const displayName = profileData?.displayName || (isMyProfile ? currentUser.displayName : "Member");
  const displayEmail = profileData?.email || (isMyProfile ? currentUser.email : "");

  return (
    <div className="profile-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', color: theme === 'dark' ? '#fff' : '#333' }}>
      
      {/* 🔙 BACK BUTTON (If viewing someone else) */}
      {!isMyProfile && (
          <button onClick={() => onNavigate('devotional')} style={{ marginBottom: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#2196F3', fontWeight: 'bold' }}>
              ← Back to Directory
          </button>
      )}

      {/* 👤 TOP CARD: User Info */}
      <div style={{ 
        backgroundColor: theme === 'dark' ? '#222' : '#fff', padding: '25px', borderRadius: '12px', 
        border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', marginBottom: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <img src={displayPhoto} alt={displayName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2196F3', marginBottom: '10px' }} />
        <h2 style={{ margin: '0 0 5px 0' }}>{displayName}</h2>
        <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '0.9rem' }}>{displayEmail}</p>

        {/* 📍 LOCATION & SETTINGS (Editable ONLY if it's ME) */}
        {isMyProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>My City:</label>
                    <input 
                        type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
                        placeholder="e.g. Sebastian"
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', width: '150px', backgroundColor: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }} 
                    />
                </div>

                {/* 🔒 PRIVACY TOGGLE */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#555' }}>
                    <input 
                        type="checkbox" 
                        checked={isHistoryPublic} 
                        onChange={(e) => setIsHistoryPublic(e.target.checked)}
                        style={{ accentColor: '#2196F3', width: '16px', height: '16px' }}
                    />
                    Make my History Public?
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={handleSaveProfile} disabled={isSaving} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                    {saveMessage && <span style={{ color: '#276749', fontWeight: 'bold', fontSize: '0.9rem' }}>{saveMessage}</span>}
                </div>
            </div>
        ) : (
            // READ ONLY VIEW
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    📍 {location} Body
                </span>
            </div>
        )}
      </div>

      {/* 🍇 FRUIT BASKET STATS (Only if Public or Me) */}
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
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '5px', textAlign: 'right' }}>
                        {post.chapter ? `Reflecting on ${post.chapter}` : `Daily Devotional (${post.date})`}
                    </div>
                    <MemberCard 
                        user={{ displayName: post.userName, photoURL: post.userPhoto }} 
                        thought={post.text} 
                        reactions={post.reactions}
                        location={post.location} // Show location on history cards too
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