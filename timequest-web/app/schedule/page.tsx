'use client';

// 시간표 페이지 — 2-패널 레이아웃: 좌측 TemplateList + 우측 BlockEditor
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TemplateList } from '@/components/schedule/TemplateList';
import { BlockEditor } from '@/components/schedule/BlockEditor';
import { useTemplates } from '@/hooks/useTemplates';
import { useUserDocument } from '@/hooks/useUserDocument';
import { DayOfWeek } from '@/types';

const DEFAULT_DAY_MAP: Record<DayOfWeek, string> = {
  mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '',
};

export default function SchedulePage() {
  return (
    <AuthGuard>
      <ScheduleContent />
    </AuthGuard>
  );
}

function ScheduleContent() {
  const {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    displayBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    pendingReorder,
    isLoading,
  } = useTemplates();

  const userDocument = useUserDocument();
  const dayTemplateMap = userDocument?.settings.dayTemplateMap ?? DEFAULT_DAY_MAP;

  // 선택된 템플릿 이름
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="시간표 관리" />

        <div className="flex flex-1 overflow-hidden">
          {/* 좌측: 템플릿 목록 */}
          <div className="w-72 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
              </div>
            ) : (
              <TemplateList
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                onCreate={createTemplate}
                onDelete={deleteTemplate}
                onDuplicate={duplicateTemplate}
                onUpdate={updateTemplate}
                dayTemplateMap={dayTemplateMap}
              />
            )}
          </div>

          {/* 우측: 블록 편집기 */}
          <div className="flex-1 p-6 overflow-hidden">
            {!selectedTemplateId ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-3 text-5xl opacity-20">📋</div>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {templates.length === 0
                      ? '새 템플릿을 만들어보세요'
                      : '좌측에서 템플릿을 선택하세요'}
                  </p>
                </div>
              </div>
            ) : (
              <BlockEditor
                templateId={selectedTemplateId}
                templateName={selectedTemplate?.name ?? ''}
                blocks={displayBlocks}
                onCreateBlock={createBlock}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onReorderBlocks={reorderBlocks}
                pendingReorder={pendingReorder}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
