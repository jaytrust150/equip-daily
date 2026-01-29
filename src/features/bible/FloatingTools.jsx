import React, { useState, useRef } from 'react';
import { COLOR_PALETTE, USFM_MAPPING } from '../../config/constants';

function FloatingTools({ 
  showPalette, setShowPalette, 
  showNotebook, setShowNotebook, 
  onApplyColor, 
  selectedVerses, 
  book,
  chapter,
  versesCopied,
  setVersesCopied,
  onSaveNote,
  onCopyVerses,
  onPasteVerses,
  onDeleteNote,
  theme = 'light'
}) {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Helper function to format verse references intelligently with abbreviations
  const getVerseReference = () => {
    if (!selectedVerses || selectedVerses.length === 0) return '';
    
    // Get abbreviated book name from USFM_MAPPING
    const bookAbbr = USFM_MAPPING[book] || book;
    
    const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
    
    // If single verse
    if (sortedVerses.length === 1) {
      return `${bookAbbr} ${chapter}:${sortedVerses[0]}`;
    }
    
    // Check if verses are consecutive
    let isConsecutive = true;
    for (let i = 1; i < sortedVerses.length; i++) {
      if (sortedVerses[i] !== sortedVerses[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    
    // If consecutive, show as range
    if (isConsecutive) {
      return `${bookAbbr} ${chapter}:${sortedVerses[0]}-${sortedVerses[sortedVerses.length - 1]}`;
    }
    
    // If not consecutive, show as list (limit to first few if many)
    if (sortedVerses.length <= 3) {
      return `${bookAbbr} ${chapter}:${sortedVerses.join(', ')}`;
    } else {
      return `${bookAbbr} ${chapter}:${sortedVerses[0]}, ${sortedVerses[1]}, ... ${sortedVerses[sortedVerses.length - 1]}`;
    }
  };

  // Reset copied state when selection changes
  React.useEffect(() => {
    if (setVersesCopied) {
      setVersesCopied(false);
    }
  }, [selectedVerses, setVersesCopied]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!showPalette && !showNotebook) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        left: `${position.x}px`, 
        top: `${position.y}px`, 
        background: theme === 'dark' ? '#1a1a1a' : 'white', 
        padding: '12px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        zIndex: 1000,
        userSelect: 'none',
        border: theme === 'dark' ? '1px solid #444' : '1px solid #ddd'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Color Palette (Reading Mode) */}
      {showPalette && (
        <>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {COLOR_PALETTE.map(c => (
              <button 
                key={c.code} 
                onClick={() => onApplyColor(c)} 
                title={c.name}
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  background: c.code, 
                  borderRadius: '50%', 
                  border: '2px solid #999',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              />
            ))}
            <button 
              onClick={() => onApplyColor(null)}
              title="Remove highlight"
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: '2px solid #999',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
          {showNotebook && <hr style={{ margin: '4px 0', borderColor: theme === 'dark' ? '#444' : '#ddd' }} />}
        </>
      )}

      {/* Study Mode Options */}
      {showNotebook && (
        <>
          <div style={{ 
            fontSize: '0.8rem', 
            color: theme === 'dark' ? '#aaa' : '#666',
            fontWeight: 'bold'
          }}>
            {selectedVerses.length} verse{selectedVerses.length !== 1 ? 's' : ''} selected
          </div>

          <button 
            onClick={onCopyVerses}
            disabled={selectedVerses.length === 0}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: selectedVerses.length > 0 ? '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedVerses.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px'
            }}
            title={selectedVerses.length > 0 ? `Copy ${getVerseReference()}` : 'Select verses to copy'}
          >
            {selectedVerses.length > 0 
              ? `📋 Copy ${getVerseReference()}` 
              : '📋 Copy Verses'}
          </button>

          <button 
            onClick={onPasteVerses}
            disabled={!versesCopied || selectedVerses.length === 0}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: (versesCopied && selectedVerses.length > 0) ? '#9c27b0' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (versesCopied && selectedVerses.length > 0) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px'
            }}
            title={(versesCopied && selectedVerses.length > 0) ? `Paste reference: ${getVerseReference()}` : 'Copy verses first'}
          >
            {(versesCopied && selectedVerses.length > 0)
              ? `📌 Paste ${getVerseReference()}` 
              : '📌 Paste Ref'}
          </button>

          <button 
            onClick={onSaveNote}
            disabled={selectedVerses.length === 0}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: selectedVerses.length > 0 ? '#276749' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedVerses.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            💾 Save Note
          </button>

          <button 
            onClick={onDeleteNote}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🗑️ Delete Note
          </button>
        </>
      )}

      {/* Close Button */}
      <button 
        onClick={() => { setShowPalette(false); setShowNotebook(false); }}
        style={{ 
          padding: '6px 10px', 
          fontSize: '0.85rem',
          background: theme === 'dark' ? '#444' : '#f0f0f0',
          color: theme === 'dark' ? '#fff' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ✕ Close
      </button>
    </div>
  );
}
export default FloatingTools;