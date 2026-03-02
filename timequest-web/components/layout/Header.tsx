'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserDocument } from '@/hooks/useUserDocument';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const userDocument = useUserDocument();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      {/* 페이지 제목 */}
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>

      {/* 사용자 정보 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--color-point)]">⭐</span>
          <span className="text-sm font-medium text-[var(--color-point)]">
            {(userDocument?.currentPoints ?? 0).toLocaleString()}pt
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-7 w-7 rounded-full bg-[var(--color-brand-primary)] text-xs font-medium text-white flex items-center justify-center">
            {(userDocument?.displayName || user?.email || '?')[0].toUpperCase()}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {userDocument?.displayName || user?.email?.split('@')[0] || '사용자'}
          </span>
        </div>
      </div>
    </header>
  );
}
