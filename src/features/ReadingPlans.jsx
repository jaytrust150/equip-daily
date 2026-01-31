/**
 * ReadingPlans Component
 * 
 * Main UI for Bible reading plans feature.
 * Displays plan selection, progress tracking, and daily recommendations.
 * 
 * Access: Click calendar icon on devotional sidebar
 */
import React, { useState } from 'react';
import { useReadingPlans } from '../hooks/useReadingPlans';
import { READING_PLAN_TEMPLATES, createReadingPlan } from '../services/readingPlansService';

function ReadingPlans({ user, theme, onClose }) {
  const { plans, currentPlan, loading, getStats, getTodayReading, switchPlan, handleCompletePlan, handlePausePlan, handleResumePlan, handleDeletePlan } = useReadingPlans(user?.uid);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Sign in to create reading plans</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading reading plans...</p>
      </div>
    );
  }

  const handleCreatePlan = async (template) => {
    try {
      await createReadingPlan(user.uid, template.id);
      setShowCreatePlan(false);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const stats = currentPlan ? getStats(currentPlan) : {};
  const todayReading = currentPlan ? getTodayReading(currentPlan) : [];

  const containerStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
    borderRadius: '12px',
    minHeight: '100vh',
  };

  const headerStyle = {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '10px',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
  };

  const subtitleStyle = {
    fontSize: '0.95rem',
    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
    marginBottom: '30px',
  };

  const cardStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: theme === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h1 style={headerStyle}>📖 Reading Plans</h1>
          <p style={subtitleStyle}>Create a plan and stay consistent with your Bible reading</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* No Plans State */}
      {plans.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '20px' }}>
            You haven't created a reading plan yet. Get started below!
          </p>
        </div>
      ) : (
        <>
          {/* Current Plan Display */}
          {currentPlan && (
            <div style={{ ...cardStyle, backgroundColor: theme === 'dark' ? '#1e3a8a' : '#eff6ff', borderColor: theme === 'dark' ? '#1e40af' : '#3b82f6' }}>
              <h2 style={{ color: theme === 'dark' ? '#93c5fd' : '#1e40af', marginBottom: '15px' }}>
                {currentPlan.emoji} {currentPlan.name}
              </h2>
              
              {/* Progress Bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}>Progress</span>
                  <span style={{ fontWeight: '600', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>{stats.progressPercent}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: theme === 'dark' ? '#374151' : '#dbeafe',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${stats.progressPercent}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: theme === 'dark' ? '#0f172a' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                    {stats.chaptersCompleted}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: theme === 'dark' ? '#0f172a' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                    {stats.chaptersRemaining}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Remaining</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: theme === 'dark' ? '#0f172a' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                    {stats.currentStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Streak 🔥</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: theme === 'dark' ? '#0f172a' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                    {stats.longestStreak}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Best</div>
                </div>
              </div>

              {/* Today's Reading */}
              {todayReading.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: theme === 'dark' ? '#111827' : '#f0fdf4', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontWeight: '600', color: theme === 'dark' ? '#86efac' : '#16a34a', marginBottom: '8px' }}>
                    ✓ Today's Reading
                  </div>
                  <div style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
                    {todayReading.map(ch => `${ch.book} ${ch.chapter}`).join(', ')}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {currentPlan.status === 'active' && (
                  <>
                    <button
                      onClick={() => handlePausePlan(currentPlan.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      ⏸ Pause
                    </button>
                    <button
                      onClick={() => handleCompletePlan(currentPlan.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      ✓ Mark Complete
                    </button>
                  </>
                )}
                {currentPlan.status === 'paused' && (
                  <button
                    onClick={() => handleResumePlan(currentPlan.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    ▶ Resume
                  </button>
                )}
                <button
                  onClick={() => handleDeletePlan(currentPlan.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fecaca',
                    color: theme === 'dark' ? '#fca5a5' : '#991b1b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Plan Section */}
      <div style={{ ...cardStyle, marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: theme === 'dark' ? '#f3f4f6' : '#1f2937', fontSize: '1.2rem' }}>
          {showCreatePlan ? '✓ Choose a Plan' : '+ Create New Plan'}
        </h3>

        {!showCreatePlan ? (
          <button
            onClick={() => setShowCreatePlan(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Get Started
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {Object.values(READING_PLAN_TEMPLATES).map(template => (
              <div
                key={template.id}
                onClick={() => handleCreatePlan(template)}
                style={{
                  padding: '16px',
                  backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : 'white';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#111827' : '#f3f4f6';
                  e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{template.emoji}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {template.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {template.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Plans List */}
      {plans.length > 1 && (
        <div style={{ ...cardStyle, marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: theme === 'dark' ? '#f3f4f6' : '#1f2937', fontSize: '1.2rem' }}>
            All Plans
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => switchPlan(plan.id)}
                style={{
                  padding: '12px',
                  backgroundColor: currentPlan?.id === plan.id ? (theme === 'dark' ? '#1e40af' : '#dbeafe') : (theme === 'dark' ? '#111827' : '#f9fafb'),
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: `1px solid ${currentPlan?.id === plan.id ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb')}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                    {plan.emoji} {plan.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Status: {plan.status}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}>
                  {calculatePlanStats(plan).progressPercent}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{ ...cardStyle, marginTop: '30px', backgroundColor: theme === 'dark' ? '#1e293b' : '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
        <h4 style={{ marginBottom: '10px', color: theme === 'dark' ? '#e0f2fe' : '#0369a1', fontSize: '0.95rem', fontWeight: '600' }}>
          💡 Tips for Success
        </h4>
        <ul style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#cbd5e1' : '#475569', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
          <li>Start with a plan that fits your schedule</li>
          <li>Track your daily readings to build a streak</li>
          <li>Take notes on passages that stand out to you</li>
          <li>Share your progress and encourage others</li>
        </ul>
      </div>
    </div>
  );
}

// Helper function to calculate plan stats
function calculatePlanStats(plan) {
  if (!plan) return { progressPercent: 0 };
  const completedCount = plan.completedChapters?.length || 0;
  const totalCount = plan.chapters?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return { progressPercent };
}

export default ReadingPlans;
