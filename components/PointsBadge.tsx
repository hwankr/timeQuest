// 포인트 배지 컴포넌트 — 현재 포인트를 골드 pill로 표시
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

interface PointsBadgeProps {
  points: number;
}

export const PointsBadge = React.memo(function PointsBadge({ points }: PointsBadgeProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: `${colors.point}20`, borderColor: `${colors.point}40` }]}>
      <Ionicons name="star" size={14} color={colors.pointDark} />
      <Text style={[styles.text, { color: colors.pointDark }]}>{points.toLocaleString()}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
