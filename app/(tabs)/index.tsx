// 시간표 메인 화면 — 오늘 날짜 + 로그인 사용자 이메일 표시
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuthStore } from '@/stores/useAuthStore';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function ScheduleScreen() {
  const user = useAuthStore((state) => state.user);

  // 오늘 날짜를 한국어 형식으로 포맷 (예: 2026년 3월 2일 (월요일))
  const todayLabel = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.title}>시간표</Text>
        <Text style={styles.date}>{todayLabel}</Text>
      </View>

      {/* 플레이스홀더 영역 */}
      <View style={styles.content}>
        <Text style={styles.placeholder}>시간표가 여기에 표시됩니다</Text>
        {user?.email ? (
          <Text style={styles.email}>{user.email}</Text>
        ) : null}
      </View>
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
  date: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  placeholder: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
});
