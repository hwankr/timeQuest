// 설정 화면 — 계정, 시간표 관리, 로그아웃
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import DayTemplateSelector from '@/components/DayTemplateSelector';
import { DayOfWeek, DayTemplateMap, ScheduleTemplate } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const userId = user?.uid;

  const templates = useTemplateStore((state) => state.templates);
  const subscribeToTemplates = useTemplateStore((state) => state.subscribeToTemplates);

  const settings = useSettingsStore((state) => state.settings);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const setDefaultTemplate = useSettingsStore((state) => state.setDefaultTemplate);
  const setDayTemplate = useSettingsStore((state) => state.setDayTemplate);
  const setDayTemplateMap = useSettingsStore((state) => state.setDayTemplateMap);

  // 템플릿 실시간 구독
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToTemplates(userId);
    return unsubscribe;
  }, [userId, subscribeToTemplates]);

  // 설정 로드
  useEffect(() => {
    if (!userId) return;
    loadSettings(userId);
  }, [userId, loadSettings]);

  // 로그아웃 확인 다이얼로그
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  // 기본 템플릿 선택 피커
  const handleDefaultTemplatePick = useCallback(() => {
    if (!userId || templates.length === 0) return;
    hapticLight();
    const options = templates.map((t) => ({
      text: t.name + (t.isDefault ? ' (현재 기본)' : ''),
      onPress: () => setDefaultTemplate(userId, t.id),
    }));
    Alert.alert('기본 시간표 선택', '기본으로 사용할 시간표를 선택하세요', [
      ...options,
      { text: '취소', style: 'cancel' },
    ]);
  }, [userId, templates, setDefaultTemplate]);

  // 요일별 템플릿 변경
  const handleDayTemplateChange = useCallback(
    (day: DayOfWeek, templateId: string) => {
      if (!userId) return;
      setDayTemplate(userId, day, templateId);
    },
    [userId, setDayTemplate],
  );

  // 평일/주말 분리 프리셋
  const handlePresetWeekdayWeekend = useCallback(() => {
    if (!userId || templates.length < 2) {
      Alert.alert('안내', '평일/주말 분리를 적용하려면 시간표가 2개 이상 필요합니다.');
      return;
    }
    // 첫 번째 템플릿 = 평일, 두 번째 템플릿 = 주말
    const weekdayTemplate = templates[0];
    const weekendTemplate = templates[1];
    const newMap: DayTemplateMap = {
      mon: weekdayTemplate.id,
      tue: weekdayTemplate.id,
      wed: weekdayTemplate.id,
      thu: weekdayTemplate.id,
      fri: weekdayTemplate.id,
      sat: weekendTemplate.id,
      sun: weekendTemplate.id,
    };
    Alert.alert(
      '평일/주말 분리',
      `평일: "${weekdayTemplate.name}"\n주말: "${weekendTemplate.name}"\n\n이 설정으로 적용하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '적용', onPress: () => setDayTemplateMap(userId, newMap) },
      ],
    );
  }, [userId, templates, setDayTemplateMap]);

  // 현재 기본 템플릿 이름
  const defaultTemplate = templates.find((t) => t.id === settings?.defaultTemplateId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>계정</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValue}>{user?.email ?? '-'}</Text>
          </View>
        </View>

        {/* 시간표 관리 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>시간표 관리</Text>

          {/* 템플릿 관리 바로가기 */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => {
              hapticLight();
              router.push('/schedule/template');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.menuCardLabel}>시간표 목록</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* 기본 시간표 선택 */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={handleDefaultTemplatePick}
            activeOpacity={0.7}
            disabled={templates.length === 0}
          >
            <View style={styles.menuCardLeft}>
              <Ionicons name="star-outline" size={20} color={COLORS.point} />
              <Text style={styles.menuCardLabel}>기본 시간표</Text>
            </View>
            <View style={styles.menuCardRight}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.menuCardValue} numberOfLines={1}>
                  {defaultTemplate?.name ?? (templates.length === 0 ? '없음' : '선택 안 됨')}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* 요일별 시간표 배정 */}
          {settings && templates.length > 0 && (
            <View style={styles.dayTemplateSectionCard}>
              <Text style={styles.dayTemplateSectionTitle}>요일별 시간표 배정</Text>
              <DayTemplateSelector
                templates={templates}
                dayTemplateMap={settings.dayTemplateMap}
                onDayTemplateChange={handleDayTemplateChange}
                onPresetWeekdayWeekend={handlePresetWeekdayWeekend}
              />
            </View>
          )}

          {templates.length === 0 && !isLoading && (
            <View style={styles.emptyTemplateHint}>
              <Text style={styles.emptyTemplateHintText}>
                시간표를 먼저 만들면 요일별 배정이 가능합니다
              </Text>
            </View>
          )}
        </View>

        {/* 로그아웃 버튼 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  section: {
    padding: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  menuCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  menuCardLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  menuCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    maxWidth: 160,
  },
  menuCardValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  dayTemplateSectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  dayTemplateSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptyTemplateHint: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyTemplateHintText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
