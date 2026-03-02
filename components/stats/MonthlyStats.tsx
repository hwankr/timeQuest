// 월간 통계 탭 콘텐츠 — 캘린더 히트맵 + 포인트 요약 + 카테고리 분류 (on-demand)
import React, { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { format, subMonths } from "date-fns";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/theme";
import { useThemeColors, useThemeMode } from "@/contexts/ThemeContext";
import { useMonthlyStats } from "@/hooks/useStatistics";
import { hapticLight } from "@/utils/haptics";

interface MonthlyStatsProps {
  userId: string | undefined;
}

export const MonthlyStats = memo(function MonthlyStats({ userId }: MonthlyStatsProps) {
  const colors = useThemeColors();
  const { effectiveTheme } = useThemeMode();
  const isDark = effectiveTheme === 'dark';
  const [monthOffset, setMonthOffset] = useState(0);
  const { stats, isLoading, loadCategoryBreakdown } = useMonthlyStats(userId, monthOffset);

  const handlePrevMonth = useCallback(() => {
    hapticLight();
    setMonthOffset((o) => o - 1);
  }, []);
  const handleNextMonth = useCallback(() => {
    hapticLight();
    setMonthOffset((o) => Math.min(o + 1, 0));
  }, []);

  const now = monthOffset === 0 ? new Date() : subMonths(new Date(), Math.abs(monthOffset));
  const month = format(now, "yyyy-MM");
  const monthLabel = monthOffset === 0 ? "이번 달" : String(Math.abs(monthOffset)) + "달 전";

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>이번 달 데이터가 없습니다</Text>
      </View>
    );
  }

  const net = stats.totalPointsEarned - stats.totalPointsSpent;
  const hasData = stats.dailyRates.some((d) => d.completionRate > 0);

  // 다크모드용 범례 색상
  const legendLow = isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2';
  const legendMid = isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7';
  const legendHigh = isDark ? 'rgba(34,197,94,0.2)' : '#d1fae5';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Text style={[styles.navBtnText, { color: colors.primary }]}>이전</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={[styles.navBtn, monthOffset === 0 && styles.navBtnDisabled]}
          disabled={monthOffset === 0}
        >
          <Text style={[styles.navBtnText, { color: colors.primary }, monthOffset === 0 && { color: colors.textTertiary }]}>
            다음
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{month} 달성 캘린더</Text>
        {hasData ? (
          <CalendarHeatmap dailyRates={stats.dailyRates} month={month} />
        ) : (
          <View style={styles.emptyHeatmap}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>이번 달 완료 기록이 없습니다</Text>
          </View>
        )}
        <View style={styles.legend}>
          <LegendItem color={colors.border} label="0%" borderColor={colors.border} textColor={colors.textSecondary} />
          <LegendItem color={legendLow} label="~25%" borderColor={colors.border} textColor={colors.textSecondary} />
          <LegendItem color={legendMid} label="~50%" borderColor={colors.border} textColor={colors.textSecondary} />
          <LegendItem color={legendHigh} label="~75%" borderColor={colors.border} textColor={colors.textSecondary} />
          <LegendItem color={colors.success} label="100%" borderColor={colors.border} textColor={colors.textSecondary} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>월간 포인트</Text>
        <View style={styles.pointsRow}>
          <PointItem label="획득" value={stats.totalPointsEarned} prefix="+" color={colors.success} textSecondary={colors.textSecondary} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PointItem label="사용" value={stats.totalPointsSpent} prefix="-" color={colors.error} textSecondary={colors.textSecondary} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PointItem
            label="순수익"
            value={net}
            prefix={net >= 0 ? "+" : ""}
            color={net >= 0 ? colors.success : colors.error}
            textSecondary={colors.textSecondary}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>카테고리별 달성</Text>
          {!stats.categoryComparison && (
            <TouchableOpacity
              style={[styles.detailButton, { backgroundColor: colors.primary }]}
              onPress={loadCategoryBreakdown}
              activeOpacity={0.7}
            >
              <Text style={[styles.detailButtonText, { color: colors.surface }]}>상세 보기</Text>
            </TouchableOpacity>
          )}
        </View>
        {stats.categoryComparison ? (
          <CategoryBreakdown breakdown={stats.categoryComparison} />
        ) : (
          <Text style={[styles.categoryHint, { color: colors.textTertiary }]}>
            상세 보기를 탭하면 카테고리별 달성률을 확인할 수 있습니다
          </Text>
        )}
      </View>
    </ScrollView>
  );
});

const LegendItem = memo(function LegendItem({
  color, label, borderColor, textColor,
}: { color: string; label: string; borderColor: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color, borderColor }]} />
      <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
});

const PointItem = memo(function PointItem({
  label, value, prefix, color, textSecondary,
}: { label: string; value: number; prefix: string; color: string; textSecondary: string }) {
  return (
    <View style={styles.pointItem}>
      <Text style={[styles.pointLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.pointValue, { color }]}>{prefix}{value}P</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: "center" },
  emptyHeatmap: { alignItems: "center", paddingVertical: SPACING.lg },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: FONT_SIZE.sm, fontWeight: "600" },
  monthLabel: { fontSize: FONT_SIZE.md, fontWeight: "600" },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, gap: SPACING.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "600" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.xs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendColor: { width: 12, height: 12, borderRadius: 2, borderWidth: 1 },
  legendLabel: { fontSize: FONT_SIZE.xs },
  pointsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  pointItem: { flex: 1, alignItems: "center", gap: 4 },
  pointLabel: { fontSize: FONT_SIZE.xs },
  pointValue: { fontSize: FONT_SIZE.md, fontWeight: "bold" },
  divider: { width: 1, height: 32 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailButton: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  detailButtonText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
  categoryHint: { fontSize: FONT_SIZE.sm, textAlign: "center", paddingVertical: SPACING.sm },
});
