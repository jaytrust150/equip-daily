import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

function Login({ theme }) {
  // Modes: 'email' | 'phone'
  const [authMode, setAuthMode] = useState('email'); 
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
                'callback': (response) => {
                  // reCAPTCHA solved
                },
                'expired-callback': () => {}
            });
        }
      } catch (err) {
          console.error("Recaptcha Error:", err);
      }
    }
  }, [authMode]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (err) { console.error(err); setError("Google Login Failed"); }
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

  // 2. Send SMS Code
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
          try { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; } catch(e){}
      } 
    }
  };

  // 3. Verify SMS Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await verificationId.confirm(otp);
      const user = result.user;
      
      // ⚡ Only update name if they don't have one (New User)
      // If they are an existing user, we ignore what they typed and keep their old name.
      if (name && !user.displayName) {
        await updateProfile(user, { displayName: name });
        window.location.reload();
      }
    } catch (err) {
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
  const btnStyle = { width: '100%', padding: '12px', margin: '10px 0', background: '#276749', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
        {authMode === 'email' ? (isSignUp ? "Join the Body" : "Welcome Back") : "Phone Login"}
      </h2>

      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

      {/* 📧 EMAIL FORM */}
      {authMode === 'email' && (
        <form onSubmit={handleEmailAuth}>
          {isSignUp && (
            <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          <button type="submit" style={btnStyle}>{isSignUp ? "Sign Up" : "Login"}</button>
        </form>
      )}

      {/* 📱 PHONE FORM */}
      {authMode === 'phone' && (
        <>
          {!codeSent ? (
            <form onSubmit={handleSendCode}>
               {/* ⚡ UPDATED: Name is now REQUIRED for Phone too */}
               <input 
                 type="text" 
                 placeholder="Your Name" 
                 value={name} 
                 onChange={(e) => setName(e.target.value)} 
                 required 
                 style={inputStyle} 
               />
               
               <input type="tel" placeholder="Mobile Number (e.g. 555-0123)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required style={inputStyle} />
               
               <div id="recaptcha-container"></div> 
               
               <button type="submit" style={btnStyle}>Send Code</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <p style={{marginBottom: '10px'}}>Sent code to {phoneNumber}</p>
              <input type="text" placeholder="Enter 6-digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle} />
              <button type="submit" style={btnStyle}>Verify & Login</button>
              <button onClick={() => setCodeSent(false)} style={{background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer'}}>Wrong Number?</button>
            </form>
          )}
        </>
      )}

      <div style={{ margin: '20px 0', borderTop: '1px solid #eee', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: theme === 'dark' ? '#333' : '#fff', padding: '0 10px', color: '#888', fontSize: '0.8rem' }}>OR</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleGoogleLogin} style={{ ...btnStyle, background: '#4285F4', margin: 0 }}>
            Sign in with Google
        </button>
        
        {authMode === 'email' ? (
             <button onClick={() => setAuthMode('phone')} style={{ ...btnStyle, background: '#333', margin: 0 }}>
                📱 Continue with Phone
             </button>
        ) : (
             <button onClick={() => setAuthMode('email')} style={{ ...btnStyle, background: '#333', margin: 0 }}>
                ✉️ Continue with Email
             </button>
        )}
      </div>

      {authMode === 'email' && (
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: theme === 'dark' ? '#ccc' : '#666' }}>
            {isSignUp ? "Already have an account? " : "New to Equip Daily? "}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#276749', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
            {isSignUp ? "Login" : "Join Now"}
            </button>
        </p>
      )}
    </div>
  );
}

export default Login;