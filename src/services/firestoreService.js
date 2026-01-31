/**
 * Firestore Service
 * 
 * Centralized service for all Firebase Firestore operations.
 * Handles:
 * - Community reflections (create, read, update, delete, subscribe)
 * - Fruit of the Spirit reactions
 * - Bible study notes (create, read, update, delete, subscribe)
 * - Verse highlights (add, remove, bulk operations)
 * - Chapter read tracking
 * - User profile subscriptions
 */
import { db } from "../config/firebase";
import { 
  doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc, 
  collection, query, where, onSnapshot, limit,
  serverTimestamp, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { CITY_NAME, DEFAULT_NOTE_COLOR } from "../config/constants";

// Query limits to prevent excessive data fetching
const QUERY_LIMITS = {
  reflections: 50,        // Max 50 reflections per query
  notes: 100,            // Max 100 notes per chapter
  userHighlights: 1000,  // Max 1000 highlights per user
  favorites: 500,        // Max 500 favorites per user
};

/**
 * Validate and limit array size for bulk operations
 * @param {Array} array - Array to validate
 * @param {number} maxSize - Maximum size allowed
 * @returns {Array} Limited array
 */
const limitArraySize = (array, maxSize = 100) => {
  if (!Array.isArray(array)) return [];
  return array.slice(0, Math.min(array.length, maxSize));
};

/**
 * Subscribe to reflections in real-time
 * 
 * Sets up a Firestore listener for reflections matching a specific field/value.
 * Commonly used for date-based or chapter-based reflection feeds.
 * 
 * @param {string} keyField - Firestore field name to filter by (e.g., 'date', 'chapter')
 * @param {string} keyValue - Value to match (e.g., '1.15', 'Genesis 1')
 * @param {Function} callback - Called with array of reflection objects whenever data changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeToReflections = (keyField, keyValue, callback) => {
  // Create Firestore query to filter reflections by the specified field
  // Query limit: 50 reflections per topic to prevent excessive data fetching
  const q = query(
    collection(db, "reflections"), 
    where(keyField, "==", keyValue),
    limit(QUERY_LIMITS.reflections)
  );
  // Set up real-time listener
  return onSnapshot(
    q, 
    (snapshot) => {
      // Transform Firestore docs into plain objects
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      callback(data);
    },
    (error) => {
      // Handle permission errors gracefully (return empty array)
      console.warn('Reflections subscription error:', error.code, error.message);
      callback([]); // Return empty array on permission error
    }
  );
};

/**
 * Save or update a reflection
 * 
 * Creates a new reflection or updates an existing one.
 * Each user can have only one reflection per keyValue (enforced by document ID).
 * 
 * @param {Object} user - Firebase user object with uid, displayName, photoURL
 * @param {string} text - Reflection text content
 * @param {string} keyField - Field name to associate reflection with (e.g., 'date')
 * @param {string} keyValue - Value for the field (e.g., '1.15')
 * @param {string|null} editingId - Document ID if editing, null if creating new
 */
export const saveReflection = async (user, text, keyField, keyValue, editingId = null) => {
  if (!text.trim() || !user) return;
  // Base data for both create and update
  const postData = { text, timestamp: serverTimestamp(), isEdited: !!editingId };
  if (editingId) {
    // Update existing reflection
    await updateDoc(doc(db, "reflections", editingId), postData);
  } else {
    // Create new reflection with composite ID (userId_keyValue)
    const newId = `${user.uid}_${keyValue}`;
    await setDoc(doc(db, "reflections", newId), {
      ...postData, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
      location: CITY_NAME, reactions: {}, [keyField]: keyValue 
    });
  }
};

/**
 * Delete a reflection
 * @param {string} id - Document ID of the reflection to delete
 */
export const deleteReflection = async (id) => { await deleteDoc(doc(db, "reflections", id)); };

/**
 * Toggle a Fruit of the Spirit reaction on a post
 * 
 * Adds or removes the user ID from the specific fruit reaction array.
 * 
 * @param {string} postId - Reflection document ID
 * @param {string} fruitId - Fruit type (e.g., 'love', 'joy', 'peace')
 * @param {string} userId - User ID toggling the reaction
 * @param {Object} currentReactions - Current reactions object from the post
 */
export const toggleFruitReaction = async (postId, fruitId, userId, currentReactions) => {
  if (!userId) return;
  const postRef = doc(db, "reflections", postId);
  // Check if user has already reacted with this fruit
  const hasReacted = currentReactions?.[fruitId]?.includes(userId);
  // Toggle: remove if exists, add if doesn't
  if (hasReacted) await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayRemove(userId) });
  else await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayUnion(userId) });
};

