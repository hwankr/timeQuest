// 사용자 Repository — Firestore 접근 계층

import { db } from '@/config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { UserDocument } from '@/types';
import { toUserDocument } from './converters';

export class UserRepository {
  constructor(private userId: string) {}

  /** 사용자 문서 조회 */
  async getUser(): Promise<UserDocument | null> {
    const ref = doc(db, 'users', this.userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toUserDocument(snap.data());
  }

  /** 사용자 문서 생성 (온보딩 시 호출) */
  async createUser(data: Omit<UserDocument, 'createdAt'>): Promise<void> {
    const ref = doc(db, 'users', this.userId);
    await setDoc(ref, { ...data, createdAt: Timestamp.now() });
  }

  /** 사용자 문서 부분 업데이트 */
  async updateUser(data: Partial<UserDocument>): Promise<void> {
    const ref = doc(db, 'users', this.userId);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  /**
   * 온보딩 완료 여부 확인
   * 문서가 없거나 onboardingComplete !== true이면 false 반환
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null && user.onboardingComplete === true;
  }

  /** 사용자 문서 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToUser(callback: (user: UserDocument | null) => void): Unsubscribe {
    const ref = doc(db, 'users', this.userId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(toUserDocument(snap.data()));
    });
  }
}
