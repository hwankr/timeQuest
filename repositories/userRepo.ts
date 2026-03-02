// 사용자 Repository — Firestore 접근 계층
// Phase 1에서는 인터페이스만 정의, 실제 CRUD는 Phase 2에서 구현

import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserDocument } from '@/types';

export class UserRepository {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /** 사용자 문서 조회 — Phase 2에서 구현 */
  async getUser(): Promise<UserDocument | null> {
    const ref = doc(db, 'users', this.userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserDocument;
  }
}
