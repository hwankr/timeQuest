# 🎯 타임퀘스트 (TimeQuest) — React Native + Expo + Firebase 풀스택 앱 개발 프롬프트

---

## 📌 프로젝트 개요

"타임퀘스트"는 하루 시간표를 설계하고, 계획을 지킬 때마다 포인트를 획득하며, 모은 포인트로 보상을 구매하는 **자기관리 게이미피케이션 앱**이다. 사용자가 시간을 블록 단위로 나누고, 각 블록을 완료하면 포인트를 받으며, 포인트로 "게임 시간", "배달음식 시켜먹기", "공부→자유 블록 전환" 등의 보상을 구매할 수 있다.

**핵심 철학**: 시간표를 지키는 것 자체가 게임이 되어야 한다. 포인트와 보상 시스템으로 운동이나 공부처럼 하기 싫은 일을 실제로 하게 만드는 것이 목표이다.

**플랫폼 전략**: 모바일 앱(React Native)이 메인이고, 웹 대시보드(Next.js)에서 시간표 템플릿 설계, 보상 커스텀 등 초기 설정을 편하게 할 수 있다. Firebase를 공유 백엔드로 사용하여 앱과 웹이 실시간 동기화된다.

---

## 🛠 기술 스택

### 모바일 앱 (메인)

| 항목 | 기술 |
|------|------|
| 프레임워크 | React Native + Expo (Managed Workflow) |
| 언어 | TypeScript |
| 네비게이션 | Expo Router (파일 기반 라우팅) |
| 상태관리 | Zustand |
| 백엔드/DB | Firebase (Firestore + Auth) |
| 알림 | expo-notifications (로컬 알림) |
| 애니메이션 | react-native-reanimated |
| 날짜/시간 | date-fns |
| 아이콘 | @expo/vector-icons (Ionicons, MaterialCommunityIcons) |

### 웹 대시보드 (보조 — Phase 6에서 구현)

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| 백엔드 | Firebase 동일 프로젝트 공유 |

> **웹 대시보드는 Phase 6에서 별도 구현한다. 지금은 모바일 앱에 집중한다.**

### Firebase 서비스 사용 범위

| Firebase 서비스 | 용도 |
|----------------|------|
| **Firebase Auth** | 사용자 인증 (이메일/Google 로그인) |
| **Cloud Firestore** | 메인 데이터베이스 (시간표, 포인트, 보상 등) |
| **Firebase Cloud Messaging** | 푸시 알림 (추후 Phase 5) |

> Firestore의 오프라인 캐시를 반드시 활성화한다. 이를 통해 인터넷이 불안정해도 앱이 즉시 반응하고, 온라인 복귀 시 자동 동기화된다.

### 프로젝트 초기화

```bash
# 모바일 앱
npx create-expo-app@latest TimeQuest --template blank-typescript
cd TimeQuest
npx expo install expo-router expo-notifications react-native-reanimated date-fns zustand
npm install firebase
```

### Firebase 초기 설정

```typescript
// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  // Firebase 콘솔에서 복사한 config
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);

// Firestore 오프라인 캐시 활성화 (필수)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Auth (React Native용 AsyncStorage 퍼시스턴스)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
```

### 폴더 구조

```
TimeQuest/
├── app/                          # Expo Router 페이지
│   ├── _layout.tsx               # 루트 레이아웃
│   ├── auth/
│   │   ├── login.tsx             # 로그인 화면
│   │   └── onboarding.tsx        # 온보딩 (첫 실행)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # 탭 레이아웃
│   │   ├── index.tsx             # 시간표 (메인 화면)
│   │   ├── shop.tsx              # 보상 상점
│   │   ├── stats.tsx             # 통계/리포트
│   │   └── settings.tsx          # 설정
│   ├── schedule/
│   │   ├── create.tsx            # 시간표 생성/편집
│   │   └── template.tsx          # 시간표 템플릿 관리
├── components/
│   ├── TimeBlock.tsx             # 시간 블록 카드 컴포넌트
│   ├── PointBadge.tsx            # 포인트 표시 뱃지
│   ├── RewardCard.tsx            # 보상 카드
│   ├── ProgressRing.tsx          # 원형 진행률
│   ├── StreakBanner.tsx          # 연속 달성 배너
│   ├── BlockEditor.tsx           # 블록 편집 모달
│   └── ConfirmModal.tsx          # 확인 모달
├── config/
│   └── firebase.ts               # Firebase 초기화 (위 코드)
├── stores/
│   ├── useScheduleStore.ts       # 시간표 상태
│   ├── usePointStore.ts          # 포인트 상태
│   ├── useAuthStore.ts           # 인증 상태
│   └── useSettingsStore.ts       # 설정 상태
├── repositories/
│   ├── scheduleRepo.ts           # 시간표 Firestore CRUD
│   ├── pointRepo.ts              # 포인트/기록 Firestore CRUD
│   ├── rewardRepo.ts             # 보상 Firestore CRUD
│   └── userRepo.ts               # 사용자 정보 CRUD
├── services/
│   ├── notification.ts           # 알림 서비스
│   └── pointCalculator.ts        # 포인트 계산 로직
├── types/
│   └── index.ts                  # 타입 정의
├── constants/
│   ├── theme.ts                  # 디자인 토큰 (색상, 폰트 등)
│   ├── blockTypes.ts             # 블록 타입 정의
│   └── rewards.ts                # 기본 보상 목록
└── utils/
    ├── time.ts                   # 시간 유틸리티
    └── haptics.ts                # 햅틱 피드백
```

