'use client';

interface PointsSummaryProps {
  currentPoints: number;
  totalPointsLifetime: number;
  weeklyEarned: number;
  weeklySpent: number;
}

export function PointsSummary({
  currentPoints,
  totalPointsLifetime,
  weeklyEarned,
  weeklySpent,
}: PointsSummaryProps) {
  const weeklyNet = weeklyEarned - weeklySpent;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">⭐</span>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">포인트</h3>
      </div>

      {/* 현재 보유 */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-[var(--color-point)]">
          {currentPoints.toLocaleString()}pt
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">현재 보유</p>
      </div>

      {/* 이번 주 수입/지출 */}
      <div className="space-y-1.5 border-t border-[var(--color-border)] pt-3">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-tertiary)]">이번 주 획득</span>
          <span className="font-medium text-[var(--color-success)]">
            +{weeklyEarned.toLocaleString()}pt
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-tertiary)]">이번 주 사용</span>
          <span className="font-medium text-[var(--color-error)]">
            -{weeklySpent.toLocaleString()}pt
          </span>
        </div>
        <div className="flex justify-between text-xs border-t border-[var(--color-border)] pt-1.5">
          <span className="text-[var(--color-text-secondary)] font-medium">순 변동</span>
          <span
            className={`font-semibold ${
              weeklyNet >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
            }`}
          >
            {weeklyNet >= 0 ? '+' : ''}{weeklyNet.toLocaleString()}pt
          </span>
        </div>
      </div>

      {/* 누적 */}
      <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        누적 획득 {totalPointsLifetime.toLocaleString()}pt
      </div>
    </div>
  );
}
