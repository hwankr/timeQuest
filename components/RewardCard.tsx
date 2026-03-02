// 보상 카드 컴포넌트 — 개별 보상 아이템 표시 및 구매 버튼
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reward } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface RewardCardProps {
  reward: Reward;
  currentPoints: number;
  onBuy: (reward: Reward) => void;
  disabled?: boolean;
  disabledReason?: string;
  /** 커스텀 보상 롱프레스 → 수정 모달 열기 */
  onLongPress?: () => void;
  /** 커스텀 보상 삭제 */
  onDelete?: () => void;
  /** 커스텀 뱃지 표시 여부 */
  showCustomBadge?: boolean;
}

export const RewardCard = React.memo(
  function RewardCard({
    reward,
    currentPoints,
    onBuy,
    disabled,
    disabledReason,
    onLongPress,
    onDelete,
    showCustomBadge,
  }: RewardCardProps) {
    const insufficientPoints = currentPoints < reward.cost;
    const isDisabled = disabled || insufficientPoints;

    const getBuyButtonLabel = () => {
      if (disabledReason) return disabledReason;
      if (insufficientPoints) return '포인트 부족';
      return '구매';
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={onLongPress ? 0.7 : 1}
      >
        {/* 커스텀 뱃지 */}
        {showCustomBadge && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>커스텀</Text>
          </View>
        )}

        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{reward.icon}</Text>
        </View>

        {/* 정보 영역 */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {reward.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>

          {/* 비용 표시 */}
          <View style={styles.costRow}>
            <Ionicons name="star" size={13} color={COLORS.pointDark} />
            <Text style={styles.cost}>{reward.cost.toLocaleString()}</Text>
          </View>
        </View>

        {/* 우측 버튼 영역 */}
        <View style={styles.actionArea}>
          {/* 삭제 버튼 (커스텀만) */}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.error} />
            </TouchableOpacity>
          )}

          {/* 구매 버튼 */}
          <TouchableOpacity
            style={[styles.buyButton, isDisabled && styles.buyButtonDisabled]}
            onPress={() => onBuy(reward)}
            disabled={isDisabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.buyButtonText, isDisabled && styles.buyButtonTextDisabled]}>
              {getBuyButtonLabel()}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
  // 커스텀 비교: 관련 필드만 비교
  (prev, next) =>
    prev.reward.id === next.reward.id &&
    prev.reward.cost === next.reward.cost &&
    prev.reward.name === next.reward.name &&
    prev.currentPoints === next.currentPoints &&
    prev.disabled === next.disabled &&
    prev.disabledReason === next.disabledReason &&
    prev.showCustomBadge === next.showCustomBadge &&
    prev.onBuy === next.onBuy &&
    prev.onLongPress === next.onLongPress &&
    prev.onDelete === next.onDelete,
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  customBadge: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.surface,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  icon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    gap: 3,
    marginTop: 4,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cost: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.pointDark,
  },
  actionArea: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  deleteButton: {
    padding: 4,
  },
  buyButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    minWidth: 60,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  buyButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.surface,
  },
  buyButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});
