// 보상 상태 관리 — 보상 목록, 구매 기록, 트랜잭션
import { create } from 'zustand';
import { Reward, RewardPurchase } from '@/types';
import { RewardRepository } from '@/repositories/rewardRepo';
import { PurchaseRepository, PurchaseResult } from '@/repositories/purchaseRepo';
import { hapticSuccess, hapticError } from '@/utils/haptics';

// ─────────────────────────────────────────────
// 상태 인터페이스
// ─────────────────────────────────────────────

interface RewardState {
  // 데이터
  rewards: Reward[];
  purchases: RewardPurchase[];

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션
  loadRewards: (userId: string) => Promise<void>;
  purchaseReward: (userId: string, date: string, rewardId: string) => Promise<PurchaseResult>;
  markUsed: (userId: string, date: string, purchaseId: string) => Promise<void>;
  subscribeToPurchases: (userId: string, date: string) => () => void;
  setPurchases: (purchases: RewardPurchase[]) => void;
  createReward: (userId: string, data: Omit<Reward, 'id' | 'createdAt' | 'isActive' | 'sortOrder' | 'isCustom'>) => Promise<void>;
  updateReward: (userId: string, rewardId: string, data: Partial<Reward>) => Promise<void>;
  deleteReward: (userId: string, rewardId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────

const initialState = {
  rewards: [],
  purchases: [],
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useRewardStore = create<RewardState>((set) => ({
  ...initialState,

  /** 보상 목록 로드 */
  loadRewards: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const repo = new RewardRepository(userId);
      const rewards = await repo.getRewards();
      set({ rewards, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '보상 목록을 불러올 수 없습니다';
      set({ isLoading: false, error: message });
    }
  },

  /** 보상 구매 — runTransaction via PurchaseRepository */
  purchaseReward: async (userId: string, date: string, rewardId: string): Promise<PurchaseResult> => {
    set({ error: null });
    try {
      const repo = new PurchaseRepository(userId);
      const result = await repo.purchaseReward(date, rewardId);
      await hapticSuccess();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '구매에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 구매 사용 처리 */
  markUsed: async (userId: string, date: string, purchaseId: string): Promise<void> => {
    set({ error: null });
    try {
      const repo = new PurchaseRepository(userId);
      await repo.markPurchaseUsed(date, purchaseId);
      await hapticSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용 처리에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 구매 기록 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToPurchases: (userId: string, date: string) => {
    const repo = new PurchaseRepository(userId);
    return repo.subscribeToPurchases(date, (purchases) => {
      set({ purchases });
    });
  },

  setPurchases: (purchases) => set({ purchases }),

  /** 커스텀 보상 생성 */
  createReward: async (userId: string, data: Omit<Reward, 'id' | 'createdAt' | 'isActive' | 'sortOrder' | 'isCustom'>): Promise<void> => {
    set({ error: null });
    try {
      const repo = new RewardRepository(userId);
      await repo.createReward({ ...data, isActive: true, isCustom: true, sortOrder: 9999 });
      await hapticSuccess();
      // 목록 새로고침
      const rewards = await repo.getRewards();
      set({ rewards });
    } catch (err) {
      const message = err instanceof Error ? err.message : '보상 생성에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 커스텀 보상 수정 */
  updateReward: async (userId: string, rewardId: string, data: Partial<Reward>): Promise<void> => {
    set({ error: null });
    try {
      const repo = new RewardRepository(userId);
      await repo.updateReward(rewardId, data);
      await hapticSuccess();
      const rewards = await repo.getRewards();
      set({ rewards });
    } catch (err) {
      const message = err instanceof Error ? err.message : '보상 수정에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  /** 커스텀 보상 삭제 */
  deleteReward: async (userId: string, rewardId: string): Promise<void> => {
    set({ error: null });
    try {
      const repo = new RewardRepository(userId);
      await repo.deleteReward(rewardId);
      await hapticSuccess();
      const rewards = await repo.getRewards();
      set({ rewards });
    } catch (err) {
      const message = err instanceof Error ? err.message : '보상 삭제에 실패했습니다';
      set({ error: message });
      await hapticError();
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
