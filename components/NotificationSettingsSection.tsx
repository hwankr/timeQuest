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
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
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
  const colors = useThemeColors();
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
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>알림 설정</Text>

      {/* 블록 시작 알림 */}
      <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>블록 시작 알림</Text>
        <Switch
          value={notifications.blockStart}
          onValueChange={(v) => handleToggle('blockStart', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* 블록 종료 알림 */}
      <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>블록 종료 알림</Text>
        <Switch
          value={notifications.blockEnd}
          onValueChange={(v) => handleToggle('blockEnd', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* 완료 리마인더 */}
      <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>완료 리마인더</Text>
        <Switch
          value={notifications.reminder}
          onValueChange={(v) => handleToggle('reminder', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* 아침 브리핑 */}
      <View style={[styles.toggleRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>아침 브리핑</Text>
        <Switch
          value={notifications.morningBriefing}
          onValueChange={(v) => handleToggle('morningBriefing', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* 스트릭 경고 */}
      <View style={[styles.toggleRow, styles.lastToggleRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>스트릭 경고</Text>
        <Switch
          value={notifications.streakWarning}
          onValueChange={(v) => handleToggle('streakWarning', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {/* 사전 알림 분 */}
      <View style={[styles.subSection, { borderTopColor: colors.border }]}>
        <Text style={[styles.subSectionLabel, { color: colors.textSecondary }]}>블록 시작 사전 알림</Text>
        <View style={styles.segmentedControl}>
          {ADVANCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.segmentButton,
                { borderColor: colors.border, backgroundColor: colors.bg },
                notifications.advanceMinutes === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => handleAdvanceMinutes(opt)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  { color: colors.textSecondary },
                  notifications.advanceMinutes === opt && { color: colors.surface, fontWeight: '600' },
                ]}
              >
                {opt}분
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 방해금지 시간 */}
      <View style={[styles.subSection, { borderTopColor: colors.border }]}>
        <Text style={[styles.subSectionLabel, { color: colors.textSecondary }]}>방해금지 시간</Text>
        <View style={styles.dndRow}>
          <TouchableOpacity style={[styles.dndButton, { borderColor: colors.border, backgroundColor: colors.bg }]} onPress={handleDndStartPick} activeOpacity={0.7}>
            <Text style={[styles.dndLabel, { color: colors.textSecondary }]}>시작</Text>
            <Text style={[styles.dndValue, { color: colors.textPrimary }]}>{localDndStart}</Text>
          </TouchableOpacity>
          <Text style={[styles.dndSeparator, { color: colors.textTertiary }]}>—</Text>
          <TouchableOpacity style={[styles.dndButton, { borderColor: colors.border, backgroundColor: colors.bg }]} onPress={handleDndEndPick} activeOpacity={0.7}>
            <Text style={[styles.dndLabel, { color: colors.textSecondary }]}>종료</Text>
            <Text style={[styles.dndValue, { color: colors.textPrimary }]}>{localDndEnd}</Text>
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
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
  },
  lastToggleRow: {
    marginBottom: SPACING.xs,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.md,
  },
  subSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
  },
  subSectionLabel: {
    fontSize: FONT_SIZE.sm,
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
    alignItems: 'center',
  },
  segmentButtonText: {
    fontSize: FONT_SIZE.sm,
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
  },
  dndLabel: {
    fontSize: FONT_SIZE.sm,
  },
  dndValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  dndSeparator: {
    fontSize: FONT_SIZE.md,
  },
});
