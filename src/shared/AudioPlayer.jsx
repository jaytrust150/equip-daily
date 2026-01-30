import React from 'react';
import { useAudio } from '../hooks/useAudio';

/**
 * AudioPlayer Component
 * 
 * HTML5 media player wrapper with integrated sleep timer for Bible audio/devotional content.
 * Uses <video> element instead of <audio> for subtitle/caption support (future enhancement).
 * 
 * Architecture:
 * - Delegates audio state management to useAudio custom hook
 * - Video element configured for audio-only playback with native controls
 * - Sleep timer provides cycling intervals (15/30/60 minutes) for bedtime listening
 * - Timer countdown auto-pauses playback and resets on expiration
 * 
 * @param {string} src - MP3 audio file URL from API.Bible or local server
 * @param {string} [captionsSrc] - Optional WebVTT captions file URL (for accessibility)
 * @param {string} theme - Theme identifier ('light'|'dark') for UI styling
 */
function AudioPlayer({ src, captionsSrc, theme }) {
  // Delegate audio state and timer logic to custom hook for separation of concerns
  const { audioRef, error, setError, handleTrackLoad, toggleSleepTimer, sleepMinutes, sleepTimeLeft, formatTimeLeft } = useAudio(src, captionsSrc);
  return (
    // Container with theme-aware background color
    <div style={{ margin: '0 auto 20px auto', maxWidth: '600px', padding: '10px', backgroundColor: theme === 'dark' ? '#222' : '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Audio player and sleep timer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Using <video> instead of <audio> for TextTrack API support (captions/subtitles) */}
        {/* Native controls provide familiar UI and accessibility (keyboard shortcuts, ARIA) */}
        <video ref={audioRef} controls onLoadedMetadata={handleTrackLoad} onError={() => setError(true)} style={{ flex: 1, height: '50px', backgroundColor: '#2c3e50', borderRadius: '4px' }} playsInline>
            <source src={src} type="audio/mpeg" />
            {/* WebVTT caption track for accessibility and language learning */}
            {/* TextTrack API automatically activated via handleTrackLoad on metadata load */}
            {captionsSrc && <track kind="captions" src={captionsSrc} srcLang="en" label="English" default />}
        </video>
        {/* Sleep timer cycles: null → 15min → 30min → 60min → null */}
        {/* Visual feedback: blue background when active, countdown displayed in MM:SS format */}
        {/* Common use case: bedtime Bible listening with automatic shutoff */}
        <button onClick={toggleSleepTimer} style={{ marginLeft: '10px', background: sleepMinutes ? '#e3f2fd' : 'transparent', color: sleepMinutes ? '#2196F3' : (theme === 'dark' ? '#ccc' : '#555'), border: `1px solid ${sleepMinutes ? '#2196F3' : '#ccc'}`, borderRadius: '20px', padding: '5px 12px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {sleepMinutes ? `🌙 ${formatTimeLeft(sleepTimeLeft)}` : "🌙 Off"}
        </button>
      </div>
      {/* Error state: graceful degradation when audio source unavailable or unsupported */}
      {/* Common causes: expired API.Bible URLs, network issues, unsupported codec */}
      {error && <p style={{ color: 'red', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>Audio not available.</p>}
    </div>
  );
}
export default AudioPlayer;