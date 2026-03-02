// 블록 전환 모달 — 전환 가능한 블록 목록 표시 및 전환 처리
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlockCompletion } from '@/types';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { hapticSuccess, hapticError, hapticLight } from '@/utils/haptics';

interface BlockConvertModalProps {
  visible: boolean;
  completions: BlockCompletion[];
  onConvert: (blockId: string) => Promise<void>;
  onClose: () => void;
}

export function BlockConvertModal({
  visible,
  completions,
  onConvert,
  onClose,
}: BlockConvertModalProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // 전환 가능한 블록: study 또는 exercise, 미완료, 미전환, 미건너뜀
  const convertibleBlocks = completions.filter(
    (c) =>
      (c.blockType === 'study' || c.blockType === 'exercise') &&
      !c.completed &&
      !c.converted &&
      !c.skipped,
  );

  const handleSelectBlock = useCallback((blockId: string) => {
    hapticLight();
    setSelectedBlockId((prev) => (prev === blockId ? null : blockId));
  }, []);

  const handleConfirmConvert = useCallback(async () => {
    if (!selectedBlockId) return;

    Alert.alert(
      '블록 전환',
      '선택한 블록을 자유 블록으로 전환하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전환',
          style: 'default',
          onPress: async () => {
            setIsConverting(true);
            try {
              await onConvert(selectedBlockId);
              await hapticSuccess();
              setSelectedBlockId(null);
              onClose();
            } catch (error) {
              await hapticError();
              const message =
                error instanceof Error ? error.message : '전환 중 오류가 발생했습니다';
              Alert.alert('전환 실패', message);
            } finally {
              setIsConverting(false);
            }
          },
        },
      ],
    );
  }, [selectedBlockId, onConvert, onClose]);

  const handleClose = useCallback(() => {
    if (isConverting) return;
    setSelectedBlockId(null);
    onClose();
  }, [isConverting, onClose]);

  const renderBlock = useCallback(
    ({ item }: ListRenderItemInfo<BlockCompletion>) => {
      const blockInfo = BLOCK_TYPES[item.blockType];
      const isSelected = item.blockId === selectedBlockId;

      return (
        <TouchableOpacity
          style={[styles.blockItem, isSelected && styles.blockItemSelected]}
          onPress={() => handleSelectBlock(item.blockId)}
          activeOpacity={0.7}
        >
          <View style={[styles.blockColorBar, { backgroundColor: blockInfo.color }]} />
          <View style={styles.blockContent}>
            <View style={styles.blockTitleRow}>
              <Ionicons
                name={blockInfo.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={16}
                color={blockInfo.color}
              />
              <Text style={styles.blockName} numberOfLines={1}>
                {item.taskName}
              </Text>
            </View>
            <Text style={styles.blockMeta}>
              {item.startTime} ~ {item.endTime} · {blockInfo.label}
            </Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedBlockId, handleSelectBlock],
  );

  const keyExtractor = useCallback((item: BlockCompletion) => item.blockId, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.title}>블록 전환</Text>
                <TouchableOpacity onPress={handleClose} disabled={isConverting}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                공부/운동 블록을 자유 블록으로 전환합니다
              </Text>

              {/* 전환 가능한 블록 목록 */}
              {convertibleBlocks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>전환 가능한 블록이 없습니다</Text>
                  <Text style={styles.emptySubText}>
                    미완료된 공부/운동 블록이 있어야 전환할 수 있습니다
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={convertibleBlocks}
                  renderItem={renderBlock}
                  keyExtractor={keyExtractor}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  style={styles.list}
                />
              )}

              {/* 전환 버튼 */}
              {convertibleBlocks.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.convertButton,
                    (!selectedBlockId || isConverting) && styles.convertButtonDisabled,
                  ]}
                  onPress={handleConfirmConvert}
                  disabled={!selectedBlockId || isConverting}
                  activeOpacity={0.7}
                >
                  {isConverting ? (
                    <ActivityIndicator size="small" color={COLORS.surface} />
                  ) : (
                    <Text style={styles.convertButtonText}>
                      {selectedBlockId ? '전환하기' : '블록을 선택하세요'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  blockItemSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}08`,
  },
  blockColorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  blockContent: {
    flex: 1,
    paddingVertical: SPACING.sm,
    gap: 3,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  blockName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  blockMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  convertButton: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  convertButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  convertButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