---

## 📊 데이터 모델 (Firestore 구조)

Firestore는 컬렉션 > 문서 > 서브컬렉션 구조이다. 모든 사용자 데이터는 `users/{userId}` 하위에 저장한다.

### 전체 구조 개요

```
users/{userId}                         ← 사용자 루트 문서
├── profile                            ← 사용자 프로필 (문서 필드)
├── stats                              ← 누적 통계 (문서 필드)
│
├── templates/{templateId}             ← 시간표 템플릿 컬렉션
│   └── blocks/{blockId}               ← 해당 템플릿의 블록들
│
├── rewards/{rewardId}                 ← 보상 목록 컬렉션
│
├── dailyRecords/{date}                ← 일별 기록 (문서 ID = "2026-03-01")
│   ├── completions/{blockId}          ← 블록 완료 기록
│   └── purchases/{purchaseId}         ← 보상 구매 기록
│
└── settings                           ← 설정 (문서 필드)
```

### 1. 사용자 루트 — `users/{userId}`

```typescript
interface UserDocument {
  // profile
  displayName: string;
  email: string;
  createdAt: Timestamp;

  // stats (누적 통계 — 문서에 직접 저장하여 매번 집계 불필요)
  currentPoints: number;          // 현재 보유 포인트
  currentStreak: number;          // 현재 연속 달성일
  longestStreak: number;          // 최장 연속 달성일
  totalPointsLifetime: number;    // 총 누적 획득 포인트
  totalBlocksCompleted: number;   // 총 완료 블록 수
  level: number;
  experience: number;
  lastActiveDate: string;         // "2026-03-01" (스트릭 계산용)

  // settings
  settings: {
    defaultTemplateId: string;
    dayTemplateMap: {              // 요일별 템플릿 배정
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    };
    notifications: {
      blockStart: boolean;
      blockEnd: boolean;
      reminder: boolean;
      morningBriefing: boolean;
      streakWarning: boolean;
      advanceMinutes: number;     // 사전 알림 분 (1, 5, 10)
      dndStart: string;           // "22:00"
      dndEnd: string;             // "07:00"
    };
    points: {
      penaltyEnabled: boolean;
      lateToleranceMinutes: number; // 지각 허용 분 (기본 5)
      streakBonusMultiplier: number; // 스트릭 보너스 배수 (기본 0.1)
    };
  };
}
```

### 2. 시간표 템플릿 — `users/{userId}/templates/{templateId}`

```typescript
interface ScheduleTemplate {
  id: string;
  name: string;                   // "평일", "주말", "시험기간"
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. 시간 블록 — `users/{userId}/templates/{templateId}/blocks/{blockId}`

```typescript
interface TimeBlock {
  id: string;
  startTime: string;              // "05:30" (HH:mm)
  endTime: string;                // "06:15"
  taskName: string;               // "샤워"
  blockType: BlockType;           // "routine" | "study" | "exercise" | "work" | "free" | "unassigned" | "rest" | "meal"
  basePoints: number;             // 완료 시 기본 포인트
  sortOrder: number;
  color?: string;                 // 커스텀 색상
  icon?: string;                  // 커스텀 아이콘
}

