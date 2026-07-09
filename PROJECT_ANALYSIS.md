# CareerPilot Architecture Report

## 1. Project Layout

Root: `CareerPilot/CareerPilot`

- `src/`
  - `App.jsx` — main shell and role-based navigation
  - `main.jsx` — app entry point, initializes backend persistence
  - `components/` — UI screens and pages for student, recruiter, and admin personas
  - `lib/` — frontend data helpers, state sync logic, persistence wrappers, and AI utilities
- `server/`
  - `index.js` — Express backend API, storage provider selection, auth, integrations, AI, PDF report generation
  - `data/` — local JSON database file path (`server/data/db.json`) when MongoDB is unavailable
  - `reports/` — generated PDF files output directory
- `public/`, `dist/`, config files, and standard Vite/react assets

## 2. Frontend Architecture

### 2.1 Entry point and persistence

- `src/main.jsx` calls `initializeBackendPersistence()` before rendering `App`
- `src/lib/backendSync.js`:
  - Defines `API_BASE` for `/api`
  - Wraps fetch in `request(path, options)`
  - Patches `window.localStorage.setItem`, `removeItem`, and `clear` to queue backend sync operations
  - Sync behavior:
    - writes are batched and posted to `/api/storage/bulk`
    - individual deletes are sent to `/api/storage/:key`
  - On initialize, it calls `/api/bootstrap` and loads backend storage into raw localStorage before patching

### 2.2 API wrappers

- `authApi` — login, register, logout, me, updateProfile, updatePassword
- `integrationApi` — payment order, email send, calendar event, report generation, provider status
- `aiApi` — interview opening, followup, evaluate, transcribe with fallback local functions when AI is unavailable
- `stateApi` — CRUD endpoints for applications, notifications, jobs, companies, students, announcements, and student profile

### 2.3 App shell and role routing

- `src/App.jsx` manages:
  - authentication state
  - sidebar persona selection
  - active tab logic
  - onboarding flow for students
  - core state hydration of applications and notifications
- Personas and main tabs:
  - `student` — Dashboard, Search & Match, My Applications, Student Profile, Mock Interviews, Settings
  - `recruiter` — Recruiter Hub, Job Management, Talent Pool, Interview Desk, Settings
  - `admin` — Placement Hub, Partner Companies, Student Records, Global Reports, Settings
- `App.jsx` uses component-level props to pass applications, notifications, and state update callbacks
- If not authenticated, `Login` is rendered; if a student needs onboarding, `StudentOnboarding` is rendered instead

### 2.4 Main frontend data helpers

- `src/lib/recruiterData.js` — job persistence and normalization
  - `getStoredJobs()` reads `careerpilot_jobs` from localStorage and seeds `DEFAULT_JOBS` if empty or corrupt
  - `saveStoredJobs()` writes normalized jobs back to localStorage and calls `stateApi.saveJobs`
  - `getPublishedJobs()` returns jobs not marked as `Draft`
- `src/lib/adminData.js` — companies, students, announcements, and student record helpers
  - `getStoredCompanies()`, `getStoredStudents()`, `getStoredAnnouncements()` each seed defaults
  - `saveStoredCompanies()`, `saveStoredStudents()`, `saveStoredAnnouncements()` sync to backend
  - `deriveStudentsFromApplications()`, `mergeStudentRecords()`, `getPlacementStats()`, `getDepartmentBreakdown()` compute dashboard metrics
- `src/lib/studentProfile.js` — student profile defaults and persistence
  - `getStudentProfile()` reads `careerpilot_student_profile`
  - `saveStudentProfile()` writes profile and onboarding flag to localStorage and backend
  - `isStudentOnboardingComplete()` checks onboarding completion

### 2.5 Component usage patterns

- `StudentDashboard.jsx` uses `getStudentProfile()`, `getStoredAnnouncements()`, `getPublishedJobs()` and localStorage data
- `RecruiterDashboard.jsx`, `Companies.jsx`, `PlacementDashboard.jsx`, `StudentRecords.jsx` use the storage helpers from `adminData.js` and `recruiterData.js`
- `JobSearch.jsx`, `MockInterviews.jsx`, `Applications.jsx`, `Profile.jsx` use a mix of local helpers and `stateApi`
- `TopBar.jsx` and `Sidebar.jsx` are UI components used across all personas

## 3. Backend Architecture

