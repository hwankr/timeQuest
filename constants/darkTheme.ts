// 다크 모드 색상 팔레트 — LIGHT_COLORS와 동일 구조

import { LIGHT_COLORS } from './theme';

/** 다크 모드 색상 팔레트 — LIGHT_COLORS와 동일 키 구조 */
export const DARK_COLORS: typeof LIGHT_COLORS = {
  // 브랜드 (인디고 — 다크 배경에서 더 밝게)
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',

  // 포인트/골드 (앰버)
  point: '#fbbf24',
  pointLight: '#fcd34d',
  pointDark: '#f59e0b',

  // 블록 타입별 색상 — 다크 배경에서도 충분한 대비 유지
  block: {
    routine: '#818cf8',    // 인디고 (라이트보다 밝게)
    study: '#22d3ee',      // 시안
    exercise: '#4ade80',   // 그린
    work: '#fb923c',       // 오렌지
    free: '#a78bfa',       // 바이올렛
    unassigned: '#94a3b8', // 슬레이트
    rest: '#64748b',       // 그레이
    meal: '#fbbf24',       // 앰버
  },

  // 시맨틱
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // 뉴트럴 (다크 배경)
  bg: '#0f172a',           // 슬레이트 900
  surface: '#1e293b',      // 슬레이트 800
  textPrimary: '#f1f5f9',  // 슬레이트 100
  textSecondary: '#94a3b8', // 슬레이트 400
  textTertiary: '#64748b', // 슬레이트 500
  border: '#334155',       // 슬레이트 700
};
