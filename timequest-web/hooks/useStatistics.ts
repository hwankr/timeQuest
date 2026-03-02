'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockCompletion, BlockType, DailyRecord } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
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
// 타입 정의 (모바일과 동일)
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
  weekLabel: string;
}

export interface MonthlyStats {
  dailyRates: Array<{ date: string; completionRate: number }>;
  totalPointsEarned: number;
  totalPointsSpent: number;
  categoryComparison: Map<BlockType, { completed: number; total: number }> | null;
  monthLabel: string;
}

// ─────────────────────────────────────────────
// 헬퍼: 날짜 포맷
// ─────────────────────────────────────────────

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// 요일 레이블 (한국어, 월~일)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

// ─────────────────────────────────────────────
// 헬퍼: 카테고리 분류 계산 (모바일에서 인라인)
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
// 헬퍼: BlockCompletion 배열에서 카테고리 비교 계산 (모바일에서 인라인)
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
// 헬퍼: 최고/최저 블록 타입 계산 (모바일에서 인라인)
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

// computeCategoryBreakdown을 외부에서도 사용 가능하도록 내보내기
export { computeCategoryBreakdown };

// ─────────────────────────────────────────────
// useWeeklyStats
// ─────────────────────────────────────────────

/**
 * 주간 통계를 조회한다.
 * weekOffset: 0 = 이번 주, -1 = 지난 주
 * 한국 관례: 주 시작일 = 월요일 (weekStartsOn: 1)
 * 웹 전용: 폴링 기반 — 페이지 진입 시 1회 로드 + 주 네비게이션 시 재로드
 */
export function useWeeklyStats(
  userId: string | undefined,
  weekOffset: number = 0,
): { stats: WeeklyStats | null; isLoading: boolean } {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // 주 라벨 생성 (예: "3월 3일 ~ 3월 9일")
        const weekLabel = `${format(weekStart, 'M월 d일')} ~ ${format(weekEnd, 'M월 d일')}`;

        setStats({
          dailyRates,
          totalPointsEarned,
          totalPointsSpent,
          bestBlockType,
          worstBlockType,
          weekLabel,
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
 * 웹 전용: 폴링 기반 — 페이지 진입 시 1회 로드 + 월 네비게이션 시 재로드
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
  const [isLoading, setIsLoading] = useState(true);

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

        // dailyRecords만 조회 (히트맵에는 completionRate만 필요)
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

        // 월 라벨 생성 (예: "2026년 3월")
        const monthLabel = format(monthStart, 'yyyy년 M월');

        setStats({
          dailyRates,
          totalPointsEarned,
          totalPointsSpent,
          categoryComparison: null,
          monthLabel,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, monthOffset]);

  // 카테고리 분류 on-demand 로드
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
