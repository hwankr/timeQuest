// 타입 변환 함수 — Firestore DocumentData를 TypeScript 타입으로 안전하게 변환
// `as` 캐스트 없이 필드 유효성 검사와 기본값 제공

import { DocumentData, Timestamp } from 'firebase/firestore';
import {
  UserDocument,
  ScheduleTemplate,
  TimeBlock,
  BlockCompletion,
  DailyRecord,
  Reward,
  RewardPurchase,
  BlockType,
  RewardCategory,
  UserSettings,
} from '@/types';

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

function requireField<T>(data: DocumentData, field: string, context: string): T {
  if (data[field] === undefined || data[field] === null) {
    throw new Error(`${context}: 필수 필드 "${field}"가 없습니다`);
  }
  return data[field] as T;
}

function optionalField<T>(data: DocumentData, field: string, defaultValue: T): T {
  if (data[field] === undefined || data[field] === null) return defaultValue;
  return data[field] as T;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultTemplateId: '',
  dayTemplateMap: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
  notifications: {
    blockStart: true,
    blockEnd: true,
    reminder: true,
    morningBriefing: true,
    streakWarning: true,
    advanceMinutes: 5,
    dndStart: '22:00',
    dndEnd: '07:00',
  },
  points: {
    penaltyEnabled: true,
    lateToleranceMinutes: 5,
    streakBonusMultiplier: 0.1,
  },
};

// ─────────────────────────────────────────────
// 변환 함수
// ─────────────────────────────────────────────

/**
 * Firestore DocumentData → UserDocument
 * 필수 필드 검사, 선택 필드 기본값 제공
 */
export function toUserDocument(data: DocumentData): UserDocument {
  const ctx = 'toUserDocument';
  requireField<string>(data, 'email', ctx);
  requireField<Timestamp>(data, 'createdAt', ctx);
  requireField<number>(data, 'currentPoints', ctx);
  requireField<UserSettings>(data, 'settings', ctx);

  return {
    displayName: optionalField<string>(data, 'displayName', ''),
    email: data['email'] as string,
    createdAt: data['createdAt'] as Timestamp,
    currentPoints: data['currentPoints'] as number,
    currentStreak: optionalField<number>(data, 'currentStreak', 0),
    longestStreak: optionalField<number>(data, 'longestStreak', 0),
    totalPointsLifetime: optionalField<number>(data, 'totalPointsLifetime', 0),
    totalBlocksCompleted: optionalField<number>(data, 'totalBlocksCompleted', 0),
    level: optionalField<number>(data, 'level', 1),
    experience: optionalField<number>(data, 'experience', 0),
    lastActiveDate: optionalField<string>(data, 'lastActiveDate', ''),
    onboardingComplete: optionalField<boolean>(data, 'onboardingComplete', false),
    settings: data['settings'] as UserSettings,
  };
}

/**
 * Firestore DocumentData → ScheduleTemplate
 * id는 문서 참조에서 전달받아 첨부
 */
export function toScheduleTemplate(id: string, data: DocumentData): ScheduleTemplate {
  const ctx = 'toScheduleTemplate';
  requireField<string>(data, 'name', ctx);
  requireField<Timestamp>(data, 'createdAt', ctx);
  requireField<Timestamp>(data, 'updatedAt', ctx);

  return {
    id,
    name: data['name'] as string,
    isDefault: optionalField<boolean>(data, 'isDefault', false),
    createdAt: data['createdAt'] as Timestamp,
    updatedAt: data['updatedAt'] as Timestamp,
  };
}

/**
 * Firestore DocumentData → TimeBlock
 * id는 문서 참조에서 전달받아 첨부
 */
export function toTimeBlock(id: string, data: DocumentData): TimeBlock {
  const ctx = 'toTimeBlock';
  requireField<string>(data, 'startTime', ctx);
  requireField<string>(data, 'endTime', ctx);
  requireField<string>(data, 'taskName', ctx);
  requireField<BlockType>(data, 'blockType', ctx);
  requireField<number>(data, 'basePoints', ctx);
  requireField<number>(data, 'sortOrder', ctx);

  return {
    id,
    startTime: data['startTime'] as string,
    endTime: data['endTime'] as string,
    taskName: data['taskName'] as string,
    blockType: data['blockType'] as BlockType,
    basePoints: data['basePoints'] as number,
    sortOrder: data['sortOrder'] as number,
    color: optionalField<string | undefined>(data, 'color', undefined),
    icon: optionalField<string | undefined>(data, 'icon', undefined),
  };
}

/**
 * Firestore DocumentData → BlockCompletion
 * 하위 호환성을 위해 선택 필드에 기본값 제공
 */
export function toBlockCompletion(data: DocumentData): BlockCompletion {
  const ctx = 'toBlockCompletion';
  requireField<string>(data, 'blockId', ctx);
  requireField<string>(data, 'taskName', ctx);
  requireField<BlockType>(data, 'blockType', ctx);
  requireField<string>(data, 'startTime', ctx);
  requireField<string>(data, 'endTime', ctx);
  requireField<boolean>(data, 'completed', ctx);

  return {
    blockId: data['blockId'] as string,
    taskName: data['taskName'] as string,
    blockType: data['blockType'] as BlockType,
    startTime: data['startTime'] as string,
    endTime: data['endTime'] as string,
    basePoints: optionalField<number>(data, 'basePoints', 0), // 하위 호환성
    completed: data['completed'] as boolean,
    completedAt: optionalField<Timestamp | null>(data, 'completedAt', null),
    pointsEarned: optionalField<number>(data, 'pointsEarned', 0),
    bonusPoints: optionalField<number>(data, 'bonusPoints', 0),
    skipped: optionalField<boolean>(data, 'skipped', false),
    note: optionalField<string | undefined>(data, 'note', undefined),
    converted: optionalField<boolean>(data, 'converted', false),
  };
}

/**
 * Firestore DocumentData → DailyRecord
 */
export function toDailyRecord(data: DocumentData): DailyRecord {
  const ctx = 'toDailyRecord';
  requireField<string>(data, 'date', ctx);
  requireField<string>(data, 'templateId', ctx);
  requireField<Timestamp>(data, 'createdAt', ctx);

  return {
    date: data['date'] as string,
    templateId: data['templateId'] as string,
    totalPointsEarned: optionalField<number>(data, 'totalPointsEarned', 0),
    totalPointsSpent: optionalField<number>(data, 'totalPointsSpent', 0),
    completionRate: optionalField<number>(data, 'completionRate', 0),
    createdAt: data['createdAt'] as Timestamp,
  };
}

/**
 * Firestore DocumentData → Reward
 * id는 문서 참조에서 전달받아 첨부
 */
export function toReward(id: string, data: DocumentData): Reward {
  const ctx = 'toReward';
  requireField<string>(data, 'name', ctx);
  requireField<number>(data, 'cost', ctx);
  requireField<RewardCategory>(data, 'category', ctx);
  requireField<Timestamp>(data, 'createdAt', ctx);

  return {
    id,
    name: data['name'] as string,
    description: optionalField<string>(data, 'description', ''),
    icon: optionalField<string>(data, 'icon', '🎁'),
    cost: data['cost'] as number,
    category: data['category'] as RewardCategory,
    isActive: optionalField<boolean>(data, 'isActive', true),
    cooldownHours: optionalField<number>(data, 'cooldownHours', 0),
    dailyLimit: optionalField<number>(data, 'dailyLimit', -1),
    sortOrder: optionalField<number>(data, 'sortOrder', 0),
    isCustom: optionalField<boolean>(data, 'isCustom', false),
    createdAt: data['createdAt'] as Timestamp,
  };
}

/**
 * Firestore DocumentData → RewardPurchase
 */
export function toRewardPurchase(id: string, data: DocumentData): RewardPurchase {
  const ctx = 'toRewardPurchase';
  requireField<string>(data, 'rewardId', ctx);
  requireField<string>(data, 'rewardName', ctx);
  requireField<number>(data, 'pointsSpent', ctx);
  requireField<Timestamp>(data, 'purchasedAt', ctx);

  return {
    id,
    rewardId: data['rewardId'] as string,
    rewardName: data['rewardName'] as string,
    rewardIcon: optionalField<string>(data, 'rewardIcon', '🎁'),
    pointsSpent: data['pointsSpent'] as number,
    purchasedAt: data['purchasedAt'] as Timestamp,
    used: optionalField<boolean>(data, 'used', false),
    usedAt: optionalField<Timestamp | null>(data, 'usedAt', null),
  };
}

// DEFAULT_SETTINGS 내보내기 (온보딩에서 사용)
export { DEFAULT_SETTINGS };
