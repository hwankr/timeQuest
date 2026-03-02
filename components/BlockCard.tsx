// 블록 카드 컴포넌트 — 타임라인의 단일 시간 블록 표시
// React.memo로 메모이제이션, 완료/현재/지나간/미래 상태별 시각화
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlockCompletion } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCompletionAnimation } from '@/hooks/useCompletionAnimation';
import { hapticSuccess } from '@/utils/haptics';
import { PointsEarnedToast } from './PointsEarnedToast';

export interface CompleteBlockResult {
  pointsEarned: number;
  bonusPoints: number;
  penaltyApplied: number;
}

interface BlockCardProps {
  completion: BlockCompletion;
  isCurrent: boolean;
  isPast: boolean;
  onComplete: (blockId: string) => Promise<CompleteBlockResult | void>;
}

const CARD_HEIGHT = 80;

export const BlockCard = React.memo(
  function BlockCard({ completion, isCurrent, isPast, onComplete }: BlockCardProps) {
    const colors = useThemeColors();
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{
      points: number;
      bonusPoints: number;
      penaltyApplied: number;
      visible: boolean;
    }>({ points: 0, bonusPoints: 0, penaltyApplied: 0, visible: false });
    const { animatedStyle, triggerAnimation } = useCompletionAnimation();

    const blockInfo = BLOCK_TYPES[completion.blockType];

    // 완료 가능 여부: 현재 블록 또는 지나갔지만 미완료인 블록
    const canComplete = !completion.completed && !completion.skipped && (isCurrent || isPast);
    // 미래 블록: 탭 비활성
    const isFuture = !isCurrent && !isPast;
    // 지각 완료: 완료됐고 지나간 블록
    const isLateCompleted = completion.completed && isPast && !isCurrent;

    const handleDismissToast = useCallback(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    const handlePress = useCallback(async () => {
      if (!canComplete || isProcessing) return;
      setIsProcessing(true);
      try {
        const result = await onComplete(completion.blockId);
        triggerAnimation();
        hapticSuccess();
        if (result) {
          setToast({
            points: result.pointsEarned,
            bonusPoints: result.bonusPoints,
            penaltyApplied: result.penaltyApplied,
            visible: true,
          });
        }
      } finally {
        setIsProcessing(false);
      }
    }, [canComplete, isProcessing, onComplete, completion.blockId, triggerAnimation]);

    return (
      <>
      <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isCurrent && { borderColor: colors.primary, borderWidth: 2, shadowColor: colors.primary },
          completion.completed && { backgroundColor: `${colors.success}08`, borderColor: `${colors.success}40` },
          isFuture && styles.cardFuture,
          isPast && !completion.completed && styles.cardPastUncompleted,
        ]}
        onPress={handlePress}
        activeOpacity={canComplete ? 0.7 : 1}
        disabled={isFuture || isProcessing || completion.completed}
      >
        {/* 왼쪽: 시간 범위 */}
        <View style={styles.timeColumn}>
          <Text style={[styles.timeText, { color: colors.textSecondary }, isFuture && { color: colors.textTertiary }]}>
            {completion.startTime}
          </Text>
          <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.timeText, { color: colors.textSecondary }, isFuture && { color: colors.textTertiary }]}>
            {completion.endTime}
          </Text>
        </View>

        {/* 블록 타입 색상 좌측 바 */}
        <View style={[styles.colorBar, { backgroundColor: blockInfo.color }]} />

        {/* 중앙: 블록 정보 */}
        <View style={styles.contentColumn}>
          <View style={styles.titleRow}>
            <Ionicons
              name={blockInfo.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={16}
              color={isFuture ? colors.textTertiary : blockInfo.color}
            />
            <Text
              style={[
                styles.taskName,
                { color: colors.textPrimary },
                isFuture && { color: colors.textTertiary },
                isPast && !completion.completed && styles.strikethrough,
              ]}
              numberOfLines={1}
            >
              {completion.taskName}
            </Text>
          </View>
          <Text style={[styles.blockTypeLabel, { color: colors.textTertiary }]}>
            {blockInfo.label}
          </Text>
        </View>

        {/* 오른쪽: 포인트 + 상태 */}
        <View style={styles.rightColumn}>
          {completion.completed ? (
            // 완료 상태
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.pointsEarned, { color: colors.success }]}>+{completion.pointsEarned}</Text>
            </View>
          ) : isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            // 미완료 상태: 기본 포인트 표시
            <View style={styles.pointsBadge}>
              <Text style={[styles.basePoints, { color: colors.textSecondary }, isFuture && { color: colors.textTertiary }]}>
                {completion.basePoints}pt
              </Text>
            </View>
          )}

          {/* 전환됨 배지 */}
          {completion.converted && (
            <View style={[styles.convertedBadge, { backgroundColor: `${colors.block.free}25`, borderColor: `${colors.block.free}60` }]}>
              <Text style={[styles.convertedText, { color: colors.block.free }]}>전환됨</Text>
            </View>
          )}

          {/* 지각 배지 */}
          {isLateCompleted && (
            <View style={[styles.lateBadge, { backgroundColor: `${colors.warning}25`, borderColor: `${colors.warning}60` }]}>
              <Text style={[styles.lateText, { color: colors.warning }]}>지각</Text>
            </View>
          )}

          {/* 지나간 미완료 블록 경고 */}
          {isPast && !completion.completed && !isProcessing && (
            <View style={[styles.penaltyWarning, { backgroundColor: `${colors.error}20` }]}>
              <Text style={[styles.penaltyText, { color: colors.error }]}>-2</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      </Animated.View>
      <PointsEarnedToast
        points={toast.points}
        bonusPoints={toast.bonusPoints}
        penaltyApplied={toast.penaltyApplied}
        visible={toast.visible}
        onDismiss={handleDismissToast}
      />
      </>
    );
  },
  // 커스텀 비교: 관련 props만 비교
  (prev, next) =>
    prev.completion.blockId === next.completion.blockId &&
    prev.completion.completed === next.completion.completed &&
    prev.completion.pointsEarned === next.completion.pointsEarned &&
    prev.completion.blockType === next.completion.blockType &&
    prev.completion.converted === next.completion.converted &&
    prev.isCurrent === next.isCurrent &&
    prev.isPast === next.isPast &&
    prev.onComplete === next.onComplete,
);

export const BLOCK_CARD_HEIGHT = CARD_HEIGHT;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardCurrent: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardFuture: {
    opacity: 0.7,
  },
  cardPastUncompleted: {
    opacity: 0.5,
  },
  timeColumn: {
    width: 52,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    fontVariant: ['tabular-nums'],
  },
  timeDivider: {
    width: 1,
    height: 8,
    marginVertical: 2,
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
    marginVertical: 8,
    borderRadius: 2,
  },
  contentColumn: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  taskName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  blockTypeLabel: {
    fontSize: FONT_SIZE.xs,
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    gap: 4,
    minWidth: 60,
  },
  completedBadge: {
    alignItems: 'center',
    gap: 2,
  },
  pointsEarned: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  pointsBadge: {
    alignItems: 'center',
  },
  basePoints: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  convertedBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  convertedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lateBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  lateText: {
    fontSize: 10,
    fontWeight: '700',
  },
  penaltyWarning: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  penaltyText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
