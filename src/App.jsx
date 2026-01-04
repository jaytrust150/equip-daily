import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth'; // We need to install this!
import { useState } from 'react';

function App() {
  const [user] = useAuthState(auth);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>Equip Daily</h1>
      <p>For the equipping of the saints.</p>
      <hr />

      {user ? (
        <div>
          <p>Welcome back, <strong>{user.displayName}</strong>!</p>
          <button onClick={logout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p>Welcome to the body. Please sign in to join us.</p>
          <button onClick={login} style={{ padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;