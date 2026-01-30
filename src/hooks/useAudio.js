import { useState, useRef, useEffect } from 'react';

/**
 * useAudio Custom Hook
 * 
 * Encapsulates audio playback state and sleep timer logic for reusability across components.
 * Manages interval-based countdown that interacts with HTML5 media element to auto-pause.
 * 
 * State Management:
 * - Audio element ref for imperative DOM manipulation (play/pause)
 * - Error state for graceful degradation on load failures
 * - Sleep timer state with cycling values (null, 15, 30, 60 minutes)
 * - Countdown state in seconds with interval-based decrement
 * 
 * Timer Lifecycle:
 * 1. User toggles timer through cycling values
 * 2. Timer converted to seconds for countdown precision
 * 3. setInterval decrements every 1000ms
 * 4. On zero: pause audio, reset timer, clear interval
 * 5. Cleanup on unmount prevents memory leaks
 * 
 * @returns {Object} Audio player state and control functions
 * @property {React.RefObject} audioRef - Ref for HTML5 audio/video element
 * @property {boolean} error - Load failure flag for error UI
 * @property {Function} setError - Error state setter
 * @property {number|null} sleepMinutes - Active timer duration (null when inactive)
 * @property {number|null} sleepTimeLeft - Remaining seconds for countdown display
 * @property {Function} toggleSleepTimer - Cycle timer: null→15→30→60→null
 * @property {Function} handleTrackLoad - Activate caption track on metadata load event
 * @property {Function} formatTimeLeft - Convert seconds to MM:SS display format
 */
export function useAudio() {
  // Ref to audio/video DOM element for imperative control (pause on timer expiry)
  const audioRef = useRef(null);
  // Error flag triggers fallback UI when audio source fails to load
  const [error, setError] = useState(false);
  // Sleep timer duration in minutes (null=off, 15/30/60=active)
  const [sleepMinutes, setSleepMinutes] = useState(null);
  // Countdown in seconds for real-time timer display (decremented via setInterval)
  const [sleepTimeLeft, setSleepTimeLeft] = useState(null);

  /**
   * Cycle sleep timer through preset intervals
   * 
   * Implements circular state machine: Off → 15min → 30min → 60min → Off
   * Converts minutes to seconds for countdown precision (15min = 900s)
   * Null value indicates timer is disabled
   * 
   * State transitions:
   * - null → 15: Activate 15-minute timer
   * - 15 → 30: Extend to 30 minutes
   * - 30 → 60: Extend to 60 minutes
   * - 60 → null: Disable timer
   */
  const toggleSleepTimer = () => {
    let newMinutes = null;
    // State machine transitions with guard clause for null handling
    if (sleepMinutes === null) newMinutes = 15;
    else if (sleepMinutes === 15) newMinutes = 30;
    else if (sleepMinutes === 30) newMinutes = 60;
    // Falls through to null (off) when current value is 60
    setSleepMinutes(newMinutes);
    // Convert minutes to seconds for countdown interval precision (15min = 900s)
    setSleepTimeLeft(newMinutes ? newMinutes * 60 : null);
  };

  /**
   * Effect: Interval-based countdown with auto-pause on expiration
   * 
   * Runs when sleepTimeLeft changes from null to a number (timer activated).
   * setInterval decrements countdown every second until reaching zero.
   * 
   * Termination conditions:
   * - Timer reaches 0: Pause audio via ref, reset state, clear interval
   * - Component unmounts: Cleanup function clears interval to prevent memory leak
   * - sleepTimeLeft becomes null: Effect re-runs, previous interval cleared
   * 
   * Race condition handling:
   * - Guard clause (if prev === null) prevents errors during state transitions
   */
  useEffect(() => {
    // Skip effect when timer is inactive (null) - no interval needed
    if (sleepTimeLeft === null) return;
    
    // Interval decrements countdown every 1000ms (1 second) for UI updates
    const interval = setInterval(() => {
      setSleepTimeLeft((prev) => {
        // Guard against race condition if timer reset during setState batching
        if (prev === null) return prev;
        
        // Timer expired: pause playback, disable timer UI, cleanup interval
        if (prev <= 1) {
          if (audioRef.current) audioRef.current.pause();
          setSleepMinutes(null);
          clearInterval(interval);
          return null;
        }
        
        // Decrement countdown by 1 second
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup: prevent memory leak by clearing interval on unmount or timer change
    return () => clearInterval(interval);
  }, [sleepTimeLeft]);

  /**
   * Activate caption track when audio metadata loads
   * 
   * HTML5 TextTrack API requires manual activation after metadata load event.
   * Sets first text track to 'showing' mode to display captions/subtitles.
   * Optional chaining prevents errors when no tracks present.
   */
  const handleTrackLoad = () => { if (audioRef.current?.textTracks?.[0]) audioRef.current.textTracks[0].mode = 'showing'; };

  /**
   * Format countdown seconds as MM:SS for UI display
   * 
   * @param {number} s - Remaining seconds (e.g., 900 for 15 minutes)
   * @returns {string} Formatted time string (e.g., "15:00", "5:03", "0:45")
   */
  const formatTimeLeft = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;

  // Return all audio utilities and state for consumer components
  return { audioRef, error, setError, sleepMinutes, sleepTimeLeft, toggleSleepTimer, handleTrackLoad, formatTimeLeft };
}