type BlockType = 'routine' | 'study' | 'exercise' | 'work' | 'free' | 'unassigned' | 'rest' | 'meal';
```

### 4. 보상 — `users/{userId}/rewards/{rewardId}`

```typescript
interface Reward {
  id: string;
  name: string;                   // "게임 1시간"
  description: string;            // "자유 블록에 게임 배치"
  icon: string;                   // 이모지
  cost: number;                   // 필요 포인트
  category: RewardCategory;       // "activity" | "convert" | "food" | "rest" | "special"
  isActive: boolean;
  cooldownHours: number;          // 재구매 대기시간 (0=무제한)
  dailyLimit: number;             // 일일 구매 한도 (-1=무제한)
  sortOrder: number;
  isCustom: boolean;              // 사용자 생성 여부
  createdAt: Timestamp;
}

type RewardCategory = 'activity' | 'convert' | 'food' | 'rest' | 'special';
```

### 5. 일별 기록 — `users/{userId}/dailyRecords/{date}`

문서 ID는 날짜 문자열 (예: `"2026-03-01"`)

```typescript
interface DailyRecord {
  date: string;                   // "2026-03-01"
  templateId: string;             // 사용된 템플릿
  totalPointsEarned: number;      // 오늘 획득 포인트
  totalPointsSpent: number;       // 오늘 사용 포인트
  completionRate: number;         // 달성률 (0~1)
  createdAt: Timestamp;
}
```

### 6. 블록 완료 기록 — `users/{userId}/dailyRecords/{date}/completions/{blockId}`

```typescript
interface BlockCompletion {
  blockId: string;                // time_blocks의 ID
  taskName: string;               // 비정규화 (조회 편의)
  blockType: BlockType;           // 비정규화
  startTime: string;              // 비정규화
  endTime: string;                // 비정규화
  completed: boolean;
  completedAt: Timestamp | null;
  pointsEarned: number;
  bonusPoints: number;
  skipped: boolean;
  note?: string;
}
```

> **비정규화 이유**: Firestore는 JOIN이 없으므로, 완료 기록 조회 시 템플릿 블록을 따로 불러올 필요 없도록 핵심 정보를 복사해둔다. 통계 화면에서 일별 기록만 읽으면 블록 정보까지 한 번에 나온다.

### 7. 보상 구매 기록 — `users/{userId}/dailyRecords/{date}/purchases/{purchaseId}`

```typescript
interface RewardPurchase {
  rewardId: string;
  rewardName: string;             // 비정규화
  rewardIcon: string;             // 비정규화
  pointsSpent: number;
  purchasedAt: Timestamp;
  used: boolean;
  usedAt: Timestamp | null;
}
```

---

## 🔥 Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자는 자기 데이터만 읽기/쓰기 가능
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 그 외 모든 접근 차단
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔄 Repository 패턴

모든 Firestore 접근은 Repository를 통해서만 한다. 컴포넌트나 Store에서 Firestore를 직접 호출하지 않는다.

```typescript
// repositories/scheduleRepo.ts 예시 구조
import { db } from '@/config/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, Timestamp
} from 'firebase/firestore';

class ScheduleRepository {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // 템플릿 목록 조회
  async getTemplates(): Promise<ScheduleTemplate[]> {
    const ref = collection(db, 'users', this.userId, 'templates');
    const snap = await getDocs(query(ref, orderBy('createdAt')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleTemplate));
  }

  // 특정 템플릿의 블록 목록 조회
  async getBlocks(templateId: string): Promise<TimeBlock[]> {
    const ref = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    const snap = await getDocs(query(ref, orderBy('sortOrder')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeBlock));
  }

  // 블록 추가
  async addBlock(templateId: string, block: Omit<TimeBlock, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'users', this.userId, 'templates', templateId, 'blocks'));
    await setDoc(ref, block);
    return ref.id;
  }

  // 실시간 리스너 (오늘의 완료 기록 실시간 동기화)
  onCompletionsChange(date: string, callback: (completions: BlockCompletion[]) => void) {
    const ref = collection(db, 'users', this.userId, 'dailyRecords', date, 'completions');
    return onSnapshot(ref, (snap) => {
      const completions = snap.docs.map(d => ({ ...d.data() } as BlockCompletion));
      callback(completions);
    });
  }

  // ... 나머지 CRUD
}
```

### Repository 사용 흐름

```
컴포넌트 (UI) → Zustand Store (상태) → Repository (Firestore 접근) → Firestore
```

- **컴포넌트**: UI 렌더링, 사용자 이벤트 처리
- **Zustand Store**: 메모리 상태 관리, Repository 호출
- **Repository**: Firestore 쿼리/리스너 관리
- **Firestore**: 데이터 저장 + 오프라인 캐시 자동 처리

---

## 🔐 인증 플로우

### 지원 로그인 방식

1. **이메일/비밀번호** (기본)
2. **Google 로그인** (expo-auth-session 사용)

### 인증 플로우

```
앱 시작 → Auth 상태 확인
  ├── 로그인 됨 → (tabs)/index.tsx (메인 화면)
  └── 로그인 안 됨 → auth/login.tsx
       ├── 첫 가입 → auth/onboarding.tsx (기본 템플릿 생성)
       └── 기존 사용자 → 바로 메인 화면
