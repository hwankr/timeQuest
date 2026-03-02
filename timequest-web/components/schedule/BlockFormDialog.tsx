'use client';

// 블록 추가/편집 다이얼로그 — shadcn/ui 없이 직접 구현
import { useState, useEffect } from 'react';
import { TimeBlock, BlockType } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { validateBlockFields, BlockValidationError } from '@/utils/timeValidation';
import { X } from 'lucide-react';

interface BlockFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TimeBlock, 'id'>) => Promise<void>;
  existingBlocks: TimeBlock[];
  /** 편집 모드일 때 기존 블록 데이터 */
  editBlock?: TimeBlock | null;
}

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = Object.values(BLOCK_TYPES).map(
  (info) => ({ value: info.type, label: info.label }),
);

export function BlockFormDialog({
  isOpen,
  onClose,
  onSubmit,
  existingBlocks,
  editBlock,
}: BlockFormDialogProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [taskName, setTaskName] = useState('');
  const [blockType, setBlockType] = useState<BlockType>('study');
  const [basePoints, setBasePoints] = useState(15);
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');
  const [errors, setErrors] = useState<BlockValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editBlock;

  // 편집 모드일 때 기존 값으로 채우기
  useEffect(() => {
    if (editBlock) {
      setStartTime(editBlock.startTime);
      setEndTime(editBlock.endTime);
      setTaskName(editBlock.taskName);
      setBlockType(editBlock.blockType);
      setBasePoints(editBlock.basePoints);
      setColor(editBlock.color ?? '');
      setIcon(editBlock.icon ?? '');
    } else {
      // 추가 모드: 마지막 블록 종료 시간을 시작 시간으로
      const lastBlock = existingBlocks.length > 0
        ? existingBlocks[existingBlocks.length - 1]
        : null;
      setStartTime(lastBlock?.endTime ?? '09:00');
      // 1시간 후를 종료 시간으로
      if (lastBlock?.endTime) {
        const [h, m] = lastBlock.endTime.split(':').map(Number);
        const endH = Math.min(h + 1, 23);
        setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        setEndTime('10:00');
      }
      setTaskName('');
      setBlockType('study');
      setBasePoints(BLOCK_TYPES.study.defaultPoints);
      setColor('');
      setIcon('');
    }
    setErrors([]);
  }, [editBlock, existingBlocks, isOpen]);

  // 블록 타입 변경 시 기본 포인트 업데이트 (추가 모드일 때만)
  const handleBlockTypeChange = (newType: BlockType) => {
    setBlockType(newType);
    if (!isEditMode) {
      setBasePoints(BLOCK_TYPES[newType].defaultPoints);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const validationErrors = validateBlockFields(
      startTime,
      endTime,
      taskName,
      basePoints,
      existingBlocks,
      editBlock?.id,
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const sortOrder = editBlock
        ? editBlock.sortOrder
        : existingBlocks.length;

      await onSubmit({
        startTime,
        endTime,
        taskName: taskName.trim(),
        blockType,
        basePoints,
        sortOrder,
        ...(color ? { color } : {}),
        ...(icon ? { icon } : {}),
      });
      onClose();
    } catch {
      setErrors([{ field: 'taskName', message: '저장에 실패했습니다. 다시 시도해주세요' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined =>
    errors.find((e) => e.field === field)?.message;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 다이얼로그 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        {/* 헤더 */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {isEditMode ? '블록 편집' : '새 블록 추가'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                  getFieldError('startTime')
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-brand-primary)]'
                } bg-[var(--color-surface)] text-[var(--color-text-primary)]`}
              />
              {getFieldError('startTime') && (
                <p className="mt-1 text-xs text-[var(--color-error)]">{getFieldError('startTime')}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                  getFieldError('endTime')
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-brand-primary)]'
                } bg-[var(--color-surface)] text-[var(--color-text-primary)]`}
              />
              {getFieldError('endTime') && (
                <p className="mt-1 text-xs text-[var(--color-error)]">{getFieldError('endTime')}</p>
              )}
            </div>
          </div>

          {/* 겹침 에러 */}
          {getFieldError('overlap') && (
            <p className="text-xs text-[var(--color-error)] bg-red-50 rounded-lg px-3 py-2">
              {getFieldError('overlap')}
            </p>
          )}

          {/* 작업 이름 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              작업 이름
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="예: 영어 공부"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                getFieldError('taskName')
                  ? 'border-[var(--color-error)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-brand-primary)]'
              } bg-[var(--color-surface)] text-[var(--color-text-primary)]`}
            />
            {getFieldError('taskName') && (
              <p className="mt-1 text-xs text-[var(--color-error)]">{getFieldError('taskName')}</p>
            )}
          </div>

          {/* 블록 타입 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              블록 타입
            </label>
            <select
              value={blockType}
              onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)]"
            >
              {BLOCK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 포인트 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              기본 포인트
            </label>
            <input
              type="number"
              min="0"
              value={basePoints}
              onChange={(e) => setBasePoints(Number(e.target.value))}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                getFieldError('basePoints')
                  ? 'border-[var(--color-error)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-brand-primary)]'
              } bg-[var(--color-surface)] text-[var(--color-text-primary)]`}
            />
            {getFieldError('basePoints') && (
              <p className="mt-1 text-xs text-[var(--color-error)]">{getFieldError('basePoints')}</p>
            )}
          </div>

          {/* 선택 필드: 색상, 아이콘 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                커스텀 색상 (선택)
              </label>
              <input
                type="color"
                value={color || BLOCK_TYPES[blockType].color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded-lg border border-[var(--color-border)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                아이콘 (선택)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="예: 📚"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-primary-dark)] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
