'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyRate } from '@/hooks/useStatistics';

interface WeeklyChartProps {
  dailyRates: DailyRate[];
  weekLabel: string;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

// 달성률에 따른 바 색상
function getBarColor(rate: number): string {
  if (rate >= 0.75) return '#6366f1'; // 브랜드 인디고
  if (rate >= 0.5) return '#818cf8';  // 연한 인디고
  if (rate >= 0.25) return '#a5b4fc'; // 더 연한 인디고
  if (rate > 0) return '#c7d2fe';     // 가장 연한 인디고
  return '#e2e8f0';                   // 회색 (데이터 없음)
}

// 커스텀 툴팁
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const rate = (payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-[var(--color-text-primary)]">{label}요일</p>
      <p className="text-sm font-bold text-[var(--color-brand-primary)]">
        {Math.round(rate * 100)}%
      </p>
    </div>
  );
}

export function WeeklyChart({ dailyRates, weekLabel, weekOffset, onPrevWeek, onNextWeek }: WeeklyChartProps) {
  const chartData = dailyRates.map((d) => ({
    day: d.dayLabel,
    rate: d.completionRate,
    date: d.date,
  }));

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">주간 달성률</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
          >
            ◀
          </button>
          <span className="min-w-[120px] text-center text-xs text-[var(--color-text-secondary)]">
            {weekLabel}
          </span>
          <button
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg)' }} />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 평균 달성률 */}
      {dailyRates.length > 0 && (
        <p className="mt-3 text-center text-xs text-[var(--color-text-tertiary)]">
          주간 평균{' '}
          <span className="font-semibold text-[var(--color-brand-primary)]">
            {Math.round(
              (dailyRates.reduce((sum, d) => sum + d.completionRate, 0) / dailyRates.length) * 100,
            )}%
          </span>
        </p>
      )}
    </div>
  );
}