```

### 온보딩 (첫 가입 시)

1. 환영 메시지
2. 기상 시간 / 취침 시간 설정
3. 기본 시간표 템플릿 자동 생성 (사용자 입력 기반)
4. 기본 보상 목록 Firestore에 자동 생성
5. 메인 화면으로 이동

```typescript
// 온보딩 완료 시 초기 데이터 생성
async function initializeNewUser(userId: string, wakeTime: string, sleepTime: string) {
  // 1. 사용자 문서 생성 (기본 설정 포함)
  await setDoc(doc(db, 'users', userId), {
    currentPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPointsLifetime: 0,
    totalBlocksCompleted: 0,
    level: 1,
    experience: 0,
    lastActiveDate: '',
    settings: { ...DEFAULT_SETTINGS },
    createdAt: Timestamp.now(),
  });

  // 2. 기본 템플릿 생성
  const templateRef = doc(collection(db, 'users', userId, 'templates'));
  await setDoc(templateRef, { name: '기본 시간표', isDefault: true, ... });

  // 3. 기본 블록 생성 (사용자의 기상/취침 시간 기반)
  // generateDefaultBlocks(wakeTime, sleepTime) → 블록 배열 생성 후 저장

  // 4. 기본 보상 목록 생성
  for (const reward of DEFAULT_REWARDS) {
    const ref = doc(collection(db, 'users', userId, 'rewards'));
    await setDoc(ref, { ...reward, isCustom: false, createdAt: Timestamp.now() });
  }
}
```

---

## 🎮 핵심 기능 상세 명세

### 1. 시간표 관리

#### 시간표 메인 화면 (`app/(tabs)/index.tsx`)

- 상단: 오늘 날짜, 요일, 포인트 뱃지
- 세로 타임라인 레이아웃으로 블록 나열
- 각 블록 카드 표시 정보:
  - 시작~종료 시간 (왼쪽 타임라인)
  - 블록 타입 아이콘 + 색상
  - 태스크 이름
  - 획득 가능 포인트
  - 완료 상태 (체크 표시)
- 블록 탭 → 완료 처리 (햅틱 피드백 + 애니메이션 + 포인트 증가)
- 현재 시간 기준 "진행 중" 블록 하이라이트
- 지나간 미완료 블록은 흐리게 표시 (더 이상 완료 불가, 또는 패널티)

#### 데이터 로딩 플로우 (매일 앱 실행 시)

```typescript
// 앱 실행 시 오늘의 데이터 로딩
async function loadToday(userId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = format(new Date(), 'EEE').toLowerCase(); // "mon", "tue", ...

  // 1. 오늘의 dailyRecord가 있는지 확인
  const recordRef = doc(db, 'users', userId, 'dailyRecords', today);
  const recordSnap = await getDoc(recordRef);

  if (!recordSnap.exists()) {
    // 2. 없으면 새로 생성 (요일에 맞는 템플릿 가져와서)
    const userDoc = await getDoc(doc(db, 'users', userId));
    const templateId = userDoc.data().settings.dayTemplateMap[dayOfWeek]
                     || userDoc.data().settings.defaultTemplateId;

    // 3. 템플릿의 블록들을 completions 서브컬렉션으로 복사
    const blocks = await getBlocks(userId, templateId);
    await setDoc(recordRef, {
      date: today,
      templateId,
      totalPointsEarned: 0,
      totalPointsSpent: 0,
      completionRate: 0,
      createdAt: Timestamp.now(),
    });

    for (const block of blocks) {
      await setDoc(
        doc(db, 'users', userId, 'dailyRecords', today, 'completions', block.id),
        {
          blockId: block.id,
          taskName: block.taskName,
          blockType: block.blockType,
          startTime: block.startTime,
          endTime: block.endTime,
          completed: false,
          completedAt: null,
          pointsEarned: 0,
          bonusPoints: 0,
          skipped: false,
        }
      );
    }
  }

  // 4. 실시간 리스너 등록 (completions 변경 감지)
  return onSnapshot(
    collection(db, 'users', userId, 'dailyRecords', today, 'completions'),
    (snap) => { /* Zustand 상태 업데이트 */ }
  );
}
```

#### 시간표 생성/편집 (`app/schedule/create.tsx`)

- 템플릿 이름 설정
- 블록 추가: 시작시간, 종료시간, 태스크명, 블록 타입, 포인트 설정
- 시간 피커: 15분 단위 스크롤 선택
- 블록 드래그 앤 드롭으로 순서 변경
- 블록 복사/삭제
- 블록 타입 선택 시 기본 포인트 자동 설정 (공부: 15P, 운동: 20P 등)
- 시간 겹침 검증: 블록 시간이 겹치면 경고
- 요일별 템플릿 배정 기능 (월~금: "평일", 토~일: "주말")

### 2. 포인트 시스템

#### 기본 포인트 규칙

```typescript
// constants/pointRules.ts
export const POINT_RULES = {
  // 블록 타입별 기본 포인트 (사용자 커스텀 가능)
  BASE_POINTS: {
    routine: 5,
    study: 15,
    exercise: 20,
    work: 25,
    meal: 5,
    free: 0,      // 자유시간은 포인트 없음
    unassigned: 0, // 미할당도 포인트 없음
    rest: 0,
  },

  // 보너스 포인트
  BONUS: {
    ON_TIME_COMPLETION: 3,       // 블록 시간 내 완료 보너스
    CONSECUTIVE_BLOCKS: 2,       // 연속 블록 완료 보너스 (2블록 이상)
    MORNING_STREAK: 10,          // 오전 블록 전부 완료 보너스
    FULL_DAY_COMPLETION: 30,     // 하루 전체 완료 보너스
    STREAK_MULTIPLIER: 0.1,      // 연속일수 × 10% 보너스 (최대 50%)
  },

  // 패널티 (선택적 — 설정에서 ON/OFF)
  PENALTY: {
    SKIP_BLOCK: -5,              // 블록 건너뛰기
    LATE_COMPLETION: -2,         // 시간 초과 완료
  },
};
```

#### 포인트 계산 서비스

```typescript
// services/pointCalculator.ts
interface PointResult {
  base: number;
  timeBonus: number;        // 시간 내 완료 보너스
  streakBonus: number;      // 연속일 보너스
  consecutiveBonus: number; // 연속 블록 보너스
  total: number;
}

