// 오늘 통계 탭 콘텐츠
import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CircularProgress } from './CircularProgress';
import { CategoryBreakdown } from './CategoryBreakdown';
import { PointsSummary } from './PointsSummary';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { TodayStats as TodayStatsData } from '@/hooks/useStatistics';

interface TodayStatsProps {
  stats: TodayStatsData | null;
  isLoading: boolean;
}

export const TodayStats = memo(function TodayStats({ stats, isLoading }: TodayStatsProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>오늘 데이터가 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 달성률 원형 차트 */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>오늘 달성률</Text>
        <View style={styles.progressRow}>
          <CircularProgress
            progress={stats.completionRate}
            size={130}
            strokeWidth={12}
            color={colors.primary}
          />
          <View style={styles.progressMeta}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>완료 블록</Text>
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
              {stats.completedCount} / {stats.totalCount}
            </Text>
            <Text style={[styles.metaLabel, { color: colors.textSecondary, marginTop: SPACING.sm }]}>달성률</Text>
            <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
              {Math.round(stats.completionRate * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* 포인트 요약 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>포인트</Text>
        <PointsSummary earned={stats.pointsEarned} spent={stats.pointsSpent} />
      </View>

      {/* 카테고리 분류 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>카테고리별 달성</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CategoryBreakdown breakdown={stats.categoryBreakdown} />
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
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
    textAlign: 'center',
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  progressMeta: {
    flex: 1,
  },
  metaLabel: {
    fontSize: FONT_SIZE.xs,
  },
  metaValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginTop: 2,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
