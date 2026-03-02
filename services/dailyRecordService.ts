// Daily Record 서비스 — 앱 실행 시 오늘의 dailyRecord 자동 생성
// firebase/firestore 직접 import 금지 — 모든 Firestore 작업은 Repository 경유

import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { DailyRecord } from '@/types';
import { getTodayDate, getDayOfWeek } from '@/utils/time';

/**
 * 오늘의 dailyRecord가 없으면 자동으로 생성한다.
 *
 * 알고리즘:
 * 1. 오늘 날짜와 요일 결정
 * 2. 트랜잭션 바깥: 사용자의 설정에서 templateId를 먼저 알아야 블록을 로드할 수 있으나,
 *    templateId는 트랜잭션 안에서 user document를 읽어 결정한다.
 *    따라서 두 단계로 나눈다:
 *    a) 1차 트랜잭션: dailyRecord 존재 여부 + user doc 읽기 → templateId 반환 또는 조기 반환
 *    b) 트랜잭션 바깥: 해당 templateId의 blocks 로드 (템플릿은 동시 수정되지 않으므로 안전)
 *    c) 2차 트랜잭션: dailyRecord + completions 생성 + streak 업데이트
 *
 * 실제 구현에서는 ScheduleRepository.ensureDailyRecordTransaction() 한 번으로
 * 모든 로직을 처리한다. 단, blocks는 트랜잭션 외부에서 미리 로드해야 하므로
 * 아래와 같이 두 단계로 처리한다.
 *
 * @param userId  Firebase Auth UID
 * @returns       오늘의 DailyRecord (기존 또는 신규 생성)
 */
export async function ensureDailyRecord(userId: string): Promise<DailyRecord> {
  const scheduleRepo = new ScheduleRepository(userId);
  const todayDate = getTodayDate();
  const dayOfWeek = getDayOfWeek();

  // 1단계: dailyRecord 이미 존재하는지 빠르게 확인 (트랜잭션 외부 read)
  // 이미 존재하면 블록 로드 비용 없이 즉시 반환
  const existing = await scheduleRepo.getDailyRecord(todayDate);
  if (existing !== null) {
    return existing;
  }

  // 2단계: 사용자 설정에서 templateId 조회 → 블록 로드
  // getDailyRecord가 null이므로 신규 생성이 필요하다.
  // templateId는 ensureDailyRecordTransaction 내부 트랜잭션에서 결정되므로
  // 여기서는 user doc을 별도로 읽어 templateId를 미리 파악한다.
  const templateId = await scheduleRepo.getTodayTemplateId(dayOfWeek);

  // 3단계: 트랜잭션 바깥에서 blocks 로드
  // 템플릿은 사용자가 직접 수정하지 않는 한 변경되지 않으므로 트랜잭션 외부 읽기 안전
  const blocks = templateId !== null ? await scheduleRepo.getBlocks(templateId) : [];

  // 4단계: runTransaction으로 dailyRecord + completions + streak 원자적 생성
  return scheduleRepo.ensureDailyRecordTransaction(todayDate, dayOfWeek, blocks);
}
