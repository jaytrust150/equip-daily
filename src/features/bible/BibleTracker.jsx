import React, { useState, useEffect } from 'react';
// ✅ FIXED IMPORT: Points to src/data/bibleData.js
import { bibleData } from '../../data/bibleData';

function BibleTracker({ readChapters = [], onNavigate, sectionFilter = null, theme = 'light' /* onToggleRead unused for now */ }) {
  
  const [selectedBook, setSelectedBook] = useState(null);

  // 1. Calculate Total Bible Progress
  const totalChaptersInBible = 1189;
  const totalReadCount = readChapters.length;
  const totalPercentage = Math.round((totalReadCount / totalChaptersInBible) * 100);

  // If a filter changes (e.g. switching OT to NT), reset the selected book view
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBook(null);
  }, [sectionFilter]);

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleChapterClick = (chapterNum) => {
    if (onNavigate) {
      onNavigate(selectedBook.name, chapterNum);
    }
    // Note: We don't scroll to top here because this might be used inside a modal/top view
  };

  // 📂 DRILL-DOWN VIEW (Chapter Grid)
  if (selectedBook) {
    const bookReadCount = readChapters.filter(entry => entry.startsWith(`${selectedBook.name} `)).length;
    const bookPercent = Math.round((bookReadCount / selectedBook.chapters) * 100);

    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white', 
        borderRadius: '15px', 
        border: theme === 'dark' ? '1px solid #444' : '1px solid #eee', 
        textAlign: 'center', 
        marginBottom: '20px' 
      }}>
        
        {/* Header with Navigation */}
        <div className="flex-between mb-10">
             <button 
                onClick={() => setSelectedBook(null)}
                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: theme === 'dark' ? '#aaa' : '#666' }}
             >
                ⬅ Back
             </button>
             <h3 style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>{selectedBook.name}</h3>
             <div className="w-50"></div>
        </div>

        {/* Book Progress Bar */}
        <div style={{ marginBottom: '25px', padding: '0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme === 'dark' ? '#999' : '#888', marginBottom: '5px' }}>
                <span>Progress</span>
                <span>{bookPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: theme === 'dark' ? '#333' : '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                    width: `${bookPercent}%`, 
                    height: '100%', 
                    background: bookPercent === 100 ? '#ffd700' : '#4caf50', 
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}></div>
            </div>
        </div>

        {/* Chapter Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {[...Array(selectedBook.chapters)].map((_, i) => {
                const chapterNum = i + 1;
                const chapterKey = `${selectedBook.name} ${chapterNum}`;
                const isRead = readChapters.includes(chapterKey);

                return (
                    <button
                        key={chapterNum}
                        onClick={() => handleChapterClick(chapterNum)}
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                            backgroundColor: isRead ? '#4caf50' : '#f0f0f0', 
                            color: isRead ? 'white' : '#555',
                            fontWeight: 'bold', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isRead ? '0 2px 5px rgba(76, 175, 80, 0.4)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {chapterNum}
                    </button>
                )
            })}
        </div>
      </div>
    );
  }

  // 📚 BOOKSHELF VIEW
  const renderSection = (sectionCode, title) => {
    // 🔍 FILTER LOGIC: If sectionFilter is set, only show that section!
    if (sectionFilter && sectionCode !== sectionFilter) return null;

    const books = bibleData.filter(b => b.section === sectionCode);

    return (
      <div style={{ marginBottom: '20px' }}>
        {/* Only show title if we aren't filtering (or if you want it always) */}
        {!sectionFilter && (
            <h4 style={{ color: theme === 'dark' ? '#ccc' : '#555', borderBottom: theme === 'dark' ? '2px solid #444' : '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            {title}
            </h4>
        )}
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {books.map(book => {
            const readCount = readChapters.filter(entry => entry.startsWith(`${book.name} `)).length;
            const percent = Math.round((readCount / book.chapters) * 100);
            const isComplete = percent === 100;
            
            const backgroundStyle = isComplete 
                ? '#ffd700' 
                : `linear-gradient(to right, #b3e5fc ${percent}%, #f5f5f5 ${percent}%)`;

            return (
              <div 
                key={book.name}
                onClick={() => handleBookClick(book)}
                style={{
                  background: backgroundStyle,
                  border: isComplete ? '1px solid #e6c200' : '1px solid #ddd',
                  borderRadius: '12px', padding: '6px 12px', fontSize: '0.8rem',
                  fontWeight: isComplete ? 'bold' : 'normal', color: isComplete ? '#555' : '#333',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: '60px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {isComplete ? `🏆 ${book.name}` : percent > 0 ? `${book.name} ${percent}%` : book.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '10px', 
      backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white', 
      borderRadius: '15px', 
      border: sectionFilter ? 'none' : (theme === 'dark' ? '1px solid #444' : '1px solid #eee') 
    }}>
      
      {/* Show Global Stats ONLY if we are in the bottom "full" mode (no filter) */}
      {!sectionFilter && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>Your Living Bookshelf</h3>
            <p style={{ color: theme === 'dark' ? '#999' : '#777', fontSize: '0.9rem', marginTop: '5px' }}>
            Total Progress: <strong>{totalPercentage}%</strong>
            </p>
            <div style={{ width: '100%', height: '10px', background: theme === 'dark' ? '#333' : '#f0f0f0', borderRadius: '5px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${totalPercentage}%`, height: '100%', background: '#4caf50', transition: 'width 0.5s ease' }}></div>
            </div>
        </div>
      )}

      {renderSection("OT", "Old Testament")}
      {renderSection("NT", "New Testament")}

    </div>
  );
}

export default BibleTracker;