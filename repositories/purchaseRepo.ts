// Purchase Repository — 구매 트랜잭션 Firestore 접근 계층
import { db } from '@/config/firebase';
import {
  doc, collection, query, where, getDocs, runTransaction,
  Timestamp, onSnapshot, increment, QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { RewardPurchase } from '@/types';
import { toRewardPurchase, toReward, toUserDocument } from './converters';

export interface PurchaseResult {
  purchaseId: string;
  pointsSpent: number;
  newPointsTotal: number;
}

export class PurchaseRepository {
  constructor(private userId: string) {}

  /** 보상 구매 — runTransaction (reads-before-writes) */
  async purchaseReward(date: string, rewardId: string): Promise<PurchaseResult> {
    const userRef = doc(db, 'users', this.userId);
    const dailyRef = doc(db, 'users', this.userId, 'dailyRecords', date);
    const rewardRef = doc(db, 'users', this.userId, 'rewards', rewardId);
    const purchasesCol = collection(db, 'users', this.userId, 'dailyRecords', date, 'purchases');
    const newPurchaseRef = doc(purchasesCol); // auto-ID

    // Phase 1: External query for daily limit check (doc IDs only)
    const dailyPurchasesQuery = query(purchasesCol, where('rewardId', '==', rewardId));
    const dailyPurchasesSnap = await getDocs(dailyPurchasesQuery);
    const existingPurchaseIds = dailyPurchasesSnap.docs.map(d => d.id);

    return await runTransaction(db, async (transaction) => {
      // -- ALL READS FIRST --
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('purchaseReward: 사용자 문서를 찾을 수 없습니다');
      const userDoc = toUserDocument(userSnap.data());

      const dailySnap = await transaction.get(dailyRef);
      if (!dailySnap.exists()) throw new Error('purchaseReward: 오늘 일별 기록을 찾을 수 없습니다');

      const rewardSnap = await transaction.get(rewardRef);
      if (!rewardSnap.exists()) throw new Error('purchaseReward: 보상을 찾을 수 없습니다');
      const reward = toReward(rewardSnap.id, rewardSnap.data());

      // Re-validate existing purchases inside transaction
      let validPurchaseCount = 0;
      for (const purchaseId of existingPurchaseIds) {
        const pRef = doc(purchasesCol, purchaseId);
        const pSnap = await transaction.get(pRef);
        if (pSnap.exists() && pSnap.data()?.rewardId === rewardId) {
          validPurchaseCount++;
        }
      }

      // -- VALIDATIONS --
      if (!reward.isActive) throw new Error('비활성화된 보상입니다');
      if (userDoc.currentPoints < reward.cost) throw new Error('포인트가 부족합니다');
      if (reward.dailyLimit !== -1 && validPurchaseCount >= reward.dailyLimit) {
        throw new Error('오늘 구매 한도를 초과했습니다');
      }

      // Cooldown check
      if (reward.cooldownHours > 0 && existingPurchaseIds.length > 0) {
        // Find most recent purchase time from the external query
        const latestPurchase = dailyPurchasesSnap.docs
          .filter(d => d.data().rewardId === rewardId)
          .sort((a, b) => b.data().purchasedAt.toMillis() - a.data().purchasedAt.toMillis())[0];
        if (latestPurchase) {
          const lastTime = latestPurchase.data().purchasedAt as Timestamp;
          const elapsedMs = Timestamp.now().toMillis() - lastTime.toMillis();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);
          if (elapsedHours < reward.cooldownHours) {
            throw new Error(`재구매 대기 시간이 남아있습니다 (${Math.ceil(reward.cooldownHours - elapsedHours)}시간 후)`);
          }
        }
      }

      // -- ALL WRITES AFTER --
      const newTotal = userDoc.currentPoints - reward.cost;

      transaction.set(newPurchaseRef, {
        rewardId: reward.id,
        rewardName: reward.name,
        rewardIcon: reward.icon,
        pointsSpent: reward.cost,
        purchasedAt: Timestamp.now(),
        used: false,
        usedAt: null,
      });

      transaction.update(userRef, {
        currentPoints: newTotal,
      });

      transaction.update(dailyRef, {
        totalPointsSpent: increment(reward.cost),
      });

      return {
        purchaseId: newPurchaseRef.id,
        pointsSpent: reward.cost,
        newPointsTotal: newTotal,
      };
    });
  }

  /** 구매 사용 처리 */
  async markPurchaseUsed(date: string, purchaseId: string): Promise<void> {
    const purchaseRef = doc(db, 'users', this.userId, 'dailyRecords', date, 'purchases', purchaseId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(purchaseRef);
      if (!snap.exists()) throw new Error('구매 기록을 찾을 수 없습니다');
      if (snap.data()?.used) throw new Error('이미 사용된 보상입니다');

      transaction.update(purchaseRef, {
        used: true,
        usedAt: Timestamp.now(),
      });
    });
  }

  /** 오늘의 구매 목록 */
  async getTodayPurchases(date: string): Promise<RewardPurchase[]> {
    const ref = collection(db, 'users', this.userId, 'dailyRecords', date, 'purchases');
    const snap = await getDocs(ref);
    return snap.docs.map((d) => toRewardPurchase(d.id, d.data()));
  }

  /** 구매 기록 실시간 구독 */
  subscribeToPurchases(date: string, callback: (purchases: RewardPurchase[]) => void): () => void {
    const ref = collection(db, 'users', this.userId, 'dailyRecords', date, 'purchases');
    return onSnapshot(ref, (snap: QuerySnapshot<DocumentData>) => {
      const purchases = snap.docs.map((d) => toRewardPurchase(d.id, d.data()));
      callback(purchases);
    });
  }
}
