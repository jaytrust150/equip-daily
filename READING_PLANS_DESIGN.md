# Reading Plans Feature - Design & Architecture

**Phase 3 Initial Setup**  
**Status:** Foundation Structure Complete  
**Created:** January 31, 2026

---

## Overview

Reading Plans is a **"secret feature"** accessed via the calendar (📅) button on the devotional sidebar. This hidden entrance keeps the feature undiscovered by casual users while providing power users a structured way to track Bible reading progress.

## Architecture

### File Structure
```
src/
├── features/
│   ├── devotional/
│   │   └── DailyDevotional.jsx (MODIFIED - added calendar button)
│   └── ReadingPlans.jsx (NEW - main UI component)
├── services/
│   └── readingPlansService.js (NEW - Firestore operations)
├── hooks/
│   └── useReadingPlans.js (NEW - custom hook for state management)
```

### Database Schema (Firestore)

**Collection: `readingPlans`**
```javascript
{
  id: string,                           // planId (userId_planType_timestamp)
  userId: string,                       // User who created plan
  planType: string,                     // '5-day', '30-day', '365-day', 'custom'
  name: string,                         // Display name
  description: string,                  // Plan description
  emoji: string,                        // Visual indicator
  
  // Timestamps
  createdAt: timestamp,
  startDate: timestamp,
  endDate: timestamp (null if active),
  
  // Status
  status: string,                       // 'active', 'completed', 'paused', 'archived'
  
  // Progress Tracking
  currentDay: number,
  daysCompleted: number,
  currentStreak: number,
  longestStreak: number,
  lastReadDate: timestamp,
  
  // Content
  chapters: Array<{book: string, chapter: number}>,
  completedChapters: Array<string>,    // ["Genesis:1", "Genesis:2", ...]
  
  // Statistics
  stats: {
    totalChapters: number,
    totalPages: number,
    estimatedHours: number,
  },
  
  // Settings
  settings: {
    dailyReminder: boolean,
    reminderTime: string,               // "09:00"
    notifications: boolean,
    shareProgress: boolean,
  }
}
```

---

## Features Implemented

### 1. Plan Templates
- **5-Day Quick Start** ⚡ - Complete New Testament in 5 days
- **30-Day Journey** 📅 - Key Bible books in 1 month
- **365-Day Bible in a Year** 📖 - Complete Bible in 1 year
- **Custom Plan** 🎯 - User-defined reading schedule

### 2. Progress Tracking
- **Visual Progress Bar** - Shows completion percentage
- **Chapter Tracking** - Mark chapters as completed
- **Streak System** - Current & longest streaks with 🔥 badge
- **Daily Recommendations** - Smart algorithm calculates chapters to read today

### 3. Plan Management
- **Create** - Select from templates or create custom
- **Switch** - Multiple plans, switch between active ones
- **Pause/Resume** - Pause without losing progress
- **Complete** - Mark plans as finished
- **Delete** - Remove plans (soft delete possible)

### 4. Statistics Dashboard
| Stat | Purpose |
|------|---------|
| Progress % | Overall completion |
| Chapters Completed | Actual vs total |
| Current Streak | Consecutive days read |
| Longest Streak | Best performance |

### 5. UI/UX Elements
- **Status Indicator** - Color-coded by status (active=blue, paused=gray, etc.)
- **Expandable Details** - Today's reading section
- **Action Buttons** - Pause, Complete, Delete with appropriate states
- **Plan List** - View all plans with quick switch
- **Creation Flow** - Template selection modal

---

## User Flow

### Discovery (Secret Feature)
1. User browsing devotional
2. Clicks 📅 calendar button (bottom of button bar)
3. Reading Plans panel opens inline

### Initial Setup
1. Panel shows "No reading plans yet"
2. User clicks "Get Started"
3. Template selection grid appears
4. User picks a template
5. Plan is created and displayed

### Daily Usage
1. User clicks 📅 to open Reading Plans
2. Current plan shows:
   - Progress bar with percentage
   - 4 stat boxes (chapters, streak)
   - Today's reading recommendation
   - Action buttons (Pause/Resume/Delete)
3. User marks chapters complete as they read

### Switching Plans
1. Panel shows "All Plans" section
2. User clicks different plan
3. Current plan switches
4. Stats update

---

## Integration Points

### With Existing Features

**BibleStudy Component**
- Could auto-mark chapters from reading plan when navigated
- Potential: "You're reading Genesis 1 - that's in your plan! ✓"

**Community Feed**
- Could show "shared progress" if enabled in plan settings
- Leaderboard showing active streaks

**AudioPlayer**
- Recommend audio for today's reading chapters

**Notes & Highlights**
- Track notes created for plan chapters
- Show "Related notes" in plan detail view

### Future Integrations
- Notifications at reminder time
- Weekly/monthly progress reports
- Share progress to community
- Achievement badges
- Audio plan integration
- Prayer tracking alongside reading

---

## Services & Hooks

### readingPlansService.js

