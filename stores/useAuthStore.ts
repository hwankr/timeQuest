// Auth 상태 관리 — Firebase Auth + Zustand
// isInitializing / isSubmitting 분리로 스플래시 재표시 버그 방지

import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

interface AuthState {
  user: User | null;
  /** 앱 시작 시 Firebase Auth 상태 최초 확인 중 (true → 스플래시 표시) */
  isInitializing: boolean;
  /** signIn/signUp API 호출 진행 중 (true → 버튼 비활성화, 인라인 스피너) */
  isSubmitting: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 액션
  /** onAuthStateChanged 리스너 등록, unsubscribe 함수 반환 */
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitializing: true, // 앱 시작 시 true — onAuthStateChanged 첫 콜백에서 false로 전환
  isSubmitting: false, // signIn/signUp 호출 시에만 true
  isAuthenticated: false,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isInitializing: false, // 최초 Auth 상태 확인 완료
        // 주의: isSubmitting은 여기서 건드리지 않음
        // signIn/signUp 성공 시 onAuthStateChanged가 발화되지만,
        // isSubmitting은 signIn/signUp의 try/finally에서 관리
      });
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  signUp: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
  },

  clearError: () => set({ error: null }),
}));

// Firebase Auth 에러 메시지 한국어 변환 헬퍼
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/invalid-email':
        return '올바른 이메일 주소를 입력해주세요';
      case 'auth/user-disabled':
        return '비활성화된 계정입니다';
      case 'auth/user-not-found':
        return '등록되지 않은 이메일입니다';
      case 'auth/wrong-password':
        return '비밀번호가 올바르지 않습니다';
      case 'auth/email-already-in-use':
        return '이미 사용 중인 이메일입니다';
      case 'auth/weak-password':
        return '비밀번호는 6자 이상이어야 합니다';
      case 'auth/too-many-requests':
        return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요';
      case 'auth/invalid-credential':
        return '이메일 또는 비밀번호가 올바르지 않습니다';
      default:
        return '인증 오류가 발생했습니다. 다시 시도해주세요';
    }
  }
  return '알 수 없는 오류가 발생했습니다';
}
