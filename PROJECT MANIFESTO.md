# Equip Daily - Project Manifesto

**Author:** Jonathan Vargas — Sebastian, Florida

---

1. THE VISION:"For the equipping of the saints." - Eph 4:12
The UX: Immersive Reader. When the user engages with the Word, the UI (headers, menus) must disappear.
2. THE COMMUNITY: "One Body"
Core Philosophy: We reject divisive "Church Modes." We are One Body.

Scripture: "For even as the body is one and yet has many members... so also is Christ." (1 Corinthians 12:12).
Identity: Users are linked to a local "Body" (City/Church) for connection, but the UI remains unified for all.
Interaction: We use "Fruit of the Spirit" reactions (Love, Joy, Peace) instead of "Likes" to encourage edification.
3. THE ARCHITECTURE: "Feature-First Modularity"
We organize code by Feature Domain, not by file type.

Directory Structure (The Truth):

src/config/ -> The Laws (Constants, API Keys, Colors).
src/services/ -> The Servants (API.Bible fetchers, Firestore logic).
src/features/bible/ -> The Word (Reader, AudioPlayer, VerseList).
src/features/devotional/ -> The Daily (Static content, Reflections).
src/shared/ -> The Tools (SearchWell, MemberCard).
4. CRITICAL UX RULES
Immersive Scroll: When reading (scrolling down), the Header and Audio Player MUST slide up/hide.
Gestures: Swipe Left/Right MUST handle chapter navigation.
The "Deep Well": Search is a tool available from anywhere (FAB), not just a page.
This document is the source of truth for all AI agents and developers working on this repository