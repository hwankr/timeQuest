# Phase 6: Web Dashboard - Quick Reference Guide

**Compiled:** 2026-03-02 | **Status:** Ready for Planning

---

## One-Page Summary

### What is Phase 6?

Build a **Next.js web dashboard** for the TimeQuest app that:
- Shares the **same Firebase project** with the mobile app
- Allows users to **manage schedules, rewards, and view stats** from a browser
- Syncs **real-time** with the mobile app

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Frontend | Tailwind CSS + shadcn/ui |
| Backend | Firebase (same project as mobile) |
| Auth | Firebase Auth |
| State | Context API + React hooks (or Zustand) |
| Charts | Recharts |
| Drag-Drop | @dnd-kit |

### 5 Tasks

| # | Task | Estimated Size |
|---|------|-----------------|
| 28 | Next.js setup + Firebase integration | Medium |
| 29 | Web login (Firebase Auth) | Small |
| 30 | Template editor (drag-and-drop) | Large |
| 31 | Reward management page | Medium |
| 32 | Statistics dashboard | Large |

---

## Firestore Data (Shared with Mobile)

```
users/{userId}/
├── profile + stats + settings (document fields)
├── templates/{templateId}/blocks/{blockId}
├── rewards/{rewardId}
└── dailyRecords/{date}/
    ├── completions/{blockId}
    └── purchases/{purchaseId}
```

**Key Rule**: User can only read/write their own data (`request.auth.uid == userId`)

---

## Architecture Overview

### Shared Components (Copy from Mobile)

1. **Types** (`types/index.ts`)
   - All Firestore types: `UserDocument`, `TimeBlock`, `Reward`, etc.

2. **Repositories** (`repositories/*.ts`)
   - `scheduleRepo.ts` — Templates, blocks, daily records
   - `pointRepo.ts` — Point calculations
   - `rewardRepo.ts` — Rewards CRUD
   - `converters.ts` — Safe type conversion

3. **Firebase Config** (`config/firebase.ts`)
   - Initialize Firestore + Auth
   - Web version uses `persistentMultipleTabManager()`

### Web-Only Components

1. **Next.js Pages** (`app/`)
   - `/login` — Firebase Auth UI
   - `/dashboard` — Main dashboard
   - `/templates` — Template list + editor
   - `/rewards` — Reward management
   - `/statistics` — Stats dashboard

2. **Components** (`components/`)
   - Template editor (drag-and-drop UI)
   - Reward card (create/edit/delete)
   - Chart components (weekly, monthly stats)

3. **Utilities**
   - Auth context/provider
   - Form validation (zod + react-hook-form)

---

## Critical Rules

### Must Enforce (Non-Negotiable)

1. ✅ **All Firestore access → Repository only**
   ```typescript
   // Good
   const repo = new ScheduleRepository(userId);
   const templates = await repo.getTemplates();

   // Bad - never do this
   const snap = await getDocs(collection(db, 'users', userId, 'templates'));
   ```

2. ✅ **Point changes → `runTransaction` only**
   ```typescript
   await runTransaction(db, async (transaction) => {
     // All point mutations here
   });
   ```

3. ✅ **TypeScript strict mode** — no `any` types

4. ✅ **Security rules enforce user isolation** — users can't access other users' data

### Code Patterns

```typescript
// Use converters for type safety
const data: DocumentData = {...};
const template = toScheduleTemplate(id, data);  // Safe conversion

// Real-time listeners need cleanup
const unsubscribe = onSnapshot(ref, (snap) => {...});
return () => unsubscribe();  // Cleanup in useEffect

// Use date-fns for all date logic
import { format, subDays } from 'date-fns';
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
```

---

## Environment Variables

### `.env.local` (Web)

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Use same values as mobile `.env` (same Firebase project)

---

## File Structure

