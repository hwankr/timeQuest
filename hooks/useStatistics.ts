// 통계 데이터 조회 및 계산 훅
import { useState, useEffect, useCallback } from 'react';
import { BlockCompletion, BlockType, DailyRecord } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { getTodayDate } from '@/utils/time';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  subWeeks,
  subMonths,
} from 'date-fns';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export interface DailyRate {
  date: string;
  dayLabel: string;
  completionRate: number;
}

export interface WeeklyStats {
  dailyRates: DailyRate[];
  totalPointsEarned: number;
  totalPointsSpent: number;
  bestBlockType: { type: BlockType; rate: number } | null;
  worstBlockType: { type: BlockType; rate: number } | null;
  currentStreak: number;
}

export interface MonthlyStats {
  dailyRates: Array<{ date: string; completionRate: number }>;
  totalPointsEarned: number;
  totalPointsSpent: number;
  categoryComparison: Map<BlockType, { completed: number; total: number }> | null;
}

export interface TodayStats {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  pointsEarned: number;
  pointsSpent: number;
  categoryBreakdown: Map<BlockType, { completed: number; total: number }>;
  completions: BlockCompletion[];
}

// ─────────────────────────────────────────────
// 헬퍼: 카테고리 분류 계산
// ─────────────────────────────────────────────

function computeCategoryBreakdown(
  completions: BlockCompletion[],
): Map<BlockType, { completed: number; total: number }> {
  const map = new Map<BlockType, { completed: number; total: number }>();
  for (const c of completions) {
    const existing = map.get(c.blockType) ?? { completed: 0, total: 0 };
    map.set(c.blockType, {
      completed: existing.completed + (c.completed ? 1 : 0),
      total: existing.total + 1,
    });
  }
  return map;
}

// ─────────────────────────────────────────────
// useTodayStats
// ─────────────────────────────────────────────

/**
 * 오늘 통계를 실시간으로 구독한다.
 * - dailyRecord: 포인트 합산 (1회 로드)
 * - completions: 실시간 구독 (subscribeToCompletions)
 */
export function useTodayStats(userId: string | undefined): {
  stats: TodayStats | null;
  isLoading: boolean;
} {
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null);
  const [completions, setCompletions] = useState<BlockCompletion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setDailyRecord(null);
      setCompletions([]);
      setIsLoading(false);
      return;
    }

    const repo = new ScheduleRepository(userId);
    const today = getTodayDate();
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setIsLoading(true);
      try {
        // 오늘 dailyRecord 로드 (포인트 집계용)
        const record = await repo.getDailyRecord(today);
        setDailyRecord(record);

        // completions 실시간 구독
        unsubscribe = repo.subscribeToCompletions(today, (updated) => {
          setCompletions(updated);
        });
      } finally {
        setIsLoading(false);
      }
    };

    void init();

    return () => {
      unsubscribe?.();
    };
  }, [userId]);

  if (isLoading) {
    return { stats: null, isLoading: true };
  }

  if (!dailyRecord) {
    return { stats: null, isLoading: false };
  }

  const completedCount = completions.filter((c) => c.completed).length;
  const totalCount = completions.length;
  const categoryBreakdown = computeCategoryBreakdown(completions);

  const stats: TodayStats = {
    completionRate: totalCount > 0 ? completedCount / totalCount : 0,
    completedCount,
    totalCount,
    pointsEarned: dailyRecord.totalPointsEarned,
    pointsSpent: dailyRecord.totalPointsSpent,
    categoryBreakdown,
    completions,
  };

  return { stats, isLoading: false };
}

// ─────────────────────────────────────────────
// 헬퍼: 날짜 문자열 포맷 ("YYYY-MM-DD")
// ─────────────────────────────────────────────

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// 요일 레이블 (한국어, 월~일)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

// ─────────────────────────────────────────────
// 헬퍼: BlockCompletion 배열에서 카테고리 비교 계산
// ─────────────────────────────────────────────

function computeCategoryComparison(
  completionsByDate: Map<string, BlockCompletion[]>,
): Map<BlockType, { completed: number; total: number }> {
  const map = new Map<BlockType, { completed: number; total: number }>();
  for (const completions of completionsByDate.values()) {
    for (const c of completions) {
      const existing = map.get(c.blockType) ?? { completed: 0, total: 0 };
      map.set(c.blockType, {
        completed: existing.completed + (c.completed ? 1 : 0),
        total: existing.total + 1,
      });
    }
  }
  return map;
}

// ─────────────────────────────────────────────
// 헬퍼: 최고/최저 블록 타입 계산
// ─────────────────────────────────────────────

function computeBestWorst(
  categoryMap: Map<BlockType, { completed: number; total: number }>,
): {
  bestBlockType: { type: BlockType; rate: number } | null;
  worstBlockType: { type: BlockType; rate: number } | null;
} {
  if (categoryMap.size === 0) return { bestBlockType: null, worstBlockType: null };

  let best: { type: BlockType; rate: number } | null = null;
  let worst: { type: BlockType; rate: number } | null = null;

  for (const [type, { completed, total }] of categoryMap.entries()) {
    if (total === 0) continue;
    const rate = completed / total;
    if (best === null || rate > best.rate) best = { type, rate };
    if (worst === null || rate < worst.rate) worst = { type, rate };
  }

  return { bestBlockType: best, worstBlockType: worst };
}

