import React from 'react';

function MemberCard({ user, thought, reactions, onSearch, onReact, currentUserId, isOwner, onEdit, onDelete, onShare }) {
  
  // 🍎 THE FRUIT OF THE SPIRIT
  const fruits = [
    { id: 'love', label: 'Love', icon: '❤️' },
    { id: 'joy', label: 'Joy', icon: '😊' },
    { id: 'peace', label: 'Peace', icon: '🕊️' },
    { id: 'patience', label: 'Patience', icon: '⏳' },
    { id: 'kindness', label: 'Kindness', icon: '🤲' },
    { id: 'goodness', label: 'Goodness', icon: '🌟' },
    { id: 'faithfulness', label: 'Faithfulness', icon: '🤝' },
    { id: 'gentleness', label: 'Gentleness', icon: '🧸' },
    { id: 'selfControl', label: 'Self-Control', icon: '🛑' }
  ];

  // 🔗 THE PARSER
  const renderThought = (text) => {
    if (!text) return null;
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+\s\d+:\d+(?:-\d+)?)/g;
    const parts = text.split(verseRegex);

    return parts.map((part, index) => {
      if (part.match(verseRegex)) {
        return (
          <span 
            key={index} 
            onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                if (onSearch) onSearch(part); 
            }}
            style={{ color: '#2196F3', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
            title="Open in Search Well"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', gap: '15px', 
      padding: '15px', border: '1px solid #eee', borderRadius: '12px',
      backgroundColor: '#fff', maxWidth: '450px', margin: '0 auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative'
    }}>
      
      {/* 🛠 OWNER ACTIONS (Top Right, Inside Card) */}
      {isOwner && (
        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
            <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', textDecoration: 'underline', padding: 0 }}>Edit</button>
            <span style={{color: '#ddd'}}>|</span>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', textDecoration: 'underline', padding: 0 }}>Delete</button>
            <span style={{color: '#ddd'}}>|</span>
            <button onClick={onShare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', textDecoration: 'underline', padding: 0 }}>Share</button>
        </div>
      )}

      {/* 👤 HEADER: Photo & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingRight: isOwner ? '80px' : '0' }}>
        <img 
          src={user.photoURL} alt={user.displayName} 
          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
        />
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#333' }}>{user.displayName}</h3>
          {thought ? (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>"{renderThought(thought)}"</p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Member of the Body</p>
          )}
        </div>
      </div>

      {/* 🍓 REACTION BAR */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
        {fruits.map((fruit) => {
          const count = reactions && reactions[fruit.id] ? reactions[fruit.id].length : 0;
          const hasReacted = reactions && reactions[fruit.id] && reactions[fruit.id].includes(currentUserId);
          
          return (
            <button 
              key={fruit.id}
              onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onReact) onReact(fruit.id);
              }}
              style={{
                background: hasReacted ? '#e3f2fd' : 'transparent',
                border: hasReacted ? '1px solid #2196F3' : '1px solid #eee',
                borderRadius: '20px', padding: '4px 10px', fontSize: '0.75rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s', color: '#444'
              }}
              title={`Give ${fruit.label}`}
            >
              <span style={{ fontSize: '1rem' }}>{fruit.icon}</span>
              <span style={{ fontWeight: '500' }}>{fruit.label}</span>
              {count > 0 && <span style={{ fontWeight: 'bold', color: '#2196F3', borderLeft: '1px solid #ccc', paddingLeft: '6px' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 📖 FOOTER */}
      <div style={{ fontSize: '0.7rem', color: '#bbb', fontStyle: 'italic', lineHeight: '1.4', marginTop: '5px' }}>
        "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control." 
        <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>— Gal 5:22-23</span>
      </div>
    </div>
  );
}

export default MemberCard;