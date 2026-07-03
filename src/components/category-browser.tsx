import { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Banknote,
  Bike,
  CarFront,
  Grid2X2,
  House,
  Shirt,
  Smartphone,
  X,
  Search,
} from 'lucide-react-native';
import {
  CATEGORY_GROUP_LABELS,
  PRODUCT_CATEGORIES,
  QUICK_CATEGORY_KEYS,
  getCategoryByKey,
  type CategoryGroupKey,
  type CategorySelection,
} from '@/lib/product-categories';

type CategoryBrowserColors = {
  surface: string;
  surfaceAlt: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  gold: string;
  goldSoft: string;
};

type CategoryBrowserProps = {
  selectedCategory: CategorySelection;
  onSelectCategory: (category: CategorySelection) => void;
  colors: CategoryBrowserColors;
};

const QUICK_ICONS = {
  all: Grid2X2,
  mobiles: Smartphone,
  cars: CarFront,
  bikes: Bike,
  'home-living': House,
  fashion: Shirt,
  'cash-prizes': Banknote,
} as const;

const GROUP_ORDER: CategoryGroupKey[] = [
  'electronics',
  'vehicles',
  'home',
  'fashion',
  'experiences',
  'sports',
  'family',
  'rewards',
  'premium',
];

export function CategoryBrowser({
  selectedCategory,
  onSelectCategory,
  colors,
}: CategoryBrowserProps) {
  const { width, height } = useWindowDimensions();
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const isDesktop = width >= 1024;
  const isTablet = width >= 640;
  const columnCount = isDesktop ? 5 : isTablet ? 3 : 2;
  const cellWidth = `${100 / columnCount}%` as `${number}%`;
  const isMoreCategory = !QUICK_CATEGORY_KEYS.some((key) => key === selectedCategory);
  const visibleCategoryKeys: CategorySelection[] = isDesktop
    ? ['all', ...PRODUCT_CATEGORIES.map((category) => category.key)]
    : [...QUICK_CATEGORY_KEYS];

  const groupedCategories = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return GROUP_ORDER.map((group) => ({
      group,
      items: PRODUCT_CATEGORIES.filter(
        (category) =>
          category.group === group &&
          (!cleanQuery || category.label.toLowerCase().includes(cleanQuery)),
      ),
    })).filter((section) => section.items.length > 0);
  }, [query]);

  function selectCategory(category: CategorySelection) {
    onSelectCategory(category);
    setShowAll(false);
    setQuery('');
  }

  return (
    <>
      <View
        style={[
          isDesktop ? styles.desktopBar : styles.compactBar,
          isDesktop
            ? { backgroundColor: colors.surface, borderColor: colors.border }
            : null,
        ]}
      >
        {isDesktop ? (
          <View style={styles.desktopHeading}>
            <Grid2X2 color={colors.gold} size={17} />
            <Text style={[styles.desktopTitle, { color: colors.gold }]}>Categories</Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickRow, isDesktop && styles.desktopOptions]}
        >
          {visibleCategoryKeys.map((key) => {
            const category = getCategoryByKey(key);
            const label = key === 'all' ? 'All' : category?.label || key;
            const Icon =
              key === 'all'
                ? Grid2X2
                : isDesktop
                  ? category?.icon || Grid2X2
                  : QUICK_ICONS[key as keyof typeof QUICK_ICONS] || category?.icon || Grid2X2;
            const selected = selectedCategory === key;

            return (
              <TouchableOpacity
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  isDesktop ? styles.desktopChip : styles.quickChip,
                  {
                    backgroundColor: selected ? colors.goldSoft : colors.surfaceAlt,
                    borderColor: selected ? colors.gold : colors.border,
                  },
                ]}
                onPress={() => selectCategory(key)}
              >
                <Icon color={selected ? colors.gold : colors.muted} size={15} strokeWidth={2} />
                <Text style={[styles.quickLabel, { color: selected ? colors.gold : colors.muted }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {!isDesktop ? (
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                styles.quickChip,
                {
                  backgroundColor: isMoreCategory ? colors.goldSoft : colors.surfaceAlt,
                  borderColor: isMoreCategory ? colors.gold : colors.border,
                },
              ]}
              onPress={() => setShowAll(true)}
            >
              <Grid2X2 color={isMoreCategory ? colors.gold : colors.muted} size={16} strokeWidth={2} />
              <Text style={[styles.quickLabel, { color: isMoreCategory ? colors.gold : colors.muted }]}>
                More
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={showAll}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAll(false)}
      >
        <View
          style={[
            styles.backdrop,
            isDesktop ? styles.backdropDesktop : styles.backdropMobile,
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAll(false)}
            accessibilityLabel="Close categories"
          />

          <View
            style={[
              styles.sheet,
              isDesktop ? styles.sheetDesktop : styles.sheetMobile,
              {
                maxHeight: Math.min(height * 0.9, 820),
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.headingCopy}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>All Categories</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                  Find the prize category you want
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close categories"
                style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowAll(false)}
              >
                <X color={colors.muted} size={20} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search color={colors.muted} size={18} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search categories"
                placeholderTextColor={colors.muted}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {query ? (
                <TouchableOpacity accessibilityLabel="Clear category search" onPress={() => setQuery('')}>
                  <X color={colors.muted} size={17} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoryContent}
            >
              {groupedCategories.map((section) => (
                <View key={section.group} style={styles.group}>
                  <Text style={[styles.groupTitle, { color: colors.gold }]}>
                    {CATEGORY_GROUP_LABELS[section.group]}
                  </Text>
                  <View style={styles.grid}>
                    {section.items.map((category) => {
                      const Icon = category.icon;
                      const selected = selectedCategory === category.key;
                      return (
                        <View key={category.key} style={[styles.cell, { width: cellWidth }]}>
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[
                              styles.categoryCard,
                              {
                                backgroundColor: selected ? colors.goldSoft : colors.elevated,
                                borderColor: selected ? colors.gold : colors.border,
                              },
                            ]}
                            onPress={() => selectCategory(category.key)}
                          >
                            <View
                              style={[
                                styles.iconContainer,
                                { backgroundColor: selected ? colors.gold : colors.surface },
                              ]}
                            >
                              <Icon
                                color={selected ? '#07130c' : colors.gold}
                                size={22}
                                strokeWidth={1.9}
                              />
                            </View>
                            <Text
                              numberOfLines={2}
                              style={[
                                styles.categoryLabel,
                                { color: selected ? colors.gold : colors.text },
                              ]}
                            >
                              {category.label}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {groupedCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No category found</Text>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Try a different search.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactBar: {
    width: '100%',
  },
  desktopBar: {
    marginHorizontal: 15,
    marginTop: 14,
    marginBottom: 2,
    borderWidth: 1,
    borderRadius: 13,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopHeading: {
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  desktopTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickRow: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 2,
    gap: 8,
  },
  desktopOptions: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 6,
  },
  desktopChip: {
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickChip: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
  },
  backdropMobile: {
    justifyContent: 'flex-end',
  },
  backdropDesktop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetMobile: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 16,
  },
  sheetDesktop: {
    width: '100%',
    maxWidth: 1120,
    borderRadius: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headingCopy: {
    flex: 1,
    gap: 3,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    minHeight: 46,
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 11,
  },
  categoryContent: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 22,
  },
  group: {
    gap: 9,
  },
  groupTitle: {
    paddingHorizontal: 5,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    padding: 5,
  },
  categoryCard: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    minHeight: 34,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 5,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
  },
});
