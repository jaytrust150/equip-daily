import React from 'react';

/**
 * MemberCard Component
 * 
 * Renders an individual community member's reflection as an interactive card.
 * Implements Galatians 5:22-23's "Fruit of the Spirit" as a reaction system,
 * allowing users to affirm specific spiritual attributes in others' reflections.
 * 
 * Features:
 * - User identity display with profile photo and location badge
 * - Intelligent verse reference detection and linking (regex-based)
 * - Nine Fruit of the Spirit reactions with real-time counter updates
 * - Conditional owner controls (edit/delete) with access control
 * - Theme-aware styling via CSS custom properties
 * 
 * @param {Object} user - Reflection author's Firebase user data
 * @param {string} user.displayName - Author's display name
 * @param {string} user.photoURL - Author's profile photo URL
 * @param {string} thought - Reflection text content (may contain Bible verse references like "John 3:16")
 * @param {Object} reactions - Map of Fruit IDs to arrays of reactor user IDs: {love: [uid1, uid2], joy: [uid3]}
 * @param {string} location - Author's geographic location/city name
 * @param {Function} onSearch - Callback invoked with verse reference string when clicked
 * @param {Function} onReact - Callback invoked with fruit ID when reaction button clicked
 * @param {Function} onProfileClick - Callback invoked when author's name/photo clicked
 * @param {string} currentUserId - Current authenticated user's ID for reaction state determination
 * @param {boolean} isOwner - Access control flag indicating if currentUser authored this post
 * @param {Function} onEdit - Callback to initiate edit mode for this reflection
 * @param {Function} onDelete - Callback to permanently delete this reflection
 */
function MemberCard({ user, thought, reactions, location, onSearch, onReact, onProfileClick, currentUserId, isOwner, onEdit, onDelete }) {
  // Galatians 5:22-23 - The nine Fruit of the Spirit as reaction options
  // Provides affirming feedback mechanism aligned with Biblical principles
  const fruits = [{ id: 'love', label: 'Love', icon: '❤️' }, { id: 'joy', label: 'Joy', icon: '😊' }, { id: 'peace', label: 'Peace', icon: '🕊️' }, { id: 'patience', label: 'Patience', icon: '⏳' }, { id: 'kindness', label: 'Kindness', icon: '🤲' }, { id: 'goodness', label: 'Goodness', icon: '🌟' }, { id: 'faithfulness', label: 'Faithfulness', icon: '🤝' }, { id: 'gentleness', label: 'Gentleness', icon: '🧸' }, { id: 'selfControl', label: 'Self-Control', icon: '🛑' }];
  
  /**
   * Parses and renders reflection text with interactive Bible verse references
   * 
   * Uses regex pattern matching to detect verse citations in natural language,
   * then transforms them into clickable elements that trigger SearchWell navigation.
   * Preserves original text structure while injecting interactivity.
   * 
   * Supported patterns:
   * - Simple references: "John 3:16", "Genesis 1:1"
   * - Numbered books: "1 Corinthians 13:4", "2 Peter 3:9"
   * - Verse ranges: "Matthew 5:3-12", "Psalm 23:1-6"
   * 
   * @param {string} text - Raw reflection text potentially containing verse references
   * @returns {Array|null} React element array of text nodes and clickable spans, or null for empty input
   */
  const renderThought = (text) => {
    if (!text) return null;
    // Regex pattern for Bible verse references with flexible formatting
    // Captures: optional book number [1-3], capitalized book name, chapter:verse(s)
    // Examples: "John 3:16", "1 Corinthians 13:4-7", "2 Peter 3:9"
    const verseRegex = /([1-3]?\s?[A-Z][a-z]+\s\d+:\d+(?:-\d+)?)/g;
    // Transform text: split by regex matches, then conditionally render as interactive or static
    // Verse matches become clickable <span> elements; non-matches remain plain text
    return text.split(verseRegex).map((part, index) => part.match(verseRegex) ? <span key={index} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onSearch) onSearch(part); }} style={{ color: '#2196F3', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>{part}</span> : part);
  };

  return (
    // Card container uses CSS custom properties for dynamic theming without prop drilling
    // Variables defined in :root and [data-theme="dark"] selectors in global CSS
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', border: '1px solid var(--card-border)', borderRadius: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--card-text)', maxWidth: '450px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
      {/* Owner controls: conditionally rendered based on isOwner prop for access control */}
      {isOwner && <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', fontSize: '0.75rem' }}><button onClick={onEdit}>Edit</button>|<button onClick={onDelete} style={{color:'red'}}>Delete</button></div>}
      {/* User info section: profile photo, name, location badge, and thought */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Clickable profile photo */}
        {/* Clickable profile photo */}
        <img src={user.photoURL} alt={user.displayName} onClick={onProfileClick} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
        <div style={{ textAlign: 'left' }}>
          {/* Clickable user name */}
          <h3 onClick={onProfileClick} style={{ margin: '0', fontSize: '0.95rem', cursor: 'pointer' }}>{user.displayName}</h3>
          {/* Location badge if available */}
          {location && <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--chip-bg)', color: 'var(--chip-text)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--chip-border)' }}>{location} Body</span>}
          {/* User's thought/reflection with clickable verse references */}
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--card-text-muted)', fontStyle: 'italic' }}>"{renderThought(thought)}"</p>
        </div>
      </div>
      {/* Fruit of the Spirit reaction buttons */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>{fruits.map(fruit => { 
        // Calculate reaction count and whether current user has reacted
        const count = reactions?.[fruit.id]?.length || 0; 
        const hasReacted = reactions?.[fruit.id]?.includes(currentUserId); 
        return <button key={fruit.id} onClick={(e) => { e.preventDefault(); if (onReact) onReact(fruit.id); }} style={{ background: hasReacted ? 'var(--chip-bg)' : 'transparent', border: hasReacted ? '1px solid var(--chip-border)' : '1px solid var(--card-border)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', color: 'var(--card-text)' }}>{fruit.icon} {fruit.label} {count > 0 && <b>{count}</b>}</button>; })}</div>
    </div>
  );
}
export default MemberCard;