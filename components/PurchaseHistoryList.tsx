// 구매 내역 목록 — 오늘의 보상 구매 기록 표시 및 사용 처리
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { RewardPurchase } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────

function formatPurchaseTime(purchase: RewardPurchase): string {
  const ts = purchase.purchasedAt;
  // Firestore Timestamp 또는 Date 모두 지원
  const date: Date = typeof (ts as { toDate?: () => Date }).toDate === 'function'
    ? (ts as { toDate: () => Date }).toDate()
    : new Date(ts as unknown as string);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface PurchaseHistoryListProps {
  purchases: RewardPurchase[];
  onMarkUsed: (purchaseId: string) => void;
}

// ─────────────────────────────────────────────
// 개별 아이템
// ─────────────────────────────────────────────

interface PurchaseItemProps {
  purchase: RewardPurchase;
  onMarkUsed: (purchaseId: string) => void;
}

const PurchaseItem = React.memo(function PurchaseItem({ purchase, onMarkUsed }: PurchaseItemProps) {
  const colors = useThemeColors();
  const handlePress = useCallback(() => {
    if (!purchase.used) {
      onMarkUsed(purchase.id);
    }
  }, [purchase.id, purchase.used, onMarkUsed]);

  return (
    <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* 아이콘 */}
      <Text style={styles.itemIcon}>{purchase.rewardIcon}</Text>

      {/* 정보 */}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
          {purchase.rewardName}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemCost, { color: colors.pointDark }]}>⭐ {purchase.pointsSpent}</Text>
          <Text style={[styles.itemDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.itemTime, { color: colors.textSecondary }]}>{formatPurchaseTime(purchase)}</Text>
        </View>
      </View>

      {/* 사용 버튼 */}
      <TouchableOpacity
        style={[
          styles.useButton,
          { backgroundColor: colors.primary },
          purchase.used && { backgroundColor: colors.border },
        ]}
        onPress={handlePress}
        disabled={purchase.used}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.useButtonText,
          { color: colors.surface },
          purchase.used && { color: colors.textSecondary },
        ]}>
          {purchase.used ? '사용됨' : '사용'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// ─────────────────────────────────────────────
// 목록 컴포넌트
// ─────────────────────────────────────────────

export function PurchaseHistoryList({ purchases, onMarkUsed }: PurchaseHistoryListProps) {
  const colors = useThemeColors();
  // purchasedAt 내림차순 정렬
  const sorted = [...purchases].sort((a, b) => {
    const aMs = typeof (a.purchasedAt as { toMillis?: () => number }).toMillis === 'function'
      ? (a.purchasedAt as { toMillis: () => number }).toMillis()
      : new Date(a.purchasedAt as unknown as string).getTime();
    const bMs = typeof (b.purchasedAt as { toMillis?: () => number }).toMillis === 'function'
      ? (b.purchasedAt as { toMillis: () => number }).toMillis()
      : new Date(b.purchasedAt as unknown as string).getTime();
    return bMs - aMs;
  });

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RewardPurchase>) => (
      <PurchaseItem purchase={item} onMarkUsed={onMarkUsed} />
    ),
    [onMarkUsed],
  );

  const keyExtractor = useCallback((item: RewardPurchase) => item.id, []);

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>오늘 구매한 보상이 없습니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    gap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  itemIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  itemCost: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  itemDot: {
    fontSize: FONT_SIZE.xs,
  },
  itemTime: {
    fontSize: FONT_SIZE.xs,
  },
  useButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
  },
});
