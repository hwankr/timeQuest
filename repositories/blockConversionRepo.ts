// Block Conversion Repository — 블록 전환 트랜잭션 Firestore 접근 계층
import { db } from '@/config/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export class BlockConversionRepository {
  constructor(private userId: string) {}

  /**
   * 공부/운동 블록을 자유 블록으로 전환 (runTransaction, reads-before-writes)
   * - 이미 완료/전환/건너뛴 블록은 전환 불가
   * - study / exercise 타입만 전환 가능
   */
  async convertBlock(date: string, blockId: string): Promise<void> {
    const completionRef = doc(
      db,
      'users',
      this.userId,
      'dailyRecords',
      date,
      'completions',
      blockId,
    );
    const userRef = doc(db, 'users', this.userId);

    await runTransaction(db, async (transaction) => {
      // ── ALL READS FIRST ──
      const completionSnap = await transaction.get(completionRef);
      if (!completionSnap.exists()) throw new Error('블록을 찾을 수 없습니다');

      const data = completionSnap.data();
      if (data?.completed) throw new Error('이미 완료된 블록입니다');
      if (data?.converted) throw new Error('이미 전환된 블록입니다');
      if (data?.skipped) throw new Error('건너뛴 블록은 전환할 수 없습니다');

      const blockType = data?.blockType;
      if (blockType !== 'study' && blockType !== 'exercise') {
        throw new Error('공부/운동 블록만 전환할 수 있습니다');
      }

      // userRef read for transaction consistency
      await transaction.get(userRef);

      // ── ALL WRITES AFTER ──
      transaction.update(completionRef, {
        blockType: 'free',
        basePoints: 0,
        converted: true,
      });
    });
  }
}
