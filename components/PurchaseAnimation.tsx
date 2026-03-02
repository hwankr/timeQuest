// 구매 성공 애니메이션 — 별/스파클 효과 후 자동 닫힘
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Modal } from 'react-native';
import { COLORS } from '@/constants/theme';

interface PurchaseAnimationProps {
  visible: boolean;
  onDismiss: () => void;
}

export function PurchaseAnimation({ visible, onDismiss }: PurchaseAnimationProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 등장 후 자동 닫힘
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 6,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        scale.setValue(0);
        opacity.setValue(0);
        onDismiss();
      });
    }
  }, [visible, scale, opacity, onDismiss]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View style={[styles.container, { transform: [{ scale }], opacity }]}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.sparkles}>✨</Text>
          <Text style={styles.successText}>구매 완료!</Text>
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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
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
    color: COLORS.textPrimary,
    marginTop: 4,
  },
});
