// 시간 유틸리티 함수 — "HH:mm" 형식 파싱/포맷 및 블록 상태 판별
import { DayOfWeek } from '@/types';

/** "HH:mm" 문자열을 자정 기준 분(minutes)으로 파싱 */
export function parseTime(time: string): number {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return hour * 60 + minute;
}

/** 자정 기준 분(minutes)을 "HH:mm" 문자열로 포맷 */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** currentTime이 [startTime, endTime) 범위 안에 있는지 확인 */
export function isCurrentBlock(startTime: string, endTime: string, currentTime: string): boolean {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const current = parseTime(currentTime);
  return current >= start && current < end;
}

/** 블록의 endTime이 currentTime보다 이전인지 확인 (블록이 이미 종료됨) */
export function isBlockPast(endTime: string, currentTime: string): boolean {
  return parseTime(currentTime) >= parseTime(endTime);
}

/** 블록의 startTime이 currentTime보다 이후인지 확인 (블록이 아직 시작 안 됨) */
export function isBlockFuture(startTime: string, currentTime: string): boolean {
  return parseTime(startTime) > parseTime(currentTime);
}

/** 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환 */
export function getTodayDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Date 객체(또는 오늘)에서 DayOfWeek 타입으로 변환 */
export function getDayOfWeek(date?: Date): DayOfWeek {
  const d = date ?? new Date();
  const dayIndex = d.getDay(); // 0=일, 1=월, ..., 6=토
  const map: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[dayIndex];
}
