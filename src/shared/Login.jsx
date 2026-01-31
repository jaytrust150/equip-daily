import React, { useState, useEffect } from 'react';
// ✅ FIXED IMPORT: Points to src/config/firebase.js
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

function Login({ theme }) {
  // Modes: 'menu' | 'email' | 'phone'
  const [authMode, setAuthMode] = useState('menu'); 
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null); 
  const [codeSent, setCodeSent] = useState(false);

  // Shared State
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // ⚡ Recaptcha Setup
  useEffect(() => {
    if (authMode === 'phone' && !window.recaptchaVerifier) {
      try {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                  // reCAPTCHA solved
                },
                'expired-callback': () => { /* reCAPTCHA expired */ }
            });
        }
      } catch (err) {
          console.error("Recaptcha Error:", err);
      }
    }
  }, [authMode]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { 
      await signInWithPopup(auth, provider); 
    } catch (err) { 
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          console.error(redirectErr);
          setError("Popup blocked. Please allow popups and try again.");
        }
        return;
      }
      if (code === 'auth/unauthorized-domain') {
        setError("This domain isn’t authorized in Firebase Auth.");
        return;
      }
      setError(err?.message?.replace('Firebase: ', '').replace('auth/', '') || "Google Login Failed");
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    try { 
      await signInWithPopup(auth, provider); 
    } catch (err) { 
      console.error(err); 
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError("This email is already associated with another account.");
      } else {
        setError("Facebook Login Failed. Check console."); 
      }
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        window.location.reload(); 
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { setError(err.message.replace('Firebase: ', '').replace('auth/', '')); }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!window.recaptchaVerifier) {
        setError("Please refresh and try again (Recaptcha missing).");
        return;
    }

    const appVerifier = window.recaptchaVerifier;
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      setVerificationId(confirmationResult);
      setCodeSent(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send SMS. Check format (+1...)");
      if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; } catch { /* cleanup skipped */ }
      } 
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await verificationId.confirm(otp);
      const user = result.user;
      
      if (name && !user.displayName) {
        await updateProfile(user, { displayName: name });
        window.location.reload();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError("Invalid Code. Please try again.");
    }
  };

  // Styles
  const containerStyle = {
    maxWidth: '400px', margin: '0 auto', padding: '30px',
    background: theme === 'dark' ? '#333' : '#fff',
    borderRadius: '12px', border: theme === 'dark' ? '1px solid #444' : '1px solid #ddd',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center'
  };
  const inputStyle = { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' };
  const btnStyle = { width: '100%', padding: '12px', margin: '8px 0', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' };
  const linkBtnStyle = { background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' };

  // Helper to go back to menu and clear errors
  const goBack = () => {
    setAuthMode('menu');
    setError('');
  }

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', marginBottom: '20px' }}>
        {authMode === 'menu' ? "Welcome" :
         authMode === 'email' ? (isSignUp ? "Join the Body" : "Welcome Back") :
         "Phone Login"}
      </h2>

      {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}

      {/* --- 1. MAIN MENU (BUTTONS ONLY) --- */}
      {authMode === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          <button onClick={() => setAuthMode('email')} style={{ ...btnStyle, background: '#333' }}>
            ✉️ Sign in with Email
          </button>

          <button onClick={handleGoogleLogin} style={{ ...btnStyle, background: '#4285F4' }}>
            Sign in with Google
          </button>

          <button onClick={handleFacebookLogin} style={{ ...btnStyle, background: '#1877F2' }}>
            Sign in with Facebook
          </button>
          
          <button onClick={() => setAuthMode('phone')} style={{ ...btnStyle, background: '#333' }}>
            📱 Continue with Phone
          </button>

          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#666' }}>
            New to Equip Daily? <br/>
            <button onClick={() => { setIsSignUp(true); setAuthMode('email'); }} style={{ ...linkBtnStyle, color: '#276749', fontWeight: 'bold' }}>
              Create an Account
            </button>
          </p>
        </div>
      )}

      {/* --- 2. EMAIL FORM --- */}
      {authMode === 'email' && (
        <form onSubmit={handleEmailAuth}>
          {isSignUp && (
            <input type="text" name="fullName" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          )}
          <input type="email" name="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          
          <button type="submit" style={{ ...btnStyle, background: '#276749' }}>
            {isSignUp ? "Sign Up" : "Login"}
          </button>

          <div style={{marginTop: '10px'}}>
            <button type="button" onClick={goBack} style={linkBtnStyle}>
              ← Choose another method
            </button>
          </div>

          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#666' }}>
            {isSignUp ? "Already have an account? " : "New to Equip Daily? "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={{ ...linkBtnStyle, color: '#276749', fontWeight: 'bold', textDecoration: 'none' }}>
              {isSignUp ? "Login" : "Join Now"}
            </button>
          </p>
        </form>
      )}

      {/* --- 3. PHONE FORM --- */}
      {authMode === 'phone' && (
        <>
          {!codeSent ? (
            <form onSubmit={handleSendCode}>
               <input type="text" name="phoneName" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
               <input type="tel" name="phoneNumber" placeholder="Mobile Number (e.g. 555-0123)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required style={inputStyle} />
               <div id="recaptcha-container"></div> 
               <button type="submit" style={{ ...btnStyle, background: '#276749' }}>Send Code</button>
               <button type="button" onClick={goBack} style={linkBtnStyle}>← Cancel</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <p style={{marginBottom: '10px'}}>Sent code to {phoneNumber}</p>
              <input type="text" name="otp" placeholder="Enter 6-digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle} />
              <button type="submit" style={{ ...btnStyle, background: '#276749' }}>Verify & Login</button>
              <button type="button" onClick={() => setCodeSent(false)} style={linkBtnStyle}>Wrong Number?</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default Login;