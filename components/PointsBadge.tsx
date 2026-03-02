// 포인트 배지 컴포넌트 — 현재 포인트를 골드 pill로 표시
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface PointsBadgeProps {
  points: number;
}

export const PointsBadge = React.memo(function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="star" size={14} color={COLORS.pointDark} />
      <Text style={styles.text}>{points.toLocaleString()}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.point}20`,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.point}40`,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.pointDark,
  },
});
