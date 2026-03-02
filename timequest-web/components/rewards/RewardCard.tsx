'use client';

import { useState } from 'react';
import { Reward } from '@/types';
import { CATEGORY_LABELS } from '@/hooks/useRewards';

interface RewardCardProps {
  reward: Reward;
  onEdit: (reward: Reward) => void;
  onDelete: (rewardId: string) => void;
  onToggleActive: (rewardId: string, isActive: boolean) => void;
}

export function RewardCard({ reward, onEdit, onDelete, onToggleActive }: RewardCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(reward.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // 3초 후 자동 취소
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-xl border p-4 transition-all ${
        reward.isActive
          ? 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm'
          : 'border-[var(--color-border)] bg-[var(--color-bg)] opacity-60'
      }`}
    >
      {/* 비활성 배지 */}
      {!reward.isActive && (
        <span className="absolute right-3 top-3 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
          비활성
        </span>
      )}

      {/* 아이콘 + 이름 */}
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none">{reward.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {reward.name}
          </h3>
          {reward.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
              {reward.description}
            </p>
          )}
        </div>
      </div>

      {/* 포인트 + 카테고리 */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-[var(--color-point)]">
          {reward.cost.toLocaleString()}pt
        </span>
        <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
          {CATEGORY_LABELS[reward.category]}
        </span>
      </div>

      {/* 제한 정보 */}
      <div className="flex flex-wrap gap-1.5">
        {reward.cooldownHours > 0 && (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
            쿨다운 {reward.cooldownHours}시간
          </span>
        )}
        {reward.dailyLimit !== -1 && (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
            일일 {reward.dailyLimit}회
          </span>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-2">
        {/* 활성/비활성 토글 */}
        <button
          onClick={() => onToggleActive(reward.id, !reward.isActive)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            reward.isActive
              ? 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-gray-100'
              : 'bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-dark)]'
          }`}
        >
          {reward.isActive ? '비활성화' : '활성화'}
        </button>

        {/* 편집 */}
        <button
          onClick={() => onEdit(reward)}
          className="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100"
        >
          편집
        </button>

        {/* 삭제 (기본 보상은 삭제 불가) */}
        {reward.isCustom ? (
          <button
            onClick={handleDeleteClick}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              confirmDelete
                ? 'bg-[var(--color-error)] text-white'
                : 'bg-[var(--color-bg)] text-[var(--color-error)] hover:bg-red-50'
            }`}
          >
            {confirmDelete ? '확인' : '삭제'}
          </button>
        ) : (
          <span className="rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-tertiary)]">
            기본
          </span>
        )}
      </div>
    </div>
  );
}
