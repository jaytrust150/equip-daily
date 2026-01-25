import React from 'react';
import { COLOR_PALETTE } from '../../config/constants';
function FloatingTools({ showPalette, setShowPalette, showNotebook, setShowNotebook, onApplyColor, selectedVerses, onSaveNote }) {
  if (!showPalette && !showNotebook) return null;
  return (
    <div style={{ position: 'fixed', top: '50%', right: '20px', background: 'white', padding: '10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 1000 }}>
      {showPalette && COLOR_PALETTE.map(c => <button key={c.code} onClick={() => onApplyColor(c)} style={{ width: '20px', height: '20px', background: c.code, borderRadius: '50%', border: '1px solid #ccc' }} />)}
      {showPalette && <button onClick={() => onApplyColor(null)}>🚫</button>}
      {showNotebook && selectedVerses.length > 0 && <button onClick={onSaveNote}>Save Note ({selectedVerses.length})</button>}
      <button onClick={() => { setShowPalette(false); setShowNotebook(false); }}>✕</button>
    </div>
  );
}
export default FloatingTools;