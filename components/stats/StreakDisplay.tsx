// 스트릭 시각화 카드 — 현재 연속 기록 및 최장 기록 표시
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

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
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* 현재 스트릭 */}
      <View style={styles.streakRow}>
        <Text style={styles.fireIcon}>🔥</Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakCount, { color: colors.textPrimary }]}>{currentStreak}일 연속</Text>
          <Text style={[styles.longestText, { color: colors.textSecondary }]}>최장 기록: {longestStreak}일</Text>
        </View>
      </View>

      {/* 마일스톤 뱃지 */}
      <View style={styles.milestonesRow}>
        {MILESTONES.map((milestone) => {
          const achieved = currentStreak >= milestone;
          return (
            <View
              key={milestone}
              style={[
                styles.milestoneBadge,
                { backgroundColor: colors.bg, borderColor: colors.border },
                achieved && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[
                styles.milestoneDays,
                { color: colors.textSecondary },
                achieved && { color: colors.surface },
              ]}>
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
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
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
  },
  longestText: {
    fontSize: FONT_SIZE.sm,
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
    borderWidth: 1,
  },
  milestoneDays: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
