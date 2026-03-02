// 시간표 템플릿 관리 화면 — 템플릿 목록, 생성, 수정, 복제, 삭제
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import TemplateCard from '@/components/TemplateCard';
import { ScheduleTemplate } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticLight } from '@/utils/haptics';

export default function ScheduleTemplateScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userId = user?.uid;

  const templates = useTemplateStore((state) => state.templates);
  const isLoading = useTemplateStore((state) => state.isLoading);
  const error = useTemplateStore((state) => state.error);
  const subscribeToTemplates = useTemplateStore((state) => state.subscribeToTemplates);
  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
  const duplicateTemplate = useTemplateStore((state) => state.duplicateTemplate);
  const clearError = useTemplateStore((state) => state.clearError);

  // 실시간 구독
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToTemplates(userId);
    return unsubscribe;
  }, [userId, subscribeToTemplates]);

  // 에러 표시
  useEffect(() => {
    if (error) {
      Alert.alert('오류', error, [{ text: '확인', onPress: clearError }]);
    }
  }, [error, clearError]);

  // 새 템플릿 생성
  const handleCreate = useCallback(() => {
    if (!userId) return;
    hapticLight();
    Alert.prompt(
      '새 시간표',
      '시간표 이름을 입력하세요',
      async (name) => {
        if (!name?.trim()) return;
        const isFirst = templates.length === 0;
        await createTemplate(userId, name.trim(), isFirst);
      },
      'plain-text',
      '',
    );
  }, [userId, templates.length, createTemplate]);

  // 편집 화면으로 이동
  const handleEdit = useCallback(
    (template: ScheduleTemplate) => {
      router.push({ pathname: '/schedule/create', params: { templateId: template.id } });
    },
    [router],
  );

  // 복제
  const handleDuplicate = useCallback(
    (template: ScheduleTemplate) => {
      if (!userId) return;
      Alert.alert('시간표 복제', `"${template.name}"을(를) 복제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '복제',
          onPress: () => duplicateTemplate(userId, template.id),
        },
      ]);
    },
    [userId, duplicateTemplate],
  );

  // 삭제
  const handleDelete = useCallback(
    (template: ScheduleTemplate) => {
      if (!userId) return;
      if (template.isDefault) {
        Alert.alert('삭제 불가', '기본 시간표는 삭제할 수 없습니다.');
        return;
      }
      Alert.alert(
        '시간표 삭제',
        `"${template.name}"을(를) 삭제하시겠습니까?\n모든 블록도 함께 삭제됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => deleteTemplate(userId, template.id),
          },
        ],
      );
    },
    [userId, deleteTemplate],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ScheduleTemplate>) => (
      <TemplateCard
        template={item}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDuplicate, handleDelete],
  );

  const keyExtractor = useCallback((item: ScheduleTemplate) => item.id, []);

  const ListEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>시간표가 없습니다</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>아래 + 버튼으로 첫 시간표를 만들어보세요</Text>
          </>
        )}
      </View>
    ),
    [isLoading, colors],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>시간표 관리</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 템플릿 목록 */}
      <FlatList
        data={templates}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — 새 템플릿 생성 */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
