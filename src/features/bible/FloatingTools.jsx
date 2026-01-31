import React, { useState, useRef } from 'react';
import { COLOR_PALETTE, USFM_MAPPING } from '../../config/constants';

function FloatingTools({ 
  showNotebook, setShowNotebook, 
  selectedVerses, 
  book,
  chapter,
  versesCopied,
  setVersesCopied,
  onSaveNote,
  onCopyVerses,
  onPasteVerses,
  onDeleteNote,
  onOpenNote,
  theme = 'light',
  activeColor,
  setActiveHighlightColor,
  initialPosition = null
}) {
  const [position, setPosition] = useState(initialPosition || { x: window.innerWidth - 350, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Update position when initialPosition changes and notebook is shown
  React.useEffect(() => {
    if (showNotebook && initialPosition) {
      setPosition(initialPosition);
    }
  }, [showNotebook, initialPosition]);

  // Helper function to format verse references intelligently with abbreviations
  const getVerseReference = () => {
    if (!selectedVerses || selectedVerses.length === 0) return '';

    // Get abbreviated book name from USFM_MAPPING
    const bookAbbr = USFM_MAPPING[book] || book;

    const sortedVerses = [...new Set(selectedVerses)].sort((a, b) => a - b);
    const segments = [];
    let start = sortedVerses[0];
    let end = sortedVerses[0];

    for (let i = 1; i < sortedVerses.length; i++) {
      const current = sortedVerses[i];
      if (current === end + 1) {
        end = current;
      } else {
        segments.push(start === end ? `${start}` : `${start}-${end}`);
        start = current;
        end = current;
      }
    }
    segments.push(start === end ? `${start}` : `${start}-${end}`);

    return `${bookAbbr} ${chapter}:${segments.join(', ')}`;
  };

  const getNoteReferenceLabel = () => {
    if (!selectedVerses || selectedVerses.length === 0) return `${book} ${chapter}`;
    const sortedVerses = [...new Set(selectedVerses)].sort((a, b) => a - b);
    const segments = [];
    let start = sortedVerses[0];
    let end = sortedVerses[0];

    for (let i = 1; i < sortedVerses.length; i++) {
      const current = sortedVerses[i];
      if (current === end + 1) {
        end = current;
      } else {
        segments.push(start === end ? `${start}` : `${start}-${end}`);
        start = current;
        end = current;
      }
    }
    segments.push(start === end ? `${start}` : `${start}-${end}`);

    return `${book} ${chapter}:${segments.join(', ')}`;
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

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [isDragging]);

  const handleTouchMove = React.useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!showNotebook) return null;

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
        border: theme === 'dark' ? '1px solid #444' : '1px solid #ddd',
        cursor: 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Color Palette Row */}
      <div className="flex-row flex-center gap-6 mb-5">
        {(COLOR_PALETTE || []).map((color) => (
          <button
            key={color.name}
            onClick={() => setActiveHighlightColor(color)}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: color.code,
              border: `2.5px solid ${activeColor && activeColor.name === color.name ? (theme === 'dark' ? '#222' : '#222') : color.border}`,
              outline: activeColor && activeColor.name === color.name ? '2px solid #333' : 'none',
              boxShadow: activeColor && activeColor.name === color.name ? '0 0 0 2px #333' : 'none',
              cursor: 'pointer',
              transition: 'border 0.2s, box-shadow 0.2s',
              display: 'inline-block',
              padding: 0
            }}
            title={color.name}
          />
        ))}
      </div>
      {/* Study Mode Options */}
      <>
        <div style={{
          fontSize: '0.85rem',
          color: theme === 'dark' ? '#ddd' : '#333',
          fontWeight: 'bold'
        }}>
          Note on {getNoteReferenceLabel()}
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          color: theme === 'dark' ? '#aaa' : '#666',
          fontWeight: 'bold'
        }}>
          {selectedVerses.length} verse{selectedVerses.length !== 1 ? 's' : ''} selected
        </div>

          <button 
            onClick={versesCopied ? onPasteVerses : onCopyVerses}
            disabled={selectedVerses.length === 0}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: versesCopied ? '#9c27b0' : (selectedVerses.length > 0 ? '#4caf50' : '#ccc'),
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
            title={versesCopied ? `Paste ${getVerseReference()}` : (selectedVerses.length > 0 ? `Copy ${getVerseReference()}` : 'Select verses to copy')}
          >
            {versesCopied
              ? `📋 Paste ${getVerseReference()}`
              : (selectedVerses.length > 0 
                ? `📋 Copy ${getVerseReference()}` 
                : '📋 Copy Verses')}
          </button>

          <button 
            onClick={() => {
              if (!isEditingNote) {
                setIsEditingNote(true);
                onOpenNote();
              } else {
                setIsEditingNote(false);
                onSaveNote();
              }
            }}
            disabled={selectedVerses.length === 0}
            style={{ 
              padding: '6px 10px', 
              fontSize: '0.85rem',
              background: isEditingNote ? '#276749' : (selectedVerses.length > 0 ? '#2196f3' : '#ccc'),
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
            title={isEditingNote ? `Close note editor` : (selectedVerses.length > 0 ? `Open note at ${getVerseReference()}` : 'Select verses to open note')}
          >
            {isEditingNote
              ? `✖️ Close Note`
              : (selectedVerses.length > 0 
                ? `📖 Open Note at ${getVerseReference()}` 
                : '📖 Open Note')}
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

      {/* Close Button */}
      <button 
        onClick={() => { setShowNotebook(false); }}
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