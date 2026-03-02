// 블록 추가/편집 모달 — 시간, 이름, 타입, 포인트 입력
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BLOCK_TYPES } from '@/constants/blockTypes';
import { TimeBlock, BlockType } from '@/types';
import { TimePicker } from '@/components/TimePicker';
import { BlockTypePicker } from '@/components/BlockTypePicker';
import { validateBlockFields } from '@/utils/timeValidation';

interface BlockFormModalProps {
  visible: boolean;
  /** null = 새 블록 추가, TimeBlock = 기존 블록 편집 */
  editingBlock: TimeBlock | null;
  existingBlocks: TimeBlock[];
  onSave: (block: Omit<TimeBlock, 'id' | 'sortOrder'>) => void;
  onCancel: () => void;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';
const DEFAULT_TYPE: BlockType = 'routine';

export function BlockFormModal({
  visible,
  editingBlock,
  existingBlocks,
  onSave,
  onCancel,
}: BlockFormModalProps) {
  const colors = useThemeColors();
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [taskName, setTaskName] = useState('');
  const [blockType, setBlockType] = useState<BlockType>(DEFAULT_TYPE);
  const [points, setPoints] = useState<string>(String(BLOCK_TYPES[DEFAULT_TYPE].defaultPoints));

  // 편집 모드일 때 기존 값으로 초기화
  useEffect(() => {
    if (visible) {
      if (editingBlock) {
        setStartTime(editingBlock.startTime);
        setEndTime(editingBlock.endTime);
        setTaskName(editingBlock.taskName);
        setBlockType(editingBlock.blockType);
        setPoints(String(editingBlock.basePoints));
      } else {
        setStartTime(DEFAULT_START);
        setEndTime(DEFAULT_END);
        setTaskName('');
        setBlockType(DEFAULT_TYPE);
        setPoints(String(BLOCK_TYPES[DEFAULT_TYPE].defaultPoints));
      }
    }
  }, [visible, editingBlock]);

  // 블록 타입 변경 시 기본 포인트 자동 설정 (새 블록일 때만)
  const handleTypeSelect = useCallback((type: BlockType) => {
    setBlockType(type);
    if (!editingBlock) {
      setPoints(String(BLOCK_TYPES[type].defaultPoints));
    }
  }, [editingBlock]);

  const handlePointsChange = useCallback((text: string) => {
    // 숫자만 허용, 0-999 범위
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setPoints('');
      return;
    }
    const num = parseInt(cleaned, 10);
    if (num <= 999) {
      setPoints(String(num));
    }
  }, []);

  const handleSave = useCallback(() => {
    const basePoints = points === '' ? 0 : parseInt(points, 10);

    // 전체 필드 검증 (시간 형식, 순서, 겹침, 이름, 포인트)
    const errors = validateBlockFields(
      startTime,
      endTime,
      taskName,
      basePoints,
      existingBlocks,
      editingBlock?.id,
    );

    if (errors.length > 0) {
      const message = errors.map((e) => e.message).join('\n');
      Alert.alert('입력 오류', message);
      return;
    }

    const newBlockData: Omit<TimeBlock, 'id' | 'sortOrder'> = {
      startTime,
      endTime,
      taskName: taskName.trim(),
      blockType,
      basePoints,
    };

    onSave(newBlockData);
  }, [taskName, startTime, endTime, blockType, points, existingBlocks, editingBlock, onSave]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          {/* 헤더 */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {editingBlock ? '블록 편집' : '블록 추가'}
            </Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
              <Text style={[styles.saveText, { color: colors.primary }]}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 시간 선택 */}
            <View style={[styles.timeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.timePickerWrapper}>
                <TimePicker
                  label="시작 시간"
                  value={startTime}
                  onChange={setStartTime}
                />
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} style={styles.timeArrow} />
              <View style={styles.timePickerWrapper}>
                <TimePicker
                  label="종료 시간"
                  value={endTime}
                  onChange={setEndTime}
                  minTime={startTime}
                />
              </View>
            </View>

            {/* 블록 이름 */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>블록 이름</Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={taskName}
                onChangeText={setTaskName}
                placeholder="예: 수학 공부, 아침 운동..."
                placeholderTextColor={colors.textTertiary}
                maxLength={30}
                returnKeyType="done"
              />
            </View>

            {/* 블록 타입 */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BlockTypePicker
                selectedType={blockType}
                onSelect={handleTypeSelect}
              />
            </View>

            {/* 포인트 */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>완료 포인트 (0-999)</Text>
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={points}
                onChangeText={handlePointsChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                maxLength={3}
                returnKeyType="done"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
  },
  timePickerWrapper: {
    flex: 1,
  },
  timeArrow: {
    marginHorizontal: SPACING.xs,
  },
  section: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
