import React, { useState, useRef } from 'react';
import { COLOR_PALETTE } from '../../config/constants';

function FloatingTools({ showPalette, setShowPalette, showNotebook, setShowNotebook, onApplyColor, selectedVerses, onSaveNote }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

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
        background: 'white', 
        padding: '10px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '5px', 
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {showPalette && COLOR_PALETTE.map(c => <button key={c.code} onClick={() => onApplyColor(c)} style={{ width: '20px', height: '20px', background: c.code, borderRadius: '50%', border: '1px solid #ccc' }} />)}
      {showPalette && <button onClick={() => onApplyColor(null)}>🚫</button>}
      {showNotebook && selectedVerses.length > 0 && <button onClick={onSaveNote}>Save Note ({selectedVerses.length})</button>}
      <button onClick={() => { setShowPalette(false); setShowNotebook(false); }}>✕</button>
    </div>
  );
}
export default FloatingTools;