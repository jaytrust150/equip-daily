import React, { useState } from 'react';
import { bibleData } from '../../bibleData'; 
import { COLOR_PALETTE, BIBLE_VERSIONS } from '../../config/constants';

/**
 * ControlBar Component
 * 
 * Comprehensive navigation and feature control toolbar for Bible Study interface.
 * Consolidates all major Bible reading controls into a single, responsive component.
 * 
 * Layout:
 * - Top row: Book/chapter selectors, version dropdown, audio toggle, search
 * - Bottom row: Prev/next buttons, highlight picker, study mode, read tracker
 * 
 * State Management:
 * - Lifts state up to parent (BibleStudy) for coordination with other components
 * - Local search input state (form-controlled)
 * - Calculates chapter boundaries via bibleData lookup
 * 
 * @param {string} book - Currently displayed Bible book name (e.g., "Genesis", "John")
 * @param {number} chapter - Currently displayed chapter number (1-indexed)
 * @param {string} version - Active Bible version ID for API.Bible requests
 * @param {Function} setBook - Callback to change book (triggers chapter fetch)
 * @param {Function} setChapter - Callback to change chapter (triggers verse re-render)
 * @param {Function} setVersion - Callback to change Bible translation
 * @param {Function} onNext - Navigate to next chapter with boundary handling
 * @param {Function} onPrev - Navigate to previous chapter with boundary handling
 * @param {boolean} showNotes - Study mode toggle state (shows/hides note editor)
 * @param {Function} setShowNotes - Toggle study mode visibility
 * @param {Function} onHighlightClick - Open highlight color picker palette
 * @param {Object} activeHighlightColor - Current highlight color object: {code: string, bg: string, border: string}
 * @param {boolean} isChapterRead - Read status flag for current chapter
 * @param {Function} toggleChapterRead - Toggle chapter read status in Firestore
 * @param {Function} onSearch - Callback with search query to open SearchWell
 * @param {boolean} showAudio - Audio player visibility state
 * @param {Function} setShowAudio - Toggle audio player component
 */
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
  // Local controlled input for search form (submits to parent via onSearch)
  const [searchInput, setSearchInput] = useState("");
  
  /**
   * Look up total chapters for current book
   * Used for next/prev button boundary validation
   * Fallback to 50 prevents errors for unmapped books
   */
  const getChapterCount = () => bibleData.find(d => d.name === book)?.chapters || 50;
  
  /**
   * Submit search query to parent component
   * 
   * Prevents default form submission to avoid page reload.
   * Trims whitespace and validates non-empty query.
   * Parent (BibleStudy) opens SearchWell with query as initial value.
   */
  const handleSearch = (e) => {
      e.preventDefault();
      if (onSearch && searchInput.trim()) onSearch(searchInput);
  };

  return (
    // Main container with responsive flex layout
    <div style={{ marginBottom: '20px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top row: audio toggle, selectors, and search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        
        {/* Audio player visibility toggle button */}
        <button onClick={() => setShowAudio(!showAudio)} title={showAudio ? "Hide Audio" : "Play Audio"} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', marginRight: '5px' }}>
            {showAudio ? '🔊' : '🔇'}
        </button>

        {/* Book selector dropdown - resets chapter to 1 when changed */}
        <select name="book" value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }}>{bibleData.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}</select>
        {/* Chapter selector dropdown - dynamically populated based on selected book */}
        <select name="chapter" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>{[...Array(getChapterCount())].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select>
        
        {/* Bible version selector dropdown */}
        <select name="version" value={version} onChange={(e) => setVersion(e.target.value)}>
            {BIBLE_VERSIONS.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
            ))}
        </select>

        {/* Search form - positioned at right end of flex container */}
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <input name="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search..." style={{ padding: '4px 8px', borderRadius: '4px 0 0 4px', border: '1px solid #ccc', borderRight: 'none', width: '120px' }} />
            <button type="submit" style={{ padding: '4px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #ccc', borderLeft: 'none', background: '#eee', cursor: 'pointer' }}>🔍</button>
        </form>
      </div>

      {/* Bottom row: navigation and study tools */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Chapter navigation buttons */}
        <button onClick={onPrev}>← Prev</button><button onClick={onNext}>Next →</button>
        {/* Highlight button with current color preview */}
        <button onClick={onHighlightClick} style={{ backgroundColor: activeHighlightColor.code }}>Highlight</button>
        {/* Study mode toggle button */}
        <button onClick={() => setShowNotes(!showNotes)} style={{ backgroundColor: showNotes ? '#2196F3' : '' }}>{showNotes ? 'Reading Mode' : 'Study Mode'}</button>
        {/* Chapter read tracking checkbox */}
        <label><input type="checkbox" name="trackRead" checked={isChapterRead} onChange={toggleChapterRead} /> Track Read</label>
      </div>
    </div>
  );
}
export default ControlBar;