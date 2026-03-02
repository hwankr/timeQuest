// 루트 레이아웃 — Auth 상태 기반 라우트 가드 + 온보딩 체크
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRepository } from '@/repositories/userRepo';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/theme';

export default function RootLayout() {
  const { isInitializing, isAuthenticated, initialize, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const initialized = useRef(false);
  const hasRouted = useRef(false);

  // Auth 리스너 초기화 — useRef 가드로 중복 구독 방지
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // 라우트 가드 — Auth 상태 + 온보딩 완료 여부 체크
  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      // 미인증 사용자 → 로그인 화면
      hasRouted.current = false;
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // 인증된 사용자가 auth 화면에 있으면 온보딩 체크 후 이동
      checkOnboardingAndRoute();
    } else if (isAuthenticated && !inAuthGroup && !inOnboarding && !hasRouted.current) {
      // 인증된 사용자 최초 앱 진입 시에만 온보딩 완료 여부 확인
      checkOnboardingAndRoute();
    }
  }, [isAuthenticated, isInitializing, segments]);

  async function checkOnboardingAndRoute() {
    if (!user) return;
    try {
      const repo = new UserRepository(user.uid);
      const completed = await repo.hasCompletedOnboarding();
      if (!completed) {
        router.replace('/onboarding');
      } else {
        hasRouted.current = true;
        router.replace('/(tabs)');
      }
    } catch {
      // 온보딩 체크 실패 시 안전하게 온보딩으로 이동
      router.replace('/onboarding');
    }
  }

  // 초기 Auth 상태 확인 중에만 스플래시 표시
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
