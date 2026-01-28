import React from 'react';
import { useAudio } from '../hooks/useAudio';
function AudioPlayer({ src, captionsSrc, theme }) {
  const { audioRef, error, setError, handleTrackLoad, toggleSleepTimer, sleepMinutes, sleepTimeLeft, formatTimeLeft } = useAudio(src, captionsSrc);
  return (
    <div style={{ margin: '0 auto 20px auto', maxWidth: '600px', padding: '10px', backgroundColor: theme === 'dark' ? '#222' : '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <video ref={audioRef} controls onLoadedMetadata={handleTrackLoad} onError={() => setError(true)} style={{ flex: 1, height: '50px', backgroundColor: '#2c3e50', borderRadius: '4px' }} playsInline>
            <source src={src} type="audio/mpeg" />
            {captionsSrc && <track kind="captions" src={captionsSrc} srcLang="en" label="English" default />}
        </video>
        <button onClick={toggleSleepTimer} style={{ marginLeft: '10px', background: sleepMinutes ? '#e3f2fd' : 'transparent', color: sleepMinutes ? '#2196F3' : (theme === 'dark' ? '#ccc' : '#555'), border: `1px solid ${sleepMinutes ? '#2196F3' : '#ccc'}`, borderRadius: '20px', padding: '5px 12px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {sleepMinutes ? `🌙 ${formatTimeLeft(sleepTimeLeft)}` : "🌙 Off"}
        </button>
      </div>
      {error && <p style={{ color: 'red', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>Audio not available.</p>}
    </div>
  );
}
export default AudioPlayer;