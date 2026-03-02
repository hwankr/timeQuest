// 시간표 상태 관리 — 오늘 일정, 완료 기록, 실시간 리스너
import { create } from 'zustand';
import { DailyRecord, BlockCompletion, ScheduleTemplate } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { PointRepository } from '@/repositories/pointRepo';
import { BlockConversionRepository } from '@/repositories/blockConversionRepo';
import { getTodayDate, isBlockPast } from '@/utils/time';
import { hapticSuccess, hapticError } from '@/utils/haptics';
import { ensureDailyRecord } from '@/services/dailyRecordService';
import { rescheduleAllNotifications } from '@/services/notification';

// ─────────────────────────────────────────────
// 블록 완료 반환 타입
// ─────────────────────────────────────────────

export interface CompleteBlockResult {
  pointsEarned: number;
  bonusPoints: number;
  penaltyApplied: number;
}

// ─────────────────────────────────────────────
// 상태 인터페이스
// ─────────────────────────────────────────────

interface ScheduleState {
  // 데이터
  todayRecord: DailyRecord | null;
  completions: BlockCompletion[];
  currentTemplate: ScheduleTemplate | null;

  // 리스너 상태
  isListenerActive: boolean;

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션
  loadToday: (userId: string) => Promise<void>;
  subscribeToCompletions: (userId: string, date: string) => () => void;
  completeBlock: (userId: string, blockId: string) => Promise<CompleteBlockResult>;
  convertBlock: (userId: string, date: string, blockId: string) => Promise<void>;
  setCompletions: (completions: BlockCompletion[]) => void;
  setListenerActive: (active: boolean) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────

const initialState = {
  todayRecord: null,
  completions: [],
  currentTemplate: null,
  isListenerActive: false,
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ...initialState,

  /** 오늘 일별 기록 로드 — 없으면 자동 생성 */
  loadToday: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const record = await ensureDailyRecord(userId);
      const scheduleRepo = new ScheduleRepository(userId);

      // 완료 기록 로드
      const completions = await scheduleRepo.getCompletions(record.date);

      // 템플릿 로드
      const template = await scheduleRepo.getTemplate(record.templateId);

      set({
        todayRecord: record,
        completions,
        currentTemplate: template,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '일정을 불러올 수 없습니다';
      set({ isLoading: false, error: message });
    }
  },

  /** 완료 기록 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToCompletions: (userId: string, date: string) => {
    const repo = new ScheduleRepository(userId);
    set({ isListenerActive: true });
    const unsubscribe = repo.subscribeToCompletions(date, (completions) => {
      set({ completions });
    });
    return () => {
      unsubscribe();
      set({ isListenerActive: false });
    };
  },

  /**
   * 블록 완료 처리
   * - isListenerActive 확인 (신선한 데이터 보장)
   * - 지각 패널티 판별
   * - 연속 완료 보너스 판별
   * - PointRepository.earnPoints (runTransaction) 호출
   * - 햅틱 피드백
   */
  completeBlock: async (userId: string, blockId: string): Promise<CompleteBlockResult> => {
    const { completions, isListenerActive, todayRecord } = get();

    // 0. 리스너 활성 상태 확인 — 비활성이면 완료 불가
    if (!isListenerActive) {
      await hapticError();
      throw new Error('실시간 리스너가 비활성 상태입니다. 잠시 후 다시 시도해주세요.');
    }

    if (!todayRecord) {
      throw new Error('오늘 일별 기록이 없습니다.');
    }

    // 1. 완료 기록에서 해당 블록 찾기
    const completion = completions.find((c) => c.blockId === blockId);
    if (!completion) {
      throw new Error(`블록 ${blockId}를 찾을 수 없습니다.`);
    }

    // 2. 이미 완료된 블록 검사
    if (completion.completed) {
      throw new Error('이미 완료된 블록입니다.');
    }

    // 3. 현재 시간으로 지각 여부 판별
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isPastEndTime = isBlockPast(completion.endTime, currentTime);
    const isOnTime = !isPastEndTime;

    // 4. 연속 완료 판별 — 정렬된 completions에서 이전 블록 확인
    // sortOrder 기준으로 현재 블록의 이전 블록이 완료됐는지 확인
    const sortedCompletions = [...completions].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    const currentIndex = sortedCompletions.findIndex((c) => c.blockId === blockId);
    const isConsecutive =
      currentIndex > 0 ? sortedCompletions[currentIndex - 1].completed : false;

    // 5. 포인트 적립 트랜잭션
    const pointRepo = new PointRepository(userId);
    const result = await pointRepo.earnPoints({
      date: todayRecord.date,
      blockId,
      blockType: completion.blockType,
      basePoints: completion.basePoints,
      isOnTime,
      isConsecutive,
      isPastEndTime,
    });

    // 6. completionRate 계산 및 업데이트 (post-transaction, non-transactional write)
    // 과다 계산 방지: 실시간 리스너가 이미 반영했을 경우를 고려
    const scheduleRepo = new ScheduleRepository(userId);
    const currentCompletions = get().completions;
    const alreadyReflected = currentCompletions.find((c) => c.blockId === blockId)?.completed;
    const completedCount =
      currentCompletions.filter((c) => c.completed).length + (alreadyReflected ? 0 : 1);
    const newRate = Math.min(completedCount / currentCompletions.length, 1.0);
    await scheduleRepo.updateDailyRecord(todayRecord.date, { completionRate: newRate });

    // 6b. 하루 전체 완료 보너스 확인 (FULL_DAY_COMPLETION = 30pt)
    // Firestore에서 최신 레코드를 가져와 멱등성 보장 (store의 todayRecord는 stale할 수 있음)
    if (newRate >= 1.0) {
      const latestRecord = await scheduleRepo.getDailyRecord(todayRecord.date);
      if (latestRecord?.fullDayBonusAwarded !== true) {
        await pointRepo.awardFullDayBonus({ date: todayRecord.date });
        await scheduleRepo.updateDailyRecord(todayRecord.date, { fullDayBonusAwarded: true });
      }
    }

    // 7. 햅틱 피드백 (성공)
    await hapticSuccess();

    // 8. 알림 재예약 — 완료된 블록의 알림을 제거하기 위해 재예약
    // 프레젠테이션 계층(index.tsx)이 아닌 스토어 계층에서 호출 (아키텍처 원칙)
    rescheduleAllNotifications(userId);

    // 9. 상태 업데이트는 실시간 리스너(subscribeToCompletions)가 처리

    return {
      pointsEarned: result.pointsEarned,
      bonusPoints: result.bonusPoints,
      penaltyApplied: result.penaltyApplied,
    };
  },

  /** 블록 전환 처리 — 공부/운동 → 자유 블록 */
  convertBlock: async (userId: string, date: string, blockId: string): Promise<void> => {
    const repo = new BlockConversionRepository(userId);
    try {
      await repo.convertBlock(date, blockId);
      await hapticSuccess();
      // 실시간 리스너가 completions를 자동 갱신
    } catch (err) {
      await hapticError();
      throw err;
    }
  },

  setCompletions: (completions) => set({ completions }),

  setListenerActive: (active) => set({ isListenerActive: active }),

  reset: () => set(initialState),
}));
