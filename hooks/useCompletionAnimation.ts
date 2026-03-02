// 블록 완료 애니메이션 훅 — Reanimated 기반 스케일 + 플래시 애니메이션
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function useCompletionAnimation() {
  const scale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  /** 완료 애니메이션 트리거 — 블록 카드 탭 시 호출 */
  function triggerAnimation(): void {
    // 1. 스케일 1.05로 확대 (spring)
    // 2. 플래시 성공 초록 (opacity pulse)
    // 3. 원래 크기로 복귀 (spring)
    scale.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 200 }),
      withSpring(1.0, { damping: 15, stiffness: 150 }),
    );

    flashOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 }),
    );
  }

  return { animatedStyle, flashStyle, triggerAnimation };
}
