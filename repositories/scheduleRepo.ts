// Schedule Repository — 시간표 관련 Firestore 접근 계층
// 템플릿, 블록, 일별 기록, 완료 기록 CRUD

import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ScheduleTemplate, TimeBlock, DailyRecord, BlockCompletion, DayOfWeek } from '@/types';
import {
  toScheduleTemplate,
  toTimeBlock,
  toDailyRecord,
  toBlockCompletion,
  toUserDocument,
} from './converters';

export class ScheduleRepository {
  constructor(private userId: string) {}

  // ─────────────────────────────────────────────
  // 템플릿
  // ─────────────────────────────────────────────

  /** 모든 템플릿 조회 (createdAt 오름차순) */
  async getTemplates(): Promise<ScheduleTemplate[]> {
    const ref = collection(db, 'users', this.userId, 'templates');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toScheduleTemplate(d.id, d.data()));
  }

  /** 단일 템플릿 조회 */
  async getTemplate(templateId: string): Promise<ScheduleTemplate | null> {
    const ref = doc(db, 'users', this.userId, 'templates', templateId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toScheduleTemplate(snap.id, snap.data());
  }

  /** 새 템플릿 생성 — 생성된 문서 ID 반환 */
  async createTemplate(name: string, isDefault: boolean): Promise<string> {
    const ref = collection(db, 'users', this.userId, 'templates');
    const now = Timestamp.now();
    const docRef = await addDoc(ref, { name, isDefault, createdAt: now, updatedAt: now });
    return docRef.id;
  }

  // ─────────────────────────────────────────────
  // 블록
  // ─────────────────────────────────────────────

  /** 템플릿의 블록 조회 (sortOrder 오름차순) */
  async getBlocks(templateId: string): Promise<TimeBlock[]> {
    const ref = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    const q = query(ref, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toTimeBlock(d.id, d.data()));
  }

  /** 단일 블록 생성 — 생성된 문서 ID 반환 */
  async createBlock(templateId: string, block: Omit<TimeBlock, 'id'>): Promise<string> {
    const ref = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    const docRef = await addDoc(ref, block);
    return docRef.id;
  }

  /** 여러 블록 원자적 일괄 생성 (writeBatch) */
  async createBlocksBatch(templateId: string, blocks: Omit<TimeBlock, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    const colRef = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    for (const block of blocks) {
      const docRef = doc(colRef);
      batch.set(docRef, block);
    }
    await batch.commit();
  }

  /** 템플릿 이름/isDefault 부분 업데이트 */
  async updateTemplate(templateId: string, data: Partial<Pick<ScheduleTemplate, 'name' | 'isDefault'>>): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'templates', templateId);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  }

  /** 템플릿과 하위 블록 전체 삭제 (writeBatch) */
  async deleteTemplate(templateId: string): Promise<void> {
    const blocksRef = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    const blocksSnap = await getDocs(blocksRef);
    const batch = writeBatch(db);
    for (const blockDoc of blocksSnap.docs) {
      batch.delete(blockDoc.ref);
    }
    const templateRef = doc(db, 'users', this.userId, 'templates', templateId);
    batch.delete(templateRef);
    await batch.commit();
  }

  /** 템플릿 복제 — 이름에 " (복사본)" 추가, 블록 전체 복사 → 새 templateId 반환 */
  async duplicateTemplate(sourceTemplateId: string): Promise<string> {
    const sourceRef = doc(db, 'users', this.userId, 'templates', sourceTemplateId);
    const sourceSnap = await getDoc(sourceRef);
    if (!sourceSnap.exists()) throw new Error(`템플릿 ${sourceTemplateId}이 존재하지 않습니다`);

    const sourceData = sourceSnap.data();
    const blocksRef = collection(db, 'users', this.userId, 'templates', sourceTemplateId, 'blocks');
    const blocksSnap = await getDocs(blocksRef);

    const batch = writeBatch(db);
    const now = Timestamp.now();

    const newTemplateRef = doc(collection(db, 'users', this.userId, 'templates'));
    batch.set(newTemplateRef, {
      name: `${sourceData['name']} (복사본)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    const newBlocksColRef = collection(db, 'users', this.userId, 'templates', newTemplateRef.id, 'blocks');
    for (const blockDoc of blocksSnap.docs) {
      const newBlockRef = doc(newBlocksColRef);
      batch.set(newBlockRef, blockDoc.data());
    }

    await batch.commit();
    return newTemplateRef.id;
  }

  /** 블록 부분 업데이트 */
  async updateBlock(templateId: string, blockId: string, data: Partial<Omit<TimeBlock, 'id'>>): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'templates', templateId, 'blocks', blockId);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  /** 블록 삭제 */
  async deleteBlock(templateId: string, blockId: string): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'templates', templateId, 'blocks', blockId);
    await deleteDoc(ref);
  }

  /** 블록 정렬 순서 일괄 업데이트 (writeBatch) */
  async updateBlocksSortOrder(templateId: string, orderedBlockIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    orderedBlockIds.forEach((blockId, index) => {
      const ref = doc(db, 'users', this.userId, 'templates', templateId, 'blocks', blockId);
      batch.update(ref, { sortOrder: index });
    });
    await batch.commit();
  }

  /** 템플릿 목록 실시간 구독 (createdAt 오름차순) */
  subscribeToTemplates(callback: (templates: ScheduleTemplate[]) => void): Unsubscribe {
    const ref = collection(db, 'users', this.userId, 'templates');
    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => toScheduleTemplate(d.id, d.data())));
    });
  }

  /** 블록 목록 실시간 구독 (sortOrder 오름차순) */
  subscribeToBlocks(templateId: string, callback: (blocks: TimeBlock[]) => void): Unsubscribe {
    const ref = collection(db, 'users', this.userId, 'templates', templateId, 'blocks');
    const q = query(ref, orderBy('sortOrder', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => toTimeBlock(d.id, d.data())));
    });
  }

  // ─────────────────────────────────────────────
  // 일별 기록
  // ─────────────────────────────────────────────

  /** 일별 기록 조회 — 날짜 형식: "YYYY-MM-DD" */
  async getDailyRecord(date: string): Promise<DailyRecord | null> {
    const ref = doc(db, 'users', this.userId, 'dailyRecords', date);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toDailyRecord(snap.data());
  }

  /** 일별 기록 생성 (문서 ID = 날짜 문자열) */
  async createDailyRecord(record: DailyRecord): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'dailyRecords', record.date);
    await setDoc(ref, record);
  }

  /** 일별 기록 부분 업데이트 */
  async updateDailyRecord(date: string, data: Partial<DailyRecord>): Promise<void> {
    const ref = doc(db, 'users', this.userId, 'dailyRecords', date);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  // ─────────────────────────────────────────────
  // 완료 기록
  // ─────────────────────────────────────────────

  /** 완료 기록 목록 조회 (startTime 오름차순) */
  async getCompletions(date: string): Promise<BlockCompletion[]> {
    const ref = collection(db, 'users', this.userId, 'dailyRecords', date, 'completions');
    const q = query(ref, orderBy('startTime', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toBlockCompletion(d.data()));
  }

  /** 여러 완료 기록 원자적 일괄 생성 (writeBatch) — 문서 ID = blockId */
  async createCompletionsBatch(date: string, completions: BlockCompletion[]): Promise<void> {
    const batch = writeBatch(db);
    for (const completion of completions) {
      const ref = doc(
        db,
        'users',
        this.userId,
        'dailyRecords',
        date,
        'completions',
        completion.blockId,
      );
      batch.set(ref, completion);
    }
    await batch.commit();
  }

  /** 단일 완료 기록 부분 업데이트 */
  async updateCompletion(
    date: string,
    blockId: string,
    data: Partial<BlockCompletion>,
  ): Promise<void> {
    const ref = doc(
      db,
      'users',
      this.userId,
      'dailyRecords',
      date,
      'completions',
      blockId,
    );
    await updateDoc(ref, data as Record<string, unknown>);
  }

  /** 완료 기록 실시간 구독 — 구독 해제 함수 반환 */
  subscribeToCompletions(
    date: string,
    callback: (completions: BlockCompletion[]) => void,
  ): Unsubscribe {
    const ref = collection(db, 'users', this.userId, 'dailyRecords', date, 'completions');
    const q = query(ref, orderBy('startTime', 'asc'));
    return onSnapshot(q, (snap) => {
      const completions = snap.docs.map((d) => toBlockCompletion(d.data()));
      callback(completions);
    });
  }

  // ─────────────────────────────────────────────
  // 설정 헬퍼
  // ─────────────────────────────────────────────

  /**
   * 오늘 요일에 맞는 templateId를 사용자 문서에서 조회한다.
   * dayTemplateMap에 해당 요일이 없으면 defaultTemplateId로 폴백.
   * 사용자 문서가 없으면 null 반환.
   */
  async getTodayTemplateId(dayOfWeek: DayOfWeek): Promise<string | null> {
    const userSnap = await getDoc(doc(db, 'users', this.userId));
    if (!userSnap.exists()) return null;
    const userDoc = toUserDocument(userSnap.data());
    return userDoc.settings.dayTemplateMap[dayOfWeek] || userDoc.settings.defaultTemplateId || null;
  }

  // ─────────────────────────────────────────────
  // 일별 기록 트랜잭션 (스트릭 업데이트 포함)
  // ─────────────────────────────────────────────

  /**
   * 오늘의 dailyRecord가 없으면 트랜잭션으로 생성한다.
   * - dailyRecord 이미 존재: 조기 반환 (쓰기 없음)
   * - 없으면: dailyRecord + completions + 사용자 스트릭을 하나의 runTransaction으로 원자적 생성
   * - writeBatch는 runTransaction 안에 중첩 불가 → transaction.set() 개별 호출
   *
   * @param todayDate   "YYYY-MM-DD" 형식 오늘 날짜
   * @param dayOfWeek   오늘 요일 (DayOfWeek)
   * @param blocks      템플릿의 블록 목록 (트랜잭션 바깥에서 미리 로드)
   * @returns           생성되거나 이미 존재하는 DailyRecord
   */
  async ensureDailyRecordTransaction(
    todayDate: string,
    dayOfWeek: DayOfWeek,
    blocks: TimeBlock[],
  ): Promise<DailyRecord> {
    const userRef = doc(db, 'users', this.userId);
    const dailyRecordRef = doc(db, 'users', this.userId, 'dailyRecords', todayDate);

    return runTransaction(db, async (transaction) => {
      // 1a. dailyRecord 이미 존재하면 조기 반환
      const dailySnap = await transaction.get(dailyRecordRef);
      if (dailySnap.exists()) {
        return toDailyRecord(dailySnap.data());
      }

      // 1b. 사용자 문서 읽기 (settings + 스트릭 정보)
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('사용자 문서가 존재하지 않습니다');
      }
      const userDoc = toUserDocument(userSnap.data());

      // 1c-1d. 오늘 요일에 맞는 templateId 결정
      const templateId =
        userDoc.settings.dayTemplateMap[dayOfWeek] || userDoc.settings.defaultTemplateId;

      // 2. 스트릭 계산 (트랜잭션 안에서 수행)
      const lastActive = userDoc.lastActiveDate;
      let newStreak = userDoc.currentStreak;

      if (lastActive === '') {
        // 최초 활성화
        newStreak = 1;
      } else if (lastActive === todayDate) {
        // 오늘 이미 활성화됨 — 변경 없음
        newStreak = userDoc.currentStreak;
      } else {
        // 어제와 비교: "YYYY-MM-DD" 날짜 문자열은 사전순 비교 가능
        const yesterday = getPreviousDate(todayDate);
        if (lastActive === yesterday) {
          // 연속: 스트릭 증가
          newStreak = userDoc.currentStreak + 1;
        } else {
          // 연속 끊김: 스트릭 리셋
          newStreak = 1;
        }
      }
      const newLongestStreak = Math.max(userDoc.longestStreak, newStreak);

      // 3a. dailyRecord 생성
      const now = Timestamp.now();
      const newDailyRecord: DailyRecord = {
        date: todayDate,
        templateId,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        completionRate: 0,
        createdAt: now,
      };
      transaction.set(dailyRecordRef, newDailyRecord);

      // 3b. 각 completion 문서 개별 생성 (writeBatch 중첩 불가 → transaction.set 사용)
      for (const block of blocks) {
        const completionRef = doc(
          db,
          'users',
          this.userId,
          'dailyRecords',
          todayDate,
          'completions',
          block.id,
        );
        const completion: BlockCompletion = {
          blockId: block.id,
          taskName: block.taskName,
          blockType: block.blockType,
          startTime: block.startTime,
          endTime: block.endTime,
          basePoints: block.basePoints, // 커스텀 basePoints 비정규화
          completed: false,
          completedAt: null,
          pointsEarned: 0,
          bonusPoints: 0,
          skipped: false,
        };
        transaction.set(completionRef, completion);
      }

      // 3c. 사용자 스트릭 업데이트
      transaction.update(userRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: todayDate,
      });

      return newDailyRecord;
    });
  }
}

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

/**
 * "YYYY-MM-DD" 날짜 문자열에서 하루 이전 날짜를 반환
 * Date 객체 사용으로 월말/연말 경계 자동 처리
 */
function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
