// 주간 통계 탭 콘텐츠 — 막대 차트 + 주간 요약 + 스트릭
import React, { memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { StreakDisplay } from './StreakDisplay';
import { getTodayDate } from '@/utils/time';
import { useWeeklyStats } from '@/hooks/useStatistics';
import { useUserDocument } from '@/hooks/useUserDocument';
import type { WeeklyStats as WeeklyStatsData, DailyRate } from '@/hooks/useStatistics';
import type { BlockType } from '@/types';

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  routine: '루틴',
  study: '공부',
  exercise: '운동',
  work: '업무',
  free: '자유',
  unassigned: '미배정',
  rest: '휴식',
  meal: '식사',
};

interface WeeklyStatsProps {
  userId: string | undefined;
}

export const WeeklyStats = memo(function WeeklyStats({
  userId,
}: WeeklyStatsProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { stats, isLoading } = useWeeklyStats(userId, weekOffset);
  const { userDoc } = useUserDocument(userId);
  const currentStreak = userDoc?.currentStreak ?? 0;
  const longestStreak = userDoc?.longestStreak ?? 0;
  const today = getTodayDate();

  const handlePrevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const handleNextWeek = useCallback(() => setWeekOffset((o) => Math.min(o + 1, 0)), []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stats || stats.dailyRates.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>이번 주 데이터가 없습니다</Text>
      </View>
    );
  }

  const barData = stats.dailyRates.map((item: DailyRate) => {
    const isToday = item.date === today;
    const value = Math.round(item.completionRate * 100);
    return {
      value,
      label: item.dayLabel,
      frontColor: isToday ? COLORS.primaryDark : COLORS.primary,
      topLabelComponent: () =>
        value > 0 ? (
          <Text style={styles.barTopLabel}>{value}%</Text>
        ) : null,
    };
  });

  const net = stats.totalPointsEarned - stats.totalPointsSpent;

  const weekLabel = weekOffset === 0 ? '이번 주' : `${Math.abs(weekOffset)}주 전`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 주간 네비게이션 */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrevWeek}>
          <Text style={styles.navArrow}>{'◀'}</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>{weekLabel}</Text>
        <TouchableOpacity onPress={handleNextWeek} disabled={weekOffset >= 0}>
          <Text style={[styles.navArrow, weekOffset >= 0 && styles.navDisabled]}>{'▶'}</Text>
        </TouchableOpacity>
      </View>

      {/* 주간 막대 차트 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>주간 달성률</Text>
        <BarChart
          data={barData}
          barWidth={28}
          spacing={12}
          roundedTop
          hideRules
          xAxisThickness={1}
          xAxisColor={COLORS.border}
          yAxisThickness={0}
          yAxisTextStyle={styles.axisText}
          noOfSections={4}
          maxValue={100}
          stepValue={25}
          isAnimated
          animationDuration={400}
          barBorderRadius={4}
          labelWidth={28}
          xAxisLabelTextStyle={styles.axisText}
        />
      </View>

      {/* 주간 포인트 요약 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>주간 포인트</Text>
        <View style={styles.pointsRow}>
          <PointItem label="획득" value={stats.totalPointsEarned} prefix="+" color={COLORS.success} />
          <View style={styles.divider} />
          <PointItem label="사용" value={stats.totalPointsSpent} prefix="-" color={COLORS.error} />
          <View style={styles.divider} />
          <PointItem
            label="순수익"
            value={net}
            prefix={net >= 0 ? '+' : ''}
            color={net >= 0 ? COLORS.success : COLORS.error}
          />
        </View>
      </View>

      {/* 최고/최저 블록 타입 */}
      {(stats.bestBlockType || stats.worstBlockType) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리 분석</Text>
          <View style={styles.bestWorstRow}>
            {stats.bestBlockType && (
              <View style={styles.bestWorstItem}>
                <Text style={styles.bestWorstEmoji}>🏆</Text>
                <Text style={styles.bestWorstLabel}>최고</Text>
                <Text style={styles.bestWorstValue}>
                  {BLOCK_TYPE_LABELS[stats.bestBlockType.type]}
                </Text>
                <Text style={styles.bestWorstRate}>
                  {Math.round(stats.bestBlockType.rate * 100)}%
                </Text>
              </View>
            )}
            {stats.worstBlockType &&
              stats.worstBlockType.type !== stats.bestBlockType?.type && (
                <View style={styles.bestWorstItem}>
                  <Text style={styles.bestWorstEmoji}>📉</Text>
                  <Text style={styles.bestWorstLabel}>개선 필요</Text>
                  <Text style={styles.bestWorstValue}>
                    {BLOCK_TYPE_LABELS[stats.worstBlockType.type]}
                  </Text>
                  <Text style={styles.bestWorstRate}>
                    {Math.round(stats.worstBlockType.rate * 100)}%
                  </Text>
                </View>
              )}
          </View>
        </View>
      )}

      {/* 스트릭 카드 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>연속 기록</Text>
        <StreakDisplay currentStreak={currentStreak} longestStreak={longestStreak} />
      </View>
    </ScrollView>
  );
});

// ─────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────

const PointItem = memo(function PointItem({
  label,
  value,
  prefix,
  color,
}: {
  label: string;
  value: number;
  prefix: string;
  color: string;
}) {
  return (
    <View style={styles.pointItem}>
      <Text style={styles.pointLabel}>{label}</Text>
      <Text style={[styles.pointValue, { color }]}>
        {prefix}
        {value}P
      </Text>
    </View>
  );
});

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  barTopLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  axisText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pointItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pointLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  pointValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  bestWorstRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  bestWorstItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    padding: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: BORDER_RADIUS.sm,
  },
  bestWorstEmoji: { fontSize: 20 },
  bestWorstLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  bestWorstValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bestWorstRate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  section: { gap: SPACING.sm },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  navArrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    paddingHorizontal: SPACING.sm,
  },
  navDisabled: {
    color: COLORS.border,
  },
  navLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 80,
    textAlign: 'center',
  },
});
