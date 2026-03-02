'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

// 클라이언트 전용 라우트 보호
// middleware.ts 사용 안 함 — Firebase JS SDK는 browserLocalPersistence(IndexedDB) 사용으로 서버에서 읽기 불가
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !user) {
      router.push('/login');
    }
  }, [user, isInitializing, router]);

  // Auth 초기화 중 — 전체 화면 로딩 스피너
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-secondary)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 — 리다이렉트 중 (빈 화면)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
