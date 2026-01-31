/**
 * Reading Plans Service
 * 
 * Handles all Firestore operations for Bible reading plans.
 * Manages:
 * - Creating/updating reading plans
 * - Tracking daily progress
 * - Streak calculations
 * - Plan statistics
 */
import { db } from "../config/firebase";
import { 
  doc, setDoc, updateDoc, deleteDoc, getDoc, 
  collection, query, where, onSnapshot, 
  serverTimestamp, arrayUnion, increment 
} from "firebase/firestore";

// Reading plan templates
export const READING_PLAN_TEMPLATES = {
  plan5Day: {
    id: '5-day',
    name: '5-Day Quick Start',
    description: 'Complete the New Testament in 5 days',
    duration: 5,
    booksPerDay: 5,
    totalDays: 5,
    difficulty: 'easy',
    emoji: '⚡'
  },
  plan30Day: {
    id: '30-day',
    name: 'One Month Journey',
    description: 'Read through key books of the Bible in 30 days',
    duration: 30,
    booksPerDay: 1,
    totalDays: 30,
    difficulty: 'medium',
    emoji: '📅'
  },
  plan365Day: {
    id: '365-day',
    name: 'Bible in a Year',
    description: 'Complete the entire Bible in 365 days',
    duration: 365,
    booksPerDay: 1,
    totalDays: 365,
    difficulty: 'hard',
    emoji: '📖'
  },
  planCustom: {
    id: 'custom',
    name: 'Custom Plan',
    description: 'Create your own reading schedule',
    duration: 'flexible',
    difficulty: 'custom',
    emoji: '🎯'
  }
};

/**
 * Create a new reading plan for a user
 * 
 * @param {string} userId - User ID
 * @param {string} planType - Type of plan (5-day, 30-day, 365-day, custom)
 * @param {Object} planData - Additional plan data (chapters to read, etc.)
 * @returns {Promise<Object>} Created plan with ID
 */
export const createReadingPlan = async (userId, planType, planData = {}) => {
  const template = READING_PLAN_TEMPLATES[`plan${planType.charAt(0).toUpperCase()}${planType.slice(1)}`];
  
  if (!template && planType !== 'custom') {
    throw new Error(`Unknown plan type: ${planType}`);
  }

  const planId = `${userId}_${planType}_${Date.now()}`;
  const plan = {
    id: planId,
    userId,
    planType,
    name: template?.name || planData.name || 'My Reading Plan',
    description: template?.description || planData.description || '',
    emoji: template?.emoji || '📖',
    createdAt: serverTimestamp(),
    startDate: serverTimestamp(),
    endDate: null,
    status: 'active', // active, completed, archived, paused
    
    // Progress tracking
    currentDay: 1,
    daysCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
    
    // Chapters to read
    chapters: planData.chapters || [],
    completedChapters: [],
    
    // Statistics
    stats: {
      totalChapters: planData.chapters?.length || 0,
      totalPages: planData.pages || 0,
      estimatedHours: planData.hours || 0,
    },
    
    // Settings
    settings: {
      dailyReminder: true,
      reminderTime: '09:00',
      notifications: true,
      shareProgress: false,
    },
    
    // Metadata
    ...planData
  };

  try {
    await setDoc(doc(db, "readingPlans", planId), plan);
    return plan;
  } catch (error) {
    console.error('Error creating reading plan:', error);
    throw error;
  }
};

/**
 * Get all reading plans for a user
 * 
 * @param {string} userId - User ID
 * @param {Function} callback - Called with array of plans
 * @returns {Function} Unsubscribe function
 */
export const subscribeToReadingPlans = (userId, callback) => {
  const q = query(
    collection(db, "readingPlans"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const plans = [];
      snapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() });
      });
      callback(plans);
    },
    (error) => {
      console.warn('Reading plans subscription error:', error);
      callback([]);
    }
  );
};

