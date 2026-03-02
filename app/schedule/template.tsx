// 시간표 템플릿 화면 — Phase 4에서 구현
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function ScheduleTemplateScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>시간표 템플릿</Text>
      <Text style={styles.placeholder}>준비 중입니다</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  placeholder: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
});
