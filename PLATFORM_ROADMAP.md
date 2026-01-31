# Equip Daily - Platform Roadmap

## Vision

Equip Daily is designed as a **cross-platform devotional and Bible study experience**. While currently available as a web app, the architecture is being built with iOS and Android apps in mind from day one.

## Current Status

### ✅ Web App (Live)
- **URL**: https://equip-daily.vercel.app
- **Status**: Fully functional
- **Coverage**: All features implemented
- **Progressive Web App (PWA)**: Installable on devices for app-like experience

### 🗓️ iOS App (Planned)
- **Target**: React Native or Native Swift
- **Timeline**: Future phase
- **Backend**: Same Vercel serverless functions + Firebase
- **Features**: 100% parity with web app

### 🗓️ Android App (Planned)
- **Target**: React Native or Native Kotlin
- **Timeline**: Future phase
- **Backend**: Same Vercel serverless functions + Firebase
- **Features**: 100% parity with web app

## Architecture for Multi-Platform

### Backend (Shared Across All Platforms)

All platforms consume the same backend:

1. **Firebase Firestore** - Database
   - User profiles
   - Notes and highlights
   - Reading progress
   - Reflections and reactions

2. **Firebase Authentication** - User management
   - Email/password auth
   - Social login (Google, Apple, etc.)

3. **Vercel Serverless Functions** - API layer
   - `api/bible-chapter.js` - Fetch Bible chapters
   - `api/bible-audio.js` - Fetch audio URLs
   - `api/bible-search.js` - Search functionality
   - `api/bibles.js` - List available Bible versions

4. **External APIs**
   - API.Bible - Bible content and audio
   - Vercel - Hosting and CDN

### Frontend Considerations

**Web App (Current)**
- React 18 + Vite
- Firebase SDK (web)
- PWA capabilities

**iOS App (Future)**
- React Native or native Swift
- Firebase SDK (iOS)
- Native navigation and UI patterns

**Android App (Future)**
- React Native or native Kotlin
- Firebase SDK (Android)
- Native navigation and UI patterns

## API Stability & Testing

Since all platforms will depend on the same serverless APIs, **API tests must remain passing** before each production deploy. This ensures:

- ✅ Mobile apps can safely call the backend
- ✅ Breaking changes are caught early
- ✅ Version compatibility is maintained
- ✅ Error handling is consistent across platforms

**Current Test Coverage:**
- `src/__tests__/services/firestoreService.test.js` - Firestore operations (23 passing)
- `api/__tests__/` - API endpoint tests (currently disabled, to be fixed)

## Feature Parity Plan

All three platforms should have identical functionality:

### Core Features
- Daily devotional readings
- Bible study (Reading & Study modes)
- Note-taking and highlighting
- Audio Bible
- Community reflections
- Reading plans
- Dark mode

### Unique Per-Platform (If Needed)
- iOS: Push notifications (Apple-specific)
- Android: Push notifications (Firebase Cloud Messaging)
- Web: Progressive Web App features

## Authentication Strategy

- Firebase Auth handles user management
- Each platform has platform-specific auth flow (web, iOS, Android)
- User data synced across platforms in real-time via Firestore

## Data Synchronization

- Firestore is the source of truth
- All platforms sync user data (notes, highlights, progress)
- Offline-first approach for mobile apps
- Cloud sync when connection available

## Next Steps

1. ✅ Keep web app fully functional and tested
2. ⏳ Ensure API tests pass consistently (preventing email spam)
3. ⏳ Decide on iOS approach (React Native vs Swift)
4. ⏳ Decide on Android approach (React Native vs Kotlin)
5. ⏳ Create shared design system for all platforms
6. ⏳ Build iOS app
7. ⏳ Build Android app

---

**Last Updated**: January 31, 2026
