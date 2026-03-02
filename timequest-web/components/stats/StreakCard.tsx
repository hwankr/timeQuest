'use client';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🔥</span>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">스트릭</h3>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{currentStreak}일</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">현재 연속</p>
        </div>
        <div className="mb-1 border-l border-[var(--color-border)] pl-4">
          <p className="text-lg font-semibold text-[var(--color-text-secondary)]">{longestStreak}일</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">최장 기록</p>
        </div>
      </div>
    </div>
  );
}