/**
 * Save or update a Bible study note
 * 
 * Creates a new note or updates an existing one for a specific verse range.
 * 
 * @param {Object} user - Firebase user object with uid
 * @param {string} book - Bible book name (e.g., 'Genesis', 'John')
 * @param {string|number} chapter - Chapter number
 * @param {Array<number>} verses - Array of verse numbers this note covers
 * @param {string} text - Note text content
 * @param {string|null} editingId - Document ID if editing, null if creating new
 */
export const saveNote = async (user, book, chapter, verses, text, editingId = null) => {
  if (!text.trim()) return;
  try {
    // Prepare note data with sorted verse array and default color
    const noteData = { userId: user.uid, book, chapter: parseInt(chapter), verses: verses.sort((a,b) => a-b), text, timestamp: serverTimestamp(), color: DEFAULT_NOTE_COLOR };
    if (editingId) {
      // Update existing note (only text and timestamp)
      await updateDoc(doc(db, "notes", editingId), { text, timestamp: serverTimestamp() });
    } else {
      // Create new note with auto-generated ID
      await addDoc(collection(db, "notes"), noteData);
    }
  } catch (error) {
    console.error('Error in saveNote:', error);
    throw error;
  }
};

/**
 * Delete a Bible study note
 * @param {string} noteId - Document ID of the note to delete
 */
export const deleteNote = async (noteId) => { await deleteDoc(doc(db, "notes", noteId)); };

/**
 * Update or remove a highlight for a single verse
 * 
 * Stores highlights in nested structure: highlights[book][chapter][verse] = {color, borderColor}
 * 
 * @param {string} userId - User ID
 * @param {string} book - Bible book name
 * @param {string|number} chapter - Chapter number
 * @param {number} verseNum - Verse number
 * @param {Object|null} highlightObj - Highlight data {color, borderColor} or null to remove
 */
export const updateUserHighlight = async (userId, book, chapter, verseNum, highlightObj) => {
  const userRef = doc(db, "users", userId);
  
  // Initialize user document if it doesn't exist yet
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    await setDoc(userRef, { highlights: {} });
  }
  
  try {
    // Get current highlights data
    const currentData = (await getDoc(userRef)).data() || {};
    const highlights = currentData.highlights || {};
    
    // Ensure nested structure exists (book -> chapter -> verse)
    if (!highlights[book]) highlights[book] = {};
    if (!highlights[book][chapter]) highlights[book][chapter] = {};
    
    if (highlightObj) {
      // Add or update highlight with color data
      highlights[book][chapter][verseNum] = highlightObj;
    } else {
      // Remove highlight (user clicked same color to toggle off)
      delete highlights[book][chapter][verseNum];
    }
    
    // Save updated highlights structure
    await updateDoc(userRef, { highlights });
  } catch (err) {
    console.error("Error updating highlight:", err);
  }
};

