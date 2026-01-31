/**
 * useReadingPlans Hook
 * 
 * Custom hook to manage reading plan state and operations.
 * Handles subscriptions, calculations, and user interactions.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToReadingPlans,
  completeChapter,
  updateStreak,
  completePlan,
  pausePlan,
  resumePlan,
  deletePlan,
  calculatePlanStats,
  getDailyRecommendation,
} from '../services/readingPlansService';

export const useReadingPlans = (userId) => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState(null);

  // Subscribe to reading plans on mount
  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeToReadingPlans(userId, (data) => {
      setPlans(data);
      // Set first active plan as current
      const activePlan = data.find(p => p.status === 'active');
      if (activePlan) {
        setCurrentPlan(activePlan);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Mark chapter complete
  const markChapterComplete = useCallback(async (planId, chapter) => {
    try {
      await completeChapter(planId, chapter);
      // Update current streak
      updateStreak(planId, (currentPlan?.currentStreak || 0) + 1, currentPlan?.longestStreak || 0);
    } catch (err) {
      setError(err.message);
    }
  }, [currentPlan]);

  // Get statistics for a plan
  const getStats = useCallback((plan) => {
    return calculatePlanStats(plan);
  }, []);

  // Get today's reading
  const getTodayReading = useCallback((plan) => {
    if (!plan) return [];
    const daysRemaining = Math.ceil(plan.stats?.estimatedHours || 30);
    return getDailyRecommendation(plan, daysRemaining);
  }, []);

  // Switch current plan
  const switchPlan = useCallback((planId) => {
    const plan = plans.find(p => p.id === planId);
    setCurrentPlan(plan);
  }, [plans]);

  // Complete plan
  const handleCompletePlan = useCallback(async (planId) => {
    try {
      await completePlan(planId);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Pause plan
  const handlePausePlan = useCallback(async (planId) => {
    try {
      await pausePlan(planId);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Resume plan
  const handleResumePlan = useCallback(async (planId) => {
    try {
      await resumePlan(planId);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Delete plan
  const handleDeletePlan = useCallback(async (planId) => {
    try {
      await deletePlan(planId);
      if (currentPlan?.id === planId) {
        setCurrentPlan(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [currentPlan]);

  return {
    plans,
    currentPlan,
    loading,
    error,
    markChapterComplete,
    getStats,
    getTodayReading,
    switchPlan,
    handleCompletePlan,
    handlePausePlan,
    handleResumePlan,
    handleDeletePlan,
  };
};
