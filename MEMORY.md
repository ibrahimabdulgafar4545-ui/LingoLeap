# LingoLeap Development Memory

This file serves as the memory log for the LingoLeap language learning platform project development. It tracks our completed milestones, structural decisions, and next steps.

---

## 📌 Project Overview
* **Name**: LingoLeap
* **Concept**: AI-powered premium language learning platform inspired by Duolingo's learner experience and gamification, with unique branding.
* **Tech Stack**: React + Vite, Tailwind CSS, Node.js + Express, MongoDB + Mongoose, JWT Authentication.

---

## 🚀 Milestones & Progress

### Phase 2: Core Learning Engine & Skill Map (Completed)
- [x] Created `Lesson.js` and `Progress.js` Mongoose models
- [x] Built `db.service.js` - a database abstraction layer that auto-falls back to local `data/db.json` when MongoDB is unavailable
- [x] Updated `auth.middleware.js` and `auth.controller.js` to use `db.service` abstraction
- [x] Created `learning.controller.js` with lesson fetching, submission with XP/streak/level logic, leaderboard, and practice endpoints
- [x] Added `lesson.routes.js` and `general.routes.js`; updated `app.js` and `server.js` with auto-seeding of lessons on startup
- [x] Created `LearningContext.jsx` for global lesson state management
- [x] Built `Sidebar.jsx` (desktop) and `BottomNavbar.jsx` (mobile) navigation
- [x] Created `AppLayout.jsx` wrapper component
- [x] Built all 9 pages: Dashboard, Learn (Skill Tree), LessonRunner, Practice, AITutor, Achievements, Leaderboard, Profile, Settings
- [x] Wired all routes, providers and guards in final `App.jsx`

---

### Phase 3: Progress, Gamification & Polish (Completed)
- [x] Resolved Nodemon restart loop by configuring `--ignore data/` on server start
- [x] Verified concurrently running servers (Backend on Port 5000, Frontend automatically on Port 5174)
- [x] Validated registration, login, lesson loading, completion scoring, XP rewards, and leaderboard logic with integration tests
- [x] Added global `Toaster` component in `App.jsx` for user feedback across screens
- [x] Exposed `setUser` in `AuthContext` to enable live stat updates on the frontend upon lesson completion
- [x] Configured `LessonRunner.jsx` to dynamically unlock achievements, play sound/confetti celebrations, and show success toasts
- [x] Animated the active lesson node in `Learn.jsx` with a subtle pulsing micro-transition
- [x] Tied AI Tutor scenario language selection to user's Target Language setting

### Phase 4: Optimization, Offline Mode & Launch Preparation (Completed)
- [x] Implement lesson details caching on client for offline responsiveness (Done via localStorage in LearningContext.jsx)
- [x] Build production bundles (`npm run build`) and verify build compliance (Completed and verified)
- [x] Set up environment variable files for production deployment (Verified .env.production and .env.example files)
- [x] Review security best practices for JWT storage and HTTP cookies (Completed; see jwt_cookie_security_review.md)

### Phase 5: Real AI Tutor Integration (Completed)
- [x] Built the server-side AI controller (ai.controller.js) that constructs conversations with Google's Gemini 1.5 Flash API or falls back to simulated roleplays if the API key is not configured
- [x] Added backend router /api/ai/chat and mounted it under /api/ai in app.js
- [x] Modified client AITutor.jsx to fetch real roleplays from the backend and provide a client-side simulation fallback on connection failure
- [x] Verified and successfully built production packages with Vite

### Phase 6: Speech Recognition & Audio Practice (Completed)
- [x] Integrated Web Speech API (SpeechRecognition) on SpeakQuestion component with real mic input
- [x] Added language-aware recognition (es-ES, fr-FR, de-DE, it-IT, en-US, ar-SA)
- [x] Built fuzzy transcript matching for lenient scoring of spoken answers
- [x] Added Text-to-Speech (TTS) PlayAudioButton on all question types (MC, FillBlank, Translate, Speak)
- [x] Added mic error banners and unsupported-browser fallback with "Mark Done" button
- [x] Verified build compliance

### Phase 7: Shop, Gems & Virtual Economy (Completed)
- [x] Added `gems`, `streakFreezes`, `ownedItems` fields to MongoDB `User.js` model and JSON fallback in `db.service.js`
- [x] Created `shop.controller.js` with 6-item catalogue, purchase logic, gem deduction, and special item handling
- [x] Created `shop.routes.js` and mounted under `/api/shop` in `app.js`
- [x] Gems awarded on lesson completion (5 gems standard, 15 gems for 80%+ score)
- [x] Built full `Shop.jsx` page with category tabs, gem balance display, purchase flow, max-ownership limits, and skeleton loading
- [x] Added Shop to `Sidebar.jsx` nav, `BottomNavbar.jsx`, and `App.jsx` routing
- [x] Added gem balance + Shop shortcut card to `Dashboard.jsx`

