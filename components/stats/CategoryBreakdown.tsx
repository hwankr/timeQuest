// 카테고리별 달성률 가로 막대 차트
import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlockType } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

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

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  routine: COLORS.block.routine,
  study: COLORS.block.study,
  exercise: COLORS.block.exercise,
  work: COLORS.block.work,
  free: COLORS.block.free,
  unassigned: COLORS.block.unassigned,
  rest: COLORS.block.rest,
  meal: COLORS.block.meal,
};

interface CategoryBreakdownProps {
  breakdown: Map<BlockType, { completed: number; total: number }>;
}

interface BarItemProps {
  blockType: BlockType;
  completed: number;
  total: number;
}

const BarItem = memo(function BarItem({ blockType, completed, total }: BarItemProps) {
  const rate = total > 0 ? completed / total : 0;
  const color = BLOCK_TYPE_COLORS[blockType];
  const label = BLOCK_TYPE_LABELS[blockType];

  return (
    <View style={styles.barItem}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barCount}>{completed}/{total}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(rate * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
});

export const CategoryBreakdown = memo(function CategoryBreakdown({
  breakdown,
}: CategoryBreakdownProps) {
  const entries = Array.from(breakdown.entries()).filter(([, v]) => v.total > 0);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>카테고리 데이터가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map(([type, counts]) => (
        <BarItem
          key={type}
          blockType={type}
          completed={counts.completed}
          total={counts.total}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  barItem: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  barCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
