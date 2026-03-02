// 테마 Context — 듀얼 Context 패턴으로 리렌더링 최소화
// ThemeColorsContext: 모든 컴포넌트(38개)가 소비 — colors 변경 시만 리렌더링
// ThemeModeContext: 설정 화면만 소비 — themeMode/setThemeMode/effectiveTheme

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_COLORS } from '@/constants/theme';
import { DARK_COLORS } from '@/constants/darkTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { ThemeMode } from '@/types';

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

type ThemeColors = typeof LIGHT_COLORS;
type EffectiveTheme = 'light' | 'dark';

interface ThemeModeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  effectiveTheme: EffectiveTheme;
}

// ─────────────────────────────────────────────
// Context 인스턴스
// ─────────────────────────────────────────────

const ThemeColorsContext = createContext<ThemeColors>(LIGHT_COLORS);
const ThemeModeContext = createContext<ThemeModeContextValue>({
  themeMode: 'system',
  setThemeMode: () => {},
  effectiveTheme: 'light',
});

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  /** 테마 모드 변경 액션 (userId 필요) */
  onSetThemeMode?: (mode: ThemeMode) => void;
}

export function ThemeProvider({ children, onSetThemeMode }: ThemeProviderProps) {
  // 시스템 테마 감지
  const systemScheme = useColorScheme();

  // 사용자 설정에서 themeMode 읽기
  const settings = useSettingsStore((s) => s.settings);
  const themeMode: ThemeMode = settings?.themeMode ?? 'system';

  // effectiveTheme 계산
  const effectiveTheme: EffectiveTheme = useMemo(() => {
    if (themeMode === 'dark') return 'dark';
    if (themeMode === 'light') return 'light';
    // 'system' — OS 설정 따름 (null인 경우 light 기본)
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemScheme]);

  // colors — 모듈 레벨 상수 참조이므로 effectiveTheme 동일 시 참조 불변 → 리렌더링 0
  const colors: ThemeColors = effectiveTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  // modeValue — 설정 화면만 소비
  const modeValue = useMemo<ThemeModeContextValue>(
    () => ({
      themeMode,
      setThemeMode: onSetThemeMode ?? (() => {}),
      effectiveTheme,
    }),
    [themeMode, effectiveTheme, onSetThemeMode],
  );

  return (
    <ThemeModeContext.Provider value={modeValue}>
      <ThemeColorsContext.Provider value={colors}>
        {children}
      </ThemeColorsContext.Provider>
    </ThemeModeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────

/**
 * 현재 테마 색상 객체를 반환한다.
 * 대부분의 컴포넌트(38개)에서 사용.
 */
export function useThemeColors(): ThemeColors {
  return useContext(ThemeColorsContext);
}

/**
 * 테마 모드 상태와 setter를 반환한다.
 * 설정 화면에서만 사용.
 */
export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
