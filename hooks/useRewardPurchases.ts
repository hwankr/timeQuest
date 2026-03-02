// 구매 기록 실시간 구독 훅 — 구독/해제 생명주기 관리
import { useEffect } from 'react';
import { useRewardStore } from '@/stores/useRewardStore';

/**
 * userId + date 기준 구매 기록을 실시간 구독한다.
 * 컴포넌트 마운트 시 구독 시작, 언마운트 시 자동 해제.
 */
export function useRewardPurchases(userId: string | undefined, date: string | undefined): void {
  const subscribeToPurchases = useRewardStore((s) => s.subscribeToPurchases);

  useEffect(() => {
    if (!userId || !date) return;

    const unsubscribe = subscribeToPurchases(userId, date);
    return () => {
      unsubscribe();
    };
  }, [userId, date, subscribeToPurchases]);
}
