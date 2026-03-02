// 블록 타입 메타데이터 — 라벨, 아이콘, 색상, 기본 포인트
import { BlockType } from '@/types';
import { COLORS } from './theme';

/** 블록 타입 메타데이터 구조 */
export interface BlockTypeInfo {
  type: BlockType;
  /** 한국어 라벨 */
  label: string;
  /** Ionicons 아이콘 이름 */
  icon: string;
  color: string;
  /** 완료 시 기본 지급 포인트 */
  defaultPoints: number;
}

/** 8개 블록 타입 메타데이터 맵 */
export const BLOCK_TYPES: Record<BlockType, BlockTypeInfo> = {
  routine: {
    type: 'routine',
    label: '루틴',
    icon: 'repeat-outline',
    color: COLORS.block.routine,
    defaultPoints: 5,
  },
  study: {
    type: 'study',
    label: '공부',
    icon: 'book-outline',
    color: COLORS.block.study,
    defaultPoints: 15,
  },
  exercise: {
    type: 'exercise',
    label: '운동',
    icon: 'barbell-outline',
    color: COLORS.block.exercise,
    defaultPoints: 20,
  },
  work: {
    type: 'work',
    label: '업무',
    icon: 'briefcase-outline',
    color: COLORS.block.work,
    defaultPoints: 25,
  },
  free: {
    type: 'free',
    label: '자유',
    icon: 'happy-outline',
    color: COLORS.block.free,
    defaultPoints: 0,
  },
  unassigned: {
    type: 'unassigned',
    label: '미할당',
    icon: 'help-circle-outline',
    color: COLORS.block.unassigned,
    defaultPoints: 0,
  },
  rest: {
    type: 'rest',
    label: '휴식',
    icon: 'bed-outline',
    color: COLORS.block.rest,
    defaultPoints: 0,
  },
  meal: {
    type: 'meal',
    label: '식사',
    icon: 'restaurant-outline',
    color: COLORS.block.meal,
    defaultPoints: 5,
  },
};
