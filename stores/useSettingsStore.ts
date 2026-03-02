// 설정 상태 관리 — dayTemplateMap, defaultTemplateId Firestore 동기화
import { create } from 'zustand';
import { DayOfWeek, DayTemplateMap, UserSettings } from '@/types';
import { UserRepository } from '@/repositories/userRepo';
import { hapticSuccess, hapticError } from '@/utils/haptics';

// ─────────────────────────────────────────────
// 상태 인터페이스
// ─────────────────────────────────────────────

interface SettingsState {
  // 데이터
  settings: UserSettings | null;

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션
  loadSettings: (userId: string) => Promise<void>;
  setDefaultTemplate: (userId: string, templateId: string) => Promise<void>;
  setDayTemplate: (userId: string, day: DayOfWeek, templateId: string) => Promise<void>;
  setDayTemplateMap: (userId: string, dayTemplateMap: DayTemplateMap) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────

const initialState = {
  settings: null,
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialState,

  /** 사용자 설정 로드 */
  loadSettings: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = new UserRepository(userId);
      const user = await repo.getUser();
      set({ settings: user?.settings ?? null, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '설정을 불러올 수 없습니다';
      set({ isLoading: false, error: message });
    }
  },

  /** 기본 템플릿 설정 — Firestore user.settings.defaultTemplateId 업데이트 */
  setDefaultTemplate: async (userId: string, templateId: string) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ 'settings.defaultTemplateId': templateId } as never);
      const current = get().settings;
      if (current) {
        set({ settings: { ...current, defaultTemplateId: templateId } });
      }
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '기본 템플릿 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 특정 요일의 템플릿 설정 — Firestore user.settings.dayTemplateMap.{day} 업데이트 */
  setDayTemplate: async (userId: string, day: DayOfWeek, templateId: string) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ [`settings.dayTemplateMap.${day}`]: templateId } as never);
      const current = get().settings;
      if (current) {
        set({
          settings: {
            ...current,
            dayTemplateMap: { ...current.dayTemplateMap, [day]: templateId },
          },
        });
      }
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '요일 템플릿 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 요일-템플릿 맵 전체 교체 — Firestore user.settings.dayTemplateMap 업데이트 */
  setDayTemplateMap: async (userId: string, dayTemplateMap: DayTemplateMap) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ 'settings.dayTemplateMap': dayTemplateMap } as never);
      const current = get().settings;
      if (current) {
        set({ settings: { ...current, dayTemplateMap } });
      }
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '요일 템플릿 맵 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
