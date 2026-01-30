import { db } from "../config/firebase";
import { 
  doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc, 
  collection, query, where, onSnapshot, 
  serverTimestamp, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { CITY_NAME, DEFAULT_NOTE_COLOR } from "../config/constants";

export const subscribeToReflections = (keyField, keyValue, callback) => {
  const q = query(
    collection(db, "reflections"), 
    where(keyField, "==", keyValue)
  );
  return onSnapshot(
    q, 
    (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      callback(data);
    },
    (error) => {
      console.warn('Reflections subscription error:', error.code, error.message);
      callback([]); // Return empty array on permission error
    }
  );
};

export const saveReflection = async (user, text, keyField, keyValue, editingId = null) => {
  if (!text.trim() || !user) return;
  const postData = { text, timestamp: serverTimestamp(), isEdited: !!editingId };
  if (editingId) {
    await updateDoc(doc(db, "reflections", editingId), postData);
  } else {
    const newId = `${user.uid}_${keyValue}`;
    await setDoc(doc(db, "reflections", newId), {
      ...postData, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
      location: CITY_NAME, reactions: {}, [keyField]: keyValue 
    });
  }
};

export const deleteReflection = async (id) => { await deleteDoc(doc(db, "reflections", id)); };

export const toggleFruitReaction = async (postId, fruitId, userId, currentReactions) => {
  if (!userId) return;
  const postRef = doc(db, "reflections", postId);
  const hasReacted = currentReactions?.[fruitId]?.includes(userId);
  if (hasReacted) await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayRemove(userId) });
  else await updateDoc(postRef, { [`reactions.${fruitId}`]: arrayUnion(userId) });
};

export const saveNote = async (user, book, chapter, verses, text, editingId = null) => {
  if (!text.trim()) return;
  try {
    const noteData = { userId: user.uid, book, chapter: parseInt(chapter), verses: verses.sort((a,b) => a-b), text, timestamp: serverTimestamp(), color: DEFAULT_NOTE_COLOR };
    if (editingId) {
      await updateDoc(doc(db, "notes", editingId), { text, timestamp: serverTimestamp() });
    } else {
      await addDoc(collection(db, "notes"), noteData);
    }
  } catch (error) {
    console.error('Error in saveNote:', error);
    throw error;
  }
};

export const deleteNote = async (noteId) => { await deleteDoc(doc(db, "notes", noteId)); };

export const updateUserHighlight = async (userId, book, chapter, verseNum, highlightObj) => {
  const userRef = doc(db, "users", userId);
  
  // Initialize if needed
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    await setDoc(userRef, { highlights: {} });
  }
  
  try {
    const currentData = (await getDoc(userRef)).data() || {};
    const highlights = currentData.highlights || {};
    
    // Ensure nested structure exists
    if (!highlights[book]) highlights[book] = {};
    if (!highlights[book][chapter]) highlights[book][chapter] = {};
    
    if (highlightObj) {
      // Add or update highlight
      highlights[book][chapter][verseNum] = highlightObj;
    } else {
      // Remove highlight
      delete highlights[book][chapter][verseNum];
    }
    
    await updateDoc(userRef, { highlights });
  } catch (err) {
    console.error("Error updating highlight:", err);
  }
};

export const subscribeToUserProfile = (userId, callback) => {
    return onSnapshot(
        doc(db, "users", userId), 
        (docSnap) => {
            if (docSnap.exists()) callback(docSnap.data());
            else callback(null);
        },
        (error) => {
            console.warn('Profile subscription error:', error.code, error.message);
            callback(null); // Return empty data on permission error
        }
    );
};

export const updateUserHighlightsBulk = async (userId, verseKeys, colorCode) => {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    const currentHighlights = docSnap.data().highlights || [];
    // Remove all highlights for these specific verses first
    const keysToRemove = verseKeys.map(k => k.split('|')[0]);
    const toRemove = currentHighlights.filter(h => keysToRemove.includes(h.split('|')[0]));
    
    if (toRemove.length > 0) await updateDoc(userRef, { highlights: arrayRemove(...toRemove) });
  }
  
  if (colorCode) {
    const toAdd = verseKeys.map(k => `${k}|${colorCode}`);
    await updateDoc(userRef, { highlights: arrayUnion(...toAdd) });
  }
};

export const subscribeToNotes = (userId, book, chapter, callback) => {
    const q = query(collection(db, "notes"), where("userId", "==", userId), where("book", "==", book), where("chapter", "==", parseInt(chapter)));
    return onSnapshot(
        q, 
        (snapshot) => {
            const notes = [];
            snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
            callback(notes);
        },
        (error) => {
            console.warn('Notes subscription error:', error.code, error.message);
            callback([]); // Return empty array on permission error
        }
    );
};

export const toggleChapterReadStatus = async (userId, chapterKey, isRead) => {
  const userRef = doc(db, "users", userId);
  if (isRead) await setDoc(userRef, { readChapters: arrayUnion(chapterKey) }, { merge: true });
  else await updateDoc(userRef, { readChapters: arrayRemove(chapterKey) });
};

export const updateNoteColor = async (noteId, color) => {
  await updateDoc(doc(db, "notes", noteId), { color });
};