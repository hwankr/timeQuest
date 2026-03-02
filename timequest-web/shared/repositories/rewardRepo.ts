// Reward Repository — 보상 Firestore 접근 계층

import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { Reward } from '@/types';
import { DEFAULT_REWARDS } from '@/constants/rewards';
import { toReward } from './converters';

export class RewardRepository {
  constructor(private userId: string) {}

  /** 보상 목록 조회 (sortOrder 오름차순) */
  async getRewards(): Promise<Reward[]> {
    const ref = collection(db, 'users', this.userId, 'rewards');
    const q = query(ref, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toReward(d.id, d.data()));
  }

  /** 기본 보상 12개 일괄 생성 (writeBatch) — 온보딩 시 호출 */
  async createDefaultRewards(): Promise<void> {
    const batch = writeBatch(db);
    const colRef = collection(db, 'users', this.userId, 'rewards');
    const now = Timestamp.now();

    DEFAULT_REWARDS.forEach((reward, index) => {
      const docRef = doc(colRef);
      batch.set(docRef, {
        ...reward,
        isActive: true,
        isCustom: false,
        sortOrder: index,
        createdAt: now,
      });
    });

    await batch.commit();
  }

  /** 단일 보상 조회 */
  async getReward(rewardId: string): Promise<Reward | null> {
    const ref = doc(db, 'users', this.userId, 'rewards', rewardId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toReward(snap.id, snap.data());
  }

  /** 커스텀 보상 생성 — 새 문서 ID 반환 */
  async createReward(data: Omit<Reward, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(db, 'users', this.userId, 'rewards');
    const newRef = doc(colRef);
    await setDoc(newRef, {
      ...data,
      createdAt: Timestamp.now(),
    });
    return newRef.id;
  }

  /** 보상 수정 */
  async updateReward(rewardId: string, data: Partial<Omit<Reward, 'id' | 'createdAt'>>): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'rewards', rewardId);
    await updateDoc(ref, data);
  }

  /** 보상 삭제 */
  async deleteReward(rewardId: string): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'rewards', rewardId);
    await deleteDoc(ref);
  }

  /** 보상 목록 실시간 구독 */
  subscribeToRewards(callback: (rewards: Reward[]) => void): () => void {
    const ref = collection(db, 'users', this.userId, 'rewards');
    const q = query(ref, orderBy('sortOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      const rewards = snap.docs.map((d) => toReward(d.id, d.data()));
      callback(rewards);
    });
  }
}
