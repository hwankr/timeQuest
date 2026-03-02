// 구매 확인 모달 — 보상 구매 전 확인 다이얼로그
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reward } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

interface PurchaseConfirmModalProps {
  visible: boolean;
  reward: Reward | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PurchaseConfirmModal({
  visible,
  reward,
  onConfirm,
  onCancel,
}: PurchaseConfirmModalProps) {
  const colors = useThemeColors();

  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
              {/* 보상 아이콘 */}
              <Text style={styles.icon}>{reward.icon}</Text>

              {/* 보상 이름 */}
              <Text style={[styles.rewardName, { color: colors.textPrimary }]}>{reward.name}</Text>

              {/* 비용 */}
              <View style={[styles.costRow, { backgroundColor: `${colors.point}15` }]}>
                <Ionicons name="star" size={16} color={colors.pointDark} />
                <Text style={[styles.cost, { color: colors.pointDark }]}>{reward.cost.toLocaleString()} 포인트</Text>
              </View>

              {/* 확인 문구 */}
              <Text style={[styles.confirmText, { color: colors.textSecondary }]}>정말 구매하시겠습니까?</Text>

              {/* 버튼 영역 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.border }]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.surface }]}>구매</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  rewardName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  cost: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    marginTop: SPACING.xs,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
