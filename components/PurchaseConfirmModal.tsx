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
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

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
            <View style={styles.container}>
              {/* 보상 아이콘 */}
              <Text style={styles.icon}>{reward.icon}</Text>

              {/* 보상 이름 */}
              <Text style={styles.rewardName}>{reward.name}</Text>

              {/* 비용 */}
              <View style={styles.costRow}>
                <Ionicons name="star" size={16} color={COLORS.pointDark} />
                <Text style={styles.cost}>{reward.cost.toLocaleString()} 포인트</Text>
              </View>

              {/* 확인 문구 */}
              <Text style={styles.confirmText}>정말 구매하시겠습니까?</Text>

              {/* 버튼 영역 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmButtonText}>구매</Text>
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.point}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  cost: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.pointDark,
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
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
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
