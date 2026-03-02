'use client';

import { useState } from 'react';
import { Reward } from '@/types';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RewardList } from '@/components/rewards/RewardList';
import { RewardFormDialog } from '@/components/rewards/RewardFormDialog';
import { useRewards } from '@/hooks/useRewards';

export default function RewardsPage() {
  const { rewards, isLoading, createReward, updateReward, deleteReward, toggleActive } = useRewards();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const handleAdd = () => {
    setEditingReward(null);
    setDialogOpen(true);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingReward(null);
  };

  const handleSubmit = async (data: Omit<Reward, 'id' | 'createdAt'>) => {
    if (editingReward) {
      await updateReward(editingReward.id, data);
    } else {
      await createReward({ ...data, sortOrder: rewards.length, isCustom: true });
    }
  };

  const handleDelete = async (rewardId: string) => {
    await deleteReward(rewardId);
  };

  const handleToggleActive = async (rewardId: string, isActive: boolean) => {
    await toggleActive(rewardId, isActive);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[var(--color-bg)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title="보상 관리" />
          <main className="flex-1 overflow-auto p-6">
            {/* 페이지 헤더 */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">보상 목록</h1>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  보상을 관리하고 카테고리별로 정리하세요
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-primary-dark)]"
              >
                <span>+</span>
                <span>새 보상</span>
              </button>
            </div>

            {/* 로딩 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
                  <p className="text-sm text-[var(--color-text-secondary)]">보상 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <RewardList
                rewards={rewards}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            )}
          </main>
        </div>
      </div>

      {/* 보상 추가/편집 다이얼로그 */}
      <RewardFormDialog
        open={dialogOpen}
        reward={editingReward}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </AuthGuard>
  );
}
