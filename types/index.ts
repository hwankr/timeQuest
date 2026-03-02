// 전체 데이터 모델 타입 정의
// Firestore 데이터 구조와 일치하는 TypeScript 인터페이스

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// 유니온 타입
// ─────────────────────────────────────────────

/** 시간 블록 타입 (8가지) */
export type BlockType =
  | 'routine'
  | 'study'
  | 'exercise'
  | 'work'
  | 'free'
  | 'unassigned'
  | 'rest'
  | 'meal';

/** 보상 카테고리 (5가지) */
export type RewardCategory = 'activity' | 'convert' | 'food' | 'rest' | 'special';

/** 요일 (7가지) */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// ─────────────────────────────────────────────
// UserDocument 중첩 설정 인터페이스
// ─────────────────────────────────────────────

/** 알림 설정 */
export interface NotificationSettings {
  blockStart: boolean;
  blockEnd: boolean;
  reminder: boolean;
  morningBriefing: boolean;
  streakWarning: boolean;
  /** 사전 알림 분 (1, 5, 10) */
  advanceMinutes: number;
  /** 방해금지 시작 시각 — "22:00" 형식 */
  dndStart: string;
  /** 방해금지 종료 시각 — "07:00" 형식 */
  dndEnd: string;
}

/** 포인트 설정 */
export interface PointSettings {
  penaltyEnabled: boolean;
  /** 지각 허용 분 (기본 5) */
  lateToleranceMinutes: number;
  /** 스트릭 보너스 배수 (기본 0.1) */
  streakBonusMultiplier: number;
}

/** 요일별 템플릿 배정 맵 */
export interface DayTemplateMap {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

/** 사용자 설정 */
export interface UserSettings {
  defaultTemplateId: string;
  dayTemplateMap: DayTemplateMap;
  notifications: NotificationSettings;
  points: PointSettings;
}

// ─────────────────────────────────────────────
// 주요 데이터 모델 인터페이스
// ─────────────────────────────────────────────

/**
 * 사용자 루트 문서 — users/{userId}
 * 프로필, 누적 통계, 설정을 포함한다
 */
export interface UserDocument {
  // 프로필
  displayName: string;
  email: string;
  createdAt: Timestamp;

  // 누적 통계 — 집계 없이 즉시 읽을 수 있도록 문서에 직접 저장
  currentPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalPointsLifetime: number;
  totalBlocksCompleted: number;
  level: number;
  experience: number;
  /** 스트릭 계산용 마지막 활성 날짜 — "2026-03-01" 형식 */
  lastActiveDate: string;

  // 설정
  settings: UserSettings;
}

/**
 * 시간표 템플릿 — users/{userId}/templates/{templateId}
 */
export interface ScheduleTemplate {
  id: string;
  /** 템플릿 이름 — "평일", "주말", "시험기간" 등 */
  name: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 시간 블록 — users/{userId}/templates/{templateId}/blocks/{blockId}
 */
export interface TimeBlock {
  id: string;
  /** 시작 시각 — "HH:mm" 형식 */
  startTime: string;
  /** 종료 시각 — "HH:mm" 형식 */
  endTime: string;
  taskName: string;
  blockType: BlockType;
  /** 완료 시 기본 포인트 */
  basePoints: number;
  sortOrder: number;
  /** 커스텀 색상 (선택) */
  color?: string;
  /** 커스텀 아이콘 (선택) */
  icon?: string;
}

/**
 * 보상 — users/{userId}/rewards/{rewardId}
 */
export interface Reward {
  id: string;
  name: string;
  description: string;
  /** 이모지 아이콘 */
  icon: string;
  /** 필요 포인트 */
  cost: number;
  category: RewardCategory;
  isActive: boolean;
  /** 재구매 대기 시간 — 0이면 무제한 */
  cooldownHours: number;
  /** 일일 구매 한도 — -1이면 무제한 */
  dailyLimit: number;
  sortOrder: number;
  /** 사용자 생성 여부 */
  isCustom: boolean;
  createdAt: Timestamp;
}

/**
 * 일별 기록 — users/{userId}/dailyRecords/{date}
 * 문서 ID는 날짜 문자열 ("2026-03-01")
 */
export interface DailyRecord {
  /** 날짜 — "2026-03-01" 형식 */
  date: string;
  templateId: string;
  totalPointsEarned: number;
  totalPointsSpent: number;
  /** 달성률 (0~1) */
  completionRate: number;
  createdAt: Timestamp;
}

/**
 * 블록 완료 기록 — users/{userId}/dailyRecords/{date}/completions/{blockId}
 * 조회 편의를 위해 블록 정보를 비정규화하여 복사한다
 */
export interface BlockCompletion {
  /** time_blocks의 ID */
  blockId: string;
  /** 비정규화 — 블록 이름 */
  taskName: string;
  /** 비정규화 — 블록 타입 */
  blockType: BlockType;
  /** 비정규화 — 시작 시각 */
  startTime: string;
  /** 비정규화 — 종료 시각 */
  endTime: string;
  completed: boolean;
  completedAt: Timestamp | null;
  pointsEarned: number;
  bonusPoints: number;
  skipped: boolean;
  note?: string;
}

/**
 * 보상 구매 기록 — users/{userId}/dailyRecords/{date}/purchases/{purchaseId}
 */
export interface RewardPurchase {
  rewardId: string;
  /** 비정규화 — 보상 이름 */
  rewardName: string;
  /** 비정규화 — 보상 아이콘 */
  rewardIcon: string;
  pointsSpent: number;
  purchasedAt: Timestamp;
  used: boolean;
  usedAt: Timestamp | null;
}
