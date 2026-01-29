import React, { useState } from 'react';
import { bibleData } from '../../bibleData'; 
import { COLOR_PALETTE, BIBLE_VERSIONS } from '../../config/constants';

function ControlBar({ 
  book, chapter, version, 
  setBook, setChapter, setVersion, 
  onNext, onPrev, 
  showNotes, setShowNotes, 
  onHighlightClick, activeHighlightColor, 
  isChapterRead, toggleChapterRead, 
  onSearch,
  showAudio, setShowAudio 
}) {
  const [searchInput, setSearchInput] = useState("");
  const getChapterCount = () => bibleData.find(d => d.name === book)?.chapters || 50;
  
  const handleSearch = (e) => {
      e.preventDefault();
      if (onSearch && searchInput.trim()) onSearch(searchInput);
  };

  return (
    <div style={{ marginBottom: '20px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        
        <button onClick={() => setShowAudio(!showAudio)} title={showAudio ? "Hide Audio" : "Play Audio"} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', marginRight: '5px' }}>
            {showAudio ? '🔊' : '🔇'}
        </button>

        <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }}>{bibleData.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}</select>
        <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>{[...Array(getChapterCount())].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select>
        
        <select value={version} onChange={(e) => setVersion(e.target.value)}>
            {BIBLE_VERSIONS.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
            ))}
        </select>

        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." style={{ padding: '4px 8px', borderRadius: '4px 0 0 4px', border: '1px solid #ccc', borderRight: 'none', width: '120px' }} />
            <button type="submit" style={{ padding: '4px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #ccc', borderLeft: 'none', background: '#eee', cursor: 'pointer' }}>🔍</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onPrev}>← Prev</button><button onClick={onNext}>Next →</button>
        <button onClick={onHighlightClick} style={{ backgroundColor: activeHighlightColor.code }}>Highlight</button>
        <button onClick={() => setShowNotes(!showNotes)} style={{ backgroundColor: showNotes ? '#2196F3' : '' }}>{showNotes ? 'Reading Mode' : 'Study Mode'}</button>
        <label><input type="checkbox" checked={isChapterRead} onChange={toggleChapterRead} /> Track Read</label>
      </div>
    </div>
  );
}
export default ControlBar;