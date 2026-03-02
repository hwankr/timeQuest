// 기본 시간 블록 생성 유틸리티 — 기상/취침 시간을 기반으로 하루 블록 자동 생성
import { TimeBlock, BlockType } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { parseTime, formatTime } from './time';

/** 블록 정의 템플릿 (오프셋 기반) */
interface BlockTemplate {
  offsetMinutes: number;  // 기상 시간으로부터 오프셋(분)
  durationMinutes: number;
  taskName: string;
  blockType: BlockType;
}

/** 기상/취침 시간을 기반으로 하루 기본 블록 배열을 생성한다 */
export function generateDefaultBlocks(
  wakeUpTime: string,
  bedTime: string,
): Omit<TimeBlock, 'id'>[] {
  const wakeMinutes = parseTime(wakeUpTime);
  const bedMinutes = parseTime(bedTime);

  // 취침 시간은 기상 시간보다 나중이어야 한다 (같은 날 내)
  if (bedMinutes <= wakeMinutes) {
    throw new Error('취침 시간은 기상 시간보다 나중이어야 합니다');
  }

  const totalMinutes = bedMinutes - wakeMinutes;

  // 오프셋 기반 블록 템플릿 (기상 시간으로부터의 상대 시간)
  const templates: BlockTemplate[] = [
    { offsetMinutes: 0,    durationMinutes: 30,  taskName: '아침 루틴',  blockType: 'routine'  },
    { offsetMinutes: 30,   durationMinutes: 30,  taskName: '아침 식사',  blockType: 'meal'     },
    { offsetMinutes: 60,   durationMinutes: 120, taskName: '오전 공부',  blockType: 'study'    },
    { offsetMinutes: 180,  durationMinutes: 30,  taskName: '휴식',       blockType: 'free'     },
    { offsetMinutes: 210,  durationMinutes: 60,  taskName: '운동',       blockType: 'exercise' },
    { offsetMinutes: 270,  durationMinutes: 60,  taskName: '점심 식사',  blockType: 'meal'     },
    { offsetMinutes: 330,  durationMinutes: 180, taskName: '오후 업무',  blockType: 'work'     },
    { offsetMinutes: 510,  durationMinutes: 30,  taskName: '휴식',       blockType: 'free'     },
    { offsetMinutes: 540,  durationMinutes: 120, taskName: '저녁 공부',  blockType: 'study'    },
    { offsetMinutes: 660,  durationMinutes: 60,  taskName: '저녁 식사',  blockType: 'meal'     },
    { offsetMinutes: 720,  durationMinutes: -1,  taskName: '자유 시간',  blockType: 'free'     }, // -1 = 취침 30분 전까지
    { offsetMinutes: -30,  durationMinutes: 30,  taskName: '취침 루틴',  blockType: 'routine'  }, // 취침 30분 전
  ];

  const blocks: Omit<TimeBlock, 'id'>[] = [];
  let sortOrder = 0;

  for (const template of templates) {
    let startOffset: number;
    let endOffset: number;

    if (template.offsetMinutes === -30) {
      // 취침 30분 전 블록
      startOffset = totalMinutes - 30;
      endOffset = totalMinutes;
    } else if (template.durationMinutes === -1) {
      // 자유 시간: 이전 블록 끝 ~ 취침 30분 전
      startOffset = template.offsetMinutes;
      endOffset = totalMinutes - 30;
    } else {
      startOffset = template.offsetMinutes;
      endOffset = template.offsetMinutes + template.durationMinutes;
    }

    // 범위 유효성 검사 — 범위를 벗어나면 스킵
    if (startOffset < 0 || startOffset >= totalMinutes) continue;
    if (endOffset <= startOffset) continue;

    // 취침 시간을 초과하면 취침 시간에 맞춰 자름
    if (endOffset > totalMinutes) {
      endOffset = totalMinutes;
    }

    const startTime = formatTime(wakeMinutes + startOffset);
    const endTime = formatTime(wakeMinutes + endOffset);
    const blockType = template.blockType;

    blocks.push({
      startTime,
      endTime,
      taskName: template.taskName,
      blockType,
      basePoints: BLOCK_TYPES[blockType].defaultPoints,
      sortOrder,
    });

    sortOrder++;
  }

  return blocks;
}
