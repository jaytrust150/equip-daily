import React, { useState, useEffect } from 'react';

// 📚 DECODER: Translates API Book IDs (1-66) to Names
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

function SearchWell({ theme, isOpen, onClose, initialQuery, onJumpToVerse }) {
  const [query, setQuery] = useState("");
  const [groupedResults, setGroupedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  
  // 📏 SIZE STATE: 'half' (default mobile) or 'full'
  const [sizeMode, setSizeMode] = useState('half'); 

  // Auto-search and reset size when opened
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
      setSizeMode('half'); 
    }
  }, [initialQuery]);

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleSize = () => {
    setSizeMode(prev => prev === 'half' ? 'full' : 'half');
  };

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setGroupedResults([]);
    setCollapsedGroups({}); 

    const isReference = /\d/.test(searchTerm);

    try {
      if (isReference) {
        // 📖 MODE 1: REFERENCE LOOKUP
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchTerm)}?translation=web`);
        const data = await res.json();

        if (data.text) {
          setGroupedResults([{
            groupName: "Passage",
            verses: [{
              book_name: data.reference,
              isRef: true, 
              text: data.text
            }]
          }]);
        }
      } else {
        // 🔍 MODE 2: KEYWORD SEARCH
        const res = await fetch(`https://bolls.life/find/WEB/?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        
        // 🛡️ UNLIMITED LOGIC (No .slice, Strict Sort)
        const rawResults = Object.values(data)
            .filter(item => item.book && BOOK_ID_MAP[item.book]) // Only allow real books
            .sort((a, b) => {
                if (a.book !== b.book) return a.book - b.book;
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
            })
            .map(item => ({
                book_name: BOOK_ID_MAP[item.book], 
                chapter: item.chapter,
                verse: item.verse,
                text: item.text 
            }));

        // Group by Book
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

  // 🚀 JUMP HANDLER
  const handleResultClick = (r) => {
    if (!onJumpToVerse) return;
    const isMobile = window.innerWidth <= 768;

    if (!r.isRef) {
      onJumpToVerse(r.book_name, r.chapter);
      if (isMobile) onClose(); // Auto-close on mobile for better flow
      return;
    }

    if (r.isRef) {
      const match = r.book_name.match(/^(.+)\s(\d+):/);
      if (match) {
        onJumpToVerse(match[1].trim(), match[2]);
        if (isMobile) onClose();
      } else {
        const chapterMatch = r.book_name.match(/^(.+)\s(\d+)$/);
        if (chapterMatch) {
            onJumpToVerse(chapterMatch[1].trim(), chapterMatch[2]);
            if (isMobile) onClose();
        }
      }
    }
  };

  if (!isOpen && !initialQuery) return null;

  // 🎨 DYNAMIC STYLES (Bottom Sheet for Mobile, Sidebar for Desktop)
  const isDark = theme === 'dark';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const containerStyle = {
    position: 'fixed',
    // Mobile: Stick to bottom (Sheet). Desktop: Stick to right (Sidebar).
    bottom: 0,
    right: isMobile ? 0 : '10px', // ✨ CHANGED: Closer to edge (was 20px)
    left: isMobile ? 0 : 'auto',
    top: isMobile ? 'auto' : '80px',
    
    // Height logic: Mobile half/full vs Desktop fixed
    height: isMobile ? (sizeMode === 'full' ? '90vh' : '50vh') : '80vh',
    width: isMobile ? '100%' : '320px', // ✨ CHANGED: Thinner width (was 380px)
    
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    borderBottomLeftRadius: isMobile ? 0 : '16px',
    borderBottomRightRadius: isMobile ? 0 : '16px',
    
    boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
    border: isDark ? '1px solid #444' : '1px solid #ddd',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  };

  return (
    <div className="search-well" style={containerStyle}>
      {/* 🧢 HEADER / DRAG HANDLE */}
      <div style={{ 
          padding: '12px 20px', 
          borderBottom: isDark ? '1px solid #444' : '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: isMobile ? 'ns-resize' : 'default',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 📏 RESIZE BUTTON (Mobile Only) */}
            {isMobile && (
                <button onClick={toggleSize} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>
                    {sizeMode === 'full' ? '⬇️' : '⬆️'}
                </button>
            )}
            <h3 style={{ margin: 0, color: '#2196F3', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📖</span> Bible Search
            </h3>
        </div>
        
        <button 
            onClick={onClose} 
            style={{ 
                background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: '1',
                cursor: 'pointer', color: isDark ? '#888' : '#555', padding: '0 5px'
            }}
        >
            ✕
        </button>
      </div>

      {/* 👑 QUOTE: EPH 5:26 (With "He" Capitalized) */}
      <div style={{ padding: '10px 20px 0 20px', textAlign: 'center' }}>
        <p style={{ 
            fontSize: '0.75rem',      
            fontStyle: 'italic', 
            color: isDark ? '#aaa' : '#666', 
            margin: 0,
            lineHeight: '1.4'
        }}>
          "That <strong>He</strong> might sanctify and cleanse it with the washing of water by the word."
          <span style={{ fontWeight: 'bold', fontStyle: 'normal', display: 'block', marginTop: '2px', opacity: 0.8, fontSize: '0.7rem' }}> — Eph 5:26</span>
        </p>
      </div>

      <div style={{ padding: '10px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords or Verses..."
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', 
              background: isDark ? '#444' : '#fff', color: isDark ? '#fff' : '#333', fontSize: '16px' 
            }}
          />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold' }}>Go</button>
        </form>
        
        {/* 💡 TIP RESTORED */}
        <p style={{ fontSize: '0.68rem', color: isDark ? '#777' : '#888', marginTop: '8px', textAlign: 'center', fontStyle: 'italic', marginBottom: 0 }}>
          💡 Tip: Click any result to jump to that chapter.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '20px' }}>Drawing from the well...</p>
        ) : groupedResults.length === 0 && query ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No results found.</p>
        ) : (
          groupedResults.map((group, gIndex) => {
            const isCollapsed = collapsedGroups[group.groupName];
            return (
              <div key={gIndex} style={{ marginBottom: '5px' }}>
                <div 
                  onClick={() => toggleGroup(group.groupName)}
                  style={{ 
                    position: 'sticky', top: 0, 
                    backgroundColor: isDark ? '#1e1e1e' : '#f0f4f8', 
                    padding: '10px 12px', borderRadius: '6px', marginBottom: '8px',
                    fontWeight: 'bold', fontSize: '0.9rem', color: '#2196F3',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 5,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{group.groupName} {group.groupName !== "Passage" && <span style={{opacity:0.7, fontSize:'0.8rem', marginLeft:'5px'}}>({group.verses.length})</span>}</span>
                  <span style={{ fontSize: '0.8rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                </div>
                
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '5px' }}>
                    {group.verses.map((r, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleResultClick(r)}
                            style={{ 
                                padding: '10px', borderRadius: '8px', 
                                backgroundColor: isDark ? '#333' : '#fff', 
                                border: isDark ? '1px solid #444' : '1px solid #eee',
                                cursor: 'pointer',
                                transition: 'transform 0.1s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                        <strong style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#555', marginBottom: '2px' }}>
                            {r.book_name} {r.chapter ? `${r.chapter}:${r.verse}` : ''}
                        </strong>
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
    </div>
  );
}

export default SearchWell;