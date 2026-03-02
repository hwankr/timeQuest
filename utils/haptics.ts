// 햅틱 피드백 유틸리티 — expo-haptics 래퍼
import * as Haptics from 'expo-haptics';

/** 성공 햅틱 — 블록 완료 시 사용 */
export async function hapticSuccess(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** 에러 햅틱 — 오류 발생 시 사용 */
export async function hapticError(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** 가벼운 임팩트 햅틱 — 탭 피드백 */
export async function hapticLight(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** 중간 임팩트 햅틱 — 테마 전환, 토글 등 */
export async function hapticMedium(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