function calculatePoints(
  block: TimeBlock,
  completedAt: Date,
  consecutiveCount: number,  // 이전 연속 완료 블록 수
  currentStreak: number,     // 현재 연속 달성일
): PointResult { ... }
```

#### 블록 완료 처리 (Firestore 트랜잭션)

```typescript
// 포인트 일관성을 위해 반드시 트랜잭션 사용
import { runTransaction, doc, Timestamp } from 'firebase/firestore';

async function completeBlock(userId: string, date: string, blockId: string, pointResult: PointResult) {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const recordRef = doc(db, 'users', userId, 'dailyRecords', date);
    const completionRef = doc(db, 'users', userId, 'dailyRecords', date, 'completions', blockId);

    const userSnap = await transaction.get(userRef);
    const recordSnap = await transaction.get(recordRef);

    const currentPoints = userSnap.data()!.currentPoints;
    const earnedToday = recordSnap.data()!.totalPointsEarned;

    // 완료 기록 업데이트
    transaction.update(completionRef, {
      completed: true,
      completedAt: Timestamp.now(),
      pointsEarned: pointResult.base + pointResult.timeBonus,
      bonusPoints: pointResult.streakBonus + pointResult.consecutiveBonus,
    });

    // 일별 기록 업데이트
    transaction.update(recordRef, {
      totalPointsEarned: earnedToday + pointResult.total,
    });

    // 사용자 포인트 업데이트
    transaction.update(userRef, {
      currentPoints: currentPoints + pointResult.total,
      totalPointsLifetime: userSnap.data()!.totalPointsLifetime + pointResult.total,
      totalBlocksCompleted: userSnap.data()!.totalBlocksCompleted + 1,
    });
  });
}
```

### 3. 보상 상점

#### 기본 보상 목록

```typescript
// constants/rewards.ts
export const DEFAULT_REWARDS = [
  // 활동 보상
  { name: "게임 1시간", icon: "🎮", cost: 30, category: "activity",
    description: "자유/미할당 블록에 게임 시간 배치", cooldownHours: 0, dailyLimit: -1 },
  { name: "SNS 30분", icon: "📱", cost: 15, category: "activity",
    description: "SNS 자유 이용 30분", cooldownHours: 0, dailyLimit: -1 },
  { name: "영화 감상", icon: "🎬", cost: 45, category: "activity",
    description: "영화 1편 감상 허용", cooldownHours: 0, dailyLimit: 1 },
  { name: "유튜브 1시간", icon: "📺", cost: 25, category: "activity",
    description: "유튜브 자유 시청", cooldownHours: 0, dailyLimit: -1 },

  // 블록 전환 보상
  { name: "블록 전환권", icon: "🔄", cost: 40, category: "convert",
    description: "공부/운동 블록 → 자유 블록 전환", cooldownHours: 0, dailyLimit: 2 },
  { name: "블록 단축권", icon: "⏱️", cost: 20, category: "convert",
    description: "블록 30분 단축", cooldownHours: 0, dailyLimit: 3 },

  // 음식 보상
  { name: "배달음식", icon: "🍕", cost: 50, category: "food",
    description: "배달음식 시켜먹기 허용", cooldownHours: 24, dailyLimit: 1 },
  { name: "간식 타임", icon: "🍫", cost: 15, category: "food",
    description: "간식 구매 허용", cooldownHours: 0, dailyLimit: -1 },
  { name: "카페 음료", icon: "☕", cost: 10, category: "food",
    description: "카페 음료 구매 허용", cooldownHours: 0, dailyLimit: -1 },

  // 휴식 보상
  { name: "늦잠 30분", icon: "😴", cost: 25, category: "rest",
    description: "다음 날 기상 30분 연장", cooldownHours: 24, dailyLimit: 1 },
  { name: "낮잠 허용", icon: "💤", cost: 20, category: "rest",
    description: "30분 낮잠 허용", cooldownHours: 0, dailyLimit: 1 },

  // 특별 보상
  { name: "하루 자유권", icon: "🏖️", cost: 200, category: "special",
    description: "내일 하루 전체 자유", cooldownHours: 168, dailyLimit: 1 },
];
```

#### 상점 화면 (`app/(tabs)/shop.tsx`)

- 상단: 현재 보유 포인트 (큰 뱃지)
- 카테고리 탭 필터: 전체 / 활동 / 전환 / 음식 / 휴식 / 특별
- 각 보상 카드:
  - 아이콘, 이름, 설명
  - 필요 포인트
  - 구매 버튼 (포인트 부족 시 비활성)
  - 쿨다운/일일 한도 표시
- 구매 시 확인 모달 → 구매 완료 애니메이션
- 하단: 오늘 구매한 보상 목록 (사용/미사용 상태)

#### 보상 구매 처리 (트랜잭션)

```typescript
async function purchaseReward(userId: string, date: string, reward: Reward) {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await transaction.get(userRef);
    const currentPoints = userSnap.data()!.currentPoints;

    // 포인트 잔액 검증
    if (currentPoints < reward.cost) {
      throw new Error('포인트가 부족합니다');
    }

    // 일일 한도 검증은 트랜잭션 밖에서 미리 확인

    // 구매 기록 생성
    const purchaseRef = doc(collection(db, 'users', userId, 'dailyRecords', date, 'purchases'));
    transaction.set(purchaseRef, {
      rewardId: reward.id,
      rewardName: reward.name,
      rewardIcon: reward.icon,
      pointsSpent: reward.cost,
      purchasedAt: Timestamp.now(),
      used: false,
      usedAt: null,
    });

    // 포인트 차감
    transaction.update(userRef, {
      currentPoints: currentPoints - reward.cost,
    });

    // 일별 기록 지출 업데이트
    const recordRef = doc(db, 'users', userId, 'dailyRecords', date);
    const recordSnap = await transaction.get(recordRef);
    transaction.update(recordRef, {
      totalPointsSpent: recordSnap.data()!.totalPointsSpent + reward.cost,
    });
  });
}
```

#### 커스텀 보상 추가

- 사용자가 직접 보상 추가 가능 (이름, 아이콘, 포인트, 설명, 카테고리)
- `isCustom: true`로 저장
- 설정에서 기존 보상 포인트 가격 조정 가능
- 웹 대시보드에서도 편집 가능 (Firebase 공유)

### 4. 블록 전환 시스템

보상 상점에서 "블록 전환권"을 구매하면:

1. 시간표 화면에서 전환할 블록 선택 (공부/운동 등 포인트가 있는 블록만)
2. 해당 블록의 완료 기록을 업데이트:
   - `blockType` → `"free"`로 변경
   - `pointsEarned` → 0으로 변경
   - 전환 표시 플래그 추가
3. UI에서 전환된 블록은 배지("전환됨")로 시각 구분
4. 하루 전환 횟수는 "블록 전환권"의 `dailyLimit`으로 제한

### 5. 알림 시스템

```typescript
// services/notification.ts

