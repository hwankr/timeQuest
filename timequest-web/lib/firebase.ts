// Firebase 초기화 — 웹 전용
// browserLocalPersistence + persistentMultipleTabManager 사용

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';

// 환경변수에서 Firebase config 로드 (하드코딩 금지)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

// 앱이 이미 초기화되었는지 확인 (핫 리로드 대응)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ──────────────────────────────────────────────
// Firestore: 멀티탭 오프라인 캐시 활성화
// ──────────────────────────────────────────────
// 웹은 IndexedDB를 지원하므로 persistentMultipleTabManager 사용 가능
// ──────────────────────────────────────────────
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // 이미 초기화된 경우 (핫 리로드) 또는 IndexedDB 미지원 환경
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch {
    db = getFirestore(app);
  }
}
export { db };

// ──────────────────────────────────────────────
// Auth: 브라우저 로컬 스토리지 persistence
// ──────────────────────────────────────────────
const auth: Auth = getAuth(app);

// browserLocalPersistence 설정 (비동기 — 초기화 시 한 번만 실행)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase] Auth persistence 설정 실패:', err);
  });
}

export { auth };
export { app };
