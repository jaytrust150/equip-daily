import React, { useState, useEffect } from 'react';
import DevotionalContent from '../components/Devotional/DevotionalContent';
import CommunityFeed from '../components/Shared/CommunityFeed';
import AudioPlayer from '../components/Shared/AudioPlayer';
import { AUDIO_BASE_PATH } from '../config/constants';

function DailyDevotional({ user, theme, onVerseClick, onProfileClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayOffset, setDayOffset] = useState(0);
  const [content, setContent] = useState("Loading...");
  const [showAudio, setShowAudio] = useState(false);

  useEffect(() => {
    const target = new Date(); target.setDate(target.getDate() + dayOffset); setCurrentDate(target);
    fetch(`/${target.getMonth() + 1}.${target.getDate()}-devotional.txt`).then(res => res.ok ? res.text() : "Edits in progress...").then(setContent).catch(() => setContent("Error."));
  }, [dayOffset]);

  const dateKey = `${currentDate.getMonth() + 1}.${currentDate.getDate()}`;
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
         <button onClick={() => setShowAudio(!showAudio)}>{showAudio ? '🔇' : '🔊'}</button>
         <button onClick={() => setDayOffset(p => p - 1)}>← Prior</button>
         <button onClick={() => setDayOffset(0)}>Today</button>
         <button onClick={() => setDayOffset(p => p + 1)}>Next →</button>
      </div>
      {showAudio && <AudioPlayer src={`${AUDIO_BASE_PATH}${dateKey}-devotional.mp3`} captionsSrc={`${AUDIO_BASE_PATH}${dateKey}-devotional.vtt`} theme={theme} />}
      <DevotionalContent text={content} theme={theme} fontSize={1.1} onVerseClick={onVerseClick} />
      <CommunityFeed queryField="date" queryValue={dateKey} user={user} theme={theme} onSearch={onVerseClick} onProfileClick={onProfileClick} title="Daily Reflections" />
    </div>
  );
}
export default DailyDevotional;