// DayTemplateSelector — 요일별 템플릿 배정 컴포넌트
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ScheduleTemplate, DayOfWeek, DayTemplateMap } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

interface DayTemplateSelectorProps {
  templates: ScheduleTemplate[];
  dayTemplateMap: DayTemplateMap;
  onDayTemplateChange: (day: DayOfWeek, templateId: string) => void;
  onPresetWeekdayWeekend: () => void;
}

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

interface DayRowProps {
  dayKey: DayOfWeek;
  dayLabel: string;
  templates: ScheduleTemplate[];
  selectedTemplateId: string;
  onSelect: (day: DayOfWeek, templateId: string) => void;
}

const DayRow = React.memo(function DayRow({
  dayKey,
  dayLabel,
  templates,
  selectedTemplateId,
  onSelect,
}: DayRowProps) {
  const isWeekend = dayKey === 'sat' || dayKey === 'sun';

  return (
    <View style={styles.dayRow}>
      <Text style={[styles.dayLabel, isWeekend && styles.dayLabelWeekend]}>{dayLabel}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {templates.map((t) => {
          const isSelected = t.id === selectedTemplateId;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateChip, isSelected && styles.templateChipSelected]}
              onPress={() => {
                hapticLight();
                onSelect(dayKey, t.id);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.templateChipText, isSelected && styles.templateChipTextSelected]}
                numberOfLines={1}
              >
                {t.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const DayTemplateSelector = React.memo(function DayTemplateSelector({
  templates,
  dayTemplateMap,
  onDayTemplateChange,
  onPresetWeekdayWeekend,
}: DayTemplateSelectorProps) {
  const handleSelect = useCallback(
    (day: DayOfWeek, templateId: string) => {
      onDayTemplateChange(day, templateId);
    },
    [onDayTemplateChange],
  );

  const handlePreset = useCallback(() => {
    hapticLight();
    onPresetWeekdayWeekend();
  }, [onPresetWeekdayWeekend]);

  if (templates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>템플릿이 없습니다. 먼저 템플릿을 만들어주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.presetButton} onPress={handlePreset} activeOpacity={0.7}>
        <Text style={styles.presetButtonText}>평일/주말 분리 적용</Text>
      </TouchableOpacity>

      {DAY_LABELS.map(({ key, label }) => (
        <DayRow
          key={key}
          dayKey={key}
          dayLabel={label}
          templates={templates}
          selectedTemplateId={dayTemplateMap[key]}
          onSelect={handleSelect}
        />
      ))}
    </View>
  );
});

export default DayTemplateSelector;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  emptyContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  presetButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  presetButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.surface,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dayLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 28,
    textAlign: 'center',
  },
  dayLabelWeekend: {
    color: COLORS.error,
  },
  templateScroll: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  templateChip: {
    backgroundColor: COLORS.bg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    maxWidth: 120,
  },
  templateChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  templateChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  templateChipTextSelected: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});
