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
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticLight } from '@/utils/haptics';
import Animated from 'react-native-reanimated';
import { useTabTransition } from '@/hooks/useTabTransition';

type TabKey = '오늘' | '주간' | '월간';
const TABS: TabKey[] = ['오늘', '주간', '월간'];

export default function StatsScreen() {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabKey>('오늘');
  const tabEntering = useTabTransition();
  const { user } = useAuthStore();
  const { userDoc } = useUserDocument(user?.uid);
  const { stats, isLoading } = useTodayStats(user?.uid);

  const handleTabPress = useCallback((tab: TabKey) => {
    hapticLight();
    setActiveTab(tab);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>통계</Text>
          {/* 스트릭 표시 */}
          <View style={[styles.streakBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={[styles.streakText, { color: colors.textPrimary }]}>
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
        <Animated.View key={activeTab} entering={tabEntering} style={styles.content}>
          {activeTab === '오늘' && (
            <TodayStats stats={stats} isLoading={isLoading} />
          )}
          {activeTab === '주간' && (
            <WeeklyStats userId={user?.uid} />
          )}
          {activeTab === '월간' && (
            <MonthlyStats userId={user?.uid} />
          )}
        </Animated.View>
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
  const colors = useThemeColors();
  const handlePress = useCallback(() => onPress(label), [label, onPress]);
  return (
    <TouchableOpacity
      style={[styles.tab, isActive && { borderBottomColor: colors.primary }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>
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
  },
  header: {
    borderBottomWidth: 1,
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
  },
  streakBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  streakText: {
    fontSize: FONT_SIZE.sm,
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
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});
