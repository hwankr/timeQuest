// 시간표 생성/편집 화면 — 블록 CRUD + DnD 순서 변경
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { TimeBlock } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { BlockEditCard } from '@/components/BlockEditCard';
import { BlockFormModal } from '@/components/BlockFormModal';
import { hapticError } from '@/utils/haptics';

export default function ScheduleCreateScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const isEditMode = !!templateId;

  const user = useAuthStore((s) => s.user);
  const {
    blocks,
    isLoading,
    subscribeToBlocks,
    createTemplate,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
  } = useTemplateStore();

  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // 새 템플릿 모드에서 로컬 블록 목록 관리
  const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>([]);

  // DnD 디바운스 타이머
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 편집 모드 — Firestore 실시간 구독
  useEffect(() => {
    if (!isEditMode || !user || !templateId) return;
    const unsubscribe = subscribeToBlocks(user.uid, templateId);
    return unsubscribe;
  }, [isEditMode, user, templateId, subscribeToBlocks]);

  // DnD 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
    };
  }, []);

  // 표시할 블록 목록 (편집 모드 = Firestore, 새 모드 = 로컬)
  const displayBlocks = isEditMode ? blocks : localBlocks;

  // ──────────────────────────────────────────
  // DnD 순서 변경
  // ──────────────────────────────────────────

  const handleDragEnd = useCallback(
    ({ data }: { data: TimeBlock[] }) => {
      if (isReordering) return;

      if (isEditMode && user && templateId) {
        // 300ms 디바운스로 Firestore 업데이트
        if (reorderTimerRef.current) {
          clearTimeout(reorderTimerRef.current);
        }
        setIsReordering(true);
        reorderTimerRef.current = setTimeout(async () => {
          try {
            await reorderBlocks(user.uid, templateId, data.map((b) => b.id));
          } finally {
            setIsReordering(false);
          }
        }, 300);
      } else {
        setLocalBlocks(data.map((b, i) => ({ ...b, sortOrder: i })));
      }
    },
    [isReordering, isEditMode, user, templateId, reorderBlocks],
  );

  // ──────────────────────────────────────────
  // 블록 CRUD
  // ──────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setEditingBlock(null);
    setModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((block: TimeBlock) => {
    setEditingBlock(block);
    setModalVisible(true);
  }, []);

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setEditingBlock(null);
  }, []);

  const handleModalSave = useCallback(
    async (blockData: Omit<TimeBlock, 'id' | 'sortOrder'>) => {
      if (!user) return;
      setModalVisible(false);

      if (isEditMode && templateId) {
        // 편집 모드 — 즉시 Firestore 동기화
        if (editingBlock) {
          await updateBlock(user.uid, templateId, editingBlock.id, blockData);
        } else {
          const sortOrder = displayBlocks.length;
          await createBlock(user.uid, templateId, { ...blockData, sortOrder });
        }
      } else {
        // 새 템플릿 모드 — 로컬 상태만 업데이트
        if (editingBlock) {
          setLocalBlocks((prev) =>
            prev.map((b) => (b.id === editingBlock.id ? { ...b, ...blockData } : b)),
          );
        } else {
          const newBlock: TimeBlock = {
            id: `local_${Date.now()}`,
            sortOrder: localBlocks.length,
            ...blockData,
          };
          setLocalBlocks((prev) => [...prev, newBlock]);
        }
      }
      setEditingBlock(null);
    },
    [user, isEditMode, templateId, editingBlock, displayBlocks, localBlocks, createBlock, updateBlock],
  );

  const handleDelete = useCallback(
    (blockId: string) => {
      Alert.alert('블록 삭제', '이 블록을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            if (isEditMode && templateId) {
              await deleteBlock(user.uid, templateId, blockId);
            } else {
              setLocalBlocks((prev) =>
                prev
                  .filter((b) => b.id !== blockId)
                  .map((b, i) => ({ ...b, sortOrder: i })),
              );
            }
          },
        },
      ]);
    },
    [user, isEditMode, templateId, deleteBlock],
  );

  // ──────────────────────────────────────────
  // 저장 (새 템플릿 모드)
  // ──────────────────────────────────────────

  const handleSaveNewTemplate = useCallback(async () => {
    if (!user) return;
    if (!templateName.trim()) {
      Alert.alert('입력 오류', '템플릿 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const newTemplateId = await createTemplate(user.uid, templateName.trim(), false);
      // 로컬 블록들을 Firestore에 일괄 저장
      for (let i = 0; i < localBlocks.length; i++) {
        const { id: _id, sortOrder: _so, ...blockData } = localBlocks[i];
        await createBlock(user.uid, newTemplateId, { ...blockData, sortOrder: i });
      }
      router.back();
    } catch {
      await hapticError();
      Alert.alert('저장 실패', '템플릿 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [user, templateName, localBlocks, createTemplate, createBlock, router]);

  // ──────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────

  const renderBlock = useCallback(
    ({ item, drag, isActive }: RenderItemParams<TimeBlock>) => (
      <ScaleDecorator>
        <BlockEditCard
          block={item}
          isDragging={isActive}
          onDrag={drag}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </ScaleDecorator>
    ),
    [handleOpenEdit, handleDelete],
  );

  const ListHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.sectionTitle}>블록 목록</Text>
      {displayBlocks.length === 0 && (
        <Text style={styles.emptyText}>블록을 추가해주세요</Text>
      )}
    </View>
  );

  const ListFooter = (
    <View style={styles.listFooter}>
      <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color={COLORS.surface} />
        <Text style={styles.addButtonText}>블록 추가</Text>
      </TouchableOpacity>

      {!isEditMode && (
        <Text style={styles.infoText}>변경사항은 내일부터 적용됩니다</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {isEditMode ? (
          <Text style={styles.headerTitle} numberOfLines={1}>시간표 편집</Text>
        ) : (
          <TextInput
            style={styles.nameInput}
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="템플릿 이름 입력..."
            placeholderTextColor={COLORS.textTertiary}
            maxLength={20}
            returnKeyType="done"
          />
        )}

        {!isEditMode && (
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSaveNewTemplate}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 블록 목록 */}
      {isLoading && isEditMode ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <DraggableFlatList
          data={displayBlocks}
          keyExtractor={(item) => item.id}
          renderItem={renderBlock}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 블록 추가/편집 모달 */}
      <BlockFormModal
        visible={modalVisible}
        editingBlock={editingBlock}
        existingBlocks={displayBlocks}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nameInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.bg,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 56,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  listFooter: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.surface,
  },
  infoText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
