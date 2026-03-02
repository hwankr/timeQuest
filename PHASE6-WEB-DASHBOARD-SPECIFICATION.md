# Phase 6: Web Dashboard - Complete Specification & Architectural Context

**Compiled:** 2026-03-02
**Current Status:** NOT STARTED
**Project Phase:** Phases 1-5 COMPLETE, Phase 6 PLANNED

---

## TABLE OF CONTENTS

1. [Phase 6 Specification (from Main Spec)](#phase-6-specification)
2. [Current Project Architecture](#current-project-architecture)
3. [Firebase Configuration](#firebase-configuration)
4. [Data Model & Firestore Structure](#data-model--firestore-structure)
5. [Current Dependencies](#current-dependencies)
6. [Design System](#design-system)
7. [Key Implementation Patterns](#key-implementation-patterns)
8. [Repository Pattern Overview](#repository-pattern-overview)
9. [Authentication Flow](#authentication-flow)
10. [Architectural Decisions for Phase 6](#architectural-decisions-for-phase-6)

---

## Phase 6 Specification

### Overview

**Phase 6 introduces the Web Dashboard** — a Next.js-based companion application to the mobile app.

**Spec Tasks:**
- Task 28: Next.js project setup + Firebase shared backend integration
- Task 29: Web login (Firebase Auth)
- Task 30: Schedule template editor (drag-and-drop)
- Task 31: Reward management page
- Task 32: Statistics dashboard

### Key Principles from Spec

1. **Shared Firebase Backend**: Web and mobile apps use the SAME Firebase project, database, and authentication
2. **Separate Project Repository**: The web dashboard is a SEPARATE Next.js project (sister to the Expo mobile app)
3. **Initial Setup Focus**: Web is for convenient setup/management of schedules and rewards BEFORE using the mobile app
4. **Real-time Sync**: Changes made on web immediately sync to mobile via Firestore real-time listeners
5. **Same Security Rules**: Firestore security rules apply equally to web and mobile (users access only their own data)

### Tech Stack (Web)

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Firebase | Same project as mobile (shared) |
| Backend | Firebase Auth + Firestore |

### Features Required

#### Task 28: Next.js Setup + Firebase Integration
- Create new Next.js 14 project with TypeScript
- Copy/adapt Firebase configuration from mobile (same Firebase project)
- Set up environment variables for Firebase credentials (NEXT_PUBLIC_FIREBASE_*)
- Initialize Firestore and Auth instances for web
- Create basic layout and routing structure

#### Task 29: Web Login
- Firebase Auth login UI (email/password + Google)
- Session management
- Auth state persistence
- Redirect unauthenticated users to login
- Display user info after login

#### Task 30: Schedule Template Editor
- List all user's schedule templates
- Create new template
- Edit existing template
- **Drag-and-drop interface** for reordering/managing time blocks
- Real-time sync with mobile (changes appear on mobile via Firestore listeners)

#### Task 31: Reward Management
- Display user's rewards (both default and custom)
- Add custom rewards
- Edit reward details (name, icon, cost, category)
- Delete custom rewards
- Disable/enable rewards
- Adjust pricing for default rewards

#### Task 32: Statistics Dashboard
- Display user statistics (same data as mobile stats screen)
- Charts: Daily/weekly/monthly completion rates
- Total points earned/spent
- Streak information
- Category breakdown

---

## Current Project Architecture

### Directory Structure

```
TimeQuest/
├── app/                          # Expo Router (React Native) pages
│   ├── _layout.tsx              # Root layout
│   ├── auth/                    # Auth pages
│   ├── onboarding/              # Onboarding flow
│   ├── (tabs)/                  # Tab navigation
│   │   ├── index.tsx            # Schedule (main)
│   │   ├── shop.tsx             # Rewards shop
│   │   ├── stats.tsx            # Statistics
│   │   └── settings.tsx         # Settings
│   └── schedule/                # Schedule management
│
├── components/                  # React Native components
│   └── (various UI components for mobile)
│
├── config/
│   └── firebase.ts              # Firebase initialization (Firestore + Auth)
│
├── repositories/                # Firestore access layer
│   ├── converters.ts            # DocumentData → TypeScript converters
│   ├── scheduleRepo.ts          # Templates, blocks, daily records
│   ├── pointRepo.ts             # Point transactions
│   ├── rewardRepo.ts            # Rewards CRUD
│   ├── purchaseRepo.ts          # Purchase history
│   ├── blockConversionRepo.ts   # Block conversions
│   └── userRepo.ts              # User profile
│
├── stores/                      # Zustand state management
│   ├── useAuthStore.ts
│   ├── useScheduleStore.ts
│   ├── useTemplateStore.ts
│   ├── useRewardStore.ts
│   ├── useSettingsStore.ts
│   └── useOnboardingStore.ts
│
├── services/                    # Business logic layer
│   ├── dailyRecordService.ts    # Daily record orchestration
│   └── notification.ts          # Notification scheduling
│
├── types/
│   └── index.ts                 # All TypeScript type definitions
│
├── constants/
│   ├── theme.ts                 # Colors, spacing, font sizes
│   └── blockTypes.ts            # Block type constants
│
├── utils/
│   ├── time.ts                  # Time utilities
│   └── haptics.ts               # Haptic feedback
│
├── hooks/                       # React hooks
│   └── useUserDocument.ts       # Real-time user document subscription
│
├── assets/                      # Images, icons
│
├── package.json                 # Dependencies
├── app.json                     # Expo configuration
└── tsconfig.json                # TypeScript configuration
```

### Current Tech Stack (Mobile)

**Core:**
- React Native 0.83.2
- Expo 55.0.4
- TypeScript 5.9.2
- React 19.2.0

**Navigation & UI:**
- Expo Router 55.0.3 (file-based routing)
- @expo/vector-icons (Ionicons, MaterialCommunityIcons)

**State Management:**
- Zustand 5.0.11

**Backend:**
- Firebase 12.10.0 (Firestore + Auth)
- @react-native-async-storage/async-storage 2.2.0

**Data & Utilities:**
- date-fns 4.1.0

**Animations & Interactions:**
- react-native-reanimated 4.2.1
- react-native-gesture-handler 2.30.0
- react-native-draggable-flatlist 4.0.3

**Charts (Phase 5):**
- react-native-gifted-charts 1.4.75
- react-native-svg 15.15.3

**Notifications:**
- expo-notifications 55.0.10
- expo-haptics 55.0.8

---

## Firebase Configuration

### Current Config (Mobile - `config/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables (from .env)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Initialize app + Firestore with offline cache (tries persistent, falls back to memory)
// Initialize Auth with React Native AsyncStorage persistence
export { db, auth };
```

### Web Configuration (Phase 6 - To Be Created)

**For Next.js, the configuration will be similar BUT:**
- No `getReactNativePersistence` — use browser's IndexedDB instead
- Use `persistentMultipleTabManager()` for cross-tab sync
- Auth persistence: browser localStorage (built-in)
- Environment variables: Use `NEXT_PUBLIC_FIREBASE_*` prefix for client-side access

**Example web config:**
```typescript
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = initializeAuth(app);
```

### Environment Variables

**Mobile (.env):**
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Web (.env.local - To Be Created):**
Same as above, but with `NEXT_PUBLIC_` prefix instead of `EXPO_PUBLIC_`

---

## Data Model & Firestore Structure

### Overview

All user data is stored under `users/{userId}` with subcollections and nested fields.

### Complete Schema

```
users/{userId}
├── profile fields:
│   ├── displayName: string
│   ├── email: string
│   └── createdAt: Timestamp
│
├── stats fields:
│   ├── currentPoints: number
│   ├── currentStreak: number
│   ├── longestStreak: number
│   ├── totalPointsLifetime: number
│   ├── totalBlocksCompleted: number
│   ├── level: number
│   ├── experience: number
│   └── lastActiveDate: string ("YYYY-MM-DD")
│
├── settings fields:
│   ├── defaultTemplateId: string
│   ├── dayTemplateMap: { mon, tue, wed, thu, fri, sat, sun }
│   ├── notifications: { blockStart, blockEnd, reminder, ... }
│   └── points: { penaltyEnabled, lateToleranceMinutes, ... }
│
├── templates/{templateId}
│   ├── id: string
│   ├── name: string
│   ├── isDefault: boolean
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   │
│   └── blocks/{blockId}
│       ├── id: string
│       ├── startTime: string ("HH:mm")
│       ├── endTime: string ("HH:mm")
│       ├── taskName: string
│       ├── blockType: BlockType (routine|study|exercise|work|free|unassigned|rest|meal)
│       ├── basePoints: number
│       ├── sortOrder: number
│       ├── color?: string
│       └── icon?: string
│
├── rewards/{rewardId}
│   ├── id: string
│   ├── name: string
│   ├── description: string
│   ├── icon: string (emoji)
│   ├── cost: number
│   ├── category: RewardCategory (activity|convert|food|rest|special)
│   ├── isActive: boolean
│   ├── cooldownHours: number
│   ├── dailyLimit: number
│   ├── sortOrder: number
│   ├── isCustom: boolean
│   └── createdAt: Timestamp
│
├── dailyRecords/{date} (document ID = "YYYY-MM-DD")
│   ├── date: string
│   ├── templateId: string
│   ├── totalPointsEarned: number
│   ├── totalPointsSpent: number
│   ├── completionRate: number (0-1)
│   ├── fullDayBonusAwarded?: boolean
│   ├── createdAt: Timestamp
│   │
│   ├── completions/{blockId}
│   │   ├── blockId: string
│   │   ├── taskName: string (denormalized)
│   │   ├── blockType: BlockType (denormalized)
│   │   ├── startTime: string (denormalized)
│   │   ├── endTime: string (denormalized)
│   │   ├── basePoints: number (denormalized)
│   │   ├── completed: boolean
│   │   ├── completedAt: Timestamp | null
│   │   ├── pointsEarned: number
│   │   ├── bonusPoints: number
│   │   ├── skipped: boolean
│   │   ├── note?: string
│   │   └── converted?: boolean
│   │
│   └── purchases/{purchaseId}
│       ├── id: string
│       ├── rewardId: string
│       ├── rewardName: string (denormalized)
│       ├── rewardIcon: string (denormalized)
│       ├── pointsSpent: number
│       ├── purchasedAt: Timestamp
│       ├── used: boolean
│       └── usedAt: Timestamp | null
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // All other access denied
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Current Dependencies

### package.json (Mobile)

```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "2.2.0",
    "date-fns": "^4.1.0",
    "expo": "~55.0.4",
    "expo-constants": "~55.0.7",
    "expo-dev-client": "~55.0.10",
    "expo-haptics": "~55.0.8",
    "expo-linking": "~55.0.7",
    "expo-notifications": "~55.0.10",
    "expo-router": "~55.0.3",
    "expo-splash-screen": "~55.0.10",
    "expo-status-bar": "~55.0.4",
    "firebase": "^12.10.0",
    "react": "19.2.0",
    "react-native": "0.83.2",
    "react-native-draggable-flatlist": "^4.0.3",
    "react-native-gesture-handler": "~2.30.0",
    "react-native-gifted-charts": "^1.4.75",
    "react-native-reanimated": "4.2.1",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-screens": "~4.23.0",
    "react-native-svg": "^15.15.3",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~5.9.2"
  }
}
```

### Suggested Dependencies (Web Phase 6)

**Core:**
- `next@14`: App Router
- `react@19`: Latest
- `typescript`: Matching mobile (5.9.2)

**Styling & UI:**
- `tailwindcss`: CSS framework
- `shadcn/ui`: Component library (built on Radix UI)
- `@radix-ui/react-*`: Accessibility primitives

**Firebase:**
- `firebase@12.10.0`: Same version as mobile (same project)

**State & Utilities:**
- `zustand@5.0.11`: Same as mobile (optional, but good for consistency)
- `date-fns@4.1.0`: Same as mobile
- `react-hook-form`: Form handling
- `zod`: Schema validation

**Charts:**
- `recharts`: Web-friendly chart library (React/SVG based)
- `react-responsive-calendar-heatmap`: For statistics dashboard heatmap

**Drag & Drop:**
- `@dnd-kit/core`: Modern drag-and-drop library (web-friendly)
- `@dnd-kit/sortable`: Sortable list extension
- `@dnd-kit/utilities`: Utilities

---

## Design System

### Colors (`constants/theme.ts`)

```typescript
export const COLORS = {
  // Brand (Indigo)
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  // Points/Gold (Amber)
  point: '#f59e0b',
  pointLight: '#fbbf24',
  pointDark: '#d97706',

  // Block types
  block: {
    routine: '#6366f1',      // Indigo
    study: '#0891b2',        // Cyan
    exercise: '#16a34a',     // Green
    work: '#ea580c',         // Orange
    free: '#8b5cf6',         // Violet
    unassigned: '#94a3b8',   // Slate
    rest: '#64748b',         // Gray
    meal: '#d97706',         // Amber
  },

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Neutral
  bg: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
```

### Design Principles

- **Card-based UI**: Clean, minimal shadows
- **Color-coding**: Block types distinguished by color
- **Responsive layout**: Mobile-first, desktop-friendly
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark mode ready**: Token-based approach

---

## Key Implementation Patterns

### 1. Repository Pattern (Firestore Access Layer)

**Purpose**: All Firestore queries MUST go through Repository classes. Components and stores never access Firestore directly.

**Files:**
- `repositories/scheduleRepo.ts` — Templates, blocks, daily records
- `repositories/pointRepo.ts` — Point transactions (critical)
- `repositories/rewardRepo.ts` — Rewards CRUD
- `repositories/purchaseRepo.ts` — Purchase history
- `repositories/blockConversionRepo.ts` — Block conversions
- `repositories/userRepo.ts` — User profile
- `repositories/converters.ts` — Type converters (DocumentData → TS types)

**Example:**
```typescript
class ScheduleRepository {
  constructor(private userId: string) {}

  async getTemplates(): Promise<ScheduleTemplate[]> {
    // Implementation
  }

  async getTemplate(templateId: string): Promise<ScheduleTemplate | null> {
    // Implementation
  }

  // ... more methods
}
```

**Usage in Web:**
```typescript
// In a server component or page
const repo = new ScheduleRepository(userId);
const templates = await repo.getTemplates();
```

### 2. Type Converters (`repositories/converters.ts`)

**Purpose**: Safe conversion from Firestore DocumentData to TypeScript types with field validation and defaults.

**Functions:**
- `toUserDocument(data)` → UserDocument
- `toScheduleTemplate(id, data)` → ScheduleTemplate
- `toTimeBlock(id, data)` → TimeBlock
- `toReward(id, data)` → Reward
- `toDailyRecord(data)` → DailyRecord
- `toBlockCompletion(data)` → BlockCompletion
- `toRewardPurchase(id, data)` → RewardPurchase

**Example:**
```typescript
export function toScheduleTemplate(id: string, data: DocumentData): ScheduleTemplate {
  const ctx = 'toScheduleTemplate';
  requireField<string>(data, 'name', ctx);
  requireField<Timestamp>(data, 'createdAt', ctx);

  return {
    id,
    name: data['name'] as string,
    isDefault: optionalField<boolean>(data, 'isDefault', false),
    createdAt: data['createdAt'] as Timestamp,
    updatedAt: data['updatedAt'] as Timestamp,
  };
}
```

### 3. Zustand State Management

**Purpose**: Client-side state management (optional for web, but mobile uses it).

**Pattern:**
```typescript
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // state
  todayRecord: null,
  completions: [],

  // actions
  loadToday: async (userId: string) => {
    // Implementation
  },
}));
```

**For Web:** Can use Zustand for shared UI state, or use Next.js Context + hooks depending on architecture preference.

### 4. Atomic Transactions for Point Changes

**Critical Rule**: All point mutations MUST use `runTransaction` to prevent race conditions.

**Example (from pointRepo.ts):**
```typescript
async earnPoints(
  blockId: string,
  pointsEarned: number,
  bonusPoints: number
): Promise<EarnPointsResult> {
  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', this.userId);
    const userSnap = await transaction.get(userRef);

    const currentPoints = userSnap.data()!.currentPoints;

    transaction.update(userRef, {
      currentPoints: currentPoints + pointsEarned + bonusPoints,
      totalPointsLifetime: increment(pointsEarned + bonusPoints),
    });

    return { /* result */ };
  });
}
```

### 5. Real-time Listeners

**Pattern:** Use `onSnapshot` in stores/components for reactive updates.

**Example:**
```typescript
const unsubscribe = onSnapshot(
  collection(db, 'users', userId, 'templates'),
  (snap) => {
    const templates = snap.docs.map((d) => toScheduleTemplate(d.id, d.data()));
    // Update state
  }
);

// Cleanup
return () => unsubscribe();
```

---

## Repository Pattern Overview

### ScheduleRepository Methods

```typescript
class ScheduleRepository {
  // Templates
  getTemplates(): Promise<ScheduleTemplate[]>
  getTemplate(templateId): Promise<ScheduleTemplate | null>
  createTemplate(name, isDefault): Promise<string>
  updateTemplate(templateId, updates): Promise<void>
  deleteTemplate(templateId): Promise<void>

  // Blocks
  getBlocks(templateId): Promise<TimeBlock[]>
  getBlock(templateId, blockId): Promise<TimeBlock | null>
  createBlock(templateId, block): Promise<string>
  updateBlock(templateId, blockId, updates): Promise<void>
  deleteBlock(templateId, blockId): Promise<void>
  reorderBlocks(templateId, blocks): Promise<void>

  // Daily Records
  getDailyRecord(date): Promise<DailyRecord | null>
  getDailyRecords(startDate, endDate): Promise<DailyRecord[]>
  createDailyRecord(record): Promise<void>
  updateDailyRecord(date, updates): Promise<void>

  // Completions
  getCompletions(date): Promise<BlockCompletion[]>
  getCompletion(date, blockId): Promise<BlockCompletion | null>
  subscribeToCompletions(date, callback): Unsubscribe

  // Real-time
  onTemplatesChange(callback): Unsubscribe
}
```

### PointRepository Methods

```typescript
class PointRepository {
  earnPoints(blockId, pointsEarned, bonusPoints): Promise<EarnPointsResult>
  spendPoints(amount): Promise<void>
  awardFullDayBonus(): Promise<void>
  applyPenalty(penalty): Promise<void>
}
```

### RewardRepository Methods

```typescript
class RewardRepository {
  getRewards(): Promise<Reward[]>
  getReward(rewardId): Promise<Reward | null>
  createReward(reward): Promise<string>
  updateReward(rewardId, updates): Promise<void>
  deleteReward(rewardId): Promise<void>
}
```

### UserRepository Methods

```typescript
class UserRepository {
  getUserDocument(): Promise<UserDocument | null>
  updateSettings(settings): Promise<void>
  updateProfile(profile): Promise<void>
}
```

---

## Authentication Flow

### Mobile Flow (Current)

```
App Start
  ↓
Check Auth State (useAuthStore)
  ├─ Logged In → Load User Data → Dashboard
  └─ Not Logged In → Login Screen
         ↓
      Email/Password or Google Login
         ↓
      First Time? → Onboarding (create default template)
         ↓
      Dashboard
```

### Web Flow (To Be Implemented - Phase 6)

```
Web App Load
  ↓
Check Auth State (next.js middleware or useEffect)
  ├─ Logged In → Load User Data → Dashboard
  └─ Not Logged In → Login Screen
         ↓
      Email/Password or Google Login
         ↓
      Dashboard (skip onboarding, user already set up on mobile)
```

### Auth Implementation Details

**Mobile (Expo):**
- Uses `firebase/auth` with `getReactNativePersistence(AsyncStorage)`
- Auth state persisted to device storage
- `useAuthStore` manages auth state in Zustand

**Web (Next.js):**
- Uses `firebase/auth` with browser's localStorage (automatic)
- Can use Next.js server-side auth via Firebase Admin SDK (optional)
- Suggested: Use `firebase/auth` client-side for consistency with mobile
- Consider using `next-auth` with Firebase provider for SSR support

---

## Architectural Decisions for Phase 6

### 1. Repository Pattern Extension

**Decision**: Share Repository classes between mobile and web (same code).

**Rationale**:
- Same Firebase project = same data structure
- Repositories are framework-agnostic (pure TS + Firebase SDK)
- Reduces duplication

**Implementation**:
- Move `repositories/` to a shared package or monorepo (OR)
- Duplicate repositories in web project (simpler, less coupling)

**Recommendation**: Start with duplication, refactor to shared package later if needed.

### 2. Type Definitions

**Decision**: Share `types/index.ts` between mobile and web.

**Rationale**:
- All Firestore documents are identical
- Type safety across projects

**Implementation**:
- Move `types/` to shared package (OR)
- Duplicate `types/` in web project

**Recommendation**: Duplicate initially, create `@timequest/types` package in monorepo if scaling.

### 3. Firestore Access

**Decision**: Web uses same Firebase SDK version as mobile (v12.10.0).

**Rationale**:
- Consistent behavior
- Same Firestore query API
- Same Auth flow

**Alternative**: Use Firebase Admin SDK for server-side rendering (more complex).

### 4. State Management (Web)

**Decision**: Use Next.js Context + React hooks (simpler than Zustand for web).

**Rationale**:
- Next.js is SSR/SSG friendly
- Zustand is optional
- Web is primarily server-rendered

**Alternative**: Use Zustand for consistency with mobile (works fine too).

### 5. Drag-and-Drop Library

**Decision**: Use `@dnd-kit` for web template editor.

**Rationale**:
- Modern, accessibility-focused
- Works with React 19
- Not specific to React Native
- Mobile uses `react-native-draggable-flatlist` (RN-only)

**Alternative**: Use `react-beautiful-dnd` (more popular, slightly heavier).

### 6. UI Component Library

**Decision**: Use `shadcn/ui` (built on Radix UI).

**Rationale**:
- Headless, customizable
- Tailwind CSS integration
- Accessibility-first
- Great developer experience
- Can match mobile design system

**Alternative**: Material-UI, Ant Design, Chakra UI (all viable).

### 7. Chart Library (Web)

**Decision**: Use `recharts` for statistics dashboard.

**Rationale**:
- React/SVG-based (no native deps)
- Mobile uses `react-native-gifted-charts`
- Easy to customize
- Good TypeScript support

**Alternative**: Plotly.js, Nivo (both good options).

### 8. Next.js Routing Structure

**Suggested:**
```
web/
├── app/
│   ├── layout.tsx              # Root layout + auth check
│   ├── page.tsx                # Dashboard (redirect if not logged in)
│   ├── login/page.tsx          # Login screen
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── templates/
│   │   ├── page.tsx            # Template list
│   │   └── [id]/page.tsx       # Template editor
│   ├── rewards/page.tsx        # Reward management
│   └── statistics/page.tsx     # Stats dashboard
├── components/
│   ├── auth/                   # Auth components
│   ├── templates/              # Template editor components
│   ├── rewards/                # Reward components
│   └── ui/                     # shadcn/ui components
├── config/
│   └── firebase.ts             # Firebase initialization (web)
├── lib/
│   ├── firebase-admin.ts       # (Optional) Firebase Admin SDK
│   └── auth-context.tsx        # Auth provider
├── types/                      # Firestore types (shared with mobile)
├── public/
└── package.json
```

---

## Key Files to Understand Before Starting Phase 6

### Must Read
1. **`types/index.ts`** — All Firestore data types
2. **`repositories/converters.ts`** — Type conversion logic
3. **`repositories/scheduleRepo.ts`** — Template/block queries
4. **`repositories/pointRepo.ts`** — Point transaction logic
5. **`config/firebase.ts`** — Firebase initialization pattern

### Nice to Have
6. **`stores/useScheduleStore.ts`** — State management pattern
7. **`.omc/plans/phase5-notifications-and-statistics.md`** — Recent architectural decisions
8. **`TimeQuest-Firebase-프롬프트.md`** (full spec) — Master specification

---

## Quick Reference: Important Rules

### Critical (Must Enforce)
1. **All Firestore access goes through Repository classes** — never direct `getDoc()` in components
2. **Point transactions MUST use `runTransaction`** — prevents race conditions
3. **User can only access their own data** — enforced by Firestore security rules (`request.auth.uid == userId`)
4. **Times stored as "HH:mm" strings** — NOT Timestamps
5. **Dates stored as "YYYY-MM-DD" strings** — document IDs in dailyRecords use this format

### Important
6. **Denormalized data (completions, purchases)** — copied for query efficiency, never has reverse sync
7. **No `as` casts without field validation** — use converters instead
8. **Type strict mode** — no `any` types
9. **Firestore uses Timestamps** — must convert to/from JS Date for UI

### Best Practices
10. **Use `date-fns` for all date math** — installed v4.1.0
11. **Zustand actions should be simple** — complex logic goes in services
12. **Services layer** — `dailyRecordService`, `notification` (orchestration)
13. **Real-time listeners need cleanup** — return unsubscribe function
14. **Firebase config uses environment variables** — never hardcode credentials

---

## Next Steps for Phase 6 Planning

1. **Create Next.js project**: `npx create-next-app@latest`
2. **Set up Firebase (same config pattern as mobile)**
3. **Copy/duplicate types and repositories from mobile**
4. **Implement auth (Firebase Auth + login UI)**
5. **Build template editor (drag-and-drop UI)**
6. **Build reward management (CRUD interface)**
7. **Build statistics dashboard (charts + data)**
8. **Test real-time sync** (edit on web, verify on mobile)

---

**Document compiled:** 2026-03-02
**TimeQuest Project Phase 6 Ready for Planning**
