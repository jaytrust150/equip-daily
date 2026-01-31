import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import { subscribeToReflections, saveReflection, deleteReflection, toggleFruitReaction } from '../services/firestoreService';
import { CITY_NAME } from '../config/constants';
import { withErrorBoundary } from './withErrorBoundary';

/**
 * CommunityFeed Component
 * 
 * Real-time community reflection feed with Firestore integration and Fruit of the Spirit reactions.
 * Implements single-reflection-per-user-per-context pattern (enforced via composite document IDs).
 * 
 * Architecture:
 * - Firestore onSnapshot subscription for real-time updates
 * - Conditional form rendering (one reflection per user per queryValue)
 * - Bidirectional data flow: form submission → Firestore → realtime update
 * - Automatic cleanup via unsubscribe function on unmount
 * 
 * Features:
 * - Real-time reflection feed filtered by dynamic field/value pairs
 * - Single-reflection constraint with edit mode for existing posts
 * - Fruit of the Spirit reaction system (9 Biblical attributes)
 * - Verse reference detection and SearchWell integration
 * - Profile navigation and user interaction
 * 
 * @param {string} queryField - Firestore document field for filtering (e.g., 'chapter', 'devotional', 'date')
 * @param {string} queryValue - Filter value matching queryField (e.g., 'Genesis 1', '1.15')
 * @param {Object} user - Firebase authenticated user object (null if not logged in)
 * @param {Object} user.uid - User's unique Firebase ID
 * @param {Object} user.displayName - User's display name
 * @param {Object} user.photoURL - User's profile photo URL
 * @param {string} theme - Theme identifier ('light'|'dark') for consistent styling
 * @param {Function} onSearch - Callback with verse reference string when clicked in MemberCard
 * @param {Function} onProfileClick - Callback with userId when profile is clicked
 * @param {string} [title] - Optional custom feed title (defaults to "{CITY_NAME} Body Directory")
 * @param {string} [placeholder] - Optional custom textarea placeholder text
 */
function CommunityFeed({ queryField, queryValue, user, theme, onSearch, onProfileClick, title, placeholder }) {
  // Reflections array populated by Firestore subscription, filtered by queryField=queryValue
  const [reflections, setReflections] = useState([]);
  // Controlled textarea value for reflection form (bidirectional binding)
  const [inputText, setInputText] = useState("");
  // Document ID when editing existing reflection (null for new submission)
  const [editingId, setEditingId] = useState(null);
  // Flag indicating if current user has existing reflection for this context
  const [hasShared, setHasShared] = useState(false);

  /**
   * Effect: Establish Firestore real-time subscription
   * 
   * Sets up onSnapshot listener for reflections collection filtered by dynamic field.
   * Automatically updates UI when any reflection is added/modified/deleted.
   * Pre-fills form with user's existing reflection if present (single-post-per-user pattern).
   * 
   * Lifecycle:
   * 1. Mount: Subscribe to Firestore query
   * 2. Update: Callback fires on any matching document change
   * 3. Check: Determine if current user has existing post
   * 4. Unmount: Cleanup function calls unsubscribe to prevent memory leaks
   * 
   * Dependencies: queryField, queryValue, user (re-subscribe on context change)
   */
  useEffect(() => {
    // Create subscription with dynamic field filter (e.g., where('chapter', '==', 'Genesis 1'))
    const unsub = subscribeToReflections(queryField, queryValue, (data) => {
      setReflections(data);
      if (user) {
        // Single-reflection enforcement: check if user already has post in this context
        const myPost = data.find(r => r.userId === user.uid);
        if (myPost) { 
          setHasShared(true); 
          // Pre-fill form with existing content (preserves data during editing)
          if (!editingId) setInputText(myPost.text); 
        } else { 
          setHasShared(false); 
          if (!editingId) setInputText(""); 
        }
      }
    });
    // Cleanup: prevent memory leak by unsubscribing from Firestore listener
    return () => unsub();
  }, [queryField, queryValue, user, editingId]);

  /**
   * Handle reflection submission (create or update)
   * Saves to Firestore and resets form state
   */
  const handleSubmit = async () => { await saveReflection(user, inputText, queryField, queryValue, editingId); setEditingId(null); setInputText(""); };

  return (
    <div style={{ marginTop: '30px' }}>
      {/* Show input form if user is logged in AND (hasn't shared yet OR is editing) */}
      {user && (!hasShared || editingId) && (
        <div style={{ background: theme === 'dark' ? '#111' : '#f9f9f9', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #333' : '1px solid #eee' }}>
          {/* Reflection textarea input */}
          <textarea 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder={placeholder || "Share with the Body..."} 
            style={{ 
              width: '100%', 
              height: '100px', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #ddd', 
              marginBottom: '10px', 
              fontFamily: 'inherit', 
              background: theme === 'dark' ? '#333' : '#fff', 
              color: theme === 'dark' ? '#fff' : '#333' 
            }} 
          />
          {/* Form action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleSubmit} className="login-btn" style={{ margin: 0 }}>
              {editingId ? "Update Reflection" : "Share with the Body"}
            </button>
            {/* Cancel button (editing mode) or Clear button (new post) */}
            {editingId ? (
              <button onClick={() => { setEditingId(null); setInputText(""); }} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                Cancel
              </button>
            ) : (
              <button onClick={() => setInputText("")} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', background: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      {/* Feed title */}
      <h3 style={{ textAlign: 'center', marginTop: '40px' }}>{title || `${CITY_NAME} Body Directory`}</h3>
      {/* List of reflection cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{reflections.map(post => <MemberCard key={post.id} user={{ displayName: post.userName, photoURL: post.userPhoto }} thought={post.text} reactions={post.reactions} location={post.location} onReact={(fruitId) => toggleFruitReaction(post.id, fruitId, user?.uid, post.reactions)} currentUserId={user?.uid} isOwner={user?.uid === post.userId} onEdit={() => { setEditingId(post.id); setInputText(post.text); }} onDelete={() => deleteReflection(post.id)} onSearch={onSearch} onProfileClick={() => onProfileClick(post.userId)} />)}</div>
    </div>
  );
}
const CommunityFeedWithBoundary = withErrorBoundary(CommunityFeed, 'Unable to load community feed');
CommunityFeedWithBoundary.displayName = 'CommunityFeedWithBoundary';
export default CommunityFeedWithBoundary;