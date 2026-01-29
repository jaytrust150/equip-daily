import { useState, useRef, useEffect } from 'react';
export function useAudio() {
  const audioRef = useRef(null);
  const [error, setError] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(null);
  const [sleepTimeLeft, setSleepTimeLeft] = useState(null);

  const toggleSleepTimer = () => {
    let newMinutes = null;
    if (sleepMinutes === null) newMinutes = 15;
    else if (sleepMinutes === 15) newMinutes = 30;
    else if (sleepMinutes === 30) newMinutes = 60;
    setSleepMinutes(newMinutes);
    setSleepTimeLeft(newMinutes ? newMinutes * 60 : null);
  };

  useEffect(() => {
    if (sleepTimeLeft === null) return;
    if (sleepTimeLeft <= 0) {
      if (audioRef.current) audioRef.current.pause();
      setSleepMinutes(null);
      setSleepTimeLeft(null);
      return;
    }
    const interval = setInterval(() => setSleepTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [sleepTimeLeft]);

  const handleTrackLoad = () => { if (audioRef.current?.textTracks?.[0]) audioRef.current.textTracks[0].mode = 'showing'; };

  return { audioRef, error, setError, sleepMinutes, sleepTimeLeft, toggleSleepTimer, handleTrackLoad, formatTimeLeft: (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}` };
}