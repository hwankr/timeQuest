// 블록 타입 선택 컴포넌트 — 8가지 타입을 수평 FlatList로 표시
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { BLOCK_TYPES, BlockTypeInfo } from '@/constants/blockTypes';
import { BlockType } from '@/types';

interface BlockTypePickerProps {
  selectedType: BlockType;
  onSelect: (type: BlockType) => void;
}

const BLOCK_TYPE_LIST: BlockTypeInfo[] = Object.values(BLOCK_TYPES);

function BlockTypeItem({
  item,
  isSelected,
  onSelect,
}: {
  item: BlockTypeInfo;
  isSelected: boolean;
  onSelect: (type: BlockType) => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.typeItem,
        isSelected && { backgroundColor: item.color + '33', borderColor: item.color, borderWidth: 2 },
      ]}
      onPress={() => onSelect(item.type)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
        size={20}
        color={isSelected ? item.color : COLORS.textSecondary}
      />
      <Text style={[styles.typeLabel, isSelected && { color: item.color, fontWeight: '700' }]}>
        {item.label}
      </Text>
      <Text style={[styles.typePoints, isSelected && { color: item.color }]}>
        {item.defaultPoints > 0 ? `+${item.defaultPoints}` : '0'}P
      </Text>
    </TouchableOpacity>
  );
}

export const BlockTypePicker = React.memo(function BlockTypePicker({
  selectedType,
  onSelect,
}: BlockTypePickerProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BlockTypeInfo>) => (
      <BlockTypeItem
        item={item}
        isSelected={item.type === selectedType}
        onSelect={onSelect}
      />
    ),
    [selectedType, onSelect],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>블록 타입</Text>
      <FlatList
        data={BLOCK_TYPE_LIST}
        keyExtractor={(item) => item.type}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  typeItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 72,
    gap: SPACING.xs,
  },
  typeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  typePoints: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
