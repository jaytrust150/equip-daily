import React from 'react';
function MemberCard({ user, thought, reactions, location, onSearch, onReact, onProfileClick, currentUserId, isOwner, onEdit, onDelete }) {
  const fruits = [{ id: 'love', label: 'Love', icon: '❤️' }, { id: 'joy', label: 'Joy', icon: '😊' }, { id: 'peace', label: 'Peace', icon: '🕊️' }, { id: 'patience', label: 'Patience', icon: '⏳' }, { id: 'kindness', label: 'Kindness', icon: '🤲' }, { id: 'goodness', label: 'Goodness', icon: '🌟' }, { id: 'faithfulness', label: 'Faithfulness', icon: '🤝' }, { id: 'gentleness', label: 'Gentleness', icon: '🧸' }, { id: 'selfControl', label: 'Self-Control', icon: '🛑' }];
  
  const renderThought = (text) => {
    if (!text) return null;
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+\s\d+:\d+(?:-\d+)?)/g;
    return text.split(verseRegex).map((part, index) => part.match(verseRegex) ? <span key={index} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onSearch) onSearch(part); }} style={{ color: '#2196F3', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>{part}</span> : part);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff', maxWidth: '450px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
      {isOwner && <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', fontSize: '0.75rem' }}><button onClick={onEdit}>Edit</button>|<button onClick={onDelete} style={{color:'red'}}>Delete</button></div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src={user.photoURL} alt={user.displayName} onClick={onProfileClick} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
        <div style={{ textAlign: 'left' }}><h3 onClick={onProfileClick} style={{ margin: '0', fontSize: '0.95rem', cursor: 'pointer' }}>{user.displayName}</h3>{location && <span style={{ fontSize: '0.65rem', backgroundColor: '#e3f2fd', color: '#1976d2', padding: '2px 6px', borderRadius: '4px' }}>{location} Body</span>}<p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>"{renderThought(thought)}"</p></div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>{fruits.map(fruit => { const count = reactions?.[fruit.id]?.length || 0; const hasReacted = reactions?.[fruit.id]?.includes(currentUserId); return <button key={fruit.id} onClick={(e) => { e.preventDefault(); if (onReact) onReact(fruit.id); }} style={{ background: hasReacted ? '#e3f2fd' : 'transparent', border: hasReacted ? '1px solid #2196F3' : '1px solid #eee', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem' }}>{fruit.icon} {fruit.label} {count > 0 && <b>{count}</b>}</button>; })}</div>
    </div>
  );
}
export default MemberCard;