```
web/                                # Separate Next.js project
├── app/
│   ├── layout.tsx                 # Root layout + auth check
│   ├── page.tsx                   # Home → redirect to dashboard
│   ├── login/page.tsx             # Login screen
│   ├── dashboard/page.tsx         # Dashboard home
│   ├── templates/
│   │   ├── page.tsx               # Template list
│   │   └── [id]/page.tsx          # Template editor
│   ├── rewards/page.tsx           # Reward management
│   └── statistics/page.tsx        # Stats dashboard
├── components/
│   ├── auth/LoginForm.tsx
│   ├── templates/TemplateEditor.tsx
│   ├── rewards/RewardCard.tsx
│   ├── charts/WeeklyChart.tsx
│   └── ui/                        # shadcn/ui components
├── config/
│   └── firebase.ts                # Firebase init (web version)
├── lib/
│   └── auth-context.tsx           # Auth provider
├── types/                         # Copy from mobile
│   └── index.ts                   # All Firestore types
├── repositories/                  # Copy from mobile
│   ├── scheduleRepo.ts
│   ├── rewardRepo.ts
│   └── converters.ts
├── hooks/
│   ├── useAuth.ts
│   └── useUserData.ts
└── package.json
```

---

## Dependencies to Install

```bash
# Core
npm install next@14 react@19 typescript

# Firebase (same version as mobile)
npm install firebase@12.10.0

# UI & Styling
npm install tailwindcss postcss autoprefixer
npx shadcn-ui@latest init
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Forms
npm install react-hook-form zod @hookform/resolvers

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Charts
npm install recharts

# Utilities (same as mobile)
npm install date-fns@4.1.0
```

---

## Key Differences: Web vs Mobile

| Aspect | Mobile (Expo) | Web (Next.js) |
|--------|---------------|--------------|
| Framework | React Native | React |
| Routing | Expo Router | Next.js App Router |
| Styling | React Native styles | Tailwind CSS |
| State | Zustand | Context API + hooks (or Zustand) |
| Forms | Custom | react-hook-form |
| Drag-Drop | react-native-draggable-flatlist | @dnd-kit |
| Charts | react-native-gifted-charts | Recharts |
| Auth Storage | AsyncStorage | Browser localStorage |
| Firestore Cache | persistentSingleTabManager | persistentMultipleTabManager |

---

## Real-Time Sync Example

### User edits template on web

```
Web Template Editor
    ↓
updateDoc(db, 'users/{userId}/templates/{id}', {...})
    ↓
Firestore
    ↓
Mobile onSnapshot listener
    ↓
Mobile useTemplateStore updates
    ↓
Mobile UI re-renders with new template
```

Same in reverse: edit on mobile → web sees changes instantly

---

## Before You Start

### 1. Read These Files (Mobile Context)
- `/types/index.ts` — All type definitions
- `/repositories/converters.ts` — Type conversion pattern
- `/repositories/scheduleRepo.ts` — Query patterns
- `/config/firebase.ts` — Firebase setup

### 2. Copy These to Web Project
- `types/index.ts`
- `repositories/` (all files)
- `config/firebase.ts` (adapt for web)
- `constants/theme.ts` (color palette)

### 3. Understand These Concepts
- Firestore security rules (users can only access their own data)
- Repository pattern (all DB access through repos)
- Type converters (safe DocumentData → TS type conversion)
- Real-time listeners with cleanup

### 4. Remember
- **Same Firebase project** — no separate backend needed
- **Same data types** — use `types/index.ts` as-is
- **User isolation** — built into security rules
- **Real-time sync** — automatic via Firestore listeners

---

## Validation Checklist

- [ ] Next.js 14 project created with TypeScript
- [ ] Firebase configured with NEXT_PUBLIC_* vars
- [ ] Auth flow working (login/logout/redirect)
- [ ] Types copied and compiling
- [ ] Repositories copied and working
- [ ] Template editor loads from Firestore
- [ ] Editing template updates Firestore
- [ ] Mobile sees changes real-time
- [ ] Reward management CRUD working
- [ ] Stats dashboard displaying data
- [ ] Dark mode (optional)

---

**Ready to plan Phase 6? Start with Task 28: Next.js setup + Firebase**
