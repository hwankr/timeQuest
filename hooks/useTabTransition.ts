// 탭 전환 시 컨텐츠 페이드 애니메이션 훅
import { useMemo } from 'react';
import { FadeIn } from 'react-native-reanimated';

/**
 * 탭 전환 시 컨텐츠 페이드인 애니메이션 entering 프롭을 반환한다.
 * 각 탭 페이지의 Animated.View entering 프롭에 사용.
 */
export function useTabTransition(enabled: boolean = true) {
  return useMemo(() => {
    if (!enabled) return undefined;
    return FadeIn.duration(200);
  }, [enabled]);
}
