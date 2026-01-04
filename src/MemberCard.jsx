import React from 'react';

function MemberCard({ user, thought }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px', 
      padding: '15px', 
      border: '1px solid #eee', 
      borderRadius: '12px',
      backgroundColor: '#fff',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      {/* 1. User Photo */}
      <img 
        src={user.photoURL} 
        alt={user.displayName} 
        style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          objectFit: 'cover' 
        }} 
      />
      
      {/* 2. User Info & Thought */}
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#333' }}>
          {user.displayName}
        </h3>
        
        {/* 🌟 If they shared a thought, show it! Otherwise, show "Member of the Body" */}
        {thought ? (
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>
            "{thought}"
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
            Member of the Body
          </p>
        )}
      </div>
    </div>
  );
}

export default MemberCard;