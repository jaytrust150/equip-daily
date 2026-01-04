import MemberCard from './MemberCard';
import './App.css'
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

function App() {
  const [user] = useAuthState(auth);
  const provider = new GoogleAuthProvider();

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div className="app-container">
      {/* 🏠 Header Section */}
      <header>
        <h1>Equip Daily</h1>
        {user && (
          <div className="user-profile">
            <p>Grace and peace, {user.displayName}</p>
            <button onClick={logout} className="secondary-btn">Logout</button>
          </div>
        )}
      </header>
      
      {/* 📖 Main Content Section */}
      <main>
        {user ? (
          <section className="directory">
            <h2>Church Directory</h2>
            <p>The body is one, yet has many members...</p>
            
            {/* 🛡️ Your Personal Member Card */}
            <MemberCard user={user} />
          </section>
        ) : (
          <section className="welcome">
            <p>For the equipping of the saints.</p>
            
            {/* ➖ The Separator Line */}
            <hr style={{ width: '50%', margin: '20px auto', borderColor: '#eee' }} />
            
            {/* 📝 Updated Greeting Text */}
            <p>Please login to access the "Body" directory and daily devotionals.</p>
            
            {/* 🟦 The Login Button */}
            <button 
              onClick={login} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#4285F4', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '15px'
              }}
            >
              Login with Google
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App;