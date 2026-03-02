import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 환경변수에서 Firebase config 로드 (하드코딩 금지)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// 환경변수 누락 경고 — .env 미설정 시 개발자에게 알림
if (__DEV__) {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
      console.warn(`[Firebase] 환경변수 누락: EXPO_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}. .env 파일을 확인해주세요.`);
    }
  }
}

// 앱이 이미 초기화되었는지 확인 (핫 리로드 대응)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ──────────────────────────────────────────────
// Firestore: 오프라인 캐시 활성화
// ──────────────────────────────────────────────
// 전략: persistentSingleTabManager → memoryLocalCache fallback
//
// - persistentMultipleTabManager()는 IndexedDB에 의존하므로 React Native에서 동작하지 않음 (사용 금지)
// - persistentSingleTabManager()도 IndexedDB에 의존하여 RN에서 실패가 예상됨
//   (Firebase JS SDK는 현재 React Native에서 persistent cache를 공식 미지원)
// - persistent 캐시 초기화 실패 시 memoryLocalCache()로 fallback하여
//   최소한 세션 내 캐시는 유지한다 (오프라인 우선 원칙 준수)
// ──────────────────────────────────────────────
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(undefined),
    }),
  });
} catch (persistentError) {
  // persistent 캐시 실패 시 (예: IndexedDB 미지원 환경)
  // memory 캐시로 fallback — 세션 내 캐시만 유지되지만 완전 비활성화보다 낫다
  console.warn(
    '[Firebase] persistentLocalCache 초기화 실패, memoryLocalCache로 fallback:',
    persistentError,
  );
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch {
    // 이미 초기화된 경우 (핫 리로드)
    db = getFirestore(app);
  }
}
export { db };

// ──────────────────────────────────────────────
// Auth: React Native AsyncStorage persistence
// ──────────────────────────────────────────────
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // 이미 초기화된 경우 (핫 리로드)
  auth = getAuth(app);
}
export { auth };
