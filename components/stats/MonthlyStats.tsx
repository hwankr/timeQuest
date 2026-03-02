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
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/theme";
import { useMonthlyStats } from "@/hooks/useStatistics";

interface MonthlyStatsProps {
  userId: string | undefined;
}

export const MonthlyStats = memo(function MonthlyStats({ userId }: MonthlyStatsProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const { stats, isLoading, loadCategoryBreakdown } = useMonthlyStats(userId, monthOffset);

  const handlePrevMonth = useCallback(() => setMonthOffset((o) => o - 1), []);
  const handleNextMonth = useCallback(() => setMonthOffset((o) => Math.min(o + 1, 0)), []);

  const now = monthOffset === 0 ? new Date() : subMonths(new Date(), Math.abs(monthOffset));
  const month = format(now, "yyyy-MM");
  const monthLabel = monthOffset === 0 ? "이번 달" : String(Math.abs(monthOffset)) + "달 전";

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>이번 달 데이터가 없습니다</Text>
      </View>
    );
  }

  const net = stats.totalPointsEarned - stats.totalPointsSpent;
  const hasData = stats.dailyRates.some((d) => d.completionRate > 0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>이전</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={[styles.navBtn, monthOffset === 0 && styles.navBtnDisabled]}
          disabled={monthOffset === 0}
        >
          <Text style={[styles.navBtnText, monthOffset === 0 && styles.navBtnTextDisabled]}>
            다음
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{month} 달성 캘린더</Text>
        {hasData ? (
          <CalendarHeatmap dailyRates={stats.dailyRates} month={month} />
        ) : (
          <View style={styles.emptyHeatmap}>
            <Text style={styles.emptyText}>이번 달 완료 기록이 없습니다</Text>
          </View>
        )}
        <View style={styles.legend}>
          <LegendItem color={COLORS.border} label="0%" />
          <LegendItem color="#fee2e2" label="~25%" />
          <LegendItem color="#fef3c7" label="~50%" />
          <LegendItem color="#d1fae5" label="~75%" />
          <LegendItem color={COLORS.success} label="100%" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>월간 포인트</Text>
        <View style={styles.pointsRow}>
          <PointItem label="획득" value={stats.totalPointsEarned} prefix="+" color={COLORS.success} />
          <View style={styles.divider} />
          <PointItem label="사용" value={stats.totalPointsSpent} prefix="-" color={COLORS.error} />
          <View style={styles.divider} />
          <PointItem
            label="순수익"
            value={net}
            prefix={net >= 0 ? "+" : ""}
            color={net >= 0 ? COLORS.success : COLORS.error}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.categoryHeader}>
          <Text style={styles.cardTitle}>카테고리별 달성</Text>
          {!stats.categoryComparison && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={loadCategoryBreakdown}
              activeOpacity={0.7}
            >
              <Text style={styles.detailButtonText}>상세 보기</Text>
            </TouchableOpacity>
          )}
        </View>
        {stats.categoryComparison ? (
          <CategoryBreakdown breakdown={stats.categoryComparison} />
        ) : (
          <Text style={styles.categoryHint}>
            상세 보기를 탭하면 카테고리별 달성률을 확인할 수 있습니다
          </Text>
        )}
      </View>
    </ScrollView>
  );
});

const LegendItem = memo(function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
});

const PointItem = memo(function PointItem({
  label, value, prefix, color,
}: { label: string; value: number; prefix: string; color: string }) {
  return (
    <View style={styles.pointItem}>
      <Text style={styles.pointLabel}>{label}</Text>
      <Text style={[styles.pointValue, { color }]}>{prefix}{value}P</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: "center" },
  emptyHeatmap: { alignItems: "center", paddingVertical: SPACING.lg },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
  navBtnTextDisabled: { color: COLORS.textTertiary },
  monthLabel: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.textPrimary },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginTop: SPACING.xs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendColor: { width: 12, height: 12, borderRadius: 2, borderWidth: 1, borderColor: COLORS.border },
  legendLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  pointsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  pointItem: { flex: 1, alignItems: "center", gap: 4 },
  pointLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  pointValue: { fontSize: FONT_SIZE.md, fontWeight: "bold" },
  divider: { width: 1, height: 32, backgroundColor: COLORS.border },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailButton: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  detailButtonText: { fontSize: FONT_SIZE.xs, color: COLORS.surface, fontWeight: "600" },
  categoryHint: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: "center", paddingVertical: SPACING.sm },
});
