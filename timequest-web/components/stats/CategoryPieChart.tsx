'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BlockType } from '@/types';
import { COLORS } from '@/constants/theme';

interface CategoryPieChartProps {
  categoryData: Map<BlockType, { completed: number; total: number }> | null;
  isLoading?: boolean;
}

// 블록 타입 한국어 라벨
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

export function CategoryPieChart({ categoryData, isLoading }: CategoryPieChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!categoryData || categoryData.size === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-3xl">📊</span>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">데이터가 없습니다</p>
      </div>
    );
  }

  // Map을 차트 데이터로 변환 (완료된 블록만 포함, total > 0인 것만)
  const chartData = Array.from(categoryData.entries())
    .filter(([, { total }]) => total > 0)
    .map(([type, { completed, total }]) => ({
      name: BLOCK_TYPE_LABELS[type],
      value: completed,
      total,
      rate: Math.round((completed / total) * 100),
      color: COLORS.block[type],
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-3xl">📊</span>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">완료된 블록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">카테고리별 완료율</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: { payload?: { rate: number; total: number } }) => [
              `${value}개 완료 (${props.payload?.rate ?? 0}%)`,
              name,
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