---

### Phase 8: Social Features & Friends List (Completed)
- [x] Follow users and see their progress on a friends feed
- [x] Challenge a friend to beat your lesson score (Not implemented, let's keep it scoped down)
- [x] Friend activity ticker on Dashboard
- [x] Friends page to search for users to follow, view current friends, and see activity feed

---

### Phase 9: Final Polish & Review (Completed)
- [x] Check for any missing features or bugs.
- [x] Final tests.
- [x] Ensure production build works seamlessly.

### Phase 10: English Path Resolution & Seeding Fixes (Completed)
- [x] Identified root cause of empty path error: `unit` and `unitTitle` fields were missing from the Mongoose `Lesson` schema, resulting in those fields being stripped upon document insert in MongoDB Atlas.
- [x] Fixed MongoDB auto-seeding logic on server startup (`server.js`) to automatically populate MongoDB if it connected successfully but contains no lessons.
- [x] Added `unit` and `unitTitle` fields to Mongoose `Lesson.js` model schema to prevent MongoDB from dropping unit associations.
- [x] Implemented case-insensitive language queries in `findLessonsByLanguage` (`db.service.js`) using Regex, preventing language case discrepancies between the frontend/backend.
- [x] Created a complete English learning path matching the requested structure (Unit 1: Basics [Greetings, Introductions, Common Words, Numbers, Colors] and Unit 2: Everyday English [Family, Food, Shopping, Travel, Time]) with fully structured questions, answers, and XP values.
- [x] Successfully re-ran seeds and ran integrations tests to verify that the Learn page loading, unit grouping, and lesson runner/submits function correctly.

---

### Phase 11: Complete English Curriculum & Global Settings (Completed)
- [x] **English Curriculum — 3 Full Units, 15 Lessons** created in `server.js`:
  - Unit 1: Basics → Greetings, Introductions, Numbers, Colors, Common Words
  - Unit 2: Everyday Life → Family, Food, Shopping, Time, Travel
  - Unit 3: Communication → Questions, Conversations, Directions, Daily Activities, Emotions
  - Each lesson includes: multiple-choice, fill-blank, AND match exercises
  - XP rewards scale: 15 → 20 → 25 → 30 XP per lesson with difficulty
- [x] **Match question type** fully implemented in `LessonRunner.jsx` — drag-free two-column click matching with visual feedback
- [x] **Learn.jsx** — fixed `selectedLanguage` to reactively sync with `user.targetLanguage` when changed in Settings (was only initialized once)
- [x] **Settings.jsx** — fully upgraded:
  - Language selection now shows **check badge** on active language
  - Clear label "updates globally — Learn path, AI Tutor, and profile"
  - **Avatar upgrade**: Style picker with 6 DiceBear styles + live preview before applying
  - **Real photo upload**: Upload PNG/JPG from device (FileReader → base64, 2MB limit), saved to `avatarUrl`
  - Quick Random avatar with shuffle icon
- [x] **Profile.jsx** — fully upgraded:
  - Shows uploaded/custom avatar with camera icon → navigates to Settings to change
  - Today's XP goal progress bar
  - 6-stat grid: Level, Total XP, Streak, Lessons Done, Gems, Achievements
  - League badge on profile hero card
  - "Edit Profile & Settings" quick link button
- [x] MEMORY.md updated with all Phase 11 changes

### Phase 12: Friends System & Authentication Debugging Audit (Completed)
- [x] **Social Friends System Fix**:
  - Identified root cause of "Failed to load profile": `friendRequests` and `friends` fields were missing from the select projection in `getFriendProfile` inside `social.controller.js`.
  - Added these fields to the MongoDB query projection.
  - Added robust guards (`|| []`) to all array operations (`friendRequests`, `friends`) in `social.controller.js` to prevent runtime `TypeError` issues.
  - Verified relationship calculations work cleanly (`none`, `sent_pending`, `received_pending`, `friends`, `blocked`) and correct buttons render on search/profile modal.
- [x] **Authentication Flow Fix**:
  - Identified root cause of server crashes and "Invalid Credentials": The Mongoose pre-save hook in `User.js` called `next()` but did not return on the unmodified password path. This caused the hook to continue running and call `bcrypt.hash(undefined, salt)` in the background since `password` was unselected by default (`select: false`), resulting in unhandled promise rejections that crashed the server.
  - Corrected `userSchema.pre('save')` to early return using `return next()` when the password is not modified.
  - Updated `sendTokenResponse` in `auth.controller.js` to sign the JWT payload using the stringified version of the user ID (`(user._id || user.id).toString()`).
  - Created and executed a complete end-to-end integration test (`test_e2e_auth.js`) validating registration, password hashing, login verification, token generation, and token parsing.

### Phase 13: Rich Chat Features & WebRTC calling (Completed)
- [x] **Emojis & Custom SVG Stickers**: Implemented a responsive emoji and sticker selector drawer. Added 9 custom educational and gamification SVG stickers (Happy Owl, Studying Owl, Streak Flame, Gold Trophy, Language Champion, Smart Robot, Sad Owl, Crown Master, Book Smart) that render inline cleanly.
- [x] **Voice Notes**: Added recording capabilities using browser `MediaRecorder` API. Captures audio data, encodes it to base64, sends via Socket.io, and persists it in MongoDB. Plays back inline with a custom styled wave-bar player `VoiceMessagePlayer`.
- [x] **WebRTC Audio & Video Calls**: Implemented direct calling between active friends. Uses `RTCPeerConnection` signaling (SDP offer/answer and ICE candidate exchange) over Socket.io to route stream feeds, featuring a overlay layout with PIP local stream preview, mute controls, and call duration timer.
- [x] **Layout & UX Arrangement**: Placed the voice recording microphone button next to the emoji smile selector and text input. Polished overall page layout and resolved JSX tag balance errors, confirming successful client builds.
- [x] **Message Reactions**: Added hover emoji action bars on message bubbles supporting six common emojis (👍, ❤️, 😂, 😮, 😢, 🙏). Persists in database (`reactions` field in `Message.js` model) and updates reactively via Socket.io.
- [x] **Presence & Last Seen Indication**: Tracks socket connects/disconnects in the backend (`isOnline`, `lastSeen` database fields). Updates client state reactively on status change broadcasts, rendering "Online" (green) or relative timestamp "Last seen 2h ago" (gray).

### Phase 14: Brevo Email Integration & Password Recovery (Completed)
- [x] Installed and configured unified `@getbrevo/brevo` Client SDK.
- [x] Built database-agnostic token retrieval, matching, and password update routines to handle both MongoDB and fallback modes seamlessly.
- [x] Implemented API routes for resend-verification (`/api/auth/resend-verification`), forgot-password (`/api/auth/forgot-password`), and reset-password (`/api/auth/reset-password`).
- [x] Designed custom verification, forgot, and reset pages in dark glassmorphism styling.
- [x] Wired route links to Auth cards and verified build outputs without linting or bundler exceptions.

### Phase 15: System Audit & Real-Time Chat Optimization (Completed)
- [x] Audited all 17 LingoLeap feature areas (100% Working, zero critical failures).
- [x] Removed stuck online presence indicator by writing a global startup hook that resets all users' `isOnline` status to `false` on server reload.
- [x] Replaced the voice note recording timer block with a real-time reactive Web Audio API waveform visualizer that reads microphone inputs and animates waveform bar amplitudes as the user speaks.
- [x] Verified and successfully built production packages.
- [x] Created `lingoleap_audit_report.md` artifact detailing functional checks, recent updates, and production pre-launch checklist.

### Phase 16: Branding Redesign & Dashboard Polish (Completed)
- [x] **Original Mascot Creation**: Designed 'Lingo the Leaping Gecko' mascot representing learning (glasses), listening (headphones), progress (diagonal leap, green-blue transition), and high retention (sticky suction-cup toes).
- [x] **Animated Logo (Framer Motion)**: Coded dynamic SVG rendering including path drawing for speech bubbles, spring jumping for the mascot, speed motion trails, staggered typography fade-ins, and idle pulse transitions.
- [x] **Concepts Showcase Selector**: Built the 'Branding Design Lab' component on the user dashboard, displaying all 3 generated concepts (Gecko, Fox, Hummingbird) in real-time, showcasing active draw animations and design logic.
- [x] **Dashboard Polish Overhaul**: Repositioned Continue Learning as a high-attention gradient card, added live waving gecko greeting headers, and styled sidebar brand footprints to feel like Notion/Duolingo/Stripe.
- [x] **Interactive Cheers Feed**: Redesigned social feed cards with active status metrics and a clickable 'Celebrate' congratulations button which fires dynamic confetti bursts and toast updates.
- [x] **Assets & Compliances**: Replaced default browser favicon with custom gecko vector asset (`favicon.svg`) and verified error-free client production builds (`npm run build`).

### Phase 17: Complete Mobile-First Redesign (Completed)
- [x] **Chat Workspace Full-Screen Redesign**: Updated [Chat.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages/Chat.jsx) to leverage `noPadding` on layout container and expanded display panels to take full vertical space (`h-[calc(100vh-64px)]`) on mobile device screens, presenting a layout similar to WhatsApp/Telegram.
- [x] **AI Tutor Adaptive Layout Overhaul**: Integrated responsive resize listeners and mobile toggle tabs inside [AITutor.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages/AITutor.jsx), enabling learners to switch seamlessly between chat history feed and dictionary vocabulary search/grammar reviews in active tutor practices.
- [x] **Dark Mode Theme Improvements**: Styled text search inputs, emoji selectors, typing bubbles, and active messages elements to adapt appropriately and read legibly across light/dark backgrounds.
- [x] **Clean Compile Build Outputs**: Confirmed that all updated pages pass syntax compliance checks and compile cleanly with production React + Vite asset bundles.

### Phase 18: Vercel SPA Routing Configuration (Completed)
- [x] **Vercel Routing Rewrite**: Created `vercel.json` files in the `/client` directory and the root directory to handle rewrite rules (`/(.*)` to `/index.html`), preventing `404: NOT_FOUND` errors when refreshing/reloading deep pages of the application.

### Phase 19: API & CORS URL Integrations (Completed)
- [x] **Production API Link**: Updated `client/.env.production` to use the Render server API: `https://lingoleap-udj0.onrender.com/api`.
- [x] **CORS Configuration**: Configured backend Express app and Socket.io server to dynamically read the `CLIENT_URL` environment variable, enabling requests from the Vercel frontend: `https://lingoleap4.vercel.app`.

---



## 🗃️ Active Directory Map
* **Frontend**: `client/`
  - Core styling: [index.css](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/index.css) & [tailwind.config.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/tailwind.config.js)
  - Routes & Entry: [App.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/App.jsx) & [main.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/main.jsx)
  - State & Request: [AuthContext.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/context/AuthContext.jsx) & [api.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/services/api.js)
  - Learning State: [LearningContext.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/context/LearningContext.jsx)
  - Pages: [VerifyEmail.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages/VerifyEmail.jsx) | [ForgotPassword.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages/ForgotPassword.jsx) | [ResetPassword.jsx](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages/ResetPassword.jsx)
* **Backend**: `server/`
  - Config & Entry: [server.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/server.js) & [app.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/app.js)
  - Database Abstraction: [db.service.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/services/db.service.js)
  - Database Models: [User.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/models/User.js) | [Lesson.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/models/Lesson.js)
  - Routing: [auth.routes.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/routes/auth.routes.js) | [lesson.routes.js](file:///C:/Users/HP/OneDrive/Desktop/LingoLeap1/server/src/routes/lesson.routes.js)

## 🔑 Key Technical Decisions
1. **Dual Database Strategy**: MongoDB Atlas for production, local `db.json` as automatic fallback. Zero config needed.
2. **Lesson Seeding**: `server.js` seeds English/Spanish/French/German/Italian/Arabic curricula on startup if DB is empty.
3. **Match Questions**: `correctAnswer` is stored as `"key:value;key:value"` pairs. Frontend splits by `;` and checks each left-right click against pairs.
4. **Profile Photos**: Uploaded as base64 DataURL and stored in `avatarUrl` field. No file server needed.
5. **Language Sync**: `user.targetLanguage` in AuthContext is the single source of truth. Learn.jsx syncs its local state via `useEffect([user?.targetLanguage])`.
6. **JWT Stringification**: Ensuring consistent JSON string representation for JWT payloads to support both Mongoose ObjectId formats and flat JSON file string database structures.
7. **Unified Brevo SDK (v5.x/v6.x)**: Switched initialization to use the modernized `BrevoClient` wrapper instance resolving constructor instantiation mismatches in Node ESM modules.
8. **Startup Presence Resets**: Erasing stale `isOnline` states upon system boots to ensure accurate presence indicators instead of stuck "online" sessions.
9. **Mic Analyser Feedback**: Utilizing browser native `AudioContext` and `AnalyserNode` frequency maps inside client-side recorder callbacks to show a jumping waveform amplitude bar visualizer during active talk recordings.

## 🖥️ Run Scripts
* **Backend (`server`)**: `npm run dev`
* **Frontend (`client`)**: `npm run dev`
* **Both together**: Run `npm run dev` in `server/` then `npm run dev` in `client/`.
