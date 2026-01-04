import MemberCard from './MemberCard';
import './App.css'
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState } from "react";

function App() {
  const [user] = useAuthState(auth);
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div className="app-container">
      <header>
        <h1>Equip Daily</h1>
        {user ? (
          <div className="user-profile">
            <p>Grace and peace, {user.displayName}</p>
            <button onClick={logout} className="secondary-btn">Logout</button>
          </div>
        ) : (
          <button onClick={login} className="primary-btn">Login with Google</button>
        )}
      </header>
      
      <main>
        {user ? (
          <section className="directory">
            <h2>Church Directory</h2>
            <p>The body is one, yet has many members...</p>
            
            {/* 🛡️ Your new MemberCard shows up here! */}
            <MemberCard user={user} />
            
            {/* Future: This is where we will list OTHER members from Firestore! */}
          </section>
        ) : (
          <section className="welcome">
            <p>Please login to access the "Body" directory and daily devotionals.</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App;