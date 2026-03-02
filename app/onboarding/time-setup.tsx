// 온보딩 시간 설정 화면 — 기상/취침 시간 선택 후 초기 데이터 생성
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { TimePicker } from '@/components/TimePicker';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticSuccess } from '@/utils/haptics';
import { parseTime } from '@/utils/time';

export default function TimeSetupScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    wakeUpTime,
    bedTime,
    isCreating,
    error,
    setWakeUpTime,
    setBedTime,
    completeOnboarding,
  } = useOnboardingStore();

  const [localError, setLocalError] = useState<string | null>(null);

  const handleWakeUpChange = useCallback(
    (time: string) => {
      setWakeUpTime(time);
      setLocalError(null);
    },
    [setWakeUpTime],
  );

  const handleBedTimeChange = useCallback(
    (time: string) => {
      setBedTime(time);
      setLocalError(null);
    },
    [setBedTime],
  );

  const handleComplete = useCallback(async () => {
    if (!user) return;

    // 취침 시간이 기상 시간보다 나중인지 검증
    if (parseTime(bedTime) <= parseTime(wakeUpTime)) {
      setLocalError('취침 시간은 기상 시간보다 나중이어야 합니다');
      return;
    }

    try {
      await completeOnboarding(user.uid, user.email ?? '');
      hapticSuccess();
      // 온보딩 완료 후 메인 탭으로 이동
      router.replace('/(tabs)');
    } catch {
      // 에러는 store의 error 필드에 저장됨
    }
  }, [user, wakeUpTime, bedTime, completeOnboarding, router]);

  const displayError = localError ?? error;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>하루 일정 설정</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>기상 시간과 취침 시간을 설정해주세요</Text>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>설정한 시간을 기반으로 하루 블록이 자동 생성됩니다</Text>
        </View>

        {/* 시간 선택 영역 */}
        <View style={[styles.pickersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TimePicker
            label="기상 시간"
            value={wakeUpTime}
            onChange={handleWakeUpChange}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TimePicker
            label="취침 시간"
            value={bedTime}
            onChange={handleBedTimeChange}
            minTime={wakeUpTime}
          />
        </View>

        {/* 에러 메시지 */}
        {displayError ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.error}15` }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
          </View>
        ) : null}

        {/* 로딩 상태 */}
        {isCreating ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>일정을 생성하는 중입니다...</Text>
            <Text style={[styles.loadingSubText, { color: colors.textSecondary }]}>잠시만 기다려주세요</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isCreating}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>이전</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary }, isCreating && styles.completeButtonDisabled]}
          onPress={handleComplete}
          activeOpacity={0.8}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Text style={[styles.completeButtonText, { color: colors.surface }]}>완료</Text>
              <Ionicons name="checkmark" size={20} color={colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  pickersContainer: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  loadingSubText: {
    fontSize: FONT_SIZE.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
