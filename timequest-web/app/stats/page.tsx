'use client';

import { useState, useEffect } from 'react';
import { BlockType } from '@/types';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StreakCard } from '@/components/stats/StreakCard';
import { PointsSummary } from '@/components/stats/PointsSummary';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { CategoryPieChart } from '@/components/stats/CategoryPieChart';
import { MonthlyHeatmap } from '@/components/stats/MonthlyHeatmap';
import { useWeeklyStats, useMonthlyStats, computeCategoryBreakdown } from '@/hooks/useStatistics';
import { useUserDocument } from '@/hooks/useUserDocument';
import { useAuth } from '@/hooks/useAuth';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  subWeeks,
} from 'date-fns';

// 주간 카테고리 데이터 로드 훅
function useWeeklyCategoryData(
  userId: string | undefined,
  weekOffset: number,
): {
  categoryData: Map<BlockType, { completed: number; total: number }> | null;
  isLoading: boolean;
} {
  const [categoryData, setCategoryData] = useState<Map<BlockType, { completed: number; total: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCategoryData(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const now = weekOffset === 0 ? new Date() : subWeeks(new Date(), Math.abs(weekOffset));
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const dateStrings = days.map((d) => format(d, 'yyyy-MM-dd'));

        const repo = new ScheduleRepository(userId);
        const completionsByDate = await repo.getCompletionsForDateRange(dateStrings);
        const allCompletions = Array.from(completionsByDate.values()).flat();
        const map = computeCategoryBreakdown(allCompletions);
        setCategoryData(map);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, weekOffset]);

  return { categoryData, isLoading };
}

export default function StatsPage() {
  const { user } = useAuth();
  const userDocument = useUserDocument();
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const { stats: weeklyStats, isLoading: weeklyLoading } = useWeeklyStats(user?.uid, weekOffset);
  const { stats: monthlyStats, isLoading: monthlyLoading } = useMonthlyStats(user?.uid, monthOffset);
  const { categoryData, isLoading: categoryLoading } = useWeeklyCategoryData(user?.uid, weekOffset);

  // 주간 평균 달성률
  const weeklyAvgRate =
    weeklyStats && weeklyStats.dailyRates.length > 0
      ? Math.round(
          (weeklyStats.dailyRates.reduce((sum, d) => sum + d.completionRate, 0) /
            weeklyStats.dailyRates.length) *
            100,
        )
      : 0;

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[var(--color-bg)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title="통계" />
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              {/* 페이지 제목 */}
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">통계 대시보드</h1>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  나의 활동 기록과 달성률을 확인하세요
                </p>
              </div>

              {/* 요약 카드 3종 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 스트릭 카드 */}
                <StreakCard
                  currentStreak={userDocument?.currentStreak ?? 0}
                  longestStreak={userDocument?.longestStreak ?? 0}
                />

                {/* 포인트 요약 */}
                <PointsSummary
                  currentPoints={userDocument?.currentPoints ?? 0}
                  totalPointsLifetime={userDocument?.totalPointsLifetime ?? 0}
                  weeklyEarned={weeklyStats?.totalPointsEarned ?? 0}
                  weeklySpent={weeklyStats?.totalPointsSpent ?? 0}
                />

                {/* 주간 달성률 요약 카드 */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">이번 주</h3>
                  </div>
                  {weeklyLoading ? (
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                        {weeklyAvgRate}%
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">평균 달성률</p>
                      {weeklyStats?.bestBlockType && (
                        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                          최고:{' '}
                          <span className="font-medium text-[var(--color-success)]">
                            {weeklyStats.bestBlockType.type} (
                            {Math.round(weeklyStats.bestBlockType.rate * 100)}%)
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 주간 차트 + 카테고리 파이 차트 */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* 주간 달성률 바 차트 */}
                {weeklyLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
                  </div>
                ) : weeklyStats ? (
                  <WeeklyChart
                    dailyRates={weeklyStats.dailyRates}
                    weekLabel={weeklyStats.weekLabel}
                    weekOffset={weekOffset}
                    onPrevWeek={() => setWeekOffset((o) => o - 1)}
                    onNextWeek={() => setWeekOffset((o) => Math.min(0, o + 1))}
                  />
                ) : null}

                {/* 카테고리별 파이 차트 */}
                <CategoryPieChart
                  categoryData={categoryData}
                  isLoading={categoryLoading}
                />
              </div>

              {/* 월간 히트맵 */}
              {monthlyLoading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
                </div>
              ) : monthlyStats ? (
                <MonthlyHeatmap
                  dailyRates={monthlyStats.dailyRates}
                  monthLabel={monthlyStats.monthLabel}
                  monthOffset={monthOffset}
                  onPrevMonth={() => setMonthOffset((o) => o - 1)}
                  onNextMonth={() => setMonthOffset((o) => Math.min(0, o + 1))}
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
