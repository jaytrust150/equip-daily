function MemberCard({ user }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      {/* 1. The Profile Picture */}
      <img 
        src={user.photoURL} 
        alt="Profile" 
        style={{ borderRadius: '50%', width: '60px', marginRight: '20px' }} 
      />
      
      {/* 2. The Text Info */}
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ margin: 0 }}>{user.displayName}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Member of the Body</p>
      </div>
    </div>
  );
}

export default MemberCard;