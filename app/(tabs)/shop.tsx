// 보상 상점 화면 — 카테고리 필터 + 보상 카드 목록 + 구매 흐름 + 커스텀 보상 CRUD + 구매 내역
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserDocument } from '@/hooks/useUserDocument';
import { useRewardStore } from '@/stores/useRewardStore';
import { useRewardPurchases } from '@/hooks/useRewardPurchases';
import { PointsBadge } from '@/components/PointsBadge';
import { CategoryFilter, CategoryKey } from '@/components/CategoryFilter';
import { RewardCard } from '@/components/RewardCard';
import { PurchaseConfirmModal } from '@/components/PurchaseConfirmModal';
import { PurchaseAnimation } from '@/components/PurchaseAnimation';
import { CustomRewardModal } from '@/components/CustomRewardModal';
import { PurchaseHistoryList } from '@/components/PurchaseHistoryList';
import { Reward, RewardCategory } from '@/types';
import Animated from 'react-native-reanimated';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getTodayDate } from '@/utils/time';
import { hapticLight } from '@/utils/haptics';
import { getListItemEntering } from '@/hooks/useListItemAnimation';

export default function ShopScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid;
  const today = getTodayDate();

  const { userDoc } = useUserDocument(userId);
  const {
    rewards,
    purchases,
    isLoading,
    purchaseReward,
    loadRewards,
    createReward,
    updateReward,
    deleteReward,
    markUsed,
  } = useRewardStore();

  // 실시간 구매 기록 구독
  useRewardPurchases(userId, today);

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [shouldAnimateInitialList, setShouldAnimateInitialList] = useState(true);
  const hasMarkedInitialAnimationDoneRef = useRef(false);

  const currentPoints = userDoc?.currentPoints ?? 0;

  // 보상 목록 최초 로드
  useEffect(() => {
    if (userId) {
      loadRewards(userId);
    }
  }, [userId]);

  // 최초 목록 렌더링 이후에는 입장 애니메이션 비활성화
  useEffect(() => {
    if (hasMarkedInitialAnimationDoneRef.current) return;
    if (rewards.length === 0) return;

    const timer = setTimeout(() => {
      hasMarkedInitialAnimationDoneRef.current = true;
      setShouldAnimateInitialList(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [rewards.length]);

  // 카테고리 필터링
  const filteredRewards = useMemo(() => {
    if (selectedCategory === 'all') return rewards;
    return rewards.filter((r) => r.category === (selectedCategory as RewardCategory));
  }, [selectedCategory, rewards]);

  const handleSelectCategory = useCallback((cat: CategoryKey) => {
    hapticLight();
    setSelectedCategory(cat);
  }, []);

  // 구매 흐름
  const handleBuy = useCallback((reward: Reward) => {
    hapticLight();
    setPendingReward(reward);
    setShowConfirmModal(true);
  }, []);

  const handleConfirmPurchase = useCallback(async () => {
    if (!pendingReward || !userId) return;
    setShowConfirmModal(false);
    try {
      await purchaseReward(userId, today, pendingReward.id);
      setShowAnimation(true);
    } catch {
      // 에러는 스토어에서 처리 (hapticError 포함)
    }
    setPendingReward(null);
  }, [pendingReward, userId, today, purchaseReward]);

  const handleCancelPurchase = useCallback(() => {
    setShowConfirmModal(false);
    setPendingReward(null);
  }, []);

  const handleAnimationDismiss = useCallback(() => {
    setShowAnimation(false);
  }, []);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await loadRewards(userId);
    } finally {
      setRefreshing(false);
    }
  }, [userId, loadRewards]);

  // 커스텀 보상 생성 모달 열기
  const handleOpenCreateModal = useCallback(() => {
    hapticLight();
    setEditingReward(undefined);
    setShowCustomModal(true);
  }, []);

  // 커스텀 보상 수정 (long-press)
  const handleLongPress = useCallback(
    (reward: Reward) => {
      if (!reward.isCustom) return;
      hapticLight();
      setEditingReward(reward);
      setShowCustomModal(true);
    },
    [],
  );

  // 커스텀 보상 저장 (생성 또는 수정)
  const handleSaveCustomReward = useCallback(
    async (data: Omit<Reward, 'id' | 'createdAt' | 'isActive' | 'sortOrder' | 'isCustom'>) => {
      if (!userId) return;
      if (editingReward) {
        await updateReward(userId, editingReward.id, data);
      } else {
        await createReward(userId, data);
      }
    },
    [userId, editingReward, createReward, updateReward],
  );

  // 커스텀 보상 삭제
  const handleDeleteCustomReward = useCallback(
    (reward: Reward) => {
      if (!reward.isCustom || !userId) return;
      hapticLight();
      Alert.alert(
        '보상 삭제',
        '이 보상을 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteReward(userId, reward.id);
              } catch {
                Alert.alert('삭제 실패', '보상 삭제 중 오류가 발생했습니다');
              }
            },
          },
        ],
      );
    },
    [userId, deleteReward],
  );

  // 구매 사용 처리
  const handleMarkUsed = useCallback(
    async (purchaseId: string) => {
      if (!userId) return;
      try {
        await markUsed(userId, today, purchaseId);
      } catch {
        Alert.alert('오류', '사용 처리 중 오류가 발생했습니다');
      }
    },
    [userId, today, markUsed],
  );

  const renderReward = useCallback(
    ({ item, index }: ListRenderItemInfo<Reward>) => (
      <Animated.View entering={getListItemEntering(index, shouldAnimateInitialList)}>
        <RewardCard
          reward={item}
          currentPoints={currentPoints}
          onBuy={handleBuy}
          onLongPress={item.isCustom ? () => handleLongPress(item) : undefined}
          onDelete={item.isCustom ? () => handleDeleteCustomReward(item) : undefined}
          showCustomBadge={item.isCustom}
        />
      </Animated.View>
    ),
    [currentPoints, handleBuy, handleLongPress, handleDeleteCustomReward, shouldAnimateInitialList],
  );

  const keyExtractor = useCallback((item: Reward) => item.id, []);

  const renderListHeader = () => (
    <>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      {isLoading && rewards.length === 0 && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>보상 목록을 불러오는 중...</Text>
        </View>
      )}
    </>
  );

  const renderListFooter = () => (
    <>
      <View style={styles.historySection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>오늘의 구매 내역</Text>
        <PurchaseHistoryList
          purchases={purchases}
          onMarkUsed={handleMarkUsed}
        />
      </View>
      <View style={styles.listFooter} />
    </>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>해당 카테고리의 보상이 없습니다</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>보상 상점</Text>
        <View style={styles.headerRight}>
          <PointsBadge points={currentPoints} />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenCreateModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 보상 목록 (카테고리 필터 포함) */}
      <FlatList
        data={filteredRewards}
        renderItem={renderReward}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* 구매 확인 모달 */}
      <PurchaseConfirmModal
        visible={showConfirmModal}
        reward={pendingReward}
        onConfirm={handleConfirmPurchase}
        onCancel={handleCancelPurchase}
      />

      {/* 구매 성공 애니메이션 */}
      <PurchaseAnimation
        visible={showAnimation}
        onDismiss={handleAnimationDismiss}
      />

      {/* 커스텀 보상 생성/수정 모달 */}
      <CustomRewardModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={handleSaveCustomReward}
        editingReward={editingReward}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  loadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
  historySection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  listFooter: {
    height: SPACING.lg,
  },
});
