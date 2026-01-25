import React, { useState, useEffect } from 'react';
import { useDraggableWindow } from '../../hooks/useDraggableWindow';
import { DEFAULT_BIBLE_VERSION, OSIS_TO_BOOK } from '../../config/constants';

function SearchWell({ theme, isOpen, onClose, initialQuery, onJumpToVerse, historyStack = [], onGoBack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileSize, setMobileSize] = useState('half');

  // 🪟 DESKTOP WINDOW STATE
  const DEFAULT_WIDTH = 340;
  const [winState, setWinState] = useState({ x: 0, y: 90, w: DEFAULT_WIDTH, h: 600 });
  
  // Use the hook for window dragging logic
  const { handleMouseDown } = useDraggableWindow(winState, setWinState); 

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth > 768) {
        setWinState({ x: window.innerWidth - DEFAULT_WIDTH - 20, y: 85, w: DEFAULT_WIDTH, h: window.innerHeight * 0.75 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery) { setQuery(initialQuery); performSearch(initialQuery); }
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
        let searchVersion = DEFAULT_BIBLE_VERSION || 'd6e14a625393b4da-01'; // Default to NLT
        
        // 🔒 Use serverless proxy to keep API key secure
        let res = await fetch(`/api/bible-search?bibleId=${searchVersion}&query=${encodeURIComponent(searchTerm.trim())}&limit=20`);

        // 🔄 Fallback to KJV if unauthorized
        if (res.status === 401 || (res.ok && (await res.clone().json()).unauthorized)) {
             if (searchVersion !== 'de4e12af7f28f599-01') {
                searchVersion = 'de4e12af7f28f599-01';
                res = await fetch(`/api/bible-search?bibleId=${searchVersion}&query=${encodeURIComponent(searchTerm.trim())}&limit=20`);
             }
        }
        
        if (res.status === 401) {
            console.error("API Authorization Failed. Check Vercel environment variables");
            throw new Error(`Unauthorized. Check API key configuration in Vercel.`);
        }
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json();
        
        if (data.data && data.data.verses) {
            const mappedResults = data.data.verses.map(v => ({
                id: v.id,
                reference: v.reference,
                text: v.text,
                bookId: v.bookId,
                chapter: v.chapterId.split('.')[1],
                verse: v.id.split('.')[2]
            }));
            setResults(mappedResults);
        }
    } catch (err) { 
        console.error("Search Error:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleResultClick = (r) => {
    if (!onJumpToVerse) return;
    // Use the OSIS_TO_BOOK map to ensure correct book names
    const fullBookName = OSIS_TO_BOOK[r.bookId] || r.bookId;
    onJumpToVerse(fullBookName, r.chapter);
    if (window.innerWidth <= 768) onClose();
  };

  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const containerStyle = {
    position: 'fixed', 
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
    border: isDark ? '1px solid #444' : '1px solid #ddd',
    zIndex: 2000, display: 'flex', flexDirection: 'column',
    ...(isMobile ? { bottom: 0, left: 0, width: '100%', height: mobileSize === 'full' ? '90vh' : '50vh', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' } 
                 : { left: winState.x, top: winState.y, width: winState.w, height: winState.h, borderRadius: '12px' })
  };

  return (
    <div style={containerStyle}>
      <div onMouseDown={handleMouseDown} style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', cursor: isMobile ? 'default' : 'grab' }}>
        <span style={{ fontWeight: 'bold', color: '#2196F3' }}>📖 The Well</span>
        <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
      </div>

      <div style={{ padding: '10px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Scripture..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold' }}>Go</button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && <p style={{textAlign:'center', color:'#888'}}>Searching...</p>}
        {error && (
            <div style={{textAlign:'center', padding:'20px', color:'red'}}>
                <p>⚠️ {error}</p>
                {error.includes("whitelist") && (
                    <p style={{fontSize:'0.85rem', color: isDark ? '#ccc' : '#666', marginTop:'10px', backgroundColor: isDark ? '#444' : '#f5f5f5', padding:'8px', borderRadius:'4px'}}>
                        👆 Copy the URL above and add it to your API.Bible Dashboard.
                    </p>
                )}
            </div>
        )}
        {!loading && !error && results.map((r) => (
            <div key={r.id} onClick={() => handleResultClick(r)} style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDark ? '#333' : '#f9f9f9', cursor: 'pointer' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#2196F3', marginBottom: '4px' }}>{r.reference}</strong>
                <span style={{ fontSize: '0.9rem', color: isDark ? '#ddd' : '#333' }} dangerouslySetInnerHTML={{ __html: r.text }} />
            </div>
        ))}
        {!loading && !error && results.length === 0 && query && <p style={{textAlign:'center', color:'#888'}}>No results.</p>}
      </div>
    </div>
  );
}

export default SearchWell;