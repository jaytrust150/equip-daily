import React, { useState, useEffect, useRef } from 'react';

// 📚 DECODER
const BOOK_ID_MAP = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles", 15: "Ezra",
  16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms", 20: "Proverbs",
  21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah", 24: "Jeremiah", 25: "Lamentations",
  26: "Ezekiel", 27: "Daniel", 28: "Hosea", 29: "Joel", 30: "Amos",
  31: "Obadiah", 32: "Jonah", 33: "Micah", 34: "Nahum", 35: "Habakkuk",
  36: "Zephaniah", 37: "Haggai", 38: "Zechariah", 39: "Malachi", 40: "Matthew",
  41: "Mark", 42: "Luke", 43: "John", 44: "Acts", 45: "Romans",
  46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians", 49: "Ephesians", 50: "Philippians",
  51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
  56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter",
  61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation"
};

function SearchWell({ theme, isOpen, onClose, initialQuery, onJumpToVerse, historyStack = [], onGoBack }) {
  const [query, setQuery] = useState("");
  const [groupedResults, setGroupedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [mobileSize, setMobileSize] = useState('half');

  // 🪟 DESKTOP WINDOW STATE
  const DEFAULT_WIDTH = 340;
  const [winState, setWinState] = useState({ x: 0, y: 90, w: DEFAULT_WIDTH, h: 600 });

  const dragStart = useRef(null); 
  const resizeStart = useRef(null); 

  useEffect(() => {
    if (isOpen) {
        setMobileSize('half');
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
            setWinState({
                x: window.innerWidth - DEFAULT_WIDTH - 20, 
                y: 85, 
                w: DEFAULT_WIDTH,
                h: window.innerHeight * 0.75 
            });
        }
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // --- 🖱️ DRAG LOGIC ---
  const handleDragStart = (e) => {
    if (window.innerWidth <= 768) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = {
        mouseX: clientX, mouseY: clientY,
        startX: winState.x, startY: winState.y
    };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragStart.current) return;
    if (e.cancelable) e.preventDefault(); 
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setWinState(prev => ({
        ...prev,
        x: dragStart.current.startX + (clientX - dragStart.current.mouseX),
        y: dragStart.current.startY + (clientY - dragStart.current.mouseY)
    }));
  };

  const handleDragEnd = () => {
    dragStart.current = null;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };

  // --- 📐 RESIZE LOGIC ---
  const handleResizeStart = (e, direction) => {
    e.stopPropagation(); 
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    resizeStart.current = {
        startW: winState.w, startH: winState.h, startX: winState.x,
        mouseX: clientX, mouseY: clientY, direction
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!resizeStart.current) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const { startW, startH, startX, mouseX, mouseY, direction } = resizeStart.current;

    const deltaX = clientX - mouseX;
    const deltaY = clientY - mouseY;

    if (direction === 'SE') {
        setWinState(prev => ({
            ...prev,
            w: Math.max(300, startW + deltaX),
            h: Math.max(300, startH + deltaY)
        }));
    } else if (direction === 'SW') {
        setWinState(prev => ({
            ...prev,
            w: Math.max(300, startW - deltaX), 
            x: startX + deltaX,
            h: Math.max(300, startH + deltaY)
        }));
    }
  };

  const handleResizeEnd = () => {
    resizeStart.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeEnd);
  };

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleMobileSize = () => {
    setMobileSize(prev => prev === 'half' ? 'full' : 'half');
  };

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setGroupedResults([]);
    setCollapsedGroups({}); 

    const isReference = /\d/.test(searchTerm);

    try {
      if (isReference) {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchTerm)}?translation=web`);
        const data = await res.json();
        if (data.text) {
          setGroupedResults([{
            groupName: "Passage",
            verses: [{ book_name: data.reference, isRef: true, text: data.text }]
          }]);
        }
      } else {
        const res = await fetch(`https://bolls.life/find/WEB/?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        const rawResults = Object.values(data)
            .filter(item => item.book && BOOK_ID_MAP[item.book])
            .sort((a, b) => {
                if (a.book !== b.book) return a.book - b.book;
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
            })
            .map(item => ({
                book_name: BOOK_ID_MAP[item.book], chapter: item.chapter, verse: item.verse, text: item.text 
            }));
        const groups = [];
        rawResults.forEach(item => {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.groupName === item.book_name) {
                lastGroup.verses.push(item);
            } else {
                groups.push({ groupName: item.book_name, verses: [item] });
            }
        });
        setGroupedResults(groups);
      }
    } catch (err) {
      console.error("The well is dry...", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (r) => {
    if (!onJumpToVerse) return;
    if (window.innerWidth <= 768) onClose();
    if (!r.isRef) {
      onJumpToVerse(r.book_name, r.chapter);
    } else {
      const match = r.book_name.match(/^(.+)\s(\d+):/);
      if (match) onJumpToVerse(match[1].trim(), match[2]);
      else {
        const chapterMatch = r.book_name.match(/^(.+)\s(\d+)$/);
        if (chapterMatch) onJumpToVerse(chapterMatch[1].trim(), chapterMatch[2]);
      }
    }
  };

  // 🛑 THE CRITICAL FIX: If isOpen is false, DIE. Do not check initialQuery.
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const mobileStyle = {
    position: 'fixed', bottom: 0, left: 0, width: '100%',
    height: mobileSize === 'full' ? '90vh' : '50vh',
    borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
    transition: 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  };

  const desktopStyle = {
    position: 'fixed',
    left: winState.x, top: winState.y,
    width: winState.w, height: winState.h,
    borderRadius: '12px',
    maxWidth: '95vw', maxHeight: '90vh'
  };

  const commonStyle = {
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
    border: isDark ? '1px solid #444' : '1px solid #ddd',
    zIndex: 2000,
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div className="search-well" style={{ ...commonStyle, ...(isMobile ? mobileStyle : desktopStyle) }}>
      
      {/* 🔴 ABSOLUTE CLOSE BUTTON (Floating Satellite) */}
      <button 
          onClick={(e) => {
              e.stopPropagation(); 
              onClose();
          }} 
          onMouseDown={(e) => e.stopPropagation()} 
          onTouchStart={(e) => e.stopPropagation()} 
          style={{ 
              position: 'absolute',
              top: '8px', 
              right: '10px',
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              lineHeight: '1', 
              cursor: 'pointer', 
              color: isDark ? '#888' : '#555', 
              padding: '8px',
              zIndex: 3000 // Super high Z-Index
          }}
      >
          ✕
      </button>

      {/* 🧢 DRAGGABLE HEADER */}
      <div 
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ 
          padding: '12px 20px', 
          borderBottom: isDark ? '1px solid #444' : '1px solid #eee',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: isMobile ? 'default' : 'grab',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          userSelect: 'none',
          borderTopLeftRadius: '12px', borderTopRightRadius: '12px',
          paddingRight: '50px' // Space for X button
      }}>
        {isMobile && (
            <button onClick={toggleMobileSize} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: 0 }}>
                {mobileSize === 'full' ? '⬇️' : '⬆️'}
            </button>
        )}
        <h3 style={{ margin: 0, color: '#2196F3', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📖</span> The Well • Bible Search
        </h3>
      </div>

      {/* 👑 QUOTE */}
      <div style={{ padding: '10px 20px 0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: isDark ? '#aaa' : '#666', margin: 0, lineHeight: '1.4' }}>
          "That <strong>He</strong> might sanctify and cleanse it with the washing of water by the word."
          <span style={{ fontWeight: 'bold', fontStyle: 'normal', display: 'block', marginTop: '2px', opacity: 0.8, fontSize: '0.7rem' }}> — Eph 5:26</span>
        </p>
      </div>

      {/* ↩ RETURN BUTTON */}
      {historyStack.length > 0 && (
        <div style={{ padding: '5px 20px 0 20px', textAlign: 'center' }}>
            <button 
                onClick={() => { if(onGoBack) onGoBack(); onClose(); }} 
                style={{
                    backgroundColor: 'transparent',
                    color: '#2196F3',
                    border: '1px solid #2196F3',
                    borderRadius: '15px',
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                ↩ Return to {historyStack[historyStack.length - 1].book} {historyStack[historyStack.length - 1].chapter}
            </button>
        </div>
      )}

      {/* 🔍 SEARCH BOX */}
      <div style={{ padding: '10px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input 
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keywords or verses..."
            onMouseDown={(e) => e.stopPropagation()} 
            onTouchStart={(e) => e.stopPropagation()} 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: isDark ? '#444' : '#fff', color: isDark ? '#fff' : '#333', fontSize: '16px' }}
          />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold' }}>Go</button>
        </form>
        {/* 💡 TIP */}
        <p style={{ fontSize: '0.68rem', color: isDark ? '#777' : '#888', marginTop: '8px', textAlign: 'center', fontStyle: 'italic', marginBottom: 0 }}>
          💡 Tip: Click any result to jump to that chapter.
        </p>
      </div>

      {/* 📜 RESULTS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '20px' }}>Drawing from the well...</p> : 
         groupedResults.length === 0 && query ? <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No results found.</p> : (
          groupedResults.map((group, gIndex) => {
            const isCollapsed = collapsedGroups[group.groupName];
            return (
              <div key={gIndex} style={{ marginBottom: '5px' }}>
                <div onClick={() => toggleGroup(group.groupName)} style={{ position: 'sticky', top: 0, backgroundColor: isDark ? '#1e1e1e' : '#f0f4f8', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: '#2196F3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 5, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{group.groupName} {group.groupName !== "Passage" && <span style={{opacity:0.7, fontSize:'0.8rem', marginLeft:'5px'}}>({group.verses.length})</span>}</span>
                  <span style={{ fontSize: '0.8rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                </div>
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '5px' }}>
                    {group.verses.map((r, i) => (
                        <div key={i} onClick={() => handleResultClick(r)} style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDark ? '#333' : '#fff', border: isDark ? '1px solid #444' : '1px solid #eee', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        <strong style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#555', marginBottom: '2px' }}>{r.book_name} {r.chapter ? `${r.chapter}:${r.verse}` : ''}</strong>
                        <span style={{ fontSize: '0.9rem', lineHeight: '1.4', color: isDark ? '#ddd' : '#333' }} dangerouslySetInnerHTML={{ __html: r.text }} />
                        </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 📐 INVISIBLE RESIZE HANDLES */}
      {!isMobile && (
        <>
            <div onMouseDown={(e) => handleResizeStart(e, 'SW')} style={{ position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', cursor: 'sw-resize', zIndex: 2002 }} />
            <div onMouseDown={(e) => handleResizeStart(e, 'SE')} style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', cursor: 'se-resize', zIndex: 2002 }} />
        </>
      )}
    </div>
  );
}

export default SearchWell;