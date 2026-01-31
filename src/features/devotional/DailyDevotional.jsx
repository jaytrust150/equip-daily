import React, { useState, useEffect } from 'react';
import DevotionalContent from './DevotionalContent';
import CommunityFeed from '../../shared/CommunityFeed';
import AudioPlayer from '../../shared/AudioPlayer';
import ReadingPlans from '../ReadingPlans';
import { AUDIO_BASE_PATH } from '../../config/constants';

function DailyDevotional({ user, theme, onVerseClick, onProfileClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayOffset, setDayOffset] = useState(0);
  const [content, setContent] = useState("Loading...");
  const [showAudio, setShowAudio] = useState(false);
  const [showReadingPlans, setShowReadingPlans] = useState(false);

  useEffect(() => {
    const target = new Date(); target.setDate(target.getDate() + dayOffset);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(target);
    fetch(`/${target.getMonth() + 1}.${target.getDate()}-devotional.txt`).then(res => res.ok ? res.text() : "Edits in progress...").then(setContent).catch(() => setContent("Error."));
  }, [dayOffset]);

  const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
  
  const handleMarkAsRead = () => {
    setDayOffset(p => p + 1); // Move to next day
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
         <button onClick={() => setShowAudio(!showAudio)}>{showAudio ? '🔇' : '🔊'}</button>
         <button onClick={() => setDayOffset(p => p - 1)}>← Prior</button>
         <button onClick={() => setDayOffset(0)}>Today</button>
         <button onClick={() => setDayOffset(p => p + 1)}>Next →</button>
        <button onClick={() => setShowReadingPlans(!showReadingPlans)} title="Reading Plans (Secret Feature)">📅</button>
      </div>
           {showReadingPlans && (
             <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6', borderRadius: '12px', border: `2px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}` }}>
               <ReadingPlans user={user} theme={theme} onClose={() => setShowReadingPlans(false)} />
             </div>
           )}
      {showAudio && <AudioPlayer src={`${AUDIO_BASE_PATH}${dateKey}-devotional.mp3`} captionsSrc={`${AUDIO_BASE_PATH}${dateKey}-devotional.vtt`} theme={theme} />}
      <DevotionalContent text={content} theme={theme} fontSize={1.1} onVerseClick={onVerseClick} />
      
      {/* Mark as Read Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button
          onClick={handleMarkAsRead}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          <span>✓</span>
          Mark as Read
        </button>
      </div>
      
      {/* Community Reflections */}
      <CommunityFeed queryField="date" queryValue={dateKey} user={user} theme={theme} onSearch={onVerseClick} onProfileClick={onProfileClick} title="Daily Reflections" />
      
      {/* Navigation Tips */}
      <div 
        style={{ 
          marginTop: '30px',
          padding: '20px',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
          borderRadius: '12px',
          borderLeft: `4px solid ${theme === 'dark' ? '#6366f1' : '#4f46e5'}`
        }}
      >
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937'
        }}>
          💡 Navigation Tips
        </h4>
        <ul style={{ 
          fontSize: '0.9rem', 
          lineHeight: '1.8',
          color: theme === 'dark' ? '#d1d5db' : '#4b5563',
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li>• Tap <strong>🔊</strong> to listen to the audio version</li>
          <li>• Click any <span style={{ color: '#2196F3', fontWeight: 'bold' }}>blue verse reference</span> to jump to that passage</li>
          <li>• Use <strong>← Prior</strong> and <strong>Next →</strong> buttons to navigate days</li>
          <li>• Tap <strong>Today</strong> to return to the current day's devotional</li>
          <li>• Click <strong>✓ Mark as Read</strong> to advance to tomorrow's reading</li>
        </ul>
      </div>
    </div>
  );
}
export default DailyDevotional;