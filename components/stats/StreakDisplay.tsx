// 스트릭 시각화 카드 — 현재 연속 기록 및 최장 기록 표시
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

// 마일스톤 뱃지 기준일
const MILESTONES = [7, 14, 30, 60, 100];

export const StreakDisplay = memo(function StreakDisplay({
  currentStreak,
  longestStreak,
}: StreakDisplayProps) {
  return (
    <View style={styles.card}>
      {/* 현재 스트릭 */}
      <View style={styles.streakRow}>
        <Text style={styles.fireIcon}>🔥</Text>
        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{currentStreak}일 연속</Text>
          <Text style={styles.longestText}>최장 기록: {longestStreak}일</Text>
        </View>
      </View>

      {/* 마일스톤 뱃지 */}
      <View style={styles.milestonesRow}>
        {MILESTONES.map((milestone) => {
          const achieved = currentStreak >= milestone;
          return (
            <View
              key={milestone}
              style={[styles.milestoneBadge, achieved && styles.milestoneBadgeAchieved]}
            >
              <Text style={[styles.milestoneDays, achieved && styles.milestoneDaysAchieved]}>
                {milestone}일
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fireIcon: {
    fontSize: 36,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  longestText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  milestonesRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  milestoneBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  milestoneBadgeAchieved: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  milestoneDays: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  milestoneDaysAchieved: {
    color: COLORS.surface,
  },
});
