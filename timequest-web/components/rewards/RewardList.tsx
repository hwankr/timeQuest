'use client';

import { useState } from 'react';
import { Reward, RewardCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/hooks/useRewards';
import { RewardCard } from './RewardCard';

interface RewardListProps {
  rewards: Reward[];
  onEdit: (reward: Reward) => void;
  onDelete: (rewardId: string) => void;
  onToggleActive: (rewardId: string, isActive: boolean) => void;
}

// 카테고리 필터 탭 (전체 포함)
type FilterTab = RewardCategory | 'all';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: '전체' },
  ...CATEGORY_ORDER.map((cat) => ({ value: cat as FilterTab, label: CATEGORY_LABELS[cat] })),
];

export function RewardList({ rewards, onEdit, onDelete, onToggleActive }: RewardListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = activeTab === 'all'
    ? rewards
    : rewards.filter((r) => r.category === activeTab);

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 탭 */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === value
                ? 'bg-[var(--color-brand-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${activeTab === value ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}`}>
              {value === 'all' ? rewards.length : rewards.filter((r) => r.category === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* 보상 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-16">
          <span className="text-4xl">🎁</span>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {activeTab === 'all' ? '보상이 없습니다' : `${CATEGORY_LABELS[activeTab as RewardCategory]} 카테고리에 보상이 없습니다`}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            새 보상을 추가해보세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
