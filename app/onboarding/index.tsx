// 온보딩 환영 화면 — 앱 소개 및 시작 버튼
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

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
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 앱 아이콘 영역 */}
        <View style={styles.iconWrapper}>
          <Ionicons name="hourglass-outline" size={72} color={COLORS.primary} />
        </View>

        {/* 제목 */}
        <Text style={styles.title}>TimeQuest에 오신 것을{'\n'}환영합니다!</Text>
        <Text style={styles.subtitle}>
          시간을 퀘스트처럼 관리하고 보상을 획득하세요
        </Text>

        {/* 기능 소개 */}
        <View style={styles.featureList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconWrapper}>
                <Ionicons name={feature.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 시작 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/onboarding/time-setup')}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>시작하기</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.surface} />
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
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
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
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
