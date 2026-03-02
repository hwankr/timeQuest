// 알림 서비스 — 로컬 알림 권한, 채널, 예약, 취소
// expo-notifications LOCAL only: DATE / DAILY triggers

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BlockCompletion, NotificationSettings } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { UserRepository } from '@/repositories/userRepo';
import { getTodayDate } from '@/utils/time';

// ─────────────────────────────────────────────
// 포그라운드 핸들러 (한 번만 설정)
// ─────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────
// 내부 디바운스 상태
// ─────────────────────────────────────────────

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─────────────────────────────────────────────
// 권한 초기화
// ─────────────────────────────────────────────

/**
 * 알림 권한 요청 및 Android 채널 생성.
 * 앱 시작 시 인증 완료 후 한 번 호출한다.
 * @returns 권한 허용 여부
 */
export async function initializeNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('blocks', {
      name: '시간 블록 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
    });
  }

  return true;
}

// ─────────────────────────────────────────────
// DND 헬퍼
// ─────────────────────────────────────────────

/**
 * 주어진 time이 DND 범위 안에 있는지 판별한다.
 * 자정을 넘는 범위(예: 22:00-07:00)도 올바르게 처리한다.
 * @param time     "HH:mm" 형식
 * @param dndStart "HH:mm" 형식
 * @param dndEnd   "HH:mm" 형식
 */
export function isWithinDND(time: string, dndStart: string, dndEnd: string): boolean {
  const toMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const t = toMinutes(time);
  const s = toMinutes(dndStart);
  const e = toMinutes(dndEnd);

  if (s <= e) {
    // 같은 날 범위 (예: 09:00-18:00)
    return t >= s && t <= e;
  } else {
    // 자정을 넘는 범위 (예: 22:00-07:00)
    return t >= s || t <= e;
  }
}

// ─────────────────────────────────────────────
// 시간 계산 헬퍼
// ─────────────────────────────────────────────

/**
 * "HH:mm" 시간 문자열과 분 오프셋으로 오늘의 Date 객체를 생성한다.
 * @param timeStr "HH:mm"
 * @param offsetMinutes 음수 = 이전, 양수 = 이후
 */
function getTodayDateAt(timeStr: string, offsetMinutes = 0): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + offsetMinutes, 0, 0);
  return d;
}

/**
 * "HH:mm" 시간 문자열을 { hour, minute } 으로 분해한다.
 */
function parseHourMinute(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

// ─────────────────────────────────────────────
// 블록 알림 예약
// ─────────────────────────────────────────────

/**
 * 오늘의 모든 블록에 대해 시작/종료/리마인더 알림을 예약한다.
 * 기존 예약 알림을 모두 취소한 후 새로 예약한다.
 */
export async function scheduleBlockNotifications(
  blocks: BlockCompletion[],
  settings: NotificationSettings,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const block of blocks) {
    // 이미 완료된 블록은 알림 불필요
    if (block.completed) continue;

    // a) 블록 시작 알림 (advanceMinutes 전)
    if (settings.blockStart) {
      const startDate = getTodayDateAt(block.startTime, -settings.advanceMinutes);
      const startTimeStr = formatTimeFromDate(startDate);

      if (
        startDate > now &&
        !isWithinDND(startTimeStr, settings.dndStart, settings.dndEnd)
      ) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ 블록 시작',
            body: `${block.taskName} 시작까지 ${settings.advanceMinutes}분 남았어요!`,
            data: { blockId: block.blockId, type: 'blockStart' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: startDate,
          },
        });
      }
    }

    // b) 블록 종료 알림
    if (settings.blockEnd) {
      const endDate = getTodayDateAt(block.endTime);
      const endTimeStr = block.endTime;

      if (
        endDate > now &&
        !isWithinDND(endTimeStr, settings.dndStart, settings.dndEnd)
      ) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 블록 종료',
            body: `${block.taskName} 시간이 끝났어요. 완료 처리 잊지 마세요!`,
            data: { blockId: block.blockId, type: 'blockEnd' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: endDate,
          },
        });
      }
    }

    // c) 리마인더 (종료 후 10분)
    if (settings.reminder) {
      const reminderDate = getTodayDateAt(block.endTime, 10);
      const reminderTimeStr = formatTimeFromDate(reminderDate);

      if (
        reminderDate > now &&
        !isWithinDND(reminderTimeStr, settings.dndStart, settings.dndEnd)
      ) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📋 완료 리마인더',
            body: `${block.taskName} 완료했나요? 지금 체크해보세요!`,
            data: { blockId: block.blockId, type: 'reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });
      }
    }
  }
}

// ─────────────────────────────────────────────
// 아침 브리핑
// ─────────────────────────────────────────────

/**
 * 매일 반복 아침 브리핑 알림을 예약한다.
 * @param wakeUpTime          "HH:mm" 형식 첫 블록 시작 시각
 * @param totalPossiblePoints 오늘 획득 가능한 총 포인트
 * @param settings            알림 설정
 */
export async function scheduleMorningBriefing(
  wakeUpTime: string,
  totalPossiblePoints: number,
  settings: NotificationSettings,
): Promise<void> {
  if (!settings.morningBriefing) return;
  if (isWithinDND(wakeUpTime, settings.dndStart, settings.dndEnd)) return;

  const { hour, minute } = parseHourMinute(wakeUpTime);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 오늘도 화이팅!',
      body: `총 ${totalPossiblePoints}P를 모을 수 있어요`,
      data: { type: 'morningBriefing' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ─────────────────────────────────────────────
// 스트릭 경고
// ─────────────────────────────────────────────

/**
 * 저녁 스트릭 경고 알림을 예약한다 (오늘 20:00 고정).
 */
export async function scheduleStreakWarning(
  settings: NotificationSettings,
  currentStreak: number,
  incompleteCount: number,
): Promise<void> {
  if (!settings.streakWarning) return;
  if (incompleteCount <= 0) return;

  const warningTime = '20:00';
  if (isWithinDND(warningTime, settings.dndStart, settings.dndEnd)) return;

  const warningDate = getTodayDateAt(warningTime);
  const now = new Date();
  if (warningDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 스트릭 경고',
      body: `오늘 ${incompleteCount}블록만 더 완료하면 ${currentStreak + 1}일 연속 달성!`,
      data: { type: 'streakWarning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: warningDate,
    },
  });
}

// ─────────────────────────────────────────────
// 전체 취소
// ─────────────────────────────────────────────

/** 예약된 모든 알림을 취소한다. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─────────────────────────────────────────────
// 전체 재예약 오케스트레이터
// ─────────────────────────────────────────────

/**
 * 오늘의 블록과 설정을 불러와 모든 알림을 재예약한다.
 * 내부 300ms 디바운스로 연속 호출을 병합한다.
 * 반환값 없음 (fire-and-forget) — 모든 호출부가 await하지 않으므로
 * void 반환으로 dangling promise 방지.
 */
export function rescheduleAllNotifications(userId: string): void {
  if (_debounceTimer !== null) {
    clearTimeout(_debounceTimer);
  }
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    _doReschedule(userId).catch((err) =>
      console.warn('[notification] reschedule failed:', err),
    );
  }, 300);
}

async function _doReschedule(userId: string): Promise<void> {
  const scheduleRepo = new ScheduleRepository(userId);
  const userRepo = new UserRepository(userId);

  const todayDate = getTodayDate();
  const [completions, user] = await Promise.all([
    scheduleRepo.getCompletions(todayDate),
    userRepo.getUser(),
  ]);

  if (!user) return;

  const settings = user.settings.notifications;

  // 블록 알림
  await scheduleBlockNotifications(completions, settings);

  // 아침 브리핑 — 첫 블록 시각 기준
  if (completions.length > 0) {
    const firstBlock = completions.reduce((earliest, c) =>
      c.startTime < earliest.startTime ? c : earliest,
    );
    const totalPossiblePoints = completions.reduce((sum, c) => sum + c.basePoints, 0);
    await scheduleMorningBriefing(firstBlock.startTime, totalPossiblePoints, settings);
  }

  // 스트릭 경고
  const incompleteCount = completions.filter((c) => !c.completed && !c.skipped).length;
  await scheduleStreakWarning(settings, user.currentStreak, incompleteCount);

  console.log('[notification] rescheduled', completions.length, 'blocks');
}

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

function formatTimeFromDate(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
