'use client';

import { useEffect, useState } from 'react';
import { UserDocument } from '@/types';
import { UserRepository } from '@/repositories/userRepo';
import { useAuth } from './useAuth';

// 사용자 문서 실시간 구독 훅
export function useUserDocument(): UserDocument | null {
  const { user } = useAuth();
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);

  useEffect(() => {
    if (!user) {
      setUserDocument(null);
      return;
    }

    const repo = new UserRepository(user.uid);
    const unsubscribe = repo.subscribeToUser((doc) => {
      setUserDocument(doc);
    });

    return unsubscribe;
  }, [user]);

  return userDocument;
}
