// 템플릿/블록 상태 관리 — 템플릿 CRUD, 블록 CRUD, 실시간 구독
import { create } from 'zustand';
import { ScheduleTemplate, TimeBlock } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { hapticSuccess, hapticError, hapticLight } from '@/utils/haptics';

// ─────────────────────────────────────────────
// 상태 인터페이스
// ─────────────────────────────────────────────

interface TemplateState {
  // 데이터
  templates: ScheduleTemplate[];
  selectedTemplate: ScheduleTemplate | null;
  blocks: TimeBlock[];

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션 — 템플릿
  loadTemplates: (userId: string) => Promise<void>;
  subscribeToTemplates: (userId: string) => () => void;
  selectTemplate: (template: ScheduleTemplate | null) => void;
  createTemplate: (userId: string, name: string, isDefault: boolean) => Promise<string>;
  updateTemplate: (userId: string, templateId: string, data: Partial<Pick<ScheduleTemplate, 'name' | 'isDefault'>>) => Promise<void>;
  deleteTemplate: (userId: string, templateId: string) => Promise<void>;
  duplicateTemplate: (userId: string, templateId: string) => Promise<string>;

  // 액션 — 블록
  loadBlocks: (userId: string, templateId: string) => Promise<void>;
  subscribeToBlocks: (userId: string, templateId: string) => () => void;
  createBlock: (userId: string, templateId: string, block: Omit<TimeBlock, 'id'>) => Promise<string>;
  updateBlock: (userId: string, templateId: string, blockId: string, data: Partial<Omit<TimeBlock, 'id'>>) => Promise<void>;
  deleteBlock: (userId: string, templateId: string, blockId: string) => Promise<void>;
  reorderBlocks: (userId: string, templateId: string, orderedBlockIds: string[]) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────

const initialState = {
  templates: [],
  selectedTemplate: null,
  blocks: [],
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useTemplateStore = create<TemplateState>((set) => ({
  ...initialState,

  /** 템플릿 목록 로드 (1회성) */
  loadTemplates: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = new ScheduleRepository(userId);
      const templates = await repo.getTemplates();
      set({ templates, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 목록을 불러올 수 없습니다';
      set({ isLoading: false, error: message });
    }
  },

  /** 템플릿 목록 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToTemplates: (userId: string) => {
    const repo = new ScheduleRepository(userId);
    const unsubscribe = repo.subscribeToTemplates((templates) => {
      set({ templates });
    });
    return unsubscribe;
  },

  /** 선택된 템플릿 설정 */
  selectTemplate: (template) => set({ selectedTemplate: template, blocks: [] }),

  /** 템플릿 생성 — 새 templateId 반환 */
  createTemplate: async (userId: string, name: string, isDefault: boolean): Promise<string> => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      const templateId = await repo.createTemplate(name, isDefault);
      await hapticSuccess();
      return templateId;
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 생성에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 템플릿 수정 */
  updateTemplate: async (userId: string, templateId: string, data: Partial<Pick<ScheduleTemplate, 'name' | 'isDefault'>>) => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      await repo.updateTemplate(templateId, data);
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 수정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 템플릿 삭제 (하위 블록 포함) */
  deleteTemplate: async (userId: string, templateId: string) => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      await repo.deleteTemplate(templateId);
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 삭제에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 템플릿 복제 — 새 templateId 반환 */
  duplicateTemplate: async (userId: string, templateId: string): Promise<string> => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      const newId = await repo.duplicateTemplate(templateId);
      await hapticSuccess();
      return newId;
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 복제에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 블록 목록 로드 (1회성) */
  loadBlocks: async (userId: string, templateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = new ScheduleRepository(userId);
      const blocks = await repo.getBlocks(templateId);
      set({ blocks, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '블록 목록을 불러올 수 없습니다';
      set({ isLoading: false, error: message });
    }
  },

  /** 블록 목록 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToBlocks: (userId: string, templateId: string) => {
    const repo = new ScheduleRepository(userId);
    const unsubscribe = repo.subscribeToBlocks(templateId, (blocks) => {
      set({ blocks });
    });
    return unsubscribe;
  },

  /** 블록 생성 — 새 blockId 반환 */
  createBlock: async (userId: string, templateId: string, block: Omit<TimeBlock, 'id'>): Promise<string> => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      const blockId = await repo.createBlock(templateId, block);
      await hapticSuccess();
      return blockId;
    } catch (err) {
      const message = err instanceof Error ? err.message : '블록 생성에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 블록 수정 */
  updateBlock: async (userId: string, templateId: string, blockId: string, data: Partial<Omit<TimeBlock, 'id'>>) => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      await repo.updateBlock(templateId, blockId, data);
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '블록 수정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 블록 삭제 */
  deleteBlock: async (userId: string, templateId: string, blockId: string) => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      await repo.deleteBlock(templateId, blockId);
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '블록 삭제에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 블록 정렬 순서 일괄 업데이트 */
  reorderBlocks: async (userId: string, templateId: string, orderedBlockIds: string[]) => {
    set({ error: null });
    try {
      const repo = new ScheduleRepository(userId);
      await repo.updateBlocksSortOrder(templateId, orderedBlockIds);
      await hapticLight();
    } catch (err) {
      const message = err instanceof Error ? err.message : '블록 순서 변경에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
