// 포인트 획득 토스트 — 블록 완료 후 획득 포인트를 잠시 표시
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

interface PointsEarnedToastProps {
  points: number;
  bonusPoints: number;
  penaltyApplied: number;
  visible: boolean;
  onDismiss: () => void;
}

export function PointsEarnedToast({
  points,
  bonusPoints,
  penaltyApplied,
  visible,
  onDismiss,
}: PointsEarnedToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
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

      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
    }
  }, [visible]);

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.pointsText}>+{points} pts</Text>
        {bonusPoints > 0 && (
          <Text style={styles.bonusText}>+{bonusPoints} 보너스!</Text>
        )}
        {penaltyApplied > 0 && (
          <Text style={styles.penaltyText}>-{penaltyApplied} 지각 패널티</Text>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bonusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  penaltyText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
  },
});
