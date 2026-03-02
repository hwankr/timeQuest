'use client';

// 드래그 가능한 블록 아이템 — useSortable() 사용
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TimeBlock, BlockType } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';

// 블록 타입별 CSS 변수 매핑
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

interface BlockItemProps {
  block: TimeBlock;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

export function BlockItem({ block, onEdit, onDelete }: BlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = BLOCK_TYPES[block.blockType];
  const colorVar = block.color || BLOCK_COLOR_VAR[block.blockType];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition-shadow ${
        isDragging ? 'shadow-lg z-10' : 'shadow-sm'
      }`}
    >
      {/* 드래그 핸들 */}
      <button
        className="cursor-grab touch-none text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical size={16} />
      </button>

      {/* 블록 타입 색상 바 */}
      <div
        className="h-10 w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: colorVar }}
      />

      {/* 시간 */}
      <div className="flex flex-col items-center flex-shrink-0 w-24">
        <span className="text-xs font-mono text-[var(--color-text-primary)]">
          {block.startTime}
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">~</span>
        <span className="text-xs font-mono text-[var(--color-text-primary)]">
          {block.endTime}
        </span>
      </div>

      {/* 블록 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {block.taskName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: colorVar }}
          >
            {typeInfo.label}
          </span>
          {block.basePoints > 0 && (
            <span className="text-[10px] text-[var(--color-point)]">
              +{block.basePoints}pt
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(block)}
          className="rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-brand-primary)] transition-colors"
          aria-label="블록 편집"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-error)] transition-colors"
          aria-label="블록 삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
