// 카테고리 필터 컴포넌트 — 가로 스크롤 탭 형태
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { RewardCategory } from '@/types';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/contexts/ThemeContext';

type CategoryKey = 'all' | RewardCategory;

interface CategoryItem {
  key: CategoryKey;
  label: string;
}

const CATEGORIES: CategoryItem[] = [
  { key: 'all', label: '전체' },
  { key: 'activity', label: '활동' },
  { key: 'convert', label: '전환' },
  { key: 'food', label: '음식' },
  { key: 'rest', label: '휴식' },
  { key: 'special', label: '특별' },
];

interface CategoryFilterProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

export const CategoryFilter = React.memo(function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === selectedCategory;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.tab,
                { backgroundColor: colors.border },
                isActive && { backgroundColor: colors.primary },
              ]}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                { color: colors.textSecondary },
                isActive && { color: colors.surface },
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

export type { CategoryKey };

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.xl,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