### 3.1 Server bootstrap and storage provider

- `server/index.js` is an Express app configured with JSON body parsing
- Storage provider is selected at runtime:
  - MongoDB if `MONGODB_URI` is set and connection succeeds
  - JSON file fallback otherwise (`server/data/db.json`)
- `ensureDb()` creates directories and seeds the database if missing
- `createDefaultDb()` declares default data arrays and storage

### 3.2 Default seeded data

Current default seed data includes:
- `DEFAULT_APPLICATIONS`, `DEFAULT_NOTIFICATIONS`
- `DEFAULT_JOBS`, `DEFAULT_COMPANIES`, `DEFAULT_STUDENTS`, `DEFAULT_ANNOUNCEMENTS`
- `DEFAULT_STUDENT_PROFILE`
- `DEFAULT_USERS` is empty
- This seed data is used for both JSON fallback and initial MongoDB seeding

### 3.3 Storage model

- `db.storage` holds serialized localStorage-derived values, including `careerpilot_*` keys
- `COLLECTION_STORAGE_KEY_MAP` maps storage keys to backend collections
- Derived storage keys are treated specially and not persisted as user-managed storage entries
- `syncCollectionStorage(db)` keeps `db.storage` in sync with current collection arrays and profile
- `applyStorageValue()` and `removeStorageValue()` support backend persistence of localStorage keys

### 3.4 Auth and user storage

- Auth uses JWT tokens signed with `JWT_SECRET`
- `users` cascade from `db.users` or parsed storage users
- `createSession(user)` generates a session record stored in `db.sessions`
- `parseUsersFromStorage()` intentionally returns `[]`, avoiding legacy user restore from `careerpilot_users`
- Password handling supports plain strings, legacy `scrypt$` values, and bcrypt-hashed passwords

### 3.5 Express routes

#### System and storage
- `GET /api/health` — health check and provider status
- `GET /api/bootstrap` — returns `db.storage` and provider metadata
- `PUT /api/storage/:key` — set a storage key and sync collections
- `POST /api/storage/bulk` — set multiple storage keys atomically
- `DELETE /api/storage/:key` — remove a storage key and associated collection state

#### State endpoints
- `GET /api/applications` — fetch applications
- `PUT /api/applications` — replace applications
- `GET /api/notifications` — fetch notifications
- `PUT /api/notifications` — replace notifications
- `GET /api/jobs` — fetch jobs
- `PUT /api/jobs` — replace jobs
- `GET /api/companies` — fetch companies
- `PUT /api/companies` — replace companies
- `GET /api/students` — fetch students
- `PUT /api/students` — replace students
- `GET /api/announcements` — fetch announcements
- `PUT /api/announcements` — replace announcements
- `GET /api/student-profile` — fetch student profile
- `PUT /api/student-profile` — replace student profile

#### Auth endpoints
- `POST /api/auth/login` — email/password/role login
- `POST /api/auth/register` — create new account and issue session
- `GET /api/auth/me` — verify JWT token and return user
- `PUT /api/auth/profile` — update user name/email and current user storage
- `PUT /api/auth/password` — change password
- `POST /api/auth/logout` — clear session and remove current user storage

#### Integrations and AI
- `POST /api/integrations/payment/order`
- `POST /api/integrations/email/send`
- `POST /api/integrations/calendar/event`
- `GET /api/integrations/status`
- `POST /api/reports/generate`
- `POST /api/ai/interview/opening`
- `POST /api/ai/interview/followup`
- `POST /api/ai/interview/evaluate`
- `POST /api/ai/interview/transcribe`

### 3.6 AI and report generation

- If `GEMINI_API_KEY` or `GOOGLE_API_KEY` are configured, `serverAi` uses Gemini model calls
- Fallback AI generation is implemented in frontend local help functions when the backend AI route is unavailable
- PDF generation is a simple custom function creating minimal PDF objects and saving them to `server/reports`

## 4. Data Flow Summary

### 4.1 Authentication flow

1. User submits login/register in `src/components/Login.jsx`
2. Frontend calls `authApi.login()` or `authApi.register()`
3. Backend verifies credentials and writes `careerpilot_current_user` + `session_token` to backend storage
4. The frontend stores `careerpilot_current_user` and `careerpilot_session_token` in localStorage
5. On app startup, `App.jsx` calls `authApi.me(token)` and restores the session

