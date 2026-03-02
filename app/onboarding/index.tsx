// 온보딩 환영 화면 — 앱 소개 및 시작 버튼
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticLight } from '@/utils/haptics';

interface FeatureItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const FEATURES: FeatureItem[] = [
  { icon: 'time-outline',       text: '하루 일정을 시간 블록으로 관리하세요' },
  { icon: 'trophy-outline',     text: '블록을 완료할 때마다 포인트를 획득하세요' },
  { icon: 'gift-outline',       text: '포인트로 원하는 보상을 교환하세요' },
];

export default function OnboardingWelcomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* 앱 아이콘 영역 */}
        <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="hourglass-outline" size={72} color={colors.primary} />
        </View>

        {/* 제목 */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>TimeQuest에 오신 것을{'\n'}환영합니다!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          시간을 퀘스트처럼 관리하고 보상을 획득하세요
        </Text>

        {/* 기능 소개 */}
        <View style={styles.featureList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIconWrapper, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={feature.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 시작 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            hapticLight();
            router.push('/onboarding/time-setup');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.startButtonText, { color: colors.surface }]}>시작하기</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  featureList: {
    width: '100%',
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
