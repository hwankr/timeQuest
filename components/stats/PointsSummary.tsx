// 포인트 획득/사용/순수익 요약 카드
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

interface PointsSummaryProps {
  earned: number;
  spent: number;
}

export const PointsSummary = memo(function PointsSummary({
  earned,
  spent,
}: PointsSummaryProps) {
  const colors = useThemeColors();
  const net = earned - spent;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <PointItem label="획득" value={earned} prefix="+" color={colors.success} textSecondary={colors.textSecondary} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <PointItem label="사용" value={spent} prefix="-" color={colors.error} textSecondary={colors.textSecondary} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <PointItem
          label="순수익"
          value={net}
          prefix={net >= 0 ? '+' : ''}
          color={net >= 0 ? colors.success : colors.error}
          textSecondary={colors.textSecondary}
        />
      </View>
    </View>
  );
});

interface PointItemProps {
  label: string;
  value: number;
  prefix: string;
  color: string;
  textSecondary: string;
}

const PointItem = memo(function PointItem({ label, value, prefix, color, textSecondary }: PointItemProps) {
  return (
    <View style={styles.item}>
      <Text style={[styles.itemLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.itemValue, { color }]}>
        {prefix}{value}P
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  itemLabel: {
    fontSize: FONT_SIZE.xs,
  },
  itemValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 32,
  },
});
