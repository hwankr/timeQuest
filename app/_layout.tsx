// 루트 레이아웃 — Auth 상태 기반 라우트 가드
// isInitializing만 체크하여 스플래시 표시, isSubmitting은 무관
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/theme';

export default function RootLayout() {
  const { isInitializing, isAuthenticated, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const initialized = useRef(false);

  // Auth 리스너 초기화 — useRef 가드로 중복 구독 방지
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // 라우트 가드 — isInitializing만 체크, isSubmitting은 무관
  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitializing, segments, router]);

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
    </Stack>
  );
}
