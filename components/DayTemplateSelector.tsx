// DayTemplateSelector — 요일별 템플릿 배정 컴포넌트
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ScheduleTemplate, DayOfWeek, DayTemplateMap } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
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
  const colors = useThemeColors();
  const isWeekend = dayKey === 'sat' || dayKey === 'sun';

  return (
    <View style={styles.dayRow}>
      <Text style={[styles.dayLabel, { color: colors.textPrimary }, isWeekend && { color: colors.error }]}>{dayLabel}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {templates.map((t) => {
          const isSelected = t.id === selectedTemplateId;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.templateChip,
                { backgroundColor: colors.bg, borderColor: colors.border },
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                hapticLight();
                onSelect(dayKey, t.id);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.templateChipText,
                  { color: colors.textSecondary },
                  isSelected && { color: colors.surface, fontWeight: '600' },
                ]}
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
  const colors = useThemeColors();

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
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>템플릿이 없습니다. 먼저 템플릿을 만들어주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.presetButton, { backgroundColor: colors.primaryLight }]} onPress={handlePreset} activeOpacity={0.7}>
        <Text style={[styles.presetButtonText, { color: colors.surface }]}>평일/주말 분리 적용</Text>
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
    textAlign: 'center',
  },
  presetButton: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  presetButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dayLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    width: 28,
    textAlign: 'center',
  },
  templateScroll: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  templateChip: {
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    maxWidth: 120,
  },
  templateChipText: {
    fontSize: FONT_SIZE.sm,
  },
});
