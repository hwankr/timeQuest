// 포인트 획득 토스트 — 블록 완료 후 획득 포인트를 잠시 표시 + 숫자 카운트업
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext';

interface PointsEarnedToastProps {
  points: number;
  bonusPoints: number;
  penaltyApplied: number;
  visible: boolean;
  onDismiss: () => void;
}

function toHexWithAlpha(hex: string, alpha: number): string {
  const normalizedHex = hex.replace('#', '');
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(safeAlpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${normalizedHex}${alphaHex}`;
}

export function PointsEarnedToast({
  points,
  bonusPoints,
  penaltyApplied,
  visible,
  onDismiss,
}: PointsEarnedToastProps) {
  const colors = useThemeColors();
  const { effectiveTheme } = useThemeMode();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // 카운트업 상태 — JS 스레드에서 업데이트
  const [displayPoints, setDisplayPoints] = useState(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      // 카운트업: 0 → points (600ms, 60fps ≈ 36 프레임)
      setDisplayPoints(0);
      const steps = 20;
      const interval = 600 / steps;
      let step = 0;
      const id = setInterval(() => {
        step += 1;
        setDisplayPoints(Math.round((points * step) / steps));
        if (step >= steps) clearInterval(id);
      }, interval);

      // 슬라이드 업 + 페이드 인
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });

      // 2초 후 자동 닫기
      const timer = setTimeout(() => {
        opacity.value = withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: 300 }),
        );
        translateY.value = withTiming(20, { duration: 300 });
        setTimeout(() => runOnJS(onDismiss)(), 300);
      }, 2000);

      return () => {
        clearInterval(id);
        clearTimeout(timer);
      };
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      setDisplayPoints(0);
    }
  }, [visible]);

  if (!visible && opacity.value === 0) return null;

  const toastBg = toHexWithAlpha(colors.surface, effectiveTheme === 'dark' ? 0.92 : 0.88);

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <View style={[styles.toast, { backgroundColor: toastBg }]}>
        <Text style={[styles.pointsText, { color: colors.point }]}>+{displayPoints} pts</Text>
        {bonusPoints > 0 && (
          <Text style={[styles.bonusText, { color: colors.success }]}>+{bonusPoints} 보너스!</Text>
        )}
        {penaltyApplied > 0 && (
          <Text style={[styles.penaltyText, { color: colors.error }]}>-{penaltyApplied} 지각 패널티</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  penaltyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
