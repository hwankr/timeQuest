// 구매 성공 애니메이션 — Reanimated v4 기반 별/스파클 효과 후 자동 닫힘
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';

interface PurchaseAnimationProps {
  visible: boolean;
  onDismiss: () => void;
}

export function PurchaseAnimation({ visible, onDismiss }: PurchaseAnimationProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // 등장: spring scale + fade in
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
      opacity.value = withTiming(1, { duration: 200 });

      // 800ms 후 퇴장: scale up + fade out → onDismiss
      scale.value = withDelay(
        1000,
        withTiming(1.2, { duration: 200 }),
      );
      opacity.value = withDelay(
        1000,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            scale.value = 0;
            opacity.value = 0;
            runOnJS(onDismiss)();
          }
        }),
      );
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View style={[
          styles.container,
          animatedStyle,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.primary,
          },
        ]}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.sparkles}>✨</Text>
          <Text style={[styles.successText, { color: colors.textPrimary }]}>구매 완료!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  star: {
    fontSize: 48,
  },
  sparkles: {
    fontSize: 24,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
});
