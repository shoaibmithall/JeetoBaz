import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, Modal, TextInput, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowRight, CalendarDays, CheckCircle2, CircleAlert,
  BadgeDollarSign, Flame, Gift, Heart, Laptop, ListFilter, LockKeyhole, Play, Search,
  ShieldCheck, Target, Ticket, UsersRound, X,
} from 'lucide-react-native';
import { ShareModal } from './share';
import { DataErrorState } from '@/components/data-error-state';
import { HomeHeader } from '@/components/home-header';
import { translate, useLanguage, type LanguageCode } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getStoredStringArray, getStoredValue, setStoredValue } from '@/lib/storage';
import { loadOfflineCache, saveOfflineCache } from '@/lib/offline-cache';
import { isNotificationForUser } from '@/lib/notifications';
import type { Product } from '@/types/database';
import { useAppTheme } from '@/hooks/use-theme';

type SortOption = 'popular' | 'newest' | 'price_low' | 'price_high' | 'entry_low';
type CategoryOption = 'all' | 'mobiles' | 'bikes' | 'electronics' | 'more';
const ACTIVE_DRAWS_CACHE_KEY = 'offlineCache:activeDraws';
const ENTRY_FEES = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;

const SORT_OPTIONS: { key: SortOption; labels: Record<LanguageCode, string> }[] = [
  { key: 'popular', labels: { en: 'Most Popular', ur: 'سب سے مقبول', roman: 'Most Popular' } },
  { key: 'newest', labels: { en: 'Newest', ur: 'تازہ ترین', roman: 'Newest' } },
  { key: 'price_low', labels: { en: 'Price: Low-High', ur: 'قیمت: کم سے زیادہ', roman: 'Price: Low-High' } },
  { key: 'price_high', labels: { en: 'Price: High-Low', ur: 'قیمت: زیادہ سے کم', roman: 'Price: High-Low' } },
  { key: 'entry_low', labels: { en: 'Entry: Low-High', ur: 'انٹری: کم سے زیادہ', roman: 'Entry: Low-High' } },
];

const CATEGORY_OPTIONS: { key: CategoryOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mobiles', label: 'Mobiles' },
  { key: 'bikes', label: 'Bikes' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'more', label: 'More' },
];

function getProductCategory(name: string): Exclude<CategoryOption, 'all'> {
  const value = name.toLowerCase();
  if (/(iphone|mobile|phone|samsung|pixel|oppo|vivo|infinix)/.test(value)) return 'mobiles';
  if (/(bike|motorcycle|honda cg|yamaha|suzuki)/.test(value)) return 'bikes';
  if (/(laptop|ipad|tablet|macbook|tv|watch|airpods|headphone|powerbank|camera|console)/.test(value)) return 'electronics';
  return 'more';
}

