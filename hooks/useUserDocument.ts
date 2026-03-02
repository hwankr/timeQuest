// 사용자 문서 실시간 구독 훅 — 포인트 배지 실시간 업데이트에 사용
import { useState, useEffect } from 'react';
import { UserDocument } from '@/types';
import { UserRepository } from '@/repositories/userRepo';

/**
 * userId에 해당하는 UserDocument를 실시간으로 구독한다.
 * 포인트 배지 등 실시간 업데이트가 필요한 컴포넌트에서 사용.
 */
export function useUserDocument(userId: string | undefined): {
  userDoc: UserDocument | null;
  isLoading: boolean;
} {
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setUserDoc(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const repo = new UserRepository(userId);
    const unsubscribe = repo.subscribeToUser((doc) => {
      setUserDoc(doc);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { userDoc, isLoading };
}
