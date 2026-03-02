// 월간 캘린더 히트맵 — 달성률에 따라 색상으로 표시
// 순수 RN View 컴포넌트 (차트 라이브러리 불필요)
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext';
import { getTodayDate } from '@/utils/time';
import { hapticLight } from '@/utils/haptics';
import { startOfMonth, getDay } from 'date-fns';

interface DayData {
  date: string;
  completionRate: number;
}

interface CalendarHeatmapProps {
  dailyRates: DayData[];
  /** "YYYY-MM" 형식 월 */
  month: string;
}

const DAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일'];

/** 달성률에 따라 셀 배경색 반환 */
function getRateColor(rate: number, borderColor: string, successColor: string, isDark: boolean): string {
  if (rate === 0) return borderColor;
  if (rate <= 0.25) return isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2'; // 연한 빨강
  if (rate <= 0.5) return isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7';  // 연한 노랑
  if (rate <= 0.75) return isDark ? 'rgba(34,197,94,0.2)' : '#d1fae5'; // 연한 초록
  return successColor;              // 강한 초록
}

export const CalendarHeatmap = memo(function CalendarHeatmap({
  dailyRates,
  month,
}: CalendarHeatmapProps) {
  const colors = useThemeColors();
  const { effectiveTheme } = useThemeMode();
  const isDark = effectiveTheme === 'dark';
  const today = getTodayDate();
  const rateMap = useMemo(
    () => new Map<string, number>(dailyRates.map((d) => [d.date, d.completionRate])),
    [dailyRates],
  );

  // 월의 첫 번째 날 요일 계산 (0=일, 1=월...6=토 → 월요일 시작으로 변환)
  const firstDay = useMemo(() => {
    const d = new Date(`${month}-01T00:00:00`);
    // getDay()는 0=일, 우리는 월=0 기준으로 변환
    const dow = getDay(startOfMonth(d)); // 0=일, 1=월...6=토
    return dow === 0 ? 6 : dow - 1; // 월요일 기준 0~6
  }, [month]);

  // 해당 월의 날짜 목록
  const daysInMonth = dailyRates.length;

  // 캘린더 셀 배열 (앞 빈 칸 + 날짜 셀)
  const cells = useMemo(() => {
    const result: Array<{ date: string | null; day: number | null }> = [];
    // 앞 빈 칸
    for (let i = 0; i < firstDay; i++) {
      result.push({ date: null, day: null });
    }
    // 날짜 셀
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`;
      result.push({ date: dateStr, day: d });
    }
    return result;
  }, [firstDay, daysInMonth, month]);

  // 행으로 분리 (7개씩)
  const rows = useMemo(() => {
    const result: Array<typeof cells> = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    // 마지막 행 7개 미만이면 빈 칸 채우기
    const lastRow = result[result.length - 1];
    if (lastRow && lastRow.length < 7) {
      while (lastRow.length < 7) {
        lastRow.push({ date: null, day: null });
      }
    }
    return result;
  }, [cells]);

  return (
    <View style={styles.container}>
      {/* 요일 헤더 */}
      <View style={styles.row}>
        {DAY_HEADERS.map((header) => (
          <View key={header} style={styles.headerCell}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>{header}</Text>
          </View>
        ))}
      </View>

      {/* 날짜 행들 */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => {
            if (!cell.date || !cell.day) {
              return <View key={cellIndex} style={styles.emptyCell} />;
            }
            const rate = rateMap.get(cell.date) ?? 0;
            const isToday = cell.date === today;
            const isFuture = cell.date > today;
            const bgColor = isFuture ? 'transparent' : getRateColor(rate, colors.border, colors.success, isDark);

            return (
              <TouchableOpacity
                key={cell.date}
                activeOpacity={0.7}
                onPress={() => hapticLight()}
                style={[
                  styles.cell,
                  { backgroundColor: bgColor },
                  isToday && { borderWidth: 2, borderColor: colors.primary },
                  isFuture && { borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.dayText, { color: colors.textPrimary }, isToday && { color: colors.primary, fontWeight: 'bold' }]}>
                  {cell.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  headerCell: {
    width: CELL_SIZE,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  dayText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
