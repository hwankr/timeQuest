// types/firebase-auth.d.ts
// Firebase JS SDK v12에서 getReactNativePersistence의 TypeScript 타입이
// 내보내지지 않는 문제를 해결하기 위한 커스텀 타입 선언.
// 이 파일은 firebase/auth 모듈의 타입을 보강(augment)한다.
//
// 참고: Firebase SDK 업데이트에서 공식 타입이 제공되면 이 파일을 제거할 것.
import { Persistence } from 'firebase/auth';
import type AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: typeof AsyncStorage
  ): Persistence;
}