### 4.2 Backend persistence and localStorage sync

- `initializeBackendPersistence()` loads `/api/bootstrap`
- backend storage values are seeded into browser localStorage before patching
- subsequent localStorage writes are synced to backend via state and storage routes
- `stateApi` offers explicit CRUD endpoints for known application data
- `backendSync.js` also syncs user events via `careerpilot:storage-updated` custom events

### 4.3 Frontend data usage

- Core UI state in `App.jsx` is built from localStorage and refreshed from backend state endpoints
- Many modules still rely directly on localStorage helper wrappers in `src/lib/*` rather than always using `stateApi`
- Jobs, companies, students, announcements, and student profile are managed by helper functions that normalize, seed, and save data locally

## 5. Key Models and Schemas

### User
- `id`, `name`, `email`, `password`, `role`
- `role` values seen in code: `student`, `recruiter`, `admin`
- Passwords are stored hashed in backend, sanitized before returning to frontend

### Session
- `id`, `token`, `userId`, `createdAt`
- Stored in `db.sessions`

### Job
- `id`, `company`, `title`, `location`, `type`, `locationType`, `experience`, `salaryMin`, `salaryMax`, `salary`, `match`, `status`, `planTier`, `branchEligibility`, `batchEligibility`, `cgpaCutoff`, `requirements`, `tags`, `shortDescription`, `description`, `missingSkills`, `deadline`, `createdAt`, `logo`

### Application
- Typical fields: `id`, `company`, `role`, `appliedDate`, `status`, `logo`
- Additional fields may include `studentName`, `studentUniversity`, `studentBranch`, `studentGpa`, `resumeSnapshot`, `matchScore`, `selectedInterviewSlot`

### Company
- `id`, `name`, `tier`, `visits`, `logo`, `status`, `documents`, `note`

### Student record
- `id`, `name`, `role`, `cgpa`, `placement`, `branch`, `initial`

### Announcement
- `id`, `title`, `message`, `audience`, `createdAt`

### Student profile
- `name`, `email`, `phone`, `role`, `university`, `degree`, `branch`, `semester`, `location`, `summary`, `skills`, `gpa`, `coursework`, `graduation`, `projects`, `experience`, `achievements`, `certifications`, `responsibility`, `socials`, `codingProfiles`, `onboardingComplete`

## 6. Observations and Risk Areas

### 6.1 Mock/default seed data still present

- Frontend helpers still include seeded defaults for jobs, companies, students, announcements, and student profile
- Backend `server/index.js` still seeds `DEFAULT_JOBS`, `DEFAULT_COMPANIES`, `DEFAULT_STUDENTS`, `DEFAULT_ANNOUNCEMENTS`, and `DEFAULT_STUDENT_PROFILE`
- `App.jsx` still uses fallback user name `Alex Rivera` in `TopBar` when `currentUser.name` is missing

### 6.2 Partial state sync patterns

- `stateApi` provides explicit backend state endpoints, yet many components read and write directly via localStorage helpers in `src/lib/*`
- This creates mixed persistence layers: some state is managed through localStorage with backend sync, some through direct `stateApi` calls, and some through both
- Example: `getStoredJobs()` seeds localStorage with `DEFAULT_JOBS`, which may diverge from backend `jobs` state

### 6.3 Backend storage and session handling

- `authApi.logout()` sends token in POST body while `auth/me` accepts either auth header or query token
- Local session state is mirrored in both localStorage and backend storage objects
- Backend storage synchronization may persist stale `careerpilot_current_user` values if sessions are cleared in frontend only

### 6.4 Unused or duplicated routes

- The backend has full `jobs`, `companies`, `students`, and `announcements` endpoints, but not all components appear to consistently use them
- `backendSync.js` also supports low-level storage endpoints that can override collections; this means both storage-key-based and direct collection updates are possible

## 7. Summary

CareerPilot is a Vite + React frontend with a role-based UX for students, recruiters, and placement admins. It relies on an Express backend that provides both localStorage-style persistence and direct collection APIs. Authentication is JWT-based and session state is mirrored through localStorage and backend storage.

The main architectural concern is that default/mock seed data is present in both frontend helpers and backend bootstrap, while the frontend uses mixed persistence methods. This means cleanup will require removing seed defaults from both layers and verifying that the app consistently loads from either backend state or clean localStorage values.

> Note: No code changes were made while preparing this architecture report.
