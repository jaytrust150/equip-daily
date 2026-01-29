import React, { useState, useEffect } from 'react';
import { useDraggableWindow } from '../hooks/useDraggableWindow';
import { DEFAULT_BIBLE_VERSION, OSIS_TO_BOOK } from '../config/constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

function SearchWell({ theme, isOpen, onClose, initialQuery, onJumpToVerse, user }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileSize] = useState('half');
  const [versions, setVersions] = useState([]); // Bible versions list
  const [selectedVersion, setSelectedVersion] = useState(null); // Selected version for search
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState({}); // Track collapsed state by chapter key
  const inputRef = React.useRef(null);

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

  // Fetch Bible versions when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchBibleVersions();
    }
  }, [isOpen]);

  // Handle initial query after version is selected
  useEffect(() => {
    if (isOpen && initialQuery && selectedVersion) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [isOpen, initialQuery, selectedVersion]);

  // Update search when initialQuery changes (for clicking different verse links)
  useEffect(() => {
    if (isOpen && initialQuery && selectedVersion && initialQuery !== query) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // 📖 Fetch available Bible versions from /api/bibles
  const fetchBibleVersions = async () => {
    setVersionsLoading(true);
    try {
      const res = await fetch('/api/bibles');
      if (!res.ok) throw new Error('Failed to load Bible versions');
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setVersions(data.data);
        
        // Load user's saved Bible version preference
        let userDefaultVersion = null;
        if (user && db) {
          try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.defaultBibleVersion) {
                userDefaultVersion = userData.defaultBibleVersion;
              }
            }
          } catch (error) {
            console.error('Error loading user Bible version preference:', error);
          }
        }
        
        // Set version priority: user's saved version > first in list > fallback
        if (!selectedVersion) {
          if (userDefaultVersion) {
            setSelectedVersion(userDefaultVersion);
          } else if (data.data.length > 0) {
            setSelectedVersion(data.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching Bible versions:', err);
      // Fallback to default version
      setSelectedVersion('d6e14a625393b4da-01');
    } finally {
      setVersionsLoading(false);
    }
  };

  const performSearch = async (searchTerm) => {
    if (!searchTerm || !selectedVersion) {
      console.log('Search blocked:', { searchTerm, selectedVersion });
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    try {
        const searchVersion = selectedVersion; // Use selected version from dropdown
        console.log('Performing search:', { query: searchTerm, version: searchVersion });
        
        // 🔒 Use serverless proxy
        const res = await fetch(`/api/bible-search?bibleId=${searchVersion}&query=${encodeURIComponent(searchTerm.trim())}&limit=20`);
        
        if (res.status === 401) {
            console.error("API Authorization Failed. Check Vercel environment variables");
            throw new Error(`Unauthorized. Check API key configuration in Vercel.`);
        }
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Search API error:', res.status, errorText);
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        
        // Debug: log the response structure
        console.log('Search API Response:', data);
        
        if (data.data && data.data.verses) {
            const mappedResults = data.data.verses.map(v => {
                // Extract chapter from chapterId (e.g., "1CO.13" -> "13")
                const chapterMatch = v.chapterId.match(/\.(\d+)$/);
                const chapter = chapterMatch ? chapterMatch[1] : '1';
                
                // Map OSIS code to book name using OSIS_TO_BOOK
                const fullBookName = OSIS_TO_BOOK[v.bookId] || v.bookId;
                
                // Extract verse number from id (e.g., "1CO.13.7" -> "7")
                const verseMatch = v.id.match(/\.(\d+)$/);
                const verse = verseMatch ? verseMatch[1] : '1';
                
                return {
                  id: v.id,
                  reference: v.reference,
                  text: v.text,
                  bookId: v.bookId,
                  fullBookName: fullBookName,
                  chapter: chapter,
                  verse: verse
                };
            });
            setResults(mappedResults);
        } else {
            // If no verses found, log for debugging
            console.warn('No verses found in response:', data);
            setResults([]);
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
    // Use the pre-mapped full book name and pass verse number
    onJumpToVerse(r.fullBookName, r.chapter, parseInt(r.verse));
    if (window.innerWidth <= 768) onClose();
  };

  // Group results by book and chapter
  const groupedResults = React.useMemo(() => {
    const grouped = {};
    results.forEach(result => {
      const key = `${result.fullBookName} ${result.chapter}`;
      if (!grouped[key]) {
        grouped[key] = {
          book: result.fullBookName,
          chapter: result.chapter,
          verses: []
        };
      }
      grouped[key].verses.push(result);
    });
    return grouped;
  }, [results]);

  const toggleChapter = (chapterKey) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterKey]: !prev[chapterKey]
    }));
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
      <div onMouseDown={handleMouseDown} style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '6px', cursor: isMobile ? 'default' : 'grab' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '1rem' }}>📖 The Well</span>
          <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: isDark ? '#aaa' : '#666', margin: 0, lineHeight: '1.3' }}>
          "How much better to get wisdom than gold, to get insight rather than silver!" — Proverbs 16:16
        </p>
      </div>

      <div style={{ padding: '10px 20px' }}>
        {/* Version Selector */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', display: 'block', marginBottom: '4px' }}>Version</label>
          <select 
            value={selectedVersion || ''} 
            onChange={(e) => setSelectedVersion(e.target.value)}
            disabled={versionsLoading || versions.length === 0}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              backgroundColor: isDark ? '#444' : '#fff',
              color: isDark ? '#fff' : '#000',
              cursor: 'pointer'
            }}
          >
            {versionsLoading && <option>Loading versions...</option>}
            {!versionsLoading && versions.map(v => (
              <option key={v.id} value={v.id}>{v.abbreviation || v.name}</option>
            ))}
          </select>
        </div>

        {/* Search Form */}
        <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }} style={{ display: 'flex', gap: '8px' }}>
          <input 
            ref={inputRef}
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search Scripture..." 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: isDark ? '#444' : '#fff', color: isDark ? '#fff' : '#000' }} 
          />
          <button type="submit" style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>Go</button>
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
        {!loading && !error && Object.keys(groupedResults).length > 0 && (
          <>
            {Object.entries(groupedResults).map(([chapterKey, group]) => {
              const isCollapsed = collapsedChapters[chapterKey];
              return (
                <div key={chapterKey} style={{ marginBottom: '10px' }}>
                  {/* Chapter Header */}
                  <div 
                    onClick={() => toggleChapter(chapterKey)}
                    style={{ 
                      padding: '10px', 
                      borderRadius: '8px', 
                      backgroundColor: isDark ? '#2c2c2c' : '#e3f2fd', 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      color: '#2196F3',
                      marginBottom: '5px'
                    }}
                  >
                    <span>{group.book} {group.chapter} ({group.verses.length} verse{group.verses.length !== 1 ? 's' : ''})</span>
                    <span style={{ fontSize: '1.2rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                  </div>
                  
                  {/* Verses - Collapsible */}
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px' }}>
                      {group.verses.map((r) => (
                        <div 
                          key={r.id} 
                          onClick={() => handleResultClick(r)} 
                          style={{ 
                            padding: '10px', 
                            borderRadius: '8px', 
                            backgroundColor: isDark ? '#333' : '#f9f9f9', 
                            cursor: 'pointer',
                            borderLeft: '3px solid #2196F3'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: '0.85rem', color: '#2196F3', marginBottom: '4px' }}>Verse {r.verse}</strong>
                          <span style={{ fontSize: '0.9rem', color: isDark ? '#ddd' : '#333' }} dangerouslySetInnerHTML={{ __html: r.text }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
        {!loading && !error && results.length === 0 && query && <p style={{textAlign:'center', color:'#888'}}>No results.</p>}
      </div>
    </div>
  );
}

export default SearchWell;