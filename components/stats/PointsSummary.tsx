// 포인트 획득/사용/순수익 요약 카드
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface PointsSummaryProps {
  earned: number;
  spent: number;
}

export const PointsSummary = memo(function PointsSummary({
  earned,
  spent,
}: PointsSummaryProps) {
  const net = earned - spent;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PointItem label="획득" value={earned} prefix="+" color={COLORS.success} />
        <View style={styles.divider} />
        <PointItem label="사용" value={spent} prefix="-" color={COLORS.error} />
        <View style={styles.divider} />
        <PointItem
          label="순수익"
          value={net}
          prefix={net >= 0 ? '+' : ''}
          color={net >= 0 ? COLORS.success : COLORS.error}
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
}

const PointItem = memo(function PointItem({ label, value, prefix, color }: PointItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={[styles.itemValue, { color }]}>
        {prefix}{value}P
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textSecondary,
  },
  itemValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
});
