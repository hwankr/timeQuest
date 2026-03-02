// 설정 상태 관리 — dayTemplateMap, defaultTemplateId Firestore 동기화
import { create } from 'zustand';
import { DayOfWeek, DayTemplateMap, NotificationSettings, ThemeMode, UserSettings } from '@/types';
import { UserRepository } from '@/repositories/userRepo';
import { hapticSuccess, hapticError } from '@/utils/haptics';
import { rescheduleAllNotifications } from '@/services/notification';

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
  updateNotificationSetting: (
    userId: string,
    key: keyof NotificationSettings,
    value: NotificationSettings[keyof NotificationSettings],
  ) => Promise<void>;
  updateAdvanceMinutes: (userId: string, minutes: 1 | 5 | 10) => Promise<void>;
  updateDNDTimes: (userId: string, dndStart: string, dndEnd: string) => Promise<void>;
  setThemeMode: (userId: string, mode: ThemeMode) => Promise<void>;
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

  /** 단일 알림 설정 필드 업데이트 → 재예약 트리거 */
  updateNotificationSetting: async (userId, key, value) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ [`settings.notifications.${key}`]: value } as never);
      const current = get().settings;
      if (current) {
        set({
          settings: {
            ...current,
            notifications: { ...current.notifications, [key]: value },
          },
        });
      }
      await hapticSuccess();
      rescheduleAllNotifications(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알림 설정 변경에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 사전 알림 분 업데이트 */
  updateAdvanceMinutes: async (userId, minutes) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ 'settings.notifications.advanceMinutes': minutes } as never);
      const current = get().settings;
      if (current) {
        set({
          settings: {
            ...current,
            notifications: { ...current.notifications, advanceMinutes: minutes },
          },
        });
      }
      await hapticSuccess();
      rescheduleAllNotifications(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '사전 알림 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 방해금지 시간 업데이트 */
  updateDNDTimes: async (userId, dndStart, dndEnd) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({
        'settings.notifications.dndStart': dndStart,
        'settings.notifications.dndEnd': dndEnd,
      } as never);
      const current = get().settings;
      if (current) {
        set({
          settings: {
            ...current,
            notifications: { ...current.notifications, dndStart, dndEnd },
          },
        });
      }
      await hapticSuccess();
      rescheduleAllNotifications(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '방해금지 시간 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 테마 모드 설정 — Firestore user.settings.themeMode 업데이트 */
  setThemeMode: async (userId: string, mode: ThemeMode) => {
    set({ error: null });
    try {
      const repo = new UserRepository(userId);
      await repo.updateUser({ 'settings.themeMode': mode } as never);
      const current = get().settings;
      if (current) {
        set({ settings: { ...current, themeMode: mode } });
      }
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '테마 설정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
