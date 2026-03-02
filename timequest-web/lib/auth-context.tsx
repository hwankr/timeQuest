'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// ─────────────────────────────────────────────
// 컨텍스트 타입
// ─────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────
// Firebase 에러 코드 → 한국어 메시지
// ─────────────────────────────────────────────

function getKoreanAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다';
    case 'auth/user-not-found':
      return '등록되지 않은 이메일입니다';
    case 'auth/wrong-password':
      return '비밀번호가 올바르지 않습니다';
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않습니다';
    default:
      return '로그인에 실패했습니다. 다시 시도해주세요';
  }
}

// ─────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsInitializing(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(getKoreanAuthError(err as AuthError));
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isInitializing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// useAuth hook
// ─────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다');
  }
  return ctx;
}
