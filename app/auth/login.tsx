// 로그인/회원가입 화면
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { signIn, signUp, clearError, isSubmitting, error } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('올바른 이메일 주소를 입력해주세요');
      return false;
    }
    if (password.length < 6) {
      setValidationError('비밀번호는 6자 이상이어야 합니다');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    clearError();
    if (!validate()) return;
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch {
      // 에러는 useAuthStore의 error 필드에서 표시
    }
  };

  const toggleMode = () => {
    clearError();
    setValidationError(null);
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const displayError = validationError ?? error;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>TimeQuest</Text>
            <Text style={styles.subtitle}>시간을 퀘스트처럼</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
            />

            {displayError !== null && (
              <Text style={styles.errorText}>{displayError}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'login' ? '로그인' : '회원가입'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMode} disabled={isSubmitting} style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? '계정이 없으신가요? 회원가입'
                  : '이미 계정이 있으신가요? 로그인'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  form: {
    gap: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.surface,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
});
