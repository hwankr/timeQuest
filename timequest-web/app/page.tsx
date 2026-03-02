'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// 루트 페이지 — 인증 상태에 따라 리다이렉트
export default function Home() {
  const router = useRouter();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (user) {
      router.replace('/schedule');
    } else {
      router.replace('/login');
    }
  }, [user, isInitializing, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
    </div>
  );
}
