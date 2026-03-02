// 온보딩 스택 레이아웃 — 헤더 숨김
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