// 1. 블록 시작 알림
//    각 블록 시작 N분 전 (설정값)
//    "05:25 — 곧 '샤워' 시간입니다! 준비하세요 🚿"

// 2. 블록 종료 알림
//    블록 종료 시각
//    "06:15 — '샤워' 끝! 완료 체크하고 5P 받으세요 ✅"

// 3. 미완료 리마인더
//    블록 종료 후 10분 뒤에도 미체크 시
//    "아직 '영어 공부' 완료 체크를 안 했어요!"

// 4. 아침 브리핑 알림
//    기상 시간
//    "오늘도 화이팅! 총 160P를 모을 수 있어요 💪"

// 5. 스트릭 유지 알림
//    저녁 시간대에 미완료 블록이 있으면
//    "오늘 3블록만 더 완료하면 7일 연속 달성! 🔥"
```

- expo-notifications로 로컬 알림 스케줄링
- 매일 앱 실행 시 (또는 시간표 변경 시) 알림 재스케줄링
- 알림 종류별 개별 ON/OFF 설정 가능
- DND(방해금지) 시간대 설정

### 6. 통계 & 리포트 (`app/(tabs)/stats.tsx`)

#### 오늘 통계

- 원형 프로그레스: 오늘 달성률 (%)
- 카테고리별 달성률 바 차트
- 획득/사용 포인트 요약
- 완료한 보상 목록

#### 주간 통계

- 요일별 달성률 막대 그래프 (월~일)
- 주간 총 포인트 획득/사용
- 가장 잘 지킨 블록 타입 / 가장 못 지킨 블록 타입
- 연속 달성일 (스트릭) 표시

#### 월간 통계

- 캘린더 히트맵 (날짜별 달성률 색상)
- 월간 총 포인트 흐름 그래프
- 카테고리별 월간 달성 비교

#### Firestore 쿼리 전략 (통계용)

```typescript
// 주간 데이터 조회 — 최근 7일의 dailyRecords만 가져오면 됨
const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
const today = format(new Date(), 'yyyy-MM-dd');

