'use client';

import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

// 루트 레이아웃 — AuthProvider로 전체 앱 래핑
// 'use client' 사용으로 metadata export 불가 → <title> 직접 삽입
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <title>TimeQuest</title>
        <meta name="description" content="자기관리 게이미피케이션 대시보드" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
