// 오늘 통계 탭 콘텐츠
import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CircularProgress } from './CircularProgress';
import { CategoryBreakdown } from './CategoryBreakdown';
import { PointsSummary } from './PointsSummary';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import type { TodayStats as TodayStatsData } from '@/hooks/useStatistics';

interface TodayStatsProps {
  stats: TodayStatsData | null;
  isLoading: boolean;
}

export const TodayStats = memo(function TodayStats({ stats, isLoading }: TodayStatsProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>오늘 데이터가 없습니다</Text>
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘 달성률</Text>
        <View style={styles.progressRow}>
          <CircularProgress
            progress={stats.completionRate}
            size={130}
            strokeWidth={12}
            color={COLORS.primary}
          />
          <View style={styles.progressMeta}>
            <Text style={styles.metaLabel}>완료 블록</Text>
            <Text style={styles.metaValue}>
              {stats.completedCount} / {stats.totalCount}
            </Text>
            <Text style={[styles.metaLabel, { marginTop: SPACING.sm }]}>달성률</Text>
            <Text style={styles.metaValue}>
              {Math.round(stats.completionRate * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* 포인트 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>포인트</Text>
        <PointsSummary earned={stats.pointsEarned} spent={stats.pointsSpent} />
      </View>

      {/* 카테고리 분류 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>카테고리별 달성</Text>
        <View style={styles.card}>
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
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
