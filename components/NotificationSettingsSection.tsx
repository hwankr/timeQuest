// 알림 설정 섹션 — 토글, 사전 알림 분, 방해금지 시간 설정 UI
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NotificationSettings } from '@/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  userId: string;
  notifications: NotificationSettings;
  onToggle: (key: keyof NotificationSettings, value: NotificationSettings[keyof NotificationSettings]) => void;
  onAdvanceMinutesChange: (minutes: 1 | 5 | 10) => void;
  onDNDChange: (dndStart: string, dndEnd: string) => void;
}

// ─────────────────────────────────────────────
// 사전 알림 분 옵션
// ─────────────────────────────────────────────

const ADVANCE_OPTIONS: Array<1 | 5 | 10> = [1, 5, 10];

// ─────────────────────────────────────────────
// DND 시간 옵션 (30분 단위)
// ─────────────────────────────────────────────

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export default function NotificationSettingsSection({
  notifications,
  onToggle,
  onAdvanceMinutesChange,
  onDNDChange,
}: Props) {
  const [localDndStart, setLocalDndStart] = useState(notifications.dndStart);
  const [localDndEnd, setLocalDndEnd] = useState(notifications.dndEnd);

  // 토글 변경
  const handleToggle = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      hapticLight();
      onToggle(key, value);
    },
    [onToggle],
  );

  // 사전 알림 분 변경
  const handleAdvanceMinutes = useCallback(
    (minutes: 1 | 5 | 10) => {
      hapticLight();
      onAdvanceMinutesChange(minutes);
    },
    [onAdvanceMinutesChange],
  );

  // 방해금지 시작 시각 선택
  const handleDndStartPick = useCallback(() => {
    hapticLight();
    Alert.alert(
      '방해금지 시작',
      '방해금지 시작 시각을 선택하세요',
      [
        ...TIME_OPTIONS.map((t) => ({
          text: t,
          onPress: () => {
            setLocalDndStart(t);
            onDNDChange(t, localDndEnd);
          },
        })),
        { text: '취소', style: 'cancel' as const },
      ],
    );
  }, [localDndEnd, onDNDChange]);

  // 방해금지 종료 시각 선택
  const handleDndEndPick = useCallback(() => {
    hapticLight();
    Alert.alert(
      '방해금지 종료',
      '방해금지 종료 시각을 선택하세요',
      [
        ...TIME_OPTIONS.map((t) => ({
          text: t,
          onPress: () => {
            setLocalDndEnd(t);
            onDNDChange(localDndStart, t);
          },
        })),
        { text: '취소', style: 'cancel' as const },
      ],
    );
  }, [localDndStart, onDNDChange]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>알림 설정</Text>

      {/* 블록 시작 알림 */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>블록 시작 알림</Text>
        <Switch
          value={notifications.blockStart}
          onValueChange={(v) => handleToggle('blockStart', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>

      {/* 블록 종료 알림 */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>블록 종료 알림</Text>
        <Switch
          value={notifications.blockEnd}
          onValueChange={(v) => handleToggle('blockEnd', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>

      {/* 완료 리마인더 */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>완료 리마인더</Text>
        <Switch
          value={notifications.reminder}
          onValueChange={(v) => handleToggle('reminder', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>

      {/* 아침 브리핑 */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>아침 브리핑</Text>
        <Switch
          value={notifications.morningBriefing}
          onValueChange={(v) => handleToggle('morningBriefing', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>

      {/* 스트릭 경고 */}
      <View style={[styles.toggleRow, styles.lastToggleRow]}>
        <Text style={styles.toggleLabel}>스트릭 경고</Text>
        <Switch
          value={notifications.streakWarning}
          onValueChange={(v) => handleToggle('streakWarning', v)}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>

      {/* 사전 알림 분 */}
      <View style={styles.subSection}>
        <Text style={styles.subSectionLabel}>블록 시작 사전 알림</Text>
        <View style={styles.segmentedControl}>
          {ADVANCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.segmentButton,
                notifications.advanceMinutes === opt && styles.segmentButtonActive,
              ]}
              onPress={() => handleAdvanceMinutes(opt)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  notifications.advanceMinutes === opt && styles.segmentButtonTextActive,
                ]}
              >
                {opt}분
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 방해금지 시간 */}
      <View style={styles.subSection}>
        <Text style={styles.subSectionLabel}>방해금지 시간</Text>
        <View style={styles.dndRow}>
          <TouchableOpacity style={styles.dndButton} onPress={handleDndStartPick} activeOpacity={0.7}>
            <Text style={styles.dndLabel}>시작</Text>
            <Text style={styles.dndValue}>{localDndStart}</Text>
          </TouchableOpacity>
          <Text style={styles.dndSeparator}>—</Text>
          <TouchableOpacity style={styles.dndButton} onPress={handleDndEndPick} activeOpacity={0.7}>
            <Text style={styles.dndLabel}>종료</Text>
            <Text style={styles.dndValue}>{localDndEnd}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lastToggleRow: {
    marginBottom: SPACING.xs,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  subSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subSectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  segmentButtonTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  dndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dndButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  dndLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  dndValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dndSeparator: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textTertiary,
  },
});
