// 시간 선택 컴포넌트 — "HH:mm" 형식의 시간을 FlatList 스크롤 휠로 선택
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

interface TimePickerProps {
  value: string;           // "HH:mm"
  onChange: (time: string) => void;
  label: string;
  minTime?: string;        // 선택 가능한 최소 시간 (선택적)
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const ITEM_HEIGHT = 44;

export function TimePicker({ value, onChange, label, minTime }: TimePickerProps) {
  const colors = useThemeColors();
  const [hourStr, minuteStr] = value.split(':');
  const selectedHour = parseInt(hourStr, 10);
  const selectedMinute = parseInt(minuteStr, 10);

  const hourListRef = useRef<FlatList<number>>(null);
  const minuteListRef = useRef<FlatList<number>>(null);

  const handleHourSelect = useCallback(
    (hour: number) => {
      // minTime 제약 적용
      let minute = selectedMinute;
      if (minTime) {
        const [minH, minM] = minTime.split(':').map(Number);
        if (hour === minH && minute < minM) {
          minute = minM;
        }
      }
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      onChange(`${hh}:${mm}`);
    },
    [selectedMinute, minTime, onChange],
  );

  const handleMinuteSelect = useCallback(
    (minute: number) => {
      const hh = String(selectedHour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      onChange(`${hh}:${mm}`);
    },
    [selectedHour, onChange],
  );

  const renderHour = useCallback(
    ({ item }: ListRenderItemInfo<number>) => {
      const isSelected = item === selectedHour;
      return (
        <TouchableOpacity
          style={[styles.item, isSelected && { backgroundColor: colors.primary }]}
          onPress={() => handleHourSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.itemText, { color: colors.textPrimary }, isSelected && { color: colors.surface, fontWeight: '700' }]}>
            {String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedHour, handleHourSelect, colors],
  );

  const renderMinute = useCallback(
    ({ item }: ListRenderItemInfo<number>) => {
      const isSelected = item === selectedMinute;
      return (
        <TouchableOpacity
          style={[styles.item, isSelected && { backgroundColor: colors.primary }]}
          onPress={() => handleMinuteSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.itemText, { color: colors.textPrimary }, isSelected && { color: colors.surface, fontWeight: '700' }]}>
            {String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedMinute, handleMinuteSelect, colors],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.pickerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* 시간 선택 */}
        <View style={styles.wheelContainer}>
          <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>시</Text>
          <FlatList
            ref={hourListRef}
            data={HOURS}
            keyExtractor={(item) => String(item)}
            renderItem={renderHour}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            initialScrollIndex={Math.max(0, selectedHour - 2)}
            showsVerticalScrollIndicator={false}
            style={styles.wheel}
            contentContainerStyle={styles.wheelContent}
          />
        </View>

        <Text style={[styles.colon, { color: colors.textPrimary }]}>:</Text>

        {/* 분 선택 (15분 단위) */}
        <View style={styles.wheelContainer}>
          <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>분</Text>
          <FlatList
            ref={minuteListRef}
            data={MINUTES}
            keyExtractor={(item) => String(item)}
            renderItem={renderMinute}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            showsVerticalScrollIndicator={false}
            style={styles.wheel}
            contentContainerStyle={styles.wheelContent}
          />
        </View>
      </View>

      {/* 현재 선택된 시간 표시 */}
      <Text style={[styles.selectedTime, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
  },
  wheelContainer: {
    alignItems: 'center',
  },
  wheelLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs,
  },
  wheel: {
    height: ITEM_HEIGHT * 4,
    width: 64,
  },
  wheelContent: {
    paddingVertical: SPACING.xs,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  itemText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '400',
  },
  colon: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.md,
  },
  selectedTime: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
});