const q = query(
  collection(db, 'users', userId, 'dailyRecords'),
  where('date', '>=', weekAgo),
  where('date', '<=', today),
  orderBy('date')
);

// 각 dailyRecord의 completionRate, totalPointsEarned 등을 활용
// 상세 블록별 통계가 필요하면 completions 서브컬렉션도 조회
```

### 7. 설정 (`app/(tabs)/settings.tsx`)

- **계정**: 로그인 정보, 로그아웃
- **기본 설정**: 이름, 기본 템플릿 선택, 요일별 템플릿 배정
- **포인트 설정**: 블록 타입별 기본 포인트 조정, 보너스 배수, 패널티 ON/OFF, 지각 허용 범위
- **알림 설정**: 종류별 ON/OFF, 사전 알림 시간, DND 시간대
- **보상 관리**: 기본 보상 가격 조정, 커스텀 보상 추가/편집/삭제
- **데이터**: 계정 삭제, 데이터 초기화

---

## 🎨 디자인 가이드라인

### 색상 체계

```typescript
// constants/theme.ts
export const COLORS = {
  // 브랜드
  primary: '#6366f1',       // 인디고 (메인)
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  // 포인트
  point: '#f59e0b',         // 앰버 (포인트/골드)
  pointLight: '#fbbf24',
  pointDark: '#d97706',

  // 블록 타입 색상
  block: {
    routine: '#6366f1',     // 인디고
    study: '#0891b2',       // 시안
    exercise: '#16a34a',    // 그린
    work: '#ea580c',        // 오렌지
    free: '#8b5cf6',        // 바이올렛
    unassigned: '#94a3b8',  // 슬레이트
    rest: '#64748b',        // 그레이
    meal: '#d97706',        // 앰버
  },

  // 시맨틱
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // 뉴트럴
  bg: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
};
```

### 디자인 원칙

- **깔끔한 카드 기반 UI**: 각 블록은 둥근 카드로 표현, 그림자 최소화
- **타임라인 레이아웃**: 왼쪽에 시간, 중앙에 점선 타임라인, 오른쪽에 블록 카드
- **색상으로 구분**: 각 블록 타입마다 고유 색상, 왼쪽 보더 또는 아이콘 배경색
- **애니메이션**: 완료 시 체크 애니메이션 + 포인트 팝업, 보상 구매 시 반짝 이펙트
- **다크 모드**: 추후 대응 (색상 토큰 기반)

---

## ⚙️ 구현 우선순위

### Phase 1 — 프로젝트 세팅 & 인증
1. Expo 프로젝트 초기화 + TypeScript + 폴더 구조
2. Firebase 프로젝트 생성 + 앱 연동 + Firestore 오프라인 캐시 설정
3. Firebase Auth 설정 (이메일/비밀번호)
4. 로그인/회원가입 화면
5. Auth 상태 관리 (useAuthStore) + 라우트 가드
6. 탭 네비게이션 (시간표 / 상점 / 통계 / 설정)

### Phase 2 — 시간표 코어
7. Firestore 보안 규칙 배포
8. Repository 패턴 세팅 (scheduleRepo, pointRepo)
9. 온보딩 플로우 (기본 템플릿 + 블록 + 보상 자동 생성)
10. 시간표 메인 화면 (타임라인 UI)
11. 블록 완료 처리 (트랜잭션 + 포인트 계산)
12. 실시간 리스너 (completions onSnapshot)
13. 매일 dailyRecord 자동 생성 로직

### Phase 3 — 보상 시스템
14. 보상 상점 화면 + 카테고리 필터
15. 보상 구매 처리 (트랜잭션)
16. 구매 내역 표시
17. 블록 전환 기능
18. 커스텀 보상 추가/편집

### Phase 4 — 시간표 편집
19. 시간표 생성/편집 화면
20. 템플릿 관리 (생성, 복제, 삭제)
21. 요일별 템플릿 자동 배정
22. 블록 드래그 앤 드롭 정렬

### Phase 5 — 알림 & 통계
23. expo-notifications 설정 + 권한 요청
24. 블록 시작/종료/리마인더 알림 스케줄링
25. 오늘 통계 화면
26. 주간/월간 통계 + 차트
27. 스트릭 시스템

### Phase 6 — 웹 대시보드 (별도 프로젝트)
28. Next.js 프로젝트 세팅 + Firebase 동일 프로젝트 연동
29. 웹 로그인 (Firebase Auth)
30. 시간표 템플릿 편집기 (드래그 앤 드롭)
31. 보상 관리 페이지
32. 통계 대시보드

### Phase 7 — 폴리싱
33. 애니메이션 개선 (reanimated)
34. 햅틱 피드백
35. Google 로그인 추가
36. 다크 모드
37. 앱 아이콘 / 스플래시 스크린

---

## 🚨 중요 규칙 및 주의사항

1. **TypeScript strict 모드 사용** — `any` 타입 금지
2. **모든 Firestore 접근은 Repository를 통해서만** — 컴포넌트/Store에서 Firestore 직접 호출 금지
3. **포인트 변경은 반드시 `runTransaction`** — 동시성 문제 방지 (포인트 중복 획득/이중 구매 방지)
4. **Firestore 오프라인 캐시 반드시 활성화** — 오프라인에서도 즉시 반응
5. **비정규화 데이터 일관성 유지** — completions에 복사된 블록 정보는 템플릿 수정 시 이미 생성된 dailyRecord에는 영향 없음 (의도된 동작)
6. **시간은 항상 "HH:mm" 문자열** — Firestore Timestamp와 구분하여 사용
7. **포인트는 음수가 될 수 없음** — 구매 전 트랜잭션 내에서 잔액 검증 필수
8. **블록 시간 겹침 금지** — 생성/편집 시 유효성 검사
9. **일별 기록(dailyRecords)의 문서 ID는 "YYYY-MM-DD" 형식** — 날짜로 직접 조회 가능
10. **성능**: FlatList 사용, 불필요한 리렌더 방지 (React.memo, useCallback), Firestore 쿼리 최소화
11. **보안 규칙**: 사용자는 자기 데이터만 접근 가능 (위 규칙 참고)

---

## 📝 코드 컨벤션

- 컴포넌트: PascalCase (`TimeBlock.tsx`)
- 함수/변수: camelCase (`calculatePoints`)
- 상수: UPPER_SNAKE_CASE (`MAX_STREAK_BONUS`)
- 타입/인터페이스: PascalCase, `I` 접두사 없이 (`TimeBlock`, `Reward`)
- Repository: camelCase 파일명 (`scheduleRepo.ts`)
- 파일명: 컴포넌트는 PascalCase, 나머지는 camelCase
- 주석: 한국어로 핵심 로직 설명
- 커밋 메시지: 한국어 (예: "feat: 시간표 메인 화면 구현")

---

위 명세를 기반으로 Phase 1부터 순서대로 구현을 시작해줘.
각 Phase가 완료될 때마다 다음 Phase를 진행하고, 중간에 파일 구조와 진행 상황을 요약해줘.