function getTimeLeft(drawDate: string | null | undefined, language: LanguageCode, now: Date) {
  if (!drawDate) return null;
  const draw = new Date(drawDate);
  const diff = draw.getTime() - now.getTime();
  if (Number.isNaN(diff)) return null;
  if (diff <= 0) return translate(language, 'drawTimeArrived');
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getDrawScheduleStatus(product: Product, language: LanguageCode, now: Date) {
  const currentEntries = product.current_entries || 0;
  const remainingEntries = Math.max(product.max_entries - currentEntries, 0);

  if (remainingEntries > 0) {
    return {
      label: translate(language, 'drawSchedule'),
      value: `${remainingEntries.toLocaleString()} ${translate(language, 'spotsNeededForDraw')}`,
      note: translate(language, 'drawAfterFull'),
    };
  }

  const timeLeft = getTimeLeft(product.draw_date, language, now);
  if (timeLeft) {
    return {
      label: translate(language, 'drawScheduled'),
      value: timeLeft,
      note: product.draw_date || translate(language, 'drawAfterFull'),
    };
  }

  return {
    label: translate(language, 'drawReadyToSchedule'),
    value: translate(language, 'participantsComplete'),
    note: translate(language, 'drawWithinWeek'),
  };
}

export default function HomeScreen() {
  const { language, t } = useLanguage();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const showPriceSidebar = width >= 700;
  const productAreaWidth = width;
  const columnCount = productAreaWidth >= 1250 ? 3 : productAreaWidth >= 680 ? 2 : 1;
  const isMultiColumn = columnCount > 1;
  const gridGap = 16;
  const gridPadding = 16;
  const productCardWidth = isMultiColumn
    ? (productAreaWidth - (gridPadding * 2) - (gridGap * (columnCount - 1))) / columnCount
    : undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [category, setCategory] = useState<CategoryOption>('all');
  const [selectedEntryFee, setSelectedEntryFee] = useState<number | null>(null);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [time, setTime] = useState(new Date());
  const [cacheInfo, setCacheInfo] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const isCompact = width < 480;
  const isDark = theme.mode === 'dark';
  const colors = isDark ? {
    background: '#020d09',
    surface: '#071b13',
    surfaceAlt: '#04140e',
    elevated: '#0a2419',
    border: '#174a35',
    borderSoft: '#103526',
    text: '#f5f7f4',
    muted: '#9aac9f',
    primary: '#18a663',
    primarySoft: '#082d1e',
    gold: theme.gold,
    goldSoft: '#2a2105',
  } : {
    background: theme.background,
    surface: theme.surface,
    surfaceAlt: theme.surfaceAlt,
    elevated: theme.surface,
    border: theme.border,
    borderSoft: theme.border,
    text: theme.text,
    muted: theme.muted,
    primary: theme.primary,
    primarySoft: theme.primarySoft,
    gold: theme.gold,
    goldSoft: theme.goldSoft,
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || getProductCategory(product.name) === category;
      const matchesEntryFee = selectedEntryFee === null || (product.entry_fee || 1) === selectedEntryFee;
      return matchesSearch && matchesCategory && matchesEntryFee;
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'entry_low') return (a.entry_fee || 1) - (b.entry_fee || 1);
      return (b.current_entries || 0) - (a.current_entries || 0);
    });
  }, [category, products, search, selectedEntryFee, sortBy]);

  const entryFeeCounts = useMemo(() => {
    return products.reduce<Record<number, number>>((counts, product) => {
      const fee = product.entry_fee || 1;
      counts[fee] = (counts[fee] || 0) + 1;
      return counts;
    }, {});
  }, [products]);

  const featuredProduct = useMemo(() => {
    return [...products].sort((a, b) => (b.current_entries || 0) - (a.current_entries || 0))[0] || null;
  }, [products]);

  useEffect(() => {
    fetchProducts();
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStoredState() {
        const [storedPhone, storedFavorites, readNotificationIds] = await Promise.all([
          getStoredValue('userPhone'),
          getStoredStringArray('favorites'),
          getStoredStringArray('readNotificationIds'),
        ]);
        if (!active) return;
        setUserPhone(storedPhone || '');
        setFavorites(storedFavorites);
        if (!storedPhone) {
          setUnreadCount(0);
          return;
        }
        const { data: notificationData } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!active) return;
        setUnreadCount((notificationData || []).filter(
          (item) => isNotificationForUser(item, storedPhone) && !readNotificationIds.includes(item.id)
        ).length);
      }

      loadStoredState();
      return () => { active = false; };
    }, [])
  );

  async function fetchProducts() {
    setLoading(true);
    setLoadError(false);
    setCacheInfo('');
    const { data, error } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (data) {
      setProducts(data);
      await saveOfflineCache(ACTIVE_DRAWS_CACHE_KEY, data);
    }
    if (error) {
      const cached = await loadOfflineCache<Product[]>(ACTIVE_DRAWS_CACHE_KEY);
      if (cached) {
        setProducts(cached.data);
        setCacheInfo(`Showing saved draws from ${new Date(cached.savedAt).toLocaleString()}.`);
      } else {
        setLoadError(true);
      }
    }
    setLoading(false);
  }

  async function handleEnter(product: Product) {
    if (!userPhone) { router.push('/login'); return; }
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('product_id', product.id)
      .eq('phone', userPhone)
      .maybeSingle();
    if (existing) { alert(t('alreadyEntered')); return; }
    router.push({
      pathname: '/payment',
      params: {
        productId: product.id,
        productName: product.name,
        entryFee: product.entry_fee || 1,
      },
    });
  }

  async function toggleFavorite(productId: string) {
    const updated = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    await setStoredValue('favorites', JSON.stringify(updated));
    setFavorites(updated);
  }

  function renderPricePanel(compact = false) {
    const groups = [
      { title: 'Rs.1 – Rs.90', fees: ENTRY_FEES.filter((fee) => fee < 100) },
      { title: 'Rs.100 – Rs.1,000', fees: ENTRY_FEES.filter((fee) => fee >= 100) },
    ];

    return (
      <View style={[styles.pricePanel, compact && styles.pricePanelCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.pricePanelHeader}>
          <View style={styles.iconText}>
            <BadgeDollarSign color={colors.gold} size={compact ? 20 : 14} />
            <Text style={[styles.pricePanelTitle, compact && styles.pricePanelTitleCompact, { color: colors.gold }]}>Entry Fee</Text>
          </View>
          {compact && (
            <TouchableOpacity onPress={() => setShowPriceFilter(false)} accessibilityLabel="Close entry fee filter">
              <X color={colors.muted} size={22} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.pricePanelHint, compact && styles.pricePanelHintCompact, { color: colors.muted }]}>Choose your entry budget</Text>

        <TouchableOpacity
          style={[styles.allPriceButton, { backgroundColor: selectedEntryFee === null ? colors.goldSoft : colors.surfaceAlt, borderColor: selectedEntryFee === null ? colors.gold : colors.border }]}
          onPress={() => {
            setSelectedEntryFee(null);
            if (compact) setShowPriceFilter(false);
          }}
        >
          <Text style={[styles.allPriceText, compact && styles.allPriceTextCompact, { color: selectedEntryFee === null ? colors.gold : colors.text }]}>All Entry Fees</Text>
          <Text style={[styles.priceCount, compact && styles.priceCountCompact, { color: colors.muted }]}>{products.length}</Text>
        </TouchableOpacity>

        {groups.map((group) => (
          <View key={group.title} style={styles.priceGroup}>
            <Text style={[styles.priceGroupTitle, compact && styles.priceGroupTitleCompact, { color: colors.muted }]}>{group.title}</Text>
            <View style={styles.priceOptions}>
              {group.fees.map((fee) => {
                const count = entryFeeCounts[fee] || 0;
                const selected = selectedEntryFee === fee;
                const disabled = count === 0;
                return (
                  <TouchableOpacity
                    key={fee}
                    disabled={disabled}
                    style={[
                      styles.priceOption,
                      { backgroundColor: selected ? colors.goldSoft : colors.surfaceAlt, borderColor: selected ? colors.gold : colors.border },
                      disabled && styles.priceOptionDisabled,
                    ]}
                    onPress={() => {
                      setSelectedEntryFee(fee);
                      if (compact) setShowPriceFilter(false);
                    }}
                  >
                    <Text style={[styles.priceOptionText, compact && styles.priceOptionTextCompact, { color: selected ? colors.gold : disabled ? colors.muted : colors.text }]}>Rs.{fee.toLocaleString()}</Text>
                    <Text style={[styles.priceOptionCount, compact && styles.priceOptionCountCompact, { color: selected ? colors.gold : colors.muted }]}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {selectedEntryFee !== null && (
          <TouchableOpacity style={[styles.clearPriceButton, { borderColor: colors.primary }]} onPress={() => setSelectedEntryFee(null)}>
            <X color={colors.primary} size={15} />
            <Text style={[styles.clearPriceText, { color: colors.primary }]}>Clear Filter</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderHorizontalPriceBar() {
    return (
      <View style={[styles.horizontalPriceBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.horizontalPriceHeading}>
          <BadgeDollarSign color={colors.gold} size={18} />
          <Text style={[styles.horizontalPriceTitle, { color: colors.gold }]}>Entry Fee</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPriceOptions}>
          <TouchableOpacity
            style={[styles.horizontalPriceOption, { backgroundColor: selectedEntryFee === null ? colors.goldSoft : colors.surfaceAlt, borderColor: selectedEntryFee === null ? colors.gold : colors.border }]}
            onPress={() => setSelectedEntryFee(null)}
          >
            <Text style={[styles.horizontalPriceText, { color: selectedEntryFee === null ? colors.gold : colors.text }]}>All</Text>
            <Text style={[styles.horizontalPriceCount, { color: colors.muted }]}>{products.length}</Text>
          </TouchableOpacity>
          {ENTRY_FEES.map((fee) => {
            const count = entryFeeCounts[fee] || 0;
            const selected = selectedEntryFee === fee;
            const disabled = count === 0;
            return (
              <TouchableOpacity
                key={fee}
                disabled={disabled}
                style={[
                  styles.horizontalPriceOption,
                  { backgroundColor: selected ? colors.goldSoft : colors.surfaceAlt, borderColor: selected ? colors.gold : colors.border },
                  disabled && styles.priceOptionDisabled,
                ]}
                onPress={() => setSelectedEntryFee(fee)}
              >
                <Text style={[styles.horizontalPriceText, { color: selected ? colors.gold : disabled ? colors.muted : colors.text }]}>Rs.{fee.toLocaleString()}</Text>
                <Text style={[styles.horizontalPriceCount, { color: selected ? colors.gold : colors.muted }]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedEntryFee !== null && (
          <TouchableOpacity style={[styles.horizontalClearButton, { borderColor: colors.primary }]} onPress={() => setSelectedEntryFee(null)} accessibilityLabel="Clear entry fee filter">
            <X color={colors.primary} size={16} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (loading) return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={[styles.loadingText, { color: colors.gold }]}>{t('loadingJeetoBaz')}</Text>
    </View>
  );

  if (loadError) return <DataErrorState onRetry={fetchProducts} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentInsetAdjustmentBehavior="automatic">
      <ShareModal visible={showShare} onClose={() => setShowShare(false)} />
      <Modal visible={showPriceFilter && !showPriceSidebar} transparent animationType="slide" onRequestClose={() => setShowPriceFilter(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowPriceFilter(false)}>
          <View style={styles.priceSheet} onStartShouldSetResponder={() => true}>
            <ScrollView showsVerticalScrollIndicator={false}>{renderPricePanel(true)}</ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <HomeHeader unreadCount={unreadCount} onShare={() => setShowShare(true)} />

      <View style={[styles.trustBar, isCompact && styles.trustBarCompact, { backgroundColor: colors.primarySoft, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.iconText}><ShieldCheck color={colors.primary} size={15} /><Text style={[styles.trustItem, { color: colors.primary }]}>Locked Results</Text></View>
        <View style={styles.iconText}><LockKeyhole color={colors.primary} size={14} /><Text style={[styles.trustItem, { color: colors.primary }]}>{t('transparent')}</Text></View>
        <Text style={[styles.trustItem, { color: colors.primary }]}>Made for Pakistan</Text>
      </View>

      {featuredProduct && (
        <View style={[styles.featuredCard, isCompact && styles.featuredCardCompact, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
          <View style={styles.featuredContent}>
            <View style={[styles.featuredLabel, { backgroundColor: colors.goldSoft }]}>
              <Flame color={colors.gold} size={14} />
              <Text style={[styles.featuredLabelText, { color: colors.gold }]}>TODAY&apos;S FEATURED DRAW</Text>
            </View>
            <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={2}>{featuredProduct.name}</Text>
            <Text style={[styles.featuredMeta, { color: colors.muted }]}>
              {(featuredProduct.current_entries || 0).toLocaleString()} / {featuredProduct.max_entries.toLocaleString()} {t('participants')}
            </Text>
            <View style={[styles.featuredProgressBar, { backgroundColor: colors.borderSoft }]}>
              <View style={[styles.featuredProgress, { backgroundColor: colors.primary, width: `${Math.min(((featuredProduct.current_entries || 0) / featuredProduct.max_entries) * 100, 100)}%` }]} />
            </View>
            <TouchableOpacity style={[styles.featuredButton, { backgroundColor: colors.primary }]} onPress={() => handleEnter(featuredProduct)}>
              <Target color="white" size={17} />
              <Text style={styles.featuredButtonText}>{t('enterFor')} Rs.{featuredProduct.entry_fee || 1}</Text>
            </TouchableOpacity>
          </View>
          {featuredProduct.image_url ? (
            <Image source={{ uri: featuredProduct.image_url }} style={styles.featuredImage} resizeMode="contain" />
          ) : (
            <View style={[styles.featuredImageFallback, { backgroundColor: colors.elevated }]}><Gift color={colors.gold} size={48} /></View>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORY_OPTIONS.map((option) => {
          const selected = category === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.categoryChip, { backgroundColor: selected ? colors.goldSoft : colors.surface, borderColor: selected ? colors.gold : colors.border }]}
              onPress={() => setCategory(option.key)}
            >
              {option.key === 'electronics' && <Laptop color={selected ? colors.gold : colors.muted} size={15} />}
              {option.key === 'more' && <Gift color={selected ? colors.gold : colors.muted} size={15} />}
              <Text style={[styles.categoryText, { color: selected ? colors.gold : colors.muted }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {cacheInfo ? (
        <View style={[styles.cacheBanner, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          <CircleAlert color={colors.gold} size={17} />
          <Text style={[styles.cacheText, { color: colors.gold }]}>{cacheInfo}</Text>
          <TouchableOpacity onPress={fetchProducts}>
            <Text style={[styles.cacheRetry, { color: colors.primary }]}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.searchRow, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.muted} size={18} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchPrizes')}
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <X color={colors.muted} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }, showFilters && { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}
          onPress={() => setShowFilters((visible) => !visible)}
          accessibilityLabel={t('sortBy')}
        >
          <ListFilter color={showFilters ? colors.gold : colors.muted} size={20} />
        </TouchableOpacity>
        {!showPriceSidebar && (
          <TouchableOpacity
            style={[
              styles.entryFilterButton,
              { backgroundColor: colors.surface, borderColor: selectedEntryFee !== null ? colors.gold : colors.border },
              selectedEntryFee !== null && { backgroundColor: colors.goldSoft },
            ]}
            onPress={() => setShowPriceFilter(true)}
            accessibilityLabel="Filter by entry fee"
          >
            <BadgeDollarSign color={selectedEntryFee !== null ? colors.gold : colors.muted} size={19} />
            <Text style={[styles.entryFilterText, { color: selectedEntryFee !== null ? colors.gold : colors.muted }]}>
              {selectedEntryFee === null ? 'Fee' : `Rs.${selectedEntryFee.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <View style={[styles.sortContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.sortLabel, { color: colors.muted }]}>{t('sortBy')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortChip, { backgroundColor: colors.surface, borderColor: colors.border }, sortBy === option.key && { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[styles.sortChipText, { color: colors.muted }, sortBy === option.key && { color: colors.gold, fontWeight: 'bold' }]}>
                  {option.labels[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.howItWorks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeading}><Ticket color={colors.gold} size={20} /><Text style={[styles.howTitle, { color: colors.gold }]}>{t('howItWorks')}</Text></View>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>1</Text></View>
            <Text style={[styles.stepTitle, { color: colors.gold }]}>{t('entryStepTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('entryStepDesc')}</Text>
          </View>
          <View style={styles.stepArrow}><ArrowRight color={colors.primary} size={isCompact ? 15 : 20} /></View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>2</Text></View>
            <Text style={[styles.stepTitle, { color: colors.gold }]}>{t('liveDrawTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('liveDrawDesc')}</Text>
          </View>
          <View style={styles.stepArrow}><ArrowRight color={colors.primary} size={isCompact ? 15 : 20} /></View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>3</Text></View>
            <Text style={[styles.stepTitle, { color: colors.gold }]}>{t('prizeTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('prizeDesc')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.algorithmBox, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
        <View style={styles.iconText}><LockKeyhole color={colors.primary} size={18} /><Text style={[styles.algoTitle, { color: colors.primary }]}>{t('winnerAlgorithm')}</Text></View>
        <Text style={[styles.algoText, { color: colors.muted }]}>{t('winnerAlgorithmText')}</Text>
        <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
          <ShieldCheck color="white" size={15} /><Text style={styles.verifiedText}>{t('verifiedFairDraw')}</Text>
        </View>
      </View>

      {showPriceSidebar && renderHorizontalPriceBar()}

      <View style={styles.drawsLayout}>
        <View style={styles.drawsContent}>
          <View style={styles.resultsRow}>
            <View style={[styles.iconText, { flex: 1 }]}><Flame color={colors.gold} size={21} /><Text style={[styles.sectionTitle, { color: colors.gold }]}>{t('activeDraws')}</Text></View>
            <View style={styles.resultsMeta}>
              <Text style={[styles.resultsText, { color: colors.muted }]}>{filteredProducts.length} {t('found')}</Text>
              <Text style={[styles.sortedBy, { color: colors.primary }]}>
                {selectedEntryFee === null ? SORT_OPTIONS.find((option) => option.key === sortBy)?.labels[language] : `Entry Fee Rs.${selectedEntryFee.toLocaleString()}`}
              </Text>
            </View>
          </View>

          {filteredProducts.length === 0 && (
            <View style={styles.emptyBox}>
              <Search color={colors.muted} size={46} />
              <Text style={[styles.emptyText, { color: colors.text }]}>{t('noDrawsFound')}</Text>
              <TouchableOpacity onPress={() => {
                setSearch('');
                setCategory('all');
                setSelectedEntryFee(null);
              }}>
                <Text style={styles.clearSearch}>{t('clearSearch')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn]}>
            {filteredProducts.map((p) => {
              const drawSchedule = getDrawScheduleStatus(p, language, time);
              const liveLink = p.live_link;
              return (
                <View
                  key={p.id}
                  style={[
                    styles.card,
                    isMultiColumn && { width: productCardWidth, margin: 0 },
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                <View style={[styles.verifiedBanner, { backgroundColor: colors.primarySoft }]}>
                  <View style={styles.iconText}><CheckCircle2 color={colors.primary} size={15} /><Text style={[styles.verifiedBannerText, { color: colors.primary }]}>{t('verifiedDraw')}</Text></View>
                  {liveLink && (
                    <TouchableOpacity onPress={() => Linking.openURL(liveLink)}>
                      <View style={styles.liveBtn}><Play color="#ff4444" size={13} fill="#ff4444" /><Text style={styles.liveBtnText}>{t('watchLive')}</Text></View>
                    </TouchableOpacity>
                  )}
                </View>

                {p.image_url && (
                  <Image
                    source={{ uri: p.image_url }}
                    style={[styles.productImage, isMultiColumn && styles.productImageMultiColumn]}
                    resizeMode={isMultiColumn ? 'contain' : 'cover'}
                  />
                )}

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.productName, { color: colors.text }]}>{p.name}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(p.id)} accessibilityLabel={`${favorites.includes(p.id) ? t('removeFavorite') : t('addFavorite')}: ${p.name}`}>
                      <Heart color={favorites.includes(p.id) ? '#ff4d67' : colors.muted} fill={favorites.includes(p.id) ? '#ff4d67' : 'transparent'} size={25} />
                    </TouchableOpacity>
                  </View>
                  {p.description && <Text style={[styles.description, { color: colors.muted }]}>{p.description}</Text>}

                  <View style={[styles.countdownBox, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
                    <Text style={[styles.countdownLabel, { color: colors.gold }]}>{drawSchedule.label}</Text>
                    <Text style={[styles.countdownTime, { color: colors.gold }]}>{drawSchedule.value}</Text>
                  </View>
                  <Text style={[styles.drawScheduleNote, { color: colors.muted }]}>{drawSchedule.note}</Text>

                  {p.draw_date && (
                    <View style={styles.iconText}><CalendarDays color="#4a9eff" size={15} /><Text style={styles.drawDate}>{t('drawDate')}: {p.draw_date}</Text></View>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.originalPrice}>Rs. {p.price?.toLocaleString()}</Text>
                    <View style={styles.entryBadge}>
                      <Text style={styles.entryFee}>{t('entryFee')}: Rs. {p.entry_fee || 1}</Text>
                    </View>
                  </View>

                  <View style={styles.iconText}><UsersRound color={colors.muted} size={15} /><Text style={[styles.participants, { color: colors.muted }]}>{(p.current_entries || 0).toLocaleString()} {t('participants')}</Text></View>

                  <View style={[styles.progressBar, { backgroundColor: colors.borderSoft }]}>
                    <View style={[styles.progress, { width: `${Math.min(((p.current_entries||0)/p.max_entries)*100, 100)}%` }]} />
                  </View>

                  <View style={styles.spotsRow}>
                    <View style={styles.iconText}><Flame color="#ff6b6b" size={14} /><Text style={styles.spots}>{(p.max_entries - (p.current_entries||0)).toLocaleString()} {t('spotsLeft')}</Text></View>
                    <Text style={styles.percent}>{Math.round(((p.current_entries||0)/p.max_entries)*100)}%</Text>
                  </View>

                  <TouchableOpacity style={styles.button} onPress={() => handleEnter(p)}>
                    <Target color="#000" size={19} /><Text style={styles.buttonText}>{t('enterFor')} Rs.{p.entry_fee || 1}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.iconText}><LockKeyhole color="#666" size={14} /><Text style={styles.footerText}>{t('fairTransparent')}</Text></View>
        <Text style={styles.footerText}>{t('footerPakistan')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  loading: { flex: 1, backgroundColor: '#020d09', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#18a663', marginTop: 10, fontSize: 16 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  headerCompact: { paddingHorizontal: 12, paddingVertical: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  brandLogo: { width: 38, height: 38, borderRadius: 9 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  tagline: { fontSize: 12, color: 'white', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerRightCompact: { gap: 5 },
  shareBtn: { minWidth: 34, minHeight: 34, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  loginBtn: { minHeight: 34, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 17, flexDirection: 'row', gap: 5, alignItems: 'center' },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  userBadge: { minWidth: 34, minHeight: 34, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  userText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  trustBar: { padding: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  trustBarCompact: { flexWrap: 'wrap', rowGap: 6 },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustItem: { color: '#18a663', fontSize: 12, fontWeight: 'bold' },
  trustDot: { color: '#18a663', fontSize: 12 },
  cacheBanner: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cacheText: { flex: 1, fontSize: 12, lineHeight: 17 },
  cacheRetry: { fontSize: 12, fontWeight: 'bold' },
  featuredCard: { marginHorizontal: 15, marginTop: 16, borderRadius: 18, borderWidth: 1, minHeight: 235, overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' },
  featuredCardCompact: { minHeight: 220 },
  featuredContent: { flex: 1.2, padding: 20, justifyContent: 'center', alignItems: 'flex-start', zIndex: 1 },
  featuredLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, marginBottom: 11 },
  featuredLabelText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  featuredName: { fontSize: 23, lineHeight: 28, fontWeight: '800', marginBottom: 7 },
  featuredMeta: { fontSize: 12, marginBottom: 9 },
  featuredProgressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  featuredProgress: { height: 6, borderRadius: 3 },
  featuredButton: { minHeight: 42, borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  featuredButtonText: { color: 'white', fontSize: 13, fontWeight: '800' },
  featuredImage: { flex: 0.9, minWidth: 120, margin: 12 },
  featuredImageFallback: { flex: 0.9, minWidth: 120, margin: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryRow: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 2, gap: 8 },
  categoryChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#04140e' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 8, borderWidth: 1, borderColor: '#174a35', paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14, paddingVertical: 10 },
  clearBtn: { color: '#aaa', fontSize: 16, padding: 5 },
  filterBtn: { width: 46, height: 46, backgroundColor: '#071b13', borderRadius: 8, borderWidth: 1, borderColor: '#174a35', alignItems: 'center', justifyContent: 'center' },
  entryFilterButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  entryFilterText: { fontSize: 11, fontWeight: '800' },
  filterBtnActive: { borderColor: '#FFD700', backgroundColor: '#2a2105' },
  filterBtnText: { fontSize: 18 },
  sortContainer: { backgroundColor: '#04140e', paddingHorizontal: 12, paddingBottom: 12 },
  sortLabel: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  sortChip: { backgroundColor: '#071b13', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#174a35' },
  sortChipActive: { backgroundColor: '#2a2105', borderColor: '#FFD700' },
  sortChipText: { color: '#aaa', fontSize: 12 },
  sortChipTextActive: { color: '#FFD700', fontWeight: 'bold' },
  howItWorks: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#174a35' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 15 },
  howTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { flex: 1, alignItems: 'center' },
  stepNumber: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepNumberText: { fontSize: 15, fontWeight: 'bold' },
  stepTitle: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  stepDesc: { color: '#aaa', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  stepArrow: { paddingHorizontal: 5 },
  arrow: { color: '#18a663', fontSize: 20 },
  algorithmBox: { backgroundColor: '#082d1e', margin: 15, marginTop: 0, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#18a663' },
  algoTitle: { color: '#18a663', fontSize: 16, fontWeight: 'bold' },
  algoText: { color: '#aaa', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  verifiedBadge: { backgroundColor: '#18a663', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center' },
  verifiedText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  priceSheet: { maxHeight: '88%' },
  pricePanel: { borderWidth: 1, borderRadius: 12, padding: 6 },
  pricePanelCompact: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 14, paddingBottom: 28 },
  pricePanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pricePanelTitle: { fontSize: 12, fontWeight: '800' },
  pricePanelTitleCompact: { fontSize: 18 },
  pricePanelHint: { fontSize: 9, lineHeight: 12, marginTop: 4, marginBottom: 10 },
  pricePanelHintCompact: { fontSize: 11, lineHeight: 15, marginBottom: 12 },
  allPriceButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  allPriceText: { fontSize: 9, fontWeight: '800' },
  allPriceTextCompact: { fontSize: 13 },
  priceCount: { fontSize: 8, fontWeight: '700' },
  priceCountCompact: { fontSize: 11 },
  priceGroup: { marginTop: 15 },
  priceGroupTitle: { fontSize: 8, fontWeight: '800', marginBottom: 7 },
  priceGroupTitleCompact: { fontSize: 11, letterSpacing: 0.4, marginBottom: 8 },
  priceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  priceOption: { width: '100%', minHeight: 34, borderRadius: 8, borderWidth: 1, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceOptionDisabled: { opacity: 0.36 },
  priceOptionText: { fontSize: 9, fontWeight: '800' },
  priceOptionTextCompact: { fontSize: 12 },
  priceOptionCount: { fontSize: 8, fontWeight: '700' },
  priceOptionCountCompact: { fontSize: 10 },
  clearPriceButton: { minHeight: 38, borderRadius: 9, borderWidth: 1, marginTop: 15, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  clearPriceText: { fontSize: 12, fontWeight: '800' },
  horizontalPriceBar: { marginHorizontal: 15, borderWidth: 1, borderRadius: 13, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  horizontalPriceHeading: { paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  horizontalPriceTitle: { fontSize: 13, fontWeight: '800' },
  horizontalPriceOptions: { gap: 6, paddingRight: 2 },
  horizontalPriceOption: { minWidth: 68, minHeight: 36, borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  horizontalPriceText: { fontSize: 11, fontWeight: '800' },
  horizontalPriceCount: { fontSize: 9, fontWeight: '700' },
  horizontalClearButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  drawsLayout: { width: '100%' },
  drawsLayoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 15, gap: 15 },
  priceSidebar: { width: 80, paddingTop: 15 },
  drawsContent: { flex: 1, minWidth: 0 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1 },
  resultsMeta: { alignItems: 'flex-end', marginLeft: 12 },
  resultsText: { color: '#aaa', fontSize: 12 },
  sortedBy: { color: '#18a663', fontSize: 11, marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  clearSearch: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  productGrid: { width: '100%' },
  productGridMultiColumn: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
  card: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#174a35' },
  verifiedBanner: { backgroundColor: '#082d1e', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBannerText: { color: '#18a663', fontSize: 12, fontWeight: 'bold' },
  liveBtn: { backgroundColor: '#2b0d0d', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', gap: 4, alignItems: 'center' },
  liveBtnText: { color: '#ff4444', fontSize: 12, fontWeight: 'bold' },
  productImage: { width: '100%', height: 200 },
  productImageMultiColumn: { height: 250 },
  cardBody: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
  heartBtn: { fontSize: 24, marginLeft: 10 },
  description: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  countdownBox: { backgroundColor: '#2a2105', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: '#FFD700' },
  countdownLabel: { color: '#FFD700', fontSize: 13, flex: 1, marginRight: 10 },
  countdownTime: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'right', flexShrink: 1 },
  drawScheduleNote: { color: '#aaa', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  drawDate: { color: '#4a9eff', fontSize: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  originalPrice: { fontSize: 18, color: '#FFD700', fontWeight: 'bold' },
  entryBadge: { backgroundColor: '#082d1e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  entryFee: { fontSize: 13, color: '#18a663', fontWeight: 'bold' },
  participants: { fontSize: 13, color: '#aaa' },
  progressBar: { backgroundColor: '#174a35', height: 8, borderRadius: 4, marginBottom: 6 },
  progress: { backgroundColor: '#18a663', height: 8, borderRadius: 4 },
  spotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  spots: { color: '#ff6b6b', fontSize: 12 },
  percent: { color: '#18a663', fontSize: 12, fontWeight: 'bold' },
  button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footer: { padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  footerText: { color: '#444', fontSize: 12, marginBottom: 5 },
});
