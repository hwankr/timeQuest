// 시간표 메인 화면 — 오늘 타임라인 FlatList
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuthStore } from '@/stores/useAuthStore';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useUserDocument } from '@/hooks/useUserDocument';
import { BlockCard, BLOCK_CARD_HEIGHT } from '@/components/BlockCard';
import { PointsBadge } from '@/components/PointsBadge';
import { BlockConvertModal } from '@/components/BlockConvertModal';
import { BlockCompletion } from '@/types';
import { isCurrentBlock, isBlockPast, getTodayDate } from '@/utils/time';
import Animated from 'react-native-reanimated';
import { SPACING, FONT_SIZE } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getListItemEntering } from '@/hooks/useListItemAnimation';

const ITEM_HEIGHT = BLOCK_CARD_HEIGHT + SPACING.xs * 2; // card + vertical margin

export default function ScheduleScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const {
    completions,
    isLoading,
    error,
    loadToday,
    subscribeToCompletions,
    completeBlock,
    convertBlock,
  } = useScheduleStore();
  const { userDoc } = useUserDocument(user?.uid);
  const currentTime = useCurrentTime();
  const flatListRef = useRef<FlatList<BlockCompletion>>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [shouldAnimateInitialList, setShouldAnimateInitialList] = useState(true);
  const hasMarkedInitialAnimationDoneRef = useRef(false);

  const todayLabel = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

  // 초기 데이터 로드 + 실시간 구독
  useEffect(() => {
    if (!user) return;
    const today = getTodayDate();

    loadToday(user.uid);
    const unsubscribe = subscribeToCompletions(user.uid, today);

    return () => {
      unsubscribe();
    };
  }, [user]);

  // 현재 블록으로 자동 스크롤
  useEffect(() => {
    if (completions.length === 0) return;
    const currentIndex = completions.findIndex((c) =>
      isCurrentBlock(c.startTime, c.endTime, currentTime),
    );
    if (currentIndex >= 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex,
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [completions.length, currentTime]);

  // 최초 목록 렌더링 이후에는 입장 애니메이션 비활성화
  useEffect(() => {
    if (hasMarkedInitialAnimationDoneRef.current) return;
    if (completions.length === 0) return;

    const timer = setTimeout(() => {
      hasMarkedInitialAnimationDoneRef.current = true;
      setShouldAnimateInitialList(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [completions.length]);

  // 블록 완료 핸들러 — CompleteBlockResult 반환하여 BlockCard가 토스트 표시 가능
  const handleComplete = useCallback(
    async (blockId: string) => {
      if (!user) return;
      try {
        return await completeBlock(user.uid, blockId);
      } catch {
        // 에러는 store error 필드로 처리됨
        return undefined;
      }
    },
    [user, completeBlock],
  );

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    await loadToday(user.uid);
    setIsRefreshing(false);
  }, [user, loadToday]);

  // 블록 전환 처리
  const handleConvertBlock = useCallback(
    async (blockId: string) => {
      if (!user) return;
      const today = getTodayDate();
      await convertBlock(user.uid, today, blockId);
    },
    [user, convertBlock],
  );

  // FlatList 렌더 아이템 — 입장 애니메이션 포함
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<BlockCompletion>) => {
      const isCurrent = isCurrentBlock(item.startTime, item.endTime, currentTime);
      const isPast = isBlockPast(item.endTime, currentTime);
      return (
        <Animated.View entering={getListItemEntering(index, shouldAnimateInitialList)}>
          <BlockCard
            completion={item}
            isCurrent={isCurrent}
            isPast={isPast}
            onComplete={handleComplete}
          />
        </Animated.View>
      );
    },
    [currentTime, handleComplete, shouldAnimateInitialList],
  );

  const keyExtractor = useCallback((item: BlockCompletion) => item.blockId, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<BlockCompletion> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      // 스크롤 실패 시 가능한 범위 내 마지막 인덱스로 이동
      flatListRef.current?.scrollToIndex({
        index: Math.min(info.index, info.highestMeasuredFrameIndex),
        animated: true,
      });
    },
    [],
  );

  if (isLoading && completions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>일정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>{todayLabel}</Text>
          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
        </View>
        <PointsBadge points={userDoc?.currentPoints ?? 0} />
      </View>

      {/* 타임라인 FlatList */}
      <FlatList
        ref={flatListRef}
        data={completions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>오늘 일정이 없습니다</Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>아래로 당겨서 새로고침하세요</Text>
          </View>
        }
      />

      {/* 블록 전환 모달 */}
      <BlockConvertModal
        visible={showConvertModal}
        completions={completions}
        onConvert={handleConvertBlock}
        onClose={() => setShowConvertModal(false)}
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
  emptySubText: {
    fontSize: FONT_SIZE.sm,
  },
});
