import React, { useState } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile 
} from 'firebase/auth';

function Login({ theme }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Needed for Directory!
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError("Google Login Failed");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Add their Name (Vital for your app!)
        await updateProfile(userCredential.user, { displayName: name });
        // 3. Reload to ensure app sees the name immediately
        window.location.reload(); 
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Clean up error message
      setError(err.message.replace('Firebase: ', '').replace('auth/', ''));
    }
  };

  // Styles
  const containerStyle = {
    maxWidth: '400px', margin: '0 auto', padding: '30px',
    background: theme === 'dark' ? '#333' : '#fff',
    borderRadius: '12px', border: theme === 'dark' ? '1px solid #444' : '1px solid #ddd',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center'
  };

  const inputStyle = {
    width: '100%', padding: '12px', margin: '10px 0',
    borderRadius: '8px', border: '1px solid #ccc',
    fontSize: '1rem', boxSizing: 'border-box' // Fixes padding issues
  };

  const btnStyle = {
    width: '100%', padding: '12px', margin: '10px 0',
    background: '#276749', color: 'white', fontWeight: 'bold',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
        {isSignUp ? "Join the Body" : "Welcome Back"}
      </h2>

      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

      <form onSubmit={handleEmailAuth}>
        {isSignUp && (
          <input 
            type="text" 
            placeholder="Your Name (for the Directory)" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={inputStyle} 
          />
        )}
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={inputStyle} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={inputStyle} 
        />
        
        <button type="submit" style={btnStyle}>
          {isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <div style={{ margin: '20px 0', borderTop: '1px solid #eee', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: theme === 'dark' ? '#333' : '#fff', padding: '0 10px', color: '#888', fontSize: '0.8rem' }}>OR</span>
      </div>

      <button onClick={handleGoogleLogin} style={{ ...btnStyle, background: '#4285F4' }}>
        Sign in with Google
      </button>

      <p style={{ marginTop: '20px', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#666' }}>
        {isSignUp ? "Already have an account? " : "New to Equip Daily? "}
        <button 
          onClick={() => setIsSignUp(!isSignUp)} 
          style={{ background: 'none', border: 'none', color: '#276749', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? "Login" : "Join Now"}
        </button>
      </p>
    </div>
  );
}

export default Login;