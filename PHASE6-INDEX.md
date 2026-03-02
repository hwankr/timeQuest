# Phase 6: Web Dashboard - Complete Information Package

**Compiled:** 2026-03-02
**Project Status:** Phases 1-5 COMPLETE | Phase 6 READY FOR PLANNING

---

## What You've Been Given

Three comprehensive documents have been compiled with ALL Phase 6 information:

### 1. PHASE6-QUICK-REFERENCE.md (302 lines)
**Purpose:** Quick lookup guide for developers starting Phase 6

**Contains:**
- One-page summary of Phase 6 goals
- Tech stack comparison (web vs mobile)
- Critical rules to enforce
- File structure template
- Dependencies list
- Real-time sync example
- Validation checklist

**Read this first** — ~5 minutes

### 2. PHASE6-WEB-DASHBOARD-SPECIFICATION.md (983 lines)
**Purpose:** Complete technical specification with architectural context

**Contains:**
- Full Phase 6 spec from main spec (verbatim)
- Current project architecture (directories, files)
- Firebase configuration (mobile + web)
- Complete Firestore data model with schema
- All current dependencies
- Design system (colors, spacing, fonts)
- Key implementation patterns (Repository, Converters, Transactions)
- Repository pattern overview with method signatures
- Authentication flow
- Architectural decisions for Phase 6
- Important rules and best practices

**Read this before implementation** — detailed reference

### 3. This Document (PHASE6-INDEX.md)
**Purpose:** Navigation guide and summary of all information gathered

---

## Quick Navigation

### For Planning & Requirements
→ Read **PHASE6-QUICK-REFERENCE.md**

### For Architecture & Implementation Details
→ Read **PHASE6-WEB-DASHBOARD-SPECIFICATION.md**

### For Understanding Current Mobile App
→ Read the spec files from Phases 1-5:
- `.omc/plans/phase1-project-setup-and-auth.md`
- `.omc/plans/phase2-schedule-core.md`
- `.omc/plans/phase3-reward-system.md`
- `.omc/plans/phase4-schedule-editing.md`
- `.omc/plans/phase5-notifications-and-statistics.md`

### For Full Project Specification
→ Read **TimeQuest-Firebase-프롬프트.md** (root directory)

---

## Key Findings Summary

### Phase 6 Tasks (from main spec, lines 946-952)

```
28. Next.js 프로젝트 세팅 + Firebase 동일 프로젝트 연동
29. 웹 로그인 (Firebase Auth)
30. 시간표 템플릿 편집기 (드래그 앤 드롭)
31. 보상 관리 페이지
32. 통계 대시보드
```

### Current Project Structure (Verified)

```
TimeQuest/                     (Mobile Expo app)
├── app/                       Expo Router pages
├── components/                React Native components
├── config/firebase.ts         Firebase init
├── repositories/              Firestore access (7 files)
├── stores/                    Zustand state (6 stores)
├── services/                  Business logic
├── types/index.ts             All TypeScript definitions
├── constants/                 Theme, block types
├── utils/                     Utilities
├── hooks/                     React hooks
├── package.json               Dependencies (verified)
└── app.json                   Expo config
```

### Current Tech Stack (Verified)

**Mobile (Expo):**
- React Native 0.83.2 + Expo 55.0.4
- Firebase 12.10.0
- Zustand 5.0.11
- date-fns 4.1.0
- React 19.2.0
- TypeScript 5.9.2

**Additions for Phase 5:**
- react-native-gifted-charts 1.4.75
- react-native-svg 15.15.3
- expo-notifications 55.0.10

### Firestore Schema (Complete & Verified)

```
users/{userId}/
├── Document fields: profile, stats, settings
├── templates/{templateId}/
│   ├── blocks/{blockId}
├── rewards/{rewardId}
└── dailyRecords/{date}/
    ├── completions/{blockId}
    └── purchases/{purchaseId}
```

**Total subcollections:** 5 (templates, rewards, dailyRecords, completions, purchases)

### Design System (Verified)

**Colors:**
- Primary: #6366f1 (Indigo)
- Points: #f59e0b (Amber)
- Block types: 8 colors mapped to block categories
- Semantic: success, warning, error, info
- Neutral palette

**Tokens:**
- Spacing: xs(4) → xl(32)
- Font sizes: xs(12) → xxl(32)
- Border radius: sm(8) → xl(24)

### Repository Pattern (Verified in Code)

**7 Repository Classes:**
1. ScheduleRepository — Templates, blocks, daily records
2. PointRepository — Point transactions (critical)
3. RewardRepository — Rewards CRUD
4. PurchaseRepository — Purchase history
5. BlockConversionRepository — Block conversions
6. UserRepository — User profile
7. Converters module — Type conversion functions

**Key Rule:** All Firestore access MUST go through repositories.

### Authentication (Verified)

**Current (Mobile):**
- Firebase Auth + email/password
- AsyncStorage persistence
- useAuthStore in Zustand
- Login/onboarding screens implemented

**For Web (Phase 6):**
- Use same Firebase Auth instance
- Browser localStorage (automatic)
- Context API or Zustand for state
- Build login UI (similar to mobile)

---

## Critical Information for Web Dashboard

### What Must Be Shared (Same Code)

1. **Firebase Project** — Same credentials, same database
2. **Firestore Types** — Copy `types/index.ts` as-is
3. **Repositories** — Copy all 7 repository files (framework-agnostic)
4. **Security Rules** — Already enforced: users access only their own data
5. **Design System** — Use same colors and spacing

### What Changes for Web

1. **Framework** — Next.js instead of Expo Router
2. **Styling** — Tailwind CSS instead of React Native styles
3. **Drag-Drop** — @dnd-kit instead of react-native-draggable-flatlist
4. **Charts** — Recharts instead of react-native-gifted-charts
5. **Firestore Cache** — persistentMultipleTabManager instead of persistentSingleTabManager
6. **Auth Storage** — Browser localStorage (automatic)

### Real-Time Sync (Key Feature)

- Edit on web → Mobile sees changes instantly (via onSnapshot listeners)
- Edit on mobile → Web sees changes instantly (via onSnapshot listeners)
- No special sync logic needed — Firestore handles it

---

## Files Created for This Gathering

### In `/c/Users/fabro/Desktop/projects/timeQuest/`

1. **PHASE6-QUICK-REFERENCE.md** (8.2 KB, 302 lines)
   - Quick start guide
   - One-page summary
   - Task breakdown
   - Dependencies
   - Validation checklist

2. **PHASE6-WEB-DASHBOARD-SPECIFICATION.md** (29 KB, 983 lines)
   - Complete spec (verbatim from main spec)
   - Architecture details
   - Firestore schema with all fields
   - Firebase config code examples
   - Design system tokens
   - Repository patterns
   - Implementation guidelines
   - Best practices and rules

3. **PHASE6-INDEX.md** (this file)
   - Navigation guide
   - Summary of findings
   - Quick facts
   - Next steps

---

## Information Sources

### Read From (Verified)

1. **TimeQuest-Firebase-프롬프트.md** (main spec)
   - Lines 31-40: Web dashboard overview
   - Lines 946-952: Phase 6 tasks
   - Full architecture and data model

2. **Current Project Files**
   - `/config/firebase.ts` — Firebase initialization
   - `/types/index.ts` — All 219 lines of type definitions
   - `/repositories/*.ts` — 7 repository implementations
   - `/package.json` — All current dependencies
   - `/app.json` — Expo configuration
   - `/constants/theme.ts` — Design system
   - `/.omc/plans/phase5-*.md` — Recent decisions

3. **.env.example** — Environment variable template

---

## Next Steps (What You Should Do)

### Immediate (Before Phase 6 Planning)

1. ✅ Read **PHASE6-QUICK-REFERENCE.md** (5 min)
2. ✅ Read **PHASE6-WEB-DASHBOARD-SPECIFICATION.md** (30 min)
3. Skim **TimeQuest-Firebase-프롬프트.md** sections:
   - Lines 31-40 (web overview)
   - Lines 149-220 (data model)
   - Lines 946-952 (Phase 6 tasks)

### For Phase 6 Planning

1. Create Next.js 14 project structure
2. Gather team for planning session (if applicable)
3. Create detailed implementation plan for Tasks 28-32
4. Assign resources and timeline estimates

### For Phase 6 Implementation

1. **Task 28**: Copy files from mobile
   - types/index.ts
   - repositories/*.ts
   - config/firebase.ts (adapt for web)
   - constants/theme.ts
   - Set up Firebase credentials

2. **Task 29**: Build auth UI (Firebase Auth)
   - Login form (email/password)
   - Google login (optional)
   - Session management

3. **Task 30**: Build template editor
   - Fetch templates from Firestore
   - Drag-and-drop interface (@dnd-kit)
   - Create/edit/delete templates
   - Real-time sync test

4. **Task 31**: Build reward manager
   - List rewards
   - CRUD interface
   - Price adjustment
   - Custom reward creation

5. **Task 32**: Build stats dashboard
   - Fetch daily/weekly/monthly data
   - Recharts integration
   - Display stats (same as mobile)

---

## Key Statistics

| Metric | Value |
|--------|-------|
| TypeScript Types | 219 lines in `types/index.ts` |
| Repository Classes | 7 total |
| Firestore Collections | 5 main (templates, rewards, dailyRecords, completions, purchases) |
| Design Tokens | 3 categories (spacing, font size, border radius) |
| Color Palette | 14 distinct colors + block types |
| Mobile Dependencies | 23 production + 2 dev |
| Current Phase Completion | 5/7 phases (71%) |
| Phase 6 Tasks | 5 tasks (28-32) |

---

## Important Rules (One More Time)

### Non-Negotiable

1. ✅ **All Firestore access through Repository classes ONLY**
2. ✅ **Point mutations use `runTransaction` for atomicity**
3. ✅ **TypeScript strict mode — no `any` types**
4. ✅ **Security rules enforce user data isolation**
5. ✅ **Denormalized data (completions) never reverse-syncs**

### Recommended

6. Use date-fns for all date logic (already installed)
7. Real-time listeners must have cleanup functions
8. Converters for safe type conversion (no `as` casts)
9. Services layer for complex orchestration
10. Test real-time sync between web and mobile

---

## Contact/Questions

For questions about:
- **Mobile app architecture** → See phase plans in `.omc/plans/`
- **Firestore structure** → See PHASE6-WEB-DASHBOARD-SPECIFICATION.md
- **Firebase setup** → See `config/firebase.ts`
- **Design system** → See `constants/theme.ts`
- **Type definitions** → See `types/index.ts`

---

## Document Summary

| Document | Size | Purpose | Read Time |
|----------|------|---------|-----------|
| PHASE6-QUICK-REFERENCE.md | 8.2 KB | Quick start guide | 5 min |
| PHASE6-WEB-DASHBOARD-SPECIFICATION.md | 29 KB | Complete spec + architecture | 30 min |
| PHASE6-INDEX.md | This file | Navigation guide | 10 min |

**Total Information Package:** 37 KB, ~45 minutes to read fully

---

## Version Info

- **Compiled:** 2026-03-02
- **TimeQuest Version:** Phase 5 Complete
- **Spec Source:** TimeQuest-Firebase-프롬프트.md (main spec)
- **Mobile Stack:** React Native 0.83.2 + Expo 55.0.4 + Firebase 12.10.0
- **Web Stack (Phase 6):** Next.js 14 + TypeScript + Tailwind + shadcn/ui

---

**You now have ALL the information needed to plan and implement Phase 6!**

Start with PHASE6-QUICK-REFERENCE.md for the overview.
