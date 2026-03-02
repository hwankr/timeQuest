// 커스텀 보상 생성/수정 모달
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Reward, RewardCategory } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { hapticLight } from '@/utils/haptics';

// ─────────────────────────────────────────────
// 카테고리 선택 옵션
// ─────────────────────────────────────────────

interface CategoryOption {
  key: RewardCategory;
  label: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'activity', label: '활동', icon: '🎮' },
  { key: 'convert', label: '전환', icon: '🔄' },
  { key: 'food', label: '음식', icon: '🍕' },
  { key: 'rest', label: '휴식', icon: '😴' },
  { key: 'special', label: '특별', icon: '🏖️' },
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface CustomRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reward, 'id' | 'createdAt' | 'isActive' | 'sortOrder' | 'isCustom'>) => Promise<void>;
  editingReward?: Reward;
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function CustomRewardModal({
  visible,
  onClose,
  onSave,
  editingReward,
}: CustomRewardModalProps) {
  const colors = useThemeColors();
  const isEditing = !!editingReward;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RewardCategory>('activity');
  const [isSaving, setIsSaving] = useState(false);

  // 수정 모드일 때 기존 값으로 초기화
  useEffect(() => {
    if (visible) {
      if (editingReward) {
        setName(editingReward.name);
        setIcon(editingReward.icon);
        setCost(String(editingReward.cost));
        setDescription(editingReward.description);
        setCategory(editingReward.category);
      } else {
        setName('');
        setIcon('🎁');
        setCost('');
        setDescription('');
        setCategory('activity');
      }
    }
  }, [visible, editingReward]);

  const handleSelectCategory = useCallback((cat: RewardCategory) => {
    hapticLight();
    setCategory(cat);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    const parsedCost = parseInt(cost, 10);

    if (!trimmedName) {
      Alert.alert('입력 오류', '보상 이름을 입력해주세요');
      return;
    }
    if (trimmedName.length > 20) {
      Alert.alert('입력 오류', '보상 이름은 20자 이하로 입력해주세요');
      return;
    }
    if (!cost || isNaN(parsedCost) || parsedCost < 1) {
      Alert.alert('입력 오류', '포인트 비용을 1 이상으로 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        icon: icon.trim() || '🎁',
        cost: parsedCost,
        description: description.trim(),
        category,
        cooldownHours: 0,
        dailyLimit: -1,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다';
      Alert.alert('저장 실패', message);
    } finally {
      setIsSaving(false);
    }
  }, [name, icon, cost, description, category, onSave, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} disabled={isSaving} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{isEditing ? '보상 수정' : '보상 추가'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.headerButton}>
              <Text style={[styles.saveText, { color: colors.primary }, isSaving && { color: colors.textTertiary }]}>
                {isSaving ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 아이콘 + 이름 행 */}
            <View style={styles.row}>
              <View style={styles.iconInputWrapper}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>아이콘</Text>
                <TextInput
                  style={[styles.iconInput, { borderColor: colors.border, backgroundColor: colors.bg }]}
                  value={icon}
                  onChangeText={setIcon}
                  maxLength={2}
                  placeholder="🎁"
                  textAlign="center"
                />
              </View>
              <View style={styles.nameWrapper}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  이름 <Text style={[styles.required, { color: colors.error }]}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="보상 이름 (최대 20자)"
                  maxLength={20}
                  returnKeyType="next"
                />
                <Text style={[styles.charCount, { color: colors.textTertiary }]}>{name.length}/20</Text>
              </View>
            </View>

            {/* 포인트 비용 */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                포인트 비용 <Text style={[styles.required, { color: colors.error }]}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={cost}
                onChangeText={setCost}
                placeholder="최소 1 포인트"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* 설명 */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>설명 (선택)</Text>
              <TextInput
                style={[styles.input, styles.descInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={description}
                onChangeText={setDescription}
                placeholder="보상 설명을 입력하세요"
                multiline
                numberOfLines={2}
                returnKeyType="done"
              />
            </View>

            {/* 카테고리 */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>카테고리</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = opt.key === category;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: colors.border },
                        isSelected && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                      ]}
                      onPress={() => handleSelectCategory(opt.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryChipIcon}>{opt.icon}</Text>
                      <Text style={[
                        styles.categoryChipLabel,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.primary },
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  iconInputWrapper: {
    width: 72,
  },
  nameWrapper: {
    flex: 1,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  required: {},
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 4,
    fontSize: FONT_SIZE.md,
  },
  iconInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs + 4,
    fontSize: 24,
    textAlign: 'center',
  },
  descInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipIcon: {
    fontSize: 16,
  },
  categoryChipLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
