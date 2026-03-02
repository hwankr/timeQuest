'use client';

// 좌측 패널: 템플릿 목록, 생성/삭제/복제 + 하단 DayTemplateMapper
import { useState } from 'react';
import { ScheduleTemplate, DayOfWeek } from '@/types';
import { DayTemplateMapper } from './DayTemplateMapper';
import { Plus, Copy, Trash2, Pencil, Check, X } from 'lucide-react';

interface TemplateListProps {
  templates: ScheduleTemplate[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<string>;
  onUpdate: (id: string, data: { name?: string }) => Promise<void>;
  dayTemplateMap: Record<DayOfWeek, string>;
}

export function TemplateList({
  templates,
  selectedTemplateId,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  onUpdate,
  dayTemplateMap,
}: TemplateListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 새 템플릿 생성
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const id = await onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
      onSelect(id);
    } catch (err) {
      console.error('템플릿 생성 실패:', err);
    }
  };

  // 이름 수정
  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await onUpdate(id, { name: editingName.trim() });
      setEditingId(null);
    } catch (err) {
      console.error('템플릿 이름 수정 실패:', err);
    }
  };

  // 삭제 확인
  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeletingId(null);
    } catch (err) {
      console.error('템플릿 삭제 실패:', err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">템플릿</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-lg p-1.5 text-[var(--color-brand-primary)] hover:bg-[var(--color-bg)] transition-colors"
          aria-label="새 템플릿 생성"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* 새 템플릿 입력 */}
      {isCreating && (
        <div className="mb-2 flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            placeholder="템플릿 이름"
            autoFocus
            className="flex-1 rounded-lg border border-[var(--color-brand-primary)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none"
          />
          <button
            onClick={handleCreate}
            className="rounded p-1 text-[var(--color-success)] hover:bg-[var(--color-bg)]"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => { setIsCreating(false); setNewName(''); }}
            className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 템플릿 목록 */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {templates.length === 0 && !isCreating && (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              템플릿이 없습니다
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 text-xs text-[var(--color-brand-primary)] hover:underline"
            >
              새 템플릿을 만들어보세요
            </button>
          </div>
        )}

        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const isEditing = editingId === template.id;
          const isDeleting = deletingId === template.id;

          return (
            <div
              key={template.id}
              className={`group flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]'
              }`}
              onClick={() => { if (!isEditing && !isDeleting) onSelect(template.id); }}
            >
              {/* 이름 수정 모드 */}
              {isEditing ? (
                <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(template.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-xs text-[var(--color-text-primary)] outline-none"
                  />
                  <button onClick={() => handleRename(template.id)} className="rounded p-0.5 hover:bg-white/20">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded p-0.5 hover:bg-white/20">
                    <X size={12} />
                  </button>
                </div>
              ) : isDeleting ? (
                <div className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="flex-1 text-xs">삭제하시겠습니까?</span>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className={`rounded px-2 py-0.5 text-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-error)] text-white'
                    }`}
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="rounded px-2 py-0.5 text-xs opacity-70 hover:opacity-100"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate text-xs font-medium">
                    {template.name}
                    {template.isDefault && (
                      <span className={`ml-1 text-[10px] ${isSelected ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}`}>
                        (기본)
                      </span>
                    )}
                  </span>

                  {/* 액션 버튼 (호버 시 표시) */}
                  <div
                    className={`flex items-center gap-0.5 ${isSelected ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setEditingId(template.id); setEditingName(template.name); }}
                      className="rounded p-1 hover:bg-white/20"
                      aria-label="이름 수정"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => onDuplicate(template.id)}
                      className="rounded p-1 hover:bg-white/20"
                      aria-label="복제"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      onClick={() => setDeletingId(template.id)}
                      className="rounded p-1 hover:bg-white/20"
                      aria-label="삭제"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 구분선 */}
      <div className="my-3 border-t border-[var(--color-border)]" />

      {/* 요일별 템플릿 배정 */}
      <DayTemplateMapper templates={templates} dayTemplateMap={dayTemplateMap} />
    </div>
  );
}
