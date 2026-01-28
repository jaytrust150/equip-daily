import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import { subscribeToReflections, saveReflection, deleteReflection, toggleFruitReaction } from '../services/firestoreService';
import { CITY_NAME } from '../config/constants';

function CommunityFeed({ queryField, queryValue, user, theme, onSearch, onProfileClick, title }) {
  const [reflections, setReflections] = useState([]);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReflections(queryField, queryValue, (data) => {
      setReflections(data);
      if (user) {
        const myPost = data.find(r => r.userId === user.uid);
        if (myPost) { setHasShared(true); if (!editingId) setInputText(myPost.text); } else { setHasShared(false); if (!editingId) setInputText(""); }
      }
    });
    return () => unsub();
  }, [queryField, queryValue, user, editingId]);

  const handleSubmit = async () => { await saveReflection(user, inputText, queryField, queryValue, editingId); setEditingId(null); setInputText(""); };

  return (
    <div style={{ marginTop: '30px' }}>
      {user && (!hasShared || editingId) && <div style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px' }}><textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Share with the Body..." style={{ width: '100%', height: '100px' }} /><button onClick={handleSubmit}>{editingId ? "Update" : "Share"}</button></div>}
      <h3 style={{ textAlign: 'center', marginTop: '40px' }}>{title || `${CITY_NAME} Body Directory`}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{reflections.map(post => <MemberCard key={post.id} user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} reactions={post.reactions} location={post.location} onReact={(fruitId) => toggleFruitReaction(post.id, fruitId, user?.uid, post.reactions)} currentUserId={user?.uid} isOwner={user?.uid === post.userId} onEdit={() => { setEditingId(post.id); setInputText(post.text); }} onDelete={() => deleteReflection(post.id)} onSearch={onSearch} onProfileClick={() => onProfileClick(post.userId)} />)}</div>
    </div>
  );
}
export default CommunityFeed;