import React, { useState, useEffect } from 'react';

function SearchWell({ theme, isOpen, onClose, initialQuery }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-search if opened with a specific verse or keyword
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    
    // 🧠 LOGIC: Detect if it's a Verse Reference or a Keyword
    // If it has numbers (like "John 3:16"), we treat it as a Reference.
    // If it's just text (like "Love"), we treat it as a Search.
    const isReference = /\d/.test(searchTerm);

    try {
      if (isReference) {
        // 📖 MODE 1: REFERENCE LOOKUP (bible-api.com)
        // Good for: Reading full passages, formatting
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchTerm)}?translation=web`);
        const data = await res.json();

        if (data.text) {
          // Normalize it to look like a list so our UI can map it
          setResults([{
            book_name: data.reference,
            chapter: '', // API gives full ref string
            verse: '',
            text: data.text
          }]);
        } else {
          setResults([]);
        }

      } else {
        // 🔍 MODE 2: KEYWORD SEARCH (bolls.life is often better for search, but sticking to bible-api logic for consistency if preferred, 
        // OR using a search-specific endpoint if available. 
        // NOTE: bible-api.com does NOT have a full text search endpoint. 
        // We will use a fallback or a different free API for keywords.
        // Let's use https://bolls.life/find/WEB/?search=... for keywords as it's free and fast.
        
        const res = await fetch(`https://bolls.life/find/WEB/?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        
        // Bolls returns { pk, text, verse, chapter... }
        // We map it to match our UI format
        const formattedResults = Object.values(data).map(item => ({
            book_name: "Verse", // Bolls doesn't always send book name easily in search, simplifying for MVP
            chapter: item.chapter,
            verse: item.verse,
            text: item.text
        })).slice(0, 50); // Limit to 50 results for speed

        setResults(formattedResults);
      }

    } catch (err) {
      console.error("The well is dry...", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !initialQuery) return null;

  // 🎨 STYLES
  const sidebarStyle = {
    position: 'fixed',
    top: '80px',
    right: isOpen ? '20px' : '-450px', // Slide in/out logic
    bottom: '20px',
    width: '350px',
    maxWidth: '85vw', // Mobile friendly
    backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smooth float effect
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'all' : 'none'
  };

  return (
    <div className="search-well" style={sidebarStyle}>
      {/* Header */}
      <div style={{ padding: '20px 20px 10px 20px', borderBottom: theme === 'dark' ? '1px solid #444' : '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#2196F3', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
            <span>💧</span> The Well
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: theme === 'dark' ? '#888' : '#555' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: theme === 'dark' ? '#888' : '#666', marginTop: '8px', lineHeight: '1.4' }}>
          "Everyone who drinks this water will be thirsty again, but whoever drinks the water I give them will never thirst..."
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '15px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords (e.g. 'Grace') or Verses..."
            style={{ 
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', 
              background: theme === 'dark' ? '#444' : '#fff', color: theme === 'dark' ? '#fff' : '#333' 
            }}
          />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>Go</button>
        </form>
      </div>

      {/* Results Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '20px' }}>Drawing water...</p>
        ) : results.length === 0 && query ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No results found.</p>
        ) : (
          results.map((r, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '8px', backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa', borderLeft: '3px solid #2196F3' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#2196F3', marginBottom: '4px' }}>
                {r.book_name} {r.chapter ? `${r.chapter}:${r.verse}` : ''}
              </strong>
              <span style={{ fontSize: '0.9rem', lineHeight: '1.5', color: theme === 'dark' ? '#ddd' : '#333' }}>
                {r.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SearchWell;