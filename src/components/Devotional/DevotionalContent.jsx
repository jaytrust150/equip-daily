import React, { useMemo, useEffect, useState } from 'react';

function DevotionalContent({ text, theme, fontSize, onVerseClick }) {
  const [youtubeId, setYoutubeId] = useState(null);

  // 📺 Extract YouTube ID from text
  useEffect(() => {
    if (!text) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setYoutubeId(null);
      return;
    }
    // Regex to find standard youtube links or youtu.be shortlinks
    const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = text.match(ytRegex);
    if (match && match[1]) {
      setYoutubeId(match[1]);
    } else {
      setYoutubeId(null);
    }
  }, [text]);

  // 📝 Process Text (Add Links to Verses)
  const processedHtml = useMemo(() => {
    if (!text) return "";
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+)\s(\d+):(\d+)(-\d+)?/g;
    return text.replace(verseRegex, (match) => {
      return `<span class="verse-link" style="color: #2196F3; cursor: pointer; text-decoration: underline; font-weight: bold;">${match}</span>`;
    });
  }, [text]);

  return (
    <div>
      <div 
        className="devotional-content" 
        style={{ 
          fontSize: `${fontSize}rem`, 
          lineHeight: '1.7', 
          textAlign: 'left', 
          color: theme === 'dark' ? '#ccc' : '#333', 
          backgroundColor: theme === 'dark' ? '#111' : '#fff', 
          padding: '25px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
          transition: 'font-size 0.2s ease' 
        }} 
        onClick={(e) => {
          if (e.target.classList.contains('verse-link') && onVerseClick) {
            onVerseClick(e.target.innerText);
          }
        }}
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
      
      {/* 📺 VIDEO PLAYER (AUTO-INSERTED) */}
      {youtubeId && (
        <div className="youtube-container" style={{ marginTop: '30px', maxWidth: '600px', margin: '30px auto 0 auto' }}>
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Devotional Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default DevotionalContent;