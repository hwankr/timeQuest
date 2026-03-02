'use client';

// 우측 패널: DnD 정렬 가능한 블록 목록 + 추가/편집/삭제 + 타임라인
import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TimeBlock } from '@/types';

// restrictToVerticalAxis 인라인 구현 (@dnd-kit/modifiers 대체)
import type { Modifier } from '@dnd-kit/core';
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});
import { BlockItem } from './BlockItem';
import { BlockFormDialog } from './BlockFormDialog';
import { TimelineView } from './TimelineView';
import { Plus } from 'lucide-react';

interface BlockEditorProps {
  templateId: string;
  templateName: string;
  blocks: TimeBlock[];
  onCreateBlock: (templateId: string, block: Omit<TimeBlock, 'id'>) => Promise<string>;
  onUpdateBlock: (templateId: string, blockId: string, data: Partial<Omit<TimeBlock, 'id'>>) => Promise<void>;
  onDeleteBlock: (templateId: string, blockId: string) => Promise<void>;
  onReorderBlocks: (templateId: string, orderedBlockIds: string[]) => Promise<void>;
  pendingReorder: boolean;
}

export function BlockEditor({
  templateId,
  templateName,
  blocks,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  pendingReorder,
}: BlockEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // 새 순서 배열 생성
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);

    const orderedIds = newBlocks.map((b) => b.id);
    onReorderBlocks(templateId, orderedIds);
  }, [blocks, templateId, onReorderBlocks]);

  // 블록 추가 다이얼로그 열기
  const handleOpenAdd = () => {
    setEditingBlock(null);
    setIsDialogOpen(true);
  };

  // 블록 편집 다이얼로그 열기
  const handleEdit = (block: TimeBlock) => {
    setEditingBlock(block);
    setIsDialogOpen(true);
  };

  // 블록 삭제
  const handleDelete = (blockId: string) => {
    setDeletingBlockId(blockId);
  };

  const confirmDelete = async () => {
    if (!deletingBlockId) return;
    try {
      await onDeleteBlock(templateId, deletingBlockId);
    } catch (err) {
      console.error('블록 삭제 실패:', err);
    }
    setDeletingBlockId(null);
  };

  // 다이얼로그 제출
  const handleDialogSubmit = async (data: Omit<TimeBlock, 'id'>) => {
    if (editingBlock) {
      await onUpdateBlock(templateId, editingBlock.id, data);
    } else {
      await onCreateBlock(templateId, data);
    }
  };

  const blockIds = blocks.map((b) => b.id);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {templateName}
          </h3>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {blocks.length}개 블록
            {pendingReorder && ' · 순서 저장 중...'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-brand-primary-dark)] transition-colors"
        >
          <Plus size={14} />
          블록 추가
        </button>
      </div>

      {/* 블록 목록 (DnD) */}
      <div className="flex-1 overflow-y-auto">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-4xl opacity-30">📋</div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              블록이 없습니다
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 text-xs text-[var(--color-brand-primary)] hover:underline"
            >
              블록을 추가해보세요
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 타임라인 미리보기 */}
      {blocks.length > 0 && (
        <div className="mt-4">
          <TimelineView blocks={blocks} />
        </div>
      )}

      {/* 블록 추가/편집 다이얼로그 */}
      <BlockFormDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingBlock(null); }}
        onSubmit={handleDialogSubmit}
        existingBlocks={blocks}
        editBlock={editingBlock}
      />

      {/* 삭제 확인 다이얼로그 */}
      {deletingBlockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingBlockId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">
              블록 삭제
            </h3>
            <p className="mb-5 text-sm text-[var(--color-text-secondary)]">
              이 블록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingBlockId(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
