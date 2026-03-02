// 설정 화면 — 계정, 시간표 관리, 외관(다크 모드), 로그아웃
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
import NotificationSettingsSection from '@/components/NotificationSettingsSection';
import { DayOfWeek, DayTemplateMap, NotificationSettings, ThemeMode } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext';
import { hapticLight, hapticMedium } from '@/utils/haptics';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { themeMode, setThemeMode, effectiveTheme } = useThemeMode();
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
  const updateNotificationSetting = useSettingsStore((state) => state.updateNotificationSetting);
  const updateAdvanceMinutes = useSettingsStore((state) => state.updateAdvanceMinutes);
  const updateDNDTimes = useSettingsStore((state) => state.updateDNDTimes);

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

  // 알림 설정 핸들러
  const handleNotificationToggle = useCallback(
    (key: keyof NotificationSettings, value: NotificationSettings[keyof NotificationSettings]) => {
      if (!userId) return;
      updateNotificationSetting(userId, key, value);
    },
    [userId, updateNotificationSetting],
  );

  const handleAdvanceMinutes = useCallback(
    (minutes: 1 | 5 | 10) => {
      if (!userId) return;
      updateAdvanceMinutes(userId, minutes);
    },
    [userId, updateAdvanceMinutes],
  );

  const handleDNDChange = useCallback(
    (dndStart: string, dndEnd: string) => {
      if (!userId) return;
      updateDNDTimes(userId, dndStart, dndEnd);
    },
    [userId, updateDNDTimes],
  );

  // 테마 모드 변경 — 중간 햅틱 (토글 전환)
  const handleThemeMode = useCallback(
    (mode: ThemeMode) => {
      hapticMedium();
      setThemeMode(mode);
    },
    [setThemeMode],
  );

  // 현재 기본 템플릿 이름
  const defaultTemplate = templates.find((t) => t.id === settings?.defaultTemplateId);

  // 테마 모드 레이블
  const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
    { mode: 'system', label: '시스템 따름' },
    { mode: 'light', label: '라이트' },
    { mode: 'dark', label: '다크' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>설정</Text>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>계정</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>이메일</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email ?? '-'}</Text>
          </View>
        </View>

        {/* 외관 섹션 — 다크 모드 토글 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>외관</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>테마</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map(({ mode, label }) => {
                const isSelected = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeOption,
                      { borderColor: colors.border, backgroundColor: colors.bg },
                      isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => handleThemeMode(mode)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={[styles.themeHint, { color: colors.textTertiary }]}>
            현재: {effectiveTheme === 'dark' ? '다크 모드' : '라이트 모드'}
          </Text>
        </View>

        {/* 시간표 관리 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>시간표 관리</Text>

          {/* 템플릿 관리 바로가기 */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              hapticLight();
              router.push('/schedule/template');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuCardLabel, { color: colors.textPrimary }]}>시간표 목록</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* 기본 시간표 선택 */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleDefaultTemplatePick}
            activeOpacity={0.7}
            disabled={templates.length === 0}
          >
            <View style={styles.menuCardLeft}>
              <Ionicons name="star-outline" size={20} color={colors.point} />
              <Text style={[styles.menuCardLabel, { color: colors.textPrimary }]}>기본 시간표</Text>
            </View>
            <View style={styles.menuCardRight}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.menuCardValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {defaultTemplate?.name ?? (templates.length === 0 ? '없음' : '선택 안 됨')}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* 요일별 시간표 배정 */}
          {settings && templates.length > 0 && (
            <View style={[styles.dayTemplateSectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.dayTemplateSectionTitle, { color: colors.textSecondary }]}>요일별 시간표 배정</Text>
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
              <Text style={[styles.emptyTemplateHintText, { color: colors.textTertiary }]}>
                시간표를 먼저 만들면 요일별 배정이 가능합니다
              </Text>
            </View>
          )}
        </View>

        {/* 알림 설정 섹션 */}
        {settings?.notifications && userId && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>알림</Text>
            <NotificationSettingsSection
              userId={userId}
              notifications={settings.notifications}
              onToggle={handleNotificationToggle}
              onAdvanceMinutesChange={handleAdvanceMinutes}
              onDNDChange={handleDNDChange}
            />
          </View>
        )}

        {/* 로그아웃 버튼 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutText, { color: colors.surface }]}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  section: {
    padding: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
  },
  themeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  themeOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  themeHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  menuCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  menuCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  menuCardLabel: {
    fontSize: FONT_SIZE.md,
  },
  menuCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    maxWidth: 160,
  },
  menuCardValue: {
    fontSize: FONT_SIZE.sm,
    flexShrink: 1,
  },
  dayTemplateSectionCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginTop: SPACING.xs,
  },
  dayTemplateSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyTemplateHint: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyTemplateHintText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  logoutButton: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
