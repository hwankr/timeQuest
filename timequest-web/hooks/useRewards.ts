'use client';

import { useState, useEffect } from 'react';
import { Reward, RewardCategory } from '@/types';
import { RewardRepository } from '@/repositories/rewardRepo';
import { useAuth } from './useAuth';

// 보상 CRUD 훅
// purchaseRepo의 쓰기 메서드(purchaseReward, markPurchaseUsed)는 웹에서 미노출
// "No point mutations from web" 원칙 준수

export interface UseRewardsReturn {
  rewards: Reward[];
  isLoading: boolean;
  createReward: (data: Omit<Reward, 'id' | 'createdAt'>) => Promise<string>;
  updateReward: (rewardId: string, data: Partial<Omit<Reward, 'id' | 'createdAt'>>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  toggleActive: (rewardId: string, isActive: boolean) => Promise<void>;
}

export function useRewards(): UseRewardsReturn {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRewards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const repo = new RewardRepository(user.uid);

    // 실시간 구독
    const unsubscribe = repo.subscribeToRewards((updated) => {
      setRewards(updated);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createReward = async (data: Omit<Reward, 'id' | 'createdAt'>): Promise<string> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new RewardRepository(user.uid);
    return repo.createReward(data);
  };

  const updateReward = async (
    rewardId: string,
    data: Partial<Omit<Reward, 'id' | 'createdAt'>>,
  ): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new RewardRepository(user.uid);
    return repo.updateReward(rewardId, data);
  };

  const deleteReward = async (rewardId: string): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new RewardRepository(user.uid);
    return repo.deleteReward(rewardId);
  };

  const toggleActive = async (rewardId: string, isActive: boolean): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new RewardRepository(user.uid);
    return repo.updateReward(rewardId, { isActive });
  };

  return { rewards, isLoading, createReward, updateReward, deleteReward, toggleActive };
}

// 카테고리 한국어 라벨
export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  activity: '활동',
  convert: '전환',
  food: '음식',
  rest: '휴식',
  special: '특별',
};

export const CATEGORY_ORDER: RewardCategory[] = ['activity', 'convert', 'food', 'rest', 'special'];