**Functions:**
- `createReadingPlan(userId, planType, planData)` - Create new plan
- `subscribeToReadingPlans(userId, callback)` - Real-time subscription
- `completeChapter(planId, chapter)` - Mark chapter done
- `updatePlanProgress(planId, progressData)` - Update any progress field
- `updateStreak(planId, current, longest)` - Update streak
- `completePlan(planId)` - Mark plan as finished
- `pausePlan(planId)` - Pause plan
- `resumePlan(planId)` - Resume paused plan
- `deletePlan(planId)` - Delete plan
- `getPlan(planId)` - Fetch single plan
- `calculatePlanStats(plan)` - Calculate display statistics
- `getDailyRecommendation(plan, daysRemaining)` - Get today's chapters

### useReadingPlans.js

**Hook State:**
- `plans` - Array of all user's plans
- `currentPlan` - Currently active plan
- `loading` - Loading state
- `error` - Error messages

**Hook Functions:**
- `markChapterComplete(planId, chapter)` - Mark chapter + update streak
- `getStats(plan)` - Get calculated stats
- `getTodayReading(plan)` - Get today's recommended chapters
- `switchPlan(planId)` - Set as current plan
- `handleCompletePlan(planId)` - Complete plan
- `handlePausePlan(planId)` - Pause plan
- `handleResumePlan(planId)` - Resume plan
- `handleDeletePlan(planId)` - Delete plan

---

## Styling & Theme

### Color Scheme
- **Primary (Active)** - #3b82f6 (blue)
- **Success (Complete)** - #10b981 (green)
- **Warning (Paused)** - #f59e0b (amber)
- **Danger (Delete)** - #ef4444 (red)
- **Info (Stats)** - #0ea5e9 (cyan)

### Responsive Design
- Mobile: Single column, stacked layout
- Tablet: 2-column stat grid
- Desktop: Full 4-column stat grid, inline plan list

### Dark Mode
- Full dark mode support
- Theme passed as prop
- Conditional colors throughout

---

## Security & Permissions

### Firestore Rules
```
- Users can read/write their own plans only
- Can read public plans (if sharing enabled)
- Cannot modify other users' plans
- Admin can query all plans for analytics
```

### Data Validation
- Plan chapters limited to 366 max
- Streak must be positive integer
- Status must be one of: active, completed, paused, archived
- Completed chapters must match plan chapters

---

## Performance Considerations

### Query Optimization
- Limited to 50 reading plans per user (Firestore rule)
- Only subscribe to active plan by default
- Batch update operations for streak calculations
- Pagination for large chapter lists (future)

### Caching
- Plans cached in component state
- Real-time subscriptions (no polling)
- Streak calculated client-side (no server calls needed)

---

## Future Enhancements

### Short Term (Next Sprint)
- [ ] Chapter selection UI for custom plans
- [ ] Integration with BibleStudy (auto-mark from navigation)
- [ ] Progress notifications at reminder time
- [ ] Weekly progress report email

### Medium Term (Month 2-3)
- [ ] Reading companions (study with friends)
- [ ] Leaderboard showing top streaks
- [ ] Achievement badges
- [ ] Export progress as PDF
- [ ] Print-friendly progress tracker

### Long Term (Quarter 2+)
- [ ] AI-suggested plans based on user interests
- [ ] Prayer journal integration
- [ ] Video commentary recommendations
- [ ] Multiple language plan support
- [ ] Difficulty level scaling (beginner/intermediate/advanced)
- [ ] Topic-based plans (book studies, themes, etc.)

---

## Testing Strategy

### Unit Tests
- `calculatePlanStats()` with various completion levels
- `getDailyRecommendation()` with different remaining days
- Status transitions (active → paused → active)

### Component Tests
- Plan creation flow
- Progress bar updates
- Streak calculation display
- Plan switching

### Integration Tests
- Firestore CRUD operations
- Real-time subscription updates
- Streak persistence across sessions

### E2E Tests
- Full user flow: Create → Track → Complete
- Mobile responsive design
- Dark/light mode switching
- Offline behavior (cached plans)

---

## Deployment Checklist

- [ ] Deploy Firestore rules update (readingPlans collection)
- [ ] Add readingPlansService to main bundle
- [ ] Add useReadingPlans hook to main bundle
- [ ] Test on staging environment
- [ ] Verify dark mode looks good
- [ ] Test mobile layout on various devices
- [ ] Performance test with 100+ plans per user
- [ ] Document secret feature discovery (blog post?)
- [ ] Monitor Firestore usage for new collection

---

## Documentation Files

| File | Purpose |
|------|---------|
| `READING_PLANS_DESIGN.md` | This file - architecture & design |
| User Guide | How to use reading plans (future) |
| API Documentation | Service function reference (future) |
| Component Storybook | UI component showcase (future) |

---

## Notes

- **"Secret Feature"** positioning is intentional - keeps UI clean for casual users
- Calendar button placement (📅) is intuitive for time/schedule management
- Foundation built for future features (notifications, sharing, etc.)
- Modular architecture allows easy expansion
- No database migration needed (new collection)

---

**Next Steps:**
1. ✅ Set up file structure and services
2. ✅ Create Firestore collection and rules
3. 🔄 Test all CRUD operations
4. 🔄 Integrate chapter selection UI for custom plans
5. 🔄 Add progress notifications
6. 🔄 Launch feature with blog post about secret discovery