// ─────────────────────────────────────────────
// useWeeklyStats
// ─────────────────────────────────────────────

/**
 * 주간 통계를 조회한다.
 * weekOffset: 0 = 이번 주, -1 = 지난 주
 * 한국 관례: 주 시작일 = 월요일 (weekStartsOn: 1)
 */
export function useWeeklyStats(
  userId: string | undefined,
  weekOffset: number = 0,
): { stats: WeeklyStats | null; isLoading: boolean } {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const repo = new ScheduleRepository(userId);

    const load = async () => {
      setIsLoading(true);
      try {
        const now = weekOffset === 0 ? new Date() : subWeeks(new Date(), Math.abs(weekOffset));
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const startDate = formatDate(weekStart);
        const endDate = formatDate(weekEnd);

        // 날짜 범위 dailyRecords 조회
        const dailyRecords = await repo.getDailyRecords(startDate, endDate);
        const recordMap = new Map<string, DailyRecord>(dailyRecords.map((r) => [r.date, r]));

        // 날짜 목록으로 completions 병렬 조회 (카테고리 분류용)
        const dateStrings = days.map((d) => formatDate(d));
        const completionsByDate = await repo.getCompletionsForDateRange(dateStrings);

        // 일별 달성률 배열 생성
        const dailyRates: DailyRate[] = days.map((day, index) => {
          const dateStr = formatDate(day);
          const record = recordMap.get(dateStr);
          return {
            date: dateStr,
            dayLabel: DAY_LABELS[index] ?? '',
            completionRate: record?.completionRate ?? 0,
          };
        });

        // 포인트 합산
        let totalPointsEarned = 0;
        let totalPointsSpent = 0;
        for (const record of dailyRecords) {
          totalPointsEarned += record.totalPointsEarned;
          totalPointsSpent += record.totalPointsSpent;
        }

        // 카테고리별 최고/최저
        const categoryMap = computeCategoryComparison(completionsByDate);
        const { bestBlockType, worstBlockType } = computeBestWorst(categoryMap);

        setStats({
          dailyRates,
          totalPointsEarned,
          totalPointsSpent,
          bestBlockType,
          worstBlockType,
          currentStreak: 0, // StreakDisplay가 useUserDocument에서 직접 조회
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, weekOffset]);

  return { stats, isLoading };
}

// ─────────────────────────────────────────────
// useMonthlyStats
// ─────────────────────────────────────────────

/**
 * 월간 통계를 조회한다.
 * monthOffset: 0 = 이번 달, -1 = 지난 달
 * 월간 히트맵은 dailyRecords만 사용 (completions 미조회 — 효율적)
 * 카테고리 분류는 on-demand (loadCategoryBreakdown 호출 시만 조회)
 */
export function useMonthlyStats(
  userId: string | undefined,
  monthOffset: number = 0,
): {
  stats: MonthlyStats | null;
  isLoading: boolean;
  loadCategoryBreakdown: () => void;
} {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const repo = new ScheduleRepository(userId);

    const load = async () => {
      setIsLoading(true);
      try {
        const now = monthOffset === 0 ? new Date() : subMonths(new Date(), Math.abs(monthOffset));
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const startDate = formatDate(monthStart);
        const endDate = formatDate(monthEnd);

        // dailyRecords만 조회 (completions 없음 — 히트맵에는 completionRate만 필요)
        const dailyRecords = await repo.getDailyRecords(startDate, endDate);
        const recordMap = new Map<string, DailyRecord>(dailyRecords.map((r) => [r.date, r]));

        const dailyRates = days.map((day) => {
          const dateStr = formatDate(day);
          const record = recordMap.get(dateStr);
          return {
            date: dateStr,
            completionRate: record?.completionRate ?? 0,
          };
        });

        let totalPointsEarned = 0;
        let totalPointsSpent = 0;
        for (const record of dailyRecords) {
          totalPointsEarned += record.totalPointsEarned;
          totalPointsSpent += record.totalPointsSpent;
        }

        setStats({
          dailyRates,
          totalPointsEarned,
          totalPointsSpent,
          categoryComparison: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, monthOffset]);

  // 카테고리 분류 on-demand 로드 (사용자가 "상세 보기" 탭 시 호출)
  const loadCategoryBreakdown = useCallback(() => {
    if (!userId || !stats) return;

    const repo = new ScheduleRepository(userId);

    const load = async () => {
      const now = monthOffset === 0 ? new Date() : subMonths(new Date(), Math.abs(monthOffset));
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const dateStrings = days.map((d) => formatDate(d));

      const completionsByDate = await repo.getCompletionsForDateRange(dateStrings);
      const categoryComparison = computeCategoryComparison(completionsByDate);

      setStats((prev) => (prev ? { ...prev, categoryComparison } : prev));
    };

    void load();
  }, [userId, stats, monthOffset]);

  return { stats, isLoading, loadCategoryBreakdown };
}
