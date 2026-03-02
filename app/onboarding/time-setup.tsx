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
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { parseTime } from '@/utils/time';

export default function TimeSetupScreen() {
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
      // 온보딩 완료 후 메인 탭으로 이동
      router.replace('/(tabs)');
    } catch {
      // 에러는 store의 error 필드에 저장됨
    }
  }, [user, wakeUpTime, bedTime, completeOnboarding, router]);

  const displayError = localError ?? error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>하루 일정 설정</Text>
          <Text style={styles.subtitle}>기상 시간과 취침 시간을 설정해주세요</Text>
          <Text style={styles.hint}>설정한 시간을 기반으로 하루 블록이 자동 생성됩니다</Text>
        </View>

        {/* 시간 선택 영역 */}
        <View style={styles.pickersContainer}>
          <TimePicker
            label="기상 시간"
            value={wakeUpTime}
            onChange={handleWakeUpChange}
          />

          <View style={styles.divider} />

          <TimePicker
            label="취침 시간"
            value={bedTime}
            onChange={handleBedTimeChange}
            minTime={wakeUpTime}
          />
        </View>

        {/* 에러 메시지 */}
        {displayError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        {/* 로딩 상태 */}
        {isCreating ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>일정을 생성하는 중입니다...</Text>
            <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isCreating}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
          <Text style={styles.backButtonText}>이전</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, isCreating && styles.completeButtonDisabled]}
          onPress={handleComplete}
          activeOpacity={0.8}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <>
              <Text style={styles.completeButtonText}>완료</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.surface} />
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
    backgroundColor: COLORS.bg,
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
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  pickersContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.error}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
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
    color: COLORS.textPrimary,
  },
  loadingSubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
