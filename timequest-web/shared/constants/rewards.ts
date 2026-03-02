// 기본 보상 목록 — 스펙에 정의된 12개 보상
import { Reward } from '@/types';

/** 기본 보상 항목 타입 (id, createdAt, isActive, sortOrder, isCustom 제외) */
type DefaultRewardItem = Omit<Reward, 'id' | 'createdAt' | 'isActive' | 'sortOrder' | 'isCustom'>;

/** 앱 초기화 시 사용할 기본 보상 목록 (12개) */
export const DEFAULT_REWARDS: DefaultRewardItem[] = [
  // 활동 보상
  {
    name: '게임 1시간',
    icon: '🎮',
    cost: 30,
    category: 'activity',
    description: '자유/미할당 블록에 게임 시간 배치',
    cooldownHours: 0,
    dailyLimit: -1,
  },
  {
    name: 'SNS 30분',
    icon: '📱',
    cost: 15,
    category: 'activity',
    description: 'SNS 자유 이용 30분',
    cooldownHours: 0,
    dailyLimit: -1,
  },
  {
    name: '영화 감상',
    icon: '🎬',
    cost: 45,
    category: 'activity',
    description: '영화 1편 감상 허용',
    cooldownHours: 0,
    dailyLimit: 1,
  },
  {
    name: '유튜브 1시간',
    icon: '📺',
    cost: 25,
    category: 'activity',
    description: '유튜브 자유 시청',
    cooldownHours: 0,
    dailyLimit: -1,
  },

  // 블록 전환 보상
  {
    name: '블록 전환권',
    icon: '🔄',
    cost: 40,
    category: 'convert',
    description: '공부/운동 블록 → 자유 블록 전환',
    cooldownHours: 0,
    dailyLimit: 2,
  },
  {
    name: '블록 단축권',
    icon: '⏱️',
    cost: 20,
    category: 'convert',
    description: '블록 30분 단축',
    cooldownHours: 0,
    dailyLimit: 3,
  },

  // 음식 보상
  {
    name: '배달음식',
    icon: '🍕',
    cost: 50,
    category: 'food',
    description: '배달음식 시켜먹기 허용',
    cooldownHours: 24,
    dailyLimit: 1,
  },
  {
    name: '간식 타임',
    icon: '🍫',
    cost: 15,
    category: 'food',
    description: '간식 구매 허용',
    cooldownHours: 0,
    dailyLimit: -1,
  },
  {
    name: '카페 음료',
    icon: '☕',
    cost: 10,
    category: 'food',
    description: '카페 음료 구매 허용',
    cooldownHours: 0,
    dailyLimit: -1,
  },

  // 휴식 보상
  {
    name: '늦잠 30분',
    icon: '😴',
    cost: 25,
    category: 'rest',
    description: '다음 날 기상 30분 연장',
    cooldownHours: 24,
    dailyLimit: 1,
  },
  {
    name: '낮잠 허용',
    icon: '💤',
    cost: 20,
    category: 'rest',
    description: '30분 낮잠 허용',
    cooldownHours: 0,
    dailyLimit: 1,
  },

  // 특별 보상
  {
    name: '하루 자유권',
    icon: '🏖️',
    cost: 200,
    category: 'special',
    description: '내일 하루 전체 자유',
    cooldownHours: 168,
    dailyLimit: 1,
  },
];
