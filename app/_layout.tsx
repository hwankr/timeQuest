// 루트 레이아웃 — Auth 상태 기반 라우트 가드 + 온보딩 체크 + 테마 Provider
import { useEffect, useRef, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { UserRepository } from '@/repositories/userRepo';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { LIGHT_COLORS } from '@/constants/theme';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { initializeNotifications, rescheduleAllNotifications } from '@/services/notification';
import { configureGoogleSignIn } from '@/services/googleAuth';
import type { ThemeMode } from '@/types';

// Google Sign-In 초기화 — 모듈 로드 시 1회 실행
configureGoogleSignIn();

// ─────────────────────────────────────────────
// 내부 컴포넌트 — ThemeProvider 안에서 useThemeMode 소비
// ─────────────────────────────────────────────

function AppContent() {
  const { isInitializing, isAuthenticated, initialize, user } = useAuthStore();
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const { effectiveTheme } = useThemeMode();
  const segments = useSegments();
  const router = useRouter();
  const initialized = useRef(false);
  const hasRouted = useRef(false);
  const lastRescheduledRef = useRef<number>(0);

  // Auth 리스너 초기화 — useRef 가드로 중복 구독 방지
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // 설정 로드 (테마 포함) — 앱 시작 시점에 미리 로드하여 테마 반영 지연 최소화
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    loadSettings(user.uid).catch(() => {
      // 설정 로드 실패 시에도 앱 사용은 가능해야 하므로 무시
    });
  }, [isAuthenticated, user?.uid, loadSettings]);

  // 알림 초기화 — 인증 완료 후 권한 요청 + 채널 생성
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    initializeNotifications().then((granted) => {
      if (granted) {
        rescheduleAllNotifications(user.uid);
      }
    });
  }, [isAuthenticated, user?.uid]);

  // AppState 리스너 — 앱 포그라운드 복귀 시 알림 재예약 (5분 스로틀)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const userId = user.uid;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const now = Date.now();
        if (now - lastRescheduledRef.current >= 5 * 60 * 1000) {
          lastRescheduledRef.current = now;
          rescheduleAllNotifications(userId);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, user?.uid]);

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
    const bgColor = effectiveTheme === 'dark' ? '#0f172a' : LIGHT_COLORS.bg;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
        <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={LIGHT_COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </GestureHandlerRootView>
  );
}

// ─────────────────────────────────────────────
// 루트 레이아웃
// ─────────────────────────────────────────────

export default function RootLayout() {
  const { user } = useAuthStore();
  const { setThemeMode } = useSettingsStore();

  // ThemeProvider에 전달할 setThemeMode 래퍼 (userId 바인딩)
  const handleSetThemeMode = useCallback(
    (mode: ThemeMode) => {
      if (!user) return;
      setThemeMode(user.uid, mode);
    },
    [user?.uid, setThemeMode],
  );

  return (
    <ThemeProvider onSetThemeMode={handleSetThemeMode}>
      <AppContent />
    </ThemeProvider>
  );
}
