import React, { useState, useEffect } from 'react';
import DevotionalContent from './DevotionalContent';
import CommunityFeed from '../../shared/CommunityFeed';
import AudioPlayer from '../../shared/AudioPlayer';
import { AUDIO_BASE_PATH } from '../../config/constants';

function DailyDevotional({ user, theme, onVerseClick, onProfileClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayOffset, setDayOffset] = useState(0);
  const [content, setContent] = useState("Loading...");
  const [showAudio, setShowAudio] = useState(false);

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
         <button onClick={() => setShowAudio(!showAudio)} style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{showAudio ? '🔇' : '🔊'}</button>
         <button onClick={() => setDayOffset(p => p - 1)} style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>← Prior</button>
         <button onClick={() => setDayOffset(0)} style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Today</button>
         <button onClick={() => setDayOffset(p => p + 1)} style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Next →</button>
      </div>
      {showAudio && <AudioPlayer src={`${AUDIO_BASE_PATH}${dateKey}-devotional.mp3`} captionsSrc={`${AUDIO_BASE_PATH}${dateKey}-devotional.vtt`} theme={theme} />}
      <DevotionalContent text={content} theme={theme} fontSize={1.1} onVerseClick={onVerseClick} />
      
      {/* Mark as Read Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button
          onClick={handleMarkAsRead}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            background: theme === 'dark' ? '#333' : '#f0f0f0',
            color: theme === 'dark' ? '#fff' : '#333',
            border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: '0.2s'
          }}
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