// 설정 화면 — 사용자 이메일 + 로그아웃 (Alert 확인 다이얼로그 포함)
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  // 로그아웃 전 확인 다이얼로그 표시
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      {/* 사용자 정보 영역 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>계정</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>이메일</Text>
          <Text style={styles.infoValue}>{user?.email ?? '-'}</Text>
        </View>
      </View>

      {/* 로그아웃 버튼 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>로그아웃</Text>
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
