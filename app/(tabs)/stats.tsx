// 통계 화면 — 오늘/주간/월간 탭
import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserDocument } from '@/hooks/useUserDocument';
import { useTodayStats } from '@/hooks/useStatistics';
import { TodayStats } from '@/components/stats/TodayStats';
import { WeeklyStats } from '@/components/stats/WeeklyStats';
import { MonthlyStats } from '@/components/stats/MonthlyStats';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

type TabKey = '오늘' | '주간' | '월간';
const TABS: TabKey[] = ['오늘', '주간', '월간'];

export default function StatsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('오늘');
  const { user } = useAuthStore();
  const { userDoc } = useUserDocument(user?.uid);
  const { stats, isLoading } = useTodayStats(user?.uid);

  const handleTabPress = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>통계</Text>
          {/* 스트릭 표시 */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              🔥 {userDoc?.currentStreak ?? 0}일 연속
            </Text>
          </View>
        </View>

        {/* 탭 선택기 */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onPress={handleTabPress}
            />
          ))}
        </View>
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.content}>
        {activeTab === '오늘' && (
          <TodayStats stats={stats} isLoading={isLoading} />
        )}
        {activeTab === '주간' && (
          <WeeklyStats userId={user?.uid} />
        )}
        {activeTab === '월간' && (
          <MonthlyStats userId={user?.uid} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────

interface TabButtonProps {
  label: TabKey;
  isActive: boolean;
  onPress: (tab: TabKey) => void;
}

const TabButton = memo(function TabButton({ label, isActive, onPress }: TabButtonProps) {
  const handlePress = useCallback(() => onPress(label), [label, onPress]);
  return (
    <TouchableOpacity
      style={[styles.tab, isActive && styles.tabActive]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});


// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  streakBadge: {
    backgroundColor: COLORS.bg,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streakText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
