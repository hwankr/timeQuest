// 블록 편집 카드 — 드래그 핸들, 편집, 삭제 버튼 포함
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { TimeBlock } from '@/types';

interface BlockEditCardProps {
  block: TimeBlock;
  /** DraggableFlatList에서 드래그 시작 함수 */
  onDrag: () => void;
  /** 드래그 중 여부 — 활성화 시 카드 강조 */
  isDragging: boolean;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

export const BlockEditCard = React.memo(function BlockEditCard({
  block,
  onDrag,
  isDragging,
  onEdit,
  onDelete,
}: BlockEditCardProps) {
  const blockTypeInfo = BLOCK_TYPES[block.blockType];

  const handleEdit = useCallback(() => {
    onEdit(block);
  }, [block, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(block.id);
  }, [block.id, onDelete]);

  return (
    <View style={[styles.container, isDragging && styles.containerDragging]}>
      {/* 왼쪽: 드래그 핸들 */}
      <TouchableOpacity
        style={styles.dragHandle}
        onLongPress={onDrag}
        delayLongPress={100}
        activeOpacity={0.6}
      >
        <Ionicons name="menu" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* 가운데: 블록 정보 */}
      <View style={styles.content}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {block.startTime} - {block.endTime}
          </Text>
        </View>
        <Text style={styles.taskName} numberOfLines={1}>
          {block.taskName}
        </Text>
        <View style={styles.typeRow}>
          <View style={[styles.colorDot, { backgroundColor: blockTypeInfo.color }]} />
          <Text style={styles.typeLabel}>{blockTypeInfo.label}</Text>
          <Text style={styles.points}>+{block.basePoints}P</Text>
        </View>
      </View>

      {/* 오른쪽: 편집/삭제 버튼 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  containerDragging: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dragHandle: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  content: {
    flex: 1,
    gap: SPACING.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  taskName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  points: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actionButtons: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
});
