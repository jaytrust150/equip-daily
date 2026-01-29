import React, { useRef, useEffect } from 'react';

function VerseList({ 
  verses, theme, fontSize, 
  highlights, notes, 
  selectedVerses, onToggleSelection, 
  showNotes, 
  isNoteMode, editingNoteId, noteText, setNoteText, 
  onSaveNote, onDeleteNote, onCancelEdit, onEditNote 
}) {
  
  const isDark = theme === 'dark';
  const editorRef = useRef(null);

  useEffect(() => {
    if ((isNoteMode || editingNoteId) && editorRef.current) {
        editorRef.current.focus();
        editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isNoteMode, editingNoteId]);

  const getHighlightStyle = (verseNum) => {
    const highlight = highlights.find(h => h.verse === verseNum);
    if (!highlight) return {};
    return {
      backgroundColor: highlight.color,
      color: '#333',
      borderLeft: `4px solid ${highlight.borderColor || highlight.color}`
    };
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', fontSize: `${fontSize}rem`, lineHeight: '1.6', color: isDark ? '#ccc' : '#333' }}>
      {verses.map((v) => {
        const isSelected = selectedVerses.includes(v.verse);
        const verseNotes = notes.filter(n => n.verses.includes(v.verse));
        
        const showEditorHere = (isNoteMode && !editingNoteId && selectedVerses.length > 0 && selectedVerses[0] === v.verse) || 
                               (editingNoteId && verseNotes.some(n => n.id === editingNoteId) && v.verse === verseNotes[0]?.verses?.[0]);

        return (
          <div key={v.verse} style={{ marginBottom: '10px' }}>
            <div 
              onClick={() => onToggleSelection(v.verse)}
              style={{
                padding: '10px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: isSelected ? '#e3f2fd' : (isDark ? '#222' : '#fff'),
                border: isSelected ? '1px solid #2196F3' : '1px solid transparent',
                transition: 'background-color 0.2s',
                ...getHighlightStyle(v.verse)
              }}
            >
              <sup style={{ marginRight: '5px', fontWeight: 'bold', color: '#888' }}>{v.verse}</sup>
              {v.text}
            </div>

            {showEditorHere && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: isDark ? '#333' : '#f0f4f8', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
                  <div style={{ marginBottom: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: '#888' }}>
                      {editingNoteId ? "Editing Note" : "New Note"}
                  </div>
                  <textarea 
                      ref={editorRef}
                      value={noteText} 
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type your note here..."
                      style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={onSaveNote} style={{ padding: '5px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save</button>
                      {editingNoteId && <button onClick={onDeleteNote} style={{ padding: '5px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>}
                      <button onClick={onCancelEdit} style={{ padding: '5px 12px', background: 'none', border: '1px solid #999', borderRadius: '5px', cursor: 'pointer', color: '#999' }}>Cancel</button>
                  </div>
              </div>
            )}

            {showNotes && verseNotes.length > 0 && verseNotes.map(note => (
              (note.id !== editingNoteId) && note.verses[note.verses.length - 1] === v.verse && (
                <div key={note.id} style={{ marginLeft: '20px', marginTop: '5px', padding: '10px', backgroundColor: isDark ? '#1e3a5f' : '#f9f9f9', borderLeft: `3px solid ${note.color || '#2196F3'}`, borderRadius: '4px', color: isDark ? '#fff' : '#333' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                  <button onClick={() => onEditNote(note)} style={{ fontSize: '0.7rem', color: '#2196F3', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px', fontWeight:'bold' }}>Edit</button>
                </div>
              )
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default VerseList;