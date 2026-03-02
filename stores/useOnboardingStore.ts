// 온보딩 상태 관리 스토어
// 온보딩 완료 시 단일 writeBatch로 모든 초기 데이터를 원자적으로 생성한다
import { create } from 'zustand';
import { db } from '@/config/firebase';
import {
  doc,
  collection,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { generateDefaultBlocks } from '@/utils/generateDefaultBlocks';
import { DEFAULT_REWARDS } from '@/constants/rewards';
import { DEFAULT_SETTINGS } from '@/repositories/converters';

// ─────────────────────────────────────────────
// 상태 인터페이스
// ─────────────────────────────────────────────

interface OnboardingState {
  step: 'welcome' | 'time-setup' | 'creating' | 'complete';
  wakeUpTime: string;   // "HH:mm", 기본값 "07:00"
  bedTime: string;      // "HH:mm", 기본값 "23:00"
  isCreating: boolean;
  error: string | null;

  setWakeUpTime: (time: string) => void;
  setBedTime: (time: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: (userId: string, email: string) => Promise<void>;
  reset: () => void;
}

const STEP_ORDER: OnboardingState['step'][] = ['welcome', 'time-setup', 'creating', 'complete'];

// ─────────────────────────────────────────────
// 스토어
// ─────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 'welcome',
  wakeUpTime: '07:00',
  bedTime: '23:00',
  isCreating: false,
  error: null,

  setWakeUpTime: (time) => set({ wakeUpTime: time }),
  setBedTime: (time) => set({ bedTime: time }),

  nextStep: () => {
    const current = get().step;
    const idx = STEP_ORDER.indexOf(current);
    if (idx < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[idx + 1] });
    }
  },

  prevStep: () => {
    const current = get().step;
    const idx = STEP_ORDER.indexOf(current);
    if (idx > 0) {
      set({ step: STEP_ORDER[idx - 1] });
    }
  },

  /**
   * 온보딩 완료 처리 — 단일 writeBatch로 모든 초기 데이터 원자적 생성
   *
   * [Repository 패턴 예외 이유]
   * 온보딩은 UserDocument, ScheduleTemplate, TimeBlock(~12개), Reward(12개)를
   * 하나의 원자적 트랜잭션으로 생성해야 한다. writeBatch는 여러 컬렉션에
   * 걸쳐 all-or-nothing 보장을 제공하며, 이를 개별 Repository 메서드로
   * 분리하면 원자성을 잃게 된다. 따라서 이 메서드에서만 Firestore 경로를
   * 직접 구성한다. 이 경로들은 각 Repository가 사용하는 경로와 동일하다.
   */
  completeOnboarding: async (userId: string, email: string) => {
    set({ isCreating: true, error: null, step: 'creating' });

    try {
      const { wakeUpTime, bedTime } = get();

      // 기본 블록 생성
      const defaultBlocks = generateDefaultBlocks(wakeUpTime, bedTime);

      // Firestore 문서 참조 준비
      const userRef = doc(db, 'users', userId);
      const templateRef = doc(collection(db, 'users', userId, 'templates'));
      const templateId = templateRef.id;

      const now = Timestamp.now();

      // 모든 dayTemplateMap 요일에 동일한 기본 템플릿 ID 배정
      const dayTemplateMap = {
        mon: templateId,
        tue: templateId,
        wed: templateId,
        thu: templateId,
        fri: templateId,
        sat: templateId,
        sun: templateId,
      };

      // ─── writeBatch 구성 (~26개 연산) ───
      const batch = writeBatch(db);

      // 1. 사용자 문서 생성 (onboardingComplete: false — 마지막에 true로 업데이트)
      batch.set(userRef, {
        displayName: '',
        email,
        currentPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalPointsLifetime: 0,
        totalBlocksCompleted: 0,
        level: 1,
        experience: 0,
        lastActiveDate: '',
        createdAt: now,
        onboardingComplete: false,
        settings: {
          ...DEFAULT_SETTINGS,
          defaultTemplateId: templateId,
          dayTemplateMap,
        },
      });

      // 2. 기본 템플릿 생성
      batch.set(templateRef, {
        name: '기본 템플릿',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });

      // 3. 기본 블록 생성 (10~12개)
      const blocksColRef = collection(db, 'users', userId, 'templates', templateId, 'blocks');
      for (const block of defaultBlocks) {
        const blockRef = doc(blocksColRef);
        batch.set(blockRef, block);
      }

      // 4. 기본 보상 생성 (12개)
      const rewardsColRef = collection(db, 'users', userId, 'rewards');
      DEFAULT_REWARDS.forEach((reward, index) => {
        const rewardRef = doc(rewardsColRef);
        batch.set(rewardRef, {
          ...reward,
          isActive: true,
          isCustom: false,
          sortOrder: index,
          createdAt: now,
        });
      });

      // 5. 마지막: onboardingComplete: true 설정 + settings 확정
      // (논리적 완료 플래그 — 배치 실패 시 false 유지되어 재실행 가능)
      batch.update(userRef, {
        onboardingComplete: true,
        'settings.defaultTemplateId': templateId,
        'settings.dayTemplateMap': dayTemplateMap,
      });

      await batch.commit();

      set({ step: 'complete', isCreating: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '온보딩 데이터 생성에 실패했습니다';
      set({ error: message, isCreating: false, step: 'time-setup' });
      throw err;
    }
  },

  reset: () =>
    set({
      step: 'welcome',
      wakeUpTime: '07:00',
      bedTime: '23:00',
      isCreating: false,
      error: null,
    }),
}));
