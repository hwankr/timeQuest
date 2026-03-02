// Point Repository — 포인트 트랜잭션 Firestore 접근 계층
// 모든 포인트 변경은 runTransaction으로 원자적으로 처리

import { db } from '@/config/firebase';
import { doc, runTransaction, Timestamp, increment, updateDoc } from 'firebase/firestore';
import { UserDocument, BlockType } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { toUserDocument } from './converters';

// ─────────────────────────────────────────────
// 모듈 상수
// ─────────────────────────────────────────────

const BONUS_POINTS = {
  ON_TIME_COMPLETION: 3,
  CONSECUTIVE_BLOCKS: 2,
  MORNING_STREAK: 10,
  FULL_DAY_COMPLETION: 30,
} as const;

const PENALTY = {
  SKIP_BLOCK: -5,
  LATE_COMPLETION: -2,
} as const;

const MAX_STREAK_MULTIPLIER = 0.5; // 최대 50%

// ─────────────────────────────────────────────
// 반환 타입
// ─────────────────────────────────────────────

export interface EarnPointsResult {
  pointsEarned: number;
  bonusPoints: number;
  newTotal: number;
  penaltyApplied: number;
}

export interface BonusCalculationResult {
  bonusPoints: number;
  breakdown: string[];
}

// ─────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────

export class PointRepository {
  constructor(private userId: string) {}

  /**
   * 블록 타입의 기본 포인트 계산 (순수 함수)
   * customBasePoints가 0보다 크면 해당 값 사용, 아니면 BLOCK_TYPES 기본값
   */
  calculateBasePoints(blockType: BlockType, customBasePoints?: number): number {
    if (customBasePoints !== undefined && customBasePoints > 0) {
      return customBasePoints;
    }
    return BLOCK_TYPES[blockType].defaultPoints;
  }

  /**
   * 보너스 포인트 계산 (순수 함수)
   * 스트릭 배수는 최대 MAX_STREAK_MULTIPLIER(50%)까지
   */
  calculateBonusPoints(params: {
    isOnTime: boolean;
    isConsecutive: boolean;
    currentStreak: number;
  }): BonusCalculationResult {
    const { isOnTime, isConsecutive, currentStreak } = params;
    let bonusPoints = 0;
    const breakdown: string[] = [];

    if (isOnTime) {
      bonusPoints += BONUS_POINTS.ON_TIME_COMPLETION;
      breakdown.push(`제시간 완료 +${BONUS_POINTS.ON_TIME_COMPLETION}`);
    }

    if (isConsecutive) {
      bonusPoints += BONUS_POINTS.CONSECUTIVE_BLOCKS;
      breakdown.push(`연속 완료 +${BONUS_POINTS.CONSECUTIVE_BLOCKS}`);
    }

    // 스트릭 배수 적용 (최대 50%)
    const streakMultiplier = Math.min(currentStreak * 0.1, MAX_STREAK_MULTIPLIER);
    if (streakMultiplier > 0) {
      breakdown.push(`스트릭 ×${(1 + streakMultiplier).toFixed(1)}`);
    }

    return { bonusPoints, breakdown };
  }

  /**
   * 스트릭 업데이트 계산 (순수 함수)
   * 연속일이면 증가, 같은 날이면 유지, 빠지면 1로 리셋
   */
  updateStreak(
    userDoc: UserDocument,
    today: string,
  ): { currentStreak: number; longestStreak: number } {
    const { lastActiveDate, currentStreak, longestStreak } = userDoc;

    if (lastActiveDate === today) {
      // 오늘 이미 활성화됨 — 변경 없음
      return { currentStreak, longestStreak };
    }

    // 어제 날짜 계산
    const todayDate = new Date(today);
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    if (lastActiveDate === yesterdayStr) {
      // 연속일 — 스트릭 증가
      newStreak = currentStreak + 1;
    } else {
      // 빠진 날 있음 — 리셋
      newStreak = 1;
    }

    const newLongest = Math.max(longestStreak, newStreak);
    return { currentStreak: newStreak, longestStreak: newLongest };
  }

  /**
   * 블록 완료 포인트 적립 (runTransaction)
   * 모든 포인트 변경은 이 함수를 통해서만 이루어짐
   */
  async earnPoints(params: {
    date: string;
    blockId: string;
    blockType: BlockType;
    basePoints: number;
    isOnTime: boolean;
    isConsecutive: boolean;
    isPastEndTime: boolean;
  }): Promise<EarnPointsResult> {
    const { date, blockId, blockType, basePoints, isOnTime, isConsecutive, isPastEndTime } = params;

    const userRef = doc(db, 'users', this.userId);
    const completionRef = doc(
      db,
      'users',
      this.userId,
      'dailyRecords',
      date,
      'completions',
      blockId,
    );
    const dailyRef = doc(db, 'users', this.userId, 'dailyRecords', date);

    return await runTransaction(db, async (transaction) => {
      // ── 모든 읽기를 쓰기 전에 수행 (Firestore 트랜잭션 규칙) ──

      // 1. 사용자 문서 읽기
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('earnPoints: 사용자 문서를 찾을 수 없습니다');
      }
      const userDoc = toUserDocument(userSnap.data());

      // 2. 완료 기록 읽기 (존재 확인 + 중복 완료 방지)
      const completionSnap = await transaction.get(completionRef);
      if (!completionSnap.exists()) {
        throw new Error(`earnPoints: 완료 기록 ${blockId}를 찾을 수 없습니다`);
      }
      if (completionSnap.data()?.completed === true) {
        throw new Error('earnPoints: 이미 완료된 블록입니다');
      }

      // 3. 일별 기록 읽기
      const dailySnap = await transaction.get(dailyRef);

      // ── 모든 쓰기는 읽기 이후에 수행 ──

      // 4. 기본 포인트 계산
      const calculatedBase = this.calculateBasePoints(blockType, basePoints);

      // 5. 보너스 포인트 계산
      const { bonusPoints } = this.calculateBonusPoints({
        isOnTime,
        isConsecutive,
        currentStreak: userDoc.currentStreak,
      });

      // 6. 스트릭 배수 적용
      const streakMultiplier = Math.min(userDoc.currentStreak * 0.1, MAX_STREAK_MULTIPLIER);
      const subtotal = calculatedBase + bonusPoints;
      const streakBonus = Math.floor(subtotal * streakMultiplier);
      let totalEarned = subtotal + streakBonus;

      // 7. 지각 패널티 (설정 활성화 + 종료 시간 초과 시)
      let penaltyApplied = 0;
      if (userDoc.settings.points.penaltyEnabled && isPastEndTime) {
        penaltyApplied = Math.abs(PENALTY.LATE_COMPLETION);
        totalEarned = Math.max(0, totalEarned + PENALTY.LATE_COMPLETION);
      }

      // 8. 포인트 하한선 0 적용
      totalEarned = Math.max(0, totalEarned);

      // 9. 스트릭 업데이트
      const today = date;
      const { currentStreak: newStreak, longestStreak: newLongest } = this.updateStreak(
        userDoc,
        today,
      );

      // 10. 사용자 문서 업데이트
      const newTotal = Math.max(0, userDoc.currentPoints + totalEarned);
      transaction.update(userRef, {
        currentPoints: newTotal,
        totalPointsLifetime: userDoc.totalPointsLifetime + totalEarned,
        totalBlocksCompleted: userDoc.totalBlocksCompleted + 1,
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: newLongest,
      });

      // 11. 완료 기록 업데이트
      transaction.update(completionRef, {
        completed: true,
        completedAt: Timestamp.now(),
        pointsEarned: totalEarned,
        bonusPoints: bonusPoints + streakBonus,
        basePoints: calculatedBase,
      });

      // 12. 일별 기록 업데이트 (totalPointsEarned 증분)
      if (dailySnap.exists()) {
        transaction.update(dailyRef, {
          totalPointsEarned: increment(totalEarned),
        });
      }

      return {
        pointsEarned: totalEarned,
        bonusPoints: bonusPoints + streakBonus,
        newTotal,
        penaltyApplied,
      };
    });
  }

  /**
   * 하루 전체 완료 보너스 지급 (FULL_DAY_COMPLETION = 30pt)
   * useScheduleStore.completeBlock에서 completionRate === 1.0 확인 후 호출.
   * fullDayBonusAwarded 플래그 확인은 호출자(store)가 담당한다.
   */
  async awardFullDayBonus(params: { date: string }): Promise<void> {
    const { date } = params;
    const userRef = doc(db, 'users', this.userId);
    const dailyRef = doc(db, 'users', this.userId, 'dailyRecords', date);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('awardFullDayBonus: 사용자 문서를 찾을 수 없습니다');
      }
      const userDoc = toUserDocument(userSnap.data());
      const bonus = BONUS_POINTS.FULL_DAY_COMPLETION;
      const newTotal = Math.max(0, userDoc.currentPoints + bonus);

      transaction.update(userRef, {
        currentPoints: newTotal,
        totalPointsLifetime: userDoc.totalPointsLifetime + bonus,
      });
      transaction.update(dailyRef, {
        totalPointsEarned: increment(bonus),
      });
    });
  }

  /**
   * 블록 건너뜀 패널티 적용 (SKIP_BLOCK = -5pt)
   * skipped: true 설정 + 포인트 차감 + dailyRecord.totalPointsEarned 차감.
   * N+1 방지: completionRate 업데이트는 호출자(store)가 처리.
   */
  async applySkipPenalty(params: {
    date: string;
    blockId: string;
  }): Promise<void> {
    const { date, blockId } = params;
    const userRef = doc(db, 'users', this.userId);
    const completionRef = doc(
      db,
      'users',
      this.userId,
      'dailyRecords',
      date,
      'completions',
      blockId,
    );
    const dailyRef = doc(db, 'users', this.userId, 'dailyRecords', date);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('applySkipPenalty: 사용자 문서를 찾을 수 없습니다');
      }
      const completionSnap = await transaction.get(completionRef);
      if (!completionSnap.exists()) {
        throw new Error(`applySkipPenalty: 완료 기록 ${blockId}를 찾을 수 없습니다`);
      }
      if (completionSnap.data()?.skipped === true) {
        // 이미 건너뜀 처리됨 — 중복 패널티 방지
        return;
      }

      const userDoc = toUserDocument(userSnap.data());
      const penalty = Math.abs(PENALTY.SKIP_BLOCK); // 5
      const newPoints = Math.max(0, userDoc.currentPoints - penalty);

      transaction.update(userRef, {
        currentPoints: newPoints,
      });
      transaction.update(completionRef, {
        skipped: true,
        completed: false,
      });
      transaction.update(dailyRef, {
        totalPointsEarned: increment(-penalty),
      });
    });
  }
}
