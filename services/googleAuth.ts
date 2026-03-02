// Google Sign-In 초기화 + 헬퍼
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export function getGoogleWebClientId(): string | undefined {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  return clientId && clientId.length > 0 ? clientId : undefined;
}

export function getGoogleConfigErrorMessage(): string | null {
  if (getGoogleWebClientId()) return null;
  return 'Google 로그인 설정이 누락되었습니다. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID를 확인해주세요';
}

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: getGoogleWebClientId(),
  });
}

export function isGoogleSignInCancelledError(error: unknown): boolean {
  return (error as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED;
}

export function getGoogleErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case statusCodes.IN_PROGRESS:
      return '로그인이 이미 진행 중입니다';
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return 'Google Play 서비스를 사용할 수 없습니다';
    case 'auth/account-exists-with-different-credential':
      return '이 이메일은 다른 로그인 방식으로 등록되어 있습니다. 기존 방식으로 로그인해주세요';
    case 'auth/invalid-credential':
      return 'Google 인증 정보를 확인할 수 없습니다. 다시 시도해주세요';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인한 뒤 다시 시도해주세요';
    default:
      return 'Google 로그인에 실패했습니다. 다시 시도해주세요';
  }
}
