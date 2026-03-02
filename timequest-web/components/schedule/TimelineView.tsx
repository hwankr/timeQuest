'use client';

// 24시간 타임라인 시각화 — 블록 배치 미리보기
import { TimeBlock, BlockType } from '@/types';
import { parseTime } from '@/utils/time';
import { hasTimeOverlap } from '@/utils/timeValidation';
import { BLOCK_TYPES } from '@/constants/blockTypes';

// 블록 타입별 CSS 변수
const BLOCK_COLOR_VAR: Record<BlockType, string> = {
  routine: 'var(--color-block-routine)',
  study: 'var(--color-block-study)',
  exercise: 'var(--color-block-exercise)',
  work: 'var(--color-block-work)',
  free: 'var(--color-block-free)',
  unassigned: 'var(--color-block-unassigned)',
  rest: 'var(--color-block-rest)',
  meal: 'var(--color-block-meal)',
};

const TOTAL_MINUTES = 24 * 60;
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

interface TimelineViewProps {
  blocks: TimeBlock[];
}

// 겹침 영역 감지
function findOverlaps(blocks: TimeBlock[]): { start: number; end: number }[] {
  const overlaps: { start: number; end: number }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (hasTimeOverlap(blocks[i].startTime, blocks[i].endTime, blocks[j].startTime, blocks[j].endTime)) {
        const overlapStart = Math.max(parseTime(blocks[i].startTime), parseTime(blocks[j].startTime));
        const overlapEnd = Math.min(parseTime(blocks[i].endTime), parseTime(blocks[j].endTime));
        overlaps.push({ start: overlapStart, end: overlapEnd });
      }
    }
  }
  return overlaps;
}

export function TimelineView({ blocks }: TimelineViewProps) {
  const overlaps = findOverlaps(blocks);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h4 className="mb-3 text-xs font-medium text-[var(--color-text-secondary)]">
        타임라인 미리보기
      </h4>

      {/* 타임라인 바 */}
      <div className="relative h-8 w-full rounded bg-[var(--color-bg)] overflow-hidden">
        {/* 블록 세그먼트 */}
        {blocks.map((block) => {
          const startMin = parseTime(block.startTime);
          const endMin = parseTime(block.endTime);
          const left = (startMin / TOTAL_MINUTES) * 100;
          const width = ((endMin - startMin) / TOTAL_MINUTES) * 100;
          const colorVar = block.color || BLOCK_COLOR_VAR[block.blockType];

          return (
            <div
              key={block.id}
              className="absolute top-0 h-full opacity-80 hover:opacity-100 transition-opacity"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.3)}%`,
                backgroundColor: colorVar,
              }}
              title={`${block.taskName} (${block.startTime}~${block.endTime}) — ${BLOCK_TYPES[block.blockType].label}`}
            />
          );
        })}

        {/* 겹침 영역 (빨간색 경고) */}
        {overlaps.map((overlap, idx) => {
          const left = (overlap.start / TOTAL_MINUTES) * 100;
          const width = ((overlap.end - overlap.start) / TOTAL_MINUTES) * 100;
          return (
            <div
              key={`overlap-${idx}`}
              className="absolute top-0 h-full"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.3)}%`,
                backgroundColor: 'var(--color-error)',
                opacity: 0.6,
              }}
              title="시간 겹침 경고"
            />
          );
        })}
      </div>

      {/* 시간 라벨 */}
      <div className="relative mt-1 h-4 w-full">
        {HOUR_LABELS.map((hour) => (
          <span
            key={hour}
            className="absolute text-[9px] text-[var(--color-text-tertiary)] -translate-x-1/2"
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            {hour}
          </span>
        ))}
      </div>

      {/* 겹침 경고 메시지 */}
      {overlaps.length > 0 && (
        <p className="mt-2 text-xs text-[var(--color-error)]">
          {overlaps.length}개 시간 겹침이 있습니다
        </p>
      )}
    </div>
  );
}
