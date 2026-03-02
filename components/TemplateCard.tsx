// TemplateCard — 템플릿 목록 아이템 (React.memo) — 선택 시 border 색상 전환 애니메이션
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleTemplate } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticLight } from '@/utils/haptics';

interface TemplateCardProps {
  template: ScheduleTemplate;
  onEdit: (template: ScheduleTemplate) => void;
  onDuplicate: (template: ScheduleTemplate) => void;
  onDelete: (template: ScheduleTemplate) => void;
}

const TemplateCard = React.memo(function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const colors = useThemeColors();
  // border 색상 전환: 탭 시 primary → border (200ms)
  const borderOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderOpacity.value > 0.5 ? colors.primary : colors.border,
  }));

  const triggerSelectAnimation = useCallback(() => {
    borderOpacity.value = withTiming(1, { duration: 100 }, () => {
      borderOpacity.value = withTiming(0, { duration: 200 });
    });
  }, []);

  const handleEdit = useCallback(() => {
    hapticLight();
    triggerSelectAnimation();
    onEdit(template);
  }, [template, onEdit, triggerSelectAnimation]);

  const handleDuplicate = useCallback(() => {
    hapticLight();
    onDuplicate(template);
  }, [template, onDuplicate]);

  const handleDelete = useCallback(() => {
    hapticLight();
    onDelete(template);
  }, [template, onDelete]);

  return (
    <Animated.View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
      animatedStyle,
    ]}>
      <TouchableOpacity style={styles.mainArea} onPress={handleEdit} activeOpacity={0.7}>
        <View style={styles.titleRow}>
          <Text style={[styles.templateName, { color: colors.textPrimary }]} numberOfLines={1}>
            {template.name}
          </Text>
          {template.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.defaultBadgeText, { color: colors.surface }]}>기본</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDuplicate}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEdit}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={template.isDefault}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={template.isDefault ? colors.textTertiary : colors.error}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default TemplateCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  mainArea: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  templateName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
  },
  defaultBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
  },
});
