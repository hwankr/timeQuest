// 블록 완료 애니메이션 훅 — Reanimated 기반 bounce + glow 강화
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
    // bounce: 1 → 1.08 → 0.95 → 1 (더 역동적인 느낌)
    scale.value = withSequence(
      withSpring(1.08, { damping: 8, stiffness: 250 }),
      withSpring(0.95, { damping: 10, stiffness: 200 }),
      withSpring(1.0, { damping: 15, stiffness: 150 }),
    );

    // success glow pulse
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.6, { duration: 100 }),
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 300 }),
    );
  }

  return { animatedStyle, flashStyle, triggerAnimation };
}
