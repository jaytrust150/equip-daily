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
  
  // 📂 NEW: State to track which books are collapsed
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Auto-search if opened with a specific verse
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setGroupedResults([]);
    setCollapsedGroups({}); // Reset collapsed state on new search

    const isReference = /\d/.test(searchTerm);

    try {
      if (isReference) {
        // 📖 MODE 1: REFERENCE LOOKUP (bible-api.com)
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
        // 🔍 MODE 2: KEYWORD SEARCH (bolls.life)
        const res = await fetch(`https://bolls.life/find/WEB/?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        
        const rawResults = Object.values(data).map(item => ({
            book_name: BOOK_ID_MAP[item.book] || "Verse", 
            chapter: item.chapter,
            verse: item.verse,
            text: item.text 
        })).slice(0, 100);

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

    const closeIfMobile = () => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    if (!r.isRef) {
      onJumpToVerse(r.book_name, r.chapter);
      closeIfMobile();
      return;
    }

    if (r.isRef) {
      const match = r.book_name.match(/^(.+)\s(\d+):/);
      
      if (match) {
        const book = match[1].trim();   
        const chapter = match[2];       
        onJumpToVerse(book, chapter);
        closeIfMobile();
      } else {
        const chapterMatch = r.book_name.match(/^(.+)\s(\d+)$/);
        if (chapterMatch) {
            onJumpToVerse(chapterMatch[1].trim(), chapterMatch[2]);
            closeIfMobile();
        }
      }
    }
  };

  if (!isOpen && !initialQuery) return null;

  // 🎨 STYLES
  const sidebarStyle = {
    position: 'fixed',
    top: '80px',
    right: isOpen ? '20px' : '-450px',
    bottom: '20px',
    width: '350px',
    maxWidth: '85vw',
    backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'all' : 'none'
  };

  return (
    <div className="search-well" style={sidebarStyle}>
      <div style={{ padding: '20px 20px 10px 20px', borderBottom: theme === 'dark' ? '1px solid #444' : '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#2196F3', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
            <span>📖</span> Bible Search
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: theme === 'dark' ? '#888' : '#555' }}>✕</button>
        </div>
        
        {/* 👑 CENTERED & MARGINED TITLE */}
        <p style={{ 
            fontSize: '0.75rem',      
            fontStyle: 'italic', 
            textAlign: 'center',
            color: theme === 'dark' ? '#aaa' : '#666', 
            marginTop: '15px',
            marginBottom: '5px', 
            lineHeight: '1.4',
            maxWidth: '92%',
            marginLeft: 'auto',
            marginRight: 'auto'
        }}>
          "How much better to get wisdom than gold! To get understanding is to be chosen rather than silver."
          <span style={{ fontWeight: 'bold', fontStyle: 'normal', display: 'block', marginTop: '4px', opacity: 0.8, fontSize: '0.7rem' }}> — Prov 16:16</span>
        </p>
      </div>

      <div style={{ padding: '15px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords or Verses..."
            style={{ 
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', 
              background: theme === 'dark' ? '#444' : '#fff', color: theme === 'dark' ? '#fff' : '#333' 
            }}
          />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>Go</button>
        </form>
        
        {/* 💡 ONE LINE TIP */}
        <p style={{ fontSize: '0.68rem', color: theme === 'dark' ? '#777' : '#888', marginTop: '8px', textAlign: 'center', fontStyle: 'italic', marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          💡 Tip: Click any result to jump to that chapter.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '20px' }}>Drawing water...</p>
        ) : groupedResults.length === 0 && query ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No results found.</p>
        ) : (
          groupedResults.map((group, gIndex) => {
            const isCollapsed = collapsedGroups[group.groupName];
            return (
              <div key={gIndex} style={{ marginBottom: '5px' }}>
                {/* 📂 CLICKABLE HEADER */}
                <div 
                  onClick={() => toggleGroup(group.groupName)}
                  style={{ 
                    position: 'sticky', top: 0, 
                    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f0f4f8', 
                    padding: '10px 12px', borderRadius: '6px', marginBottom: '8px',
                    fontWeight: 'bold', fontSize: '0.9rem', color: '#2196F3',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 5,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{group.groupName} <span style={{fontSize: '0.8rem', opacity: 0.7, color: theme === 'dark' ? '#aaa' : '#666'}}>({group.verses.length})</span></span>
                  <span style={{ fontSize: '0.8rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                </div>
                
                {/* 📜 VERSES LIST (Hidden if collapsed) */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '5px' }}>
                    {group.verses.map((r, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleResultClick(r)}
                            style={{ 
                                padding: '10px', borderRadius: '8px', 
                                backgroundColor: theme === 'dark' ? '#333' : '#fff', 
                                border: theme === 'dark' ? '1px solid #444' : '1px solid #eee',
                                cursor: 'pointer', 
                                transition: 'transform 0.1s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                        <strong style={{ display: 'block', fontSize: '0.8rem', color: theme === 'dark' ? '#aaa' : '#555', marginBottom: '2px' }}>
                            {r.book_name} {r.chapter ? `${r.chapter}:${r.verse}` : ''}
                        </strong>
                        <span 
                            style={{ fontSize: '0.9rem', lineHeight: '1.4', color: theme === 'dark' ? '#ddd' : '#333' }} 
                            dangerouslySetInnerHTML={{ __html: r.text }} 
                        />
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