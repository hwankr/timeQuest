// 시간 유효성 검사 — 순수 함수, Firebase 의존성 없음
// "HH:mm" 형식 시간 문자열 검증 및 블록 겹침 감지

import { parseTime } from './time';
import { TimeBlock } from '@/types';

// ─────────────────────────────────────────────
// 단일 시간 검증
// ─────────────────────────────────────────────

/** "HH:mm" 형식인지 확인 (00:00 ~ 23:59) */
export function isValidTimeFormat(time: string): boolean {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match !== null;
}

/** startTime이 endTime보다 이전인지 확인 (같으면 false) */
export function isStartBeforeEnd(startTime: string, endTime: string): boolean {
  return parseTime(startTime) < parseTime(endTime);
}

// ─────────────────────────────────────────────
// 블록 겹침 감지
// ─────────────────────────────────────────────

/**
 * 두 블록이 겹치는지 확인 — 반개방 구간 [start, end) 사용
 * [09:00, 10:00)과 [10:00, 11:00)은 겹치지 않는다.
 */
export function hasTimeOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const aS = parseTime(aStart);
  const aE = parseTime(aEnd);
  const bS = parseTime(bStart);
  const bE = parseTime(bEnd);
  // 겹침: aS < bE AND bS < aE
  return aS < bE && bS < aE;
}

/**
 * 새 블록이 기존 블록 목록과 겹치는지 확인
 * excludeId를 전달하면 해당 블록은 비교에서 제외 (수정 시 자기 자신 제외)
 */
export function findOverlappingBlock(
  newStart: string,
  newEnd: string,
  existingBlocks: TimeBlock[],
  excludeId?: string,
): TimeBlock | undefined {
  return existingBlocks.find((block) => {
    if (excludeId && block.id === excludeId) return false;
    return hasTimeOverlap(newStart, newEnd, block.startTime, block.endTime);
  });
}

// ─────────────────────────────────────────────
// 블록 데이터 종합 검증
// ─────────────────────────────────────────────

export interface BlockValidationError {
  field: 'startTime' | 'endTime' | 'taskName' | 'basePoints' | 'overlap';
  message: string;
}

/**
 * 블록 필드 유효성 전체 검사
 * 오류가 없으면 빈 배열 반환
 */
export function validateBlockFields(
  startTime: string,
  endTime: string,
  taskName: string,
  basePoints: number,
  existingBlocks: TimeBlock[],
  excludeId?: string,
): BlockValidationError[] {
  const errors: BlockValidationError[] = [];

  if (!isValidTimeFormat(startTime)) {
    errors.push({ field: 'startTime', message: '시작 시간 형식이 올바르지 않습니다 (HH:mm)' });
  }

  if (!isValidTimeFormat(endTime)) {
    errors.push({ field: 'endTime', message: '종료 시간 형식이 올바르지 않습니다 (HH:mm)' });
  }

  if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
    if (!isStartBeforeEnd(startTime, endTime)) {
      errors.push({ field: 'endTime', message: '종료 시간은 시작 시간보다 이후여야 합니다' });
    } else {
      const overlapping = findOverlappingBlock(startTime, endTime, existingBlocks, excludeId);
      if (overlapping) {
        errors.push({
          field: 'overlap',
          message: `"${overlapping.taskName}" 블록과 시간이 겹칩니다 (${overlapping.startTime}~${overlapping.endTime})`,
        });
      }
    }
  }

  if (!taskName.trim()) {
    errors.push({ field: 'taskName', message: '작업 이름을 입력해주세요' });
  }

  if (!Number.isFinite(basePoints) || basePoints < 0) {
    errors.push({ field: 'basePoints', message: '포인트는 0 이상의 숫자여야 합니다' });
  }

  return errors;
}