/**
 * Mark a chapter as completed in a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @param {Object} chapter - Chapter object {book, chapter}
 * @returns {Promise}
 */
export const completeChapter = async (planId, chapter) => {
  const planRef = doc(db, "readingPlans", planId);
  
  const chapterKey = `${chapter.book}:${chapter.chapter}`;
  
  await updateDoc(planRef, {
    completedChapters: arrayUnion(chapterKey),
    lastReadDate: serverTimestamp(),
    daysCompleted: increment(1),
  });
};

/**
 * Update reading plan progress
 * 
 * @param {string} planId - Reading plan ID
 * @param {Object} progressData - Progress updates
 * @returns {Promise}
 */
export const updatePlanProgress = async (planId, progressData) => {
  const planRef = doc(db, "readingPlans", planId);

  try {
    await updateDoc(planRef, {
      ...progressData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating plan progress:', error);
    throw error;
  }
};

/**
 * Update streak for a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @param {number} currentStreak - Current streak count
 * @param {number} longestStreak - Longest streak achieved
 * @returns {Promise}
 */
export const updateStreak = async (planId, currentStreak, longestStreak) => {
  const planRef = doc(db, "readingPlans", planId);

  await updateDoc(planRef, {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastReadDate: serverTimestamp(),
  });
};

/**
 * Complete a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @returns {Promise}
 */
export const completePlan = async (planId) => {
  const planRef = doc(db, "readingPlans", planId);

  await updateDoc(planRef, {
    status: 'completed',
    endDate: serverTimestamp(),
  });
};

/**
 * Pause a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @returns {Promise}
 */
export const pausePlan = async (planId) => {
  const planRef = doc(db, "readingPlans", planId);

  await updateDoc(planRef, {
    status: 'paused',
  });
};

/**
 * Resume a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @returns {Promise}
 */
export const resumePlan = async (planId) => {
  const planRef = doc(db, "readingPlans", planId);

  await updateDoc(planRef, {
    status: 'active',
  });
};

/**
 * Delete a reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @returns {Promise}
 */
export const deletePlan = async (planId) => {
  await deleteDoc(doc(db, "readingPlans", planId));
};

/**
 * Get a single reading plan
 * 
 * @param {string} planId - Reading plan ID
 * @returns {Promise<Object>} Plan data
 */
export const getPlan = async (planId) => {
  const docSnap = await getDoc(doc(db, "readingPlans", planId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

/**
 * Calculate reading plan statistics
 * 
 * @param {Object} plan - Reading plan object
 * @returns {Object} Statistics
 */
export const calculatePlanStats = (plan) => {
  if (!plan) return {};

  const completedCount = plan.completedChapters?.length || 0;
  const totalCount = plan.chapters?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    progressPercent,
    chaptersCompleted: completedCount,
    chaptersRemaining: totalCount - completedCount,
    totalChapters: totalCount,
    currentStreak: plan.currentStreak || 0,
    longestStreak: plan.longestStreak || 0,
    estimatedDaysRemaining: plan.stats?.totalPages ? 
      Math.ceil(plan.stats.totalPages / (plan.stats.totalPages / plan.stats.estimatedHours)) : 0,
  };
};

/**
 * Calculate daily chapter recommendation
 * 
 * @param {Object} plan - Reading plan object
 * @param {number} daysRemaining - Days left in plan
 * @returns {Array<Object>} Recommended chapters for today
 */
export const getDailyRecommendation = (plan, daysRemaining) => {
  if (!plan || !plan.chapters) return [];

  const chaptersRemaining = plan.chapters.filter(
    ch => !plan.completedChapters?.includes(`${ch.book}:${ch.chapter}`)
  );

  if (chaptersRemaining.length === 0) return [];

  // Calculate how many to read per day
  const chapsPerDay = Math.ceil(chaptersRemaining.length / Math.max(daysRemaining, 1));

  return chaptersRemaining.slice(0, chapsPerDay);
};
