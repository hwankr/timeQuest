'use client';

import { useState } from 'react';

interface DayRate {
  date: string;
  completionRate: number;
}

interface MonthlyHeatmapProps {
  dailyRates: DayRate[];
  monthLabel: string;
  monthOffset: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

// 달성률에 따른 색상 클래스
function getColorClass(rate: number): string {
  if (rate === 0) return 'bg-gray-100';
  if (rate <= 0.25) return 'bg-indigo-100';
  if (rate <= 0.5) return 'bg-indigo-200';
  if (rate <= 0.75) return 'bg-indigo-300';
  return 'bg-indigo-500';
}

// 요일 헤더
const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export function MonthlyHeatmap({
  dailyRates,
  monthLabel,
  monthOffset,
  onPrevMonth,
  onNextMonth,
}: MonthlyHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    rate: number;
    x: number;
    y: number;
  } | null>(null);

  if (dailyRates.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-[var(--color-text-secondary)]">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // 첫 날의 요일 인덱스 계산 (0=일요일)
  const firstDate = new Date(dailyRates[0]?.date ?? '');
  const firstDayOfWeek = firstDate.getDay(); // 0(일) ~ 6(토)

  // 그리드 셀 배열 생성 (빈 칸 + 날짜 칸)
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => ({ key: `empty-${i}`, isEmpty: true }));
  const dateCells = dailyRates.map((d) => ({ ...d, isEmpty: false, key: d.date }));
  const allCells = [...emptyCells, ...dateCells];

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">월간 히트맵</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
          >
            ◀
          </button>
          <span className="min-w-[80px] text-center text-xs text-[var(--color-text-secondary)]">
            {monthLabel}
          </span>
          <button
            onClick={onNextMonth}
            disabled={monthOffset >= 0}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-[var(--color-text-tertiary)]">
            {day}
          </div>
        ))}
      </div>

      {/* 히트맵 그리드 */}
      <div className="relative grid grid-cols-7 gap-1">
        {allCells.map((cell) => {
          if (cell.isEmpty) {
            return <div key={cell.key} className="aspect-square" />;
          }

          const dayCell = cell as DayRate & { key: string; isEmpty: false };
          const dayNum = parseInt(dayCell.date.split('-')[2] ?? '0', 10);

          return (
            <div
              key={dayCell.key}
              className={`relative aspect-square cursor-pointer rounded-sm transition-opacity hover:opacity-80 ${getColorClass(dayCell.completionRate)}`}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({
                  date: dayCell.date,
                  rate: dayCell.completionRate,
                  x: rect.left,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* 날짜 숫자 (작게) */}
              <span className="absolute bottom-0.5 right-1 text-[9px] font-medium text-gray-500/70">
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-lg text-xs pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 48 }}
        >
          <p className="font-medium text-[var(--color-text-primary)]">{tooltip.date}</p>
          <p className="text-[var(--color-brand-primary)]">
            달성률 {Math.round(tooltip.rate * 100)}%
          </p>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-xs text-[var(--color-text-tertiary)]">낮음</span>
        {['bg-gray-100', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-500'].map(
          (cls) => (
            <div key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
          ),
        )}
        <span className="text-xs text-[var(--color-text-tertiary)]">높음</span>
      </div>
    </div>
  );
}
