// 원형 진행도 표시기 — SVG 기반 (react-native-svg 필요)
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT_SIZE } from '@/constants/theme';

interface CircularProgressProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const CircularProgress = memo(function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  color = COLORS.primary,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* 배경 트랙 */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행 원호 */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {/* 중앙 텍스트 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.centerContent}>
          <Text style={[styles.percentText, { fontSize: size * 0.22 }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});