/**
 * Subscribe to user profile data in real-time
 * 
 * Sets up a Firestore listener for the user's profile document.
 * Used to sync highlights, read chapters, settings, etc.
 * 
 * @param {string} userId - User ID
 * @param {Function} callback - Called with user data object whenever it changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeToUserProfile = (userId, callback) => {
    // Set up real-time listener on user document
    return onSnapshot(
        doc(db, "users", userId), 
        (docSnap) => {
            // Return user data if document exists, null otherwise
            if (docSnap.exists()) callback(docSnap.data());
            else callback(null);
        },
        (error) => {
            // Handle permission errors gracefully
            console.warn('Profile subscription error:', error.code, error.message);
            callback(null); // Return empty data on permission error
        }
    );
};

/**
 * Update highlights for multiple verses at once (bulk operation)
 * 
 * Used for highlighting multiple selected verses with one color.
 * Uses array-based storage format: ["Genesis|1|1|yellow", "Genesis|1|2|yellow"]
 * 
 * @param {string} userId - User ID
 * @param {Array<string>} verseKeys - Array of verse keys (format: "book|chapter|verse")
 * @param {string} colorCode - Color code to apply, or null to remove highlights
 */
export const updateUserHighlightsBulk = async (userId, verseKeys, colorCode) => {
  // Limit bulk operations to prevent excessive writes
  const limitedVerseKeys = limitArraySize(verseKeys, 100);
  
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const currentHighlights = docSnap.data().highlights || [];
    // Remove all existing highlights for these specific verses first
    // Extract just the verse keys (without color) from existing highlights
    const keysToRemove = limitedVerseKeys.map(k => k.split('|')[0]);
    const toRemove = currentHighlights.filter(h => keysToRemove.includes(h.split('|')[0]));
    
    // Remove old highlights using Firestore arrayRemove
    if (toRemove.length > 0) await updateDoc(userRef, { highlights: arrayRemove(...toRemove) });
  }
  
  // Add new highlights with the selected color (if color provided)
  if (colorCode) {
    // Format: "book|chapter|verse|colorCode"
    const toAdd = limitedVerseKeys.map(k => `${k}|${colorCode}`);
    await updateDoc(userRef, { highlights: arrayUnion(...toAdd) });
  }
};

/**
 * Subscribe to Bible study notes in real-time
 * 
 * Sets up a Firestore listener for notes matching user, book, and chapter.
 * 
 * @param {string} userId - User ID
 * @param {string} book - Bible book name
 * @param {string|number} chapter - Chapter number
 * @param {Function} callback - Called with array of note objects whenever data changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeToNotes = (userId, book, chapter, callback) => {
    // Create Firestore query to filter notes by user, book, and chapter
    // Query limit: 100 notes per chapter to prevent excessive data fetching
    const q = query(
      collection(db, "notes"), 
      where("userId", "==", userId), 
      where("book", "==", book), 
      where("chapter", "==", parseInt(chapter)),
      limit(QUERY_LIMITS.notes)
    );
    // Set up real-time listener
    return onSnapshot(
        q, 
        (snapshot) => {
            // Transform Firestore docs into plain objects
            const notes = [];
            snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
            callback(notes);
        },
        (error) => {
            // Handle permission errors gracefully
            console.warn('Notes subscription error:', error.code, error.message);
            callback([]); // Return empty array on permission error
        }
    );
};

/**
 * Toggle chapter read status for tracking Bible reading progress
 * 
 * Adds or removes chapter from user's readChapters array.
 * 
 * @param {string} userId - User ID
 * @param {string} chapterKey - Chapter identifier (format: "BookName Chapter", e.g., "Genesis 1")
 * @param {boolean} isRead - True to mark as read, false to mark as unread
 */
export const toggleChapterReadStatus = async (userId, chapterKey, isRead) => {
  const userRef = doc(db, "users", userId);
  // Add to array if marking as read, remove if marking as unread
  if (isRead) await setDoc(userRef, { readChapters: arrayUnion(chapterKey) }, { merge: true });
  else await updateDoc(userRef, { readChapters: arrayRemove(chapterKey) });
};

/**
 * Update the color of a Bible study note
 * 
 * @param {string} noteId - Document ID of the note
 * @param {string} color - New color code (hex color)
 */
export const updateNoteColor = async (noteId, color) => {
  await updateDoc(doc(db, "notes", noteId), { color });
};