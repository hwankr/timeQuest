// FlatList 아이템 staggered 입장 애니메이션
import { useMemo } from 'react';
import { FadeInDown } from 'react-native-reanimated';

/**
 * 최초 렌더링 구간에만 사용하는 list item entering 애니메이션.
 * index 상한 10으로 딜레이 과다를 방지한다 (최대 500ms).
 */
export function getListItemEntering(index: number, enabled: boolean) {
  if (!enabled) return undefined;
  const delay = Math.min(index, 10) * 50;
  return FadeInDown.delay(delay).duration(300);
}

/**
 * 컴포넌트 내부에서 사용할 때의 hook 버전.
 */
export function useListItemAnimation(index: number, enabled: boolean) {
  return useMemo(() => getListItemEntering(index, enabled), [index, enabled]);
}
