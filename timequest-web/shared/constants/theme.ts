// 디자인 토큰 — 색상, 간격, 폰트 크기, 테두리 반경

/** 앱 전역 색상 팔레트 */
export const COLORS = {
  // 브랜드 (인디고)
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  // 포인트/골드 (앰버)
  point: '#f59e0b',
  pointLight: '#fbbf24',
  pointDark: '#d97706',

  // 블록 타입별 색상
  block: {
    routine: '#6366f1',    // 인디고
    study: '#0891b2',      // 시안
    exercise: '#16a34a',   // 그린
    work: '#ea580c',       // 오렌지
    free: '#8b5cf6',       // 바이올렛
    unassigned: '#94a3b8', // 슬레이트
    rest: '#64748b',       // 그레이
    meal: '#d97706',       // 앰버
  },

  // 시맨틱
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // 뉴트럴
  bg: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
};

/** 간격 단위 (px) */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 폰트 크기 (px) */
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

/** 테두리 반경 (px) */
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
