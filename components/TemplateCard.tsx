// TemplateCard — 템플릿 목록 아이템 (React.memo)
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleTemplate } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
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
  const handleEdit = useCallback(() => {
    hapticLight();
    onEdit(template);
  }, [template, onEdit]);

  const handleDuplicate = useCallback(() => {
    hapticLight();
    onDuplicate(template);
  }, [template, onDuplicate]);

  const handleDelete = useCallback(() => {
    hapticLight();
    onDelete(template);
  }, [template, onDelete]);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainArea} onPress={handleEdit} activeOpacity={0.7}>
        <View style={styles.titleRow}>
          <Text style={styles.templateName} numberOfLines={1}>
            {template.name}
          </Text>
          {template.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>기본</Text>
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
          <Ionicons name="copy-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEdit}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={20} color={COLORS.textSecondary} />
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
            color={template.isDefault ? COLORS.textTertiary : COLORS.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default TemplateCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.surface,
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
