'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserDocument } from '@/hooks/useUserDocument';

// 네비게이션 아이템 정의
const NAV_ITEMS = [
  { href: '/schedule', label: '시간표', icon: '📋' },
  { href: '/rewards', label: '보상', icon: '🎁' },
  { href: '/stats', label: '통계', icon: '📊' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const userDocument = useUserDocument();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6">
      {/* 로고 */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-brand-primary)]">TimeQuest</h1>
        <p className="text-xs text-[var(--color-text-tertiary)]">자기관리 게이미피케이션</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-brand-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* 구분선 */}
      <div className="mb-4 border-t border-[var(--color-border)]" />

      {/* 사용자 정보 */}
      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span>👤</span>
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {userDocument?.displayName || user?.email || '사용자'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>⭐</span>
          <span className="text-sm text-[var(--color-point)]">
            {(userDocument?.currentPoints ?? 0).toLocaleString()}pt
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {userDocument?.currentStreak ?? 0}일 연속
          </span>
        </div>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-error)]"
      >
        로그아웃
      </button>
    </aside>
  );
}
