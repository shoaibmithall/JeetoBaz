import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, RefreshControl, TextInput, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import {
  ArrowRight, CalendarDays, CheckCircle2, CircleAlert,
  BadgeDollarSign, ChevronLeft, ChevronRight, Flame, Heart, ListFilter, LockKeyhole, Play, Search,
  Megaphone, ShieldCheck, Target, Ticket, TrendingUp, UsersRound, X,
} from 'lucide-react-native';
import { CategoryBrowser } from '@/components/category-browser';
import { DataErrorState } from '@/components/data-error-state';
import { HomeHeader } from '@/components/home-header';
import { HomeMain, HomeNavigation, HomePageHeading, HomeSkipLink } from '@/components/home-semantics';
import JeetoBazFooter from '@/components/jeetobaz-footer';
import { ReferralFloatingBanner } from '@/components/referral-floating-banner';
import { translate, useLanguage, type LanguageCode, type TranslationKey } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getStoredStringArray, getStoredValue, removeStoredValues, setStoredValue } from '@/lib/storage';
import { loadOfflineCache, saveOfflineCache } from '@/lib/offline-cache';
import { getAnnouncement, getHomeAdImages } from '@/lib/app-settings';
import { subscribeHomeScrollToTop } from '@/lib/home-scroll';
import {
  CATEGORY_GROUP_LABELS,
  getProductCategory,
  PRODUCT_CATEGORIES,
  type CategoryGroupKey,
  type CategorySelection,
  type ProductCategoryKey,
} from '@/lib/product-categories';
import type { Product } from '@/types/database';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/hooks/use-theme';

type SortOption = 'popular' | 'newest' | 'price_low' | 'price_high' | 'entry_low';
type HomeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  elevated: string;
  border: string;
  borderSoft: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  gold: string;
  goldSoft: string;
};
type DrawSchedule = ReturnType<typeof getDrawScheduleStatus>;
type ProductFetchOptions = {
  hydrateFromCache?: boolean;
  showLoading?: boolean;
};
const ACTIVE_DRAWS_CACHE_KEY = 'offlineCache:activeDraws';
const HOME_ADS_CACHE_KEY = 'offlineCache:homeAds';
const ENTRY_FEES = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;
const HOME_PRODUCTS_LIMIT = 120;
const HOME_PRODUCT_COLUMNS = 'id, name, price, status, created_at, current_entries, max_entries, entry_fee, winner_phone, image_url, description, draw_date, live_link, winner_photo, slug';
const HOME_NOTIFICATION_COLUMNS = 'id, target_phone';
const PULL_TO_REFRESH_THRESHOLD = 64;
const HOME_URL = 'https://jeetobaz.pk/';
const HOME_TITLE = 'Transparent Prize Campaigns in Pakistan | JeetoBaz';
const HOME_DESCRIPTION = 'Explore JeetoBaz prize campaigns, review participation details, follow draw updates, and view verified winners in Pakistan.';
const HOME_OG_IMAGE = 'https://jeetobaz.pk/og-image.png';
const HOME_TWITTER_IMAGE = 'https://jeetobaz.pk/twitter-image.png';
const ORGANIZATION_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://jeetobaz.pk/#organization',
  name: 'JeetoBaz',
  url: HOME_URL,
  logo: 'https://jeetobaz.pk/icon-512.png',
  sameAs: [
    'https://www.facebook.com/share/17uAJE6AQY/',
    'https://www.instagram.com/jeetobaz',
    'https://www.tiktok.com/@jeetobaz',
    'https://youtube.com/@jeetobaz',
    'https://snapchat.com/t/ZM4Q6K11',
    'https://x.com/jeetobaz',
    'https://t.me/jeetobaz',
  ],
};
const WEBSITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://jeetobaz.pk/#website',
  name: 'JeetoBaz',
  url: HOME_URL,
  description: HOME_DESCRIPTION,
  publisher: {
    '@id': 'https://jeetobaz.pk/#organization',
  },
};
const HOMEPAGE_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': HOME_URL + '#webpage',
  name: 'Transparent Prize Campaigns in Pakistan',
  url: HOME_URL,
  description: HOME_DESCRIPTION,
  isPartOf: { '@id': 'https://jeetobaz.pk/#website' },
  about: { '@id': 'https://jeetobaz.pk/#organization' },
};
const SORT_OPTIONS: { key: SortOption; labels: Record<LanguageCode, string> }[] = [
  { key: 'popular', labels: { en: 'Most Popular', ur: 'سب سے مقبول', roman: 'Most Popular' } },
  { key: 'newest', labels: { en: 'Newest', ur: 'تازہ ترین', roman: 'Newest' } },
  { key: 'price_low', labels: { en: 'Price: Low-High', ur: 'قیمت: کم سے زیادہ', roman: 'Price: Low-High' } },
  { key: 'price_high', labels: { en: 'Price: High-Low', ur: 'قیمت: زیادہ سے کم', roman: 'Price: High-Low' } },
  { key: 'entry_low', labels: { en: 'Entry: Low-High', ur: 'انٹری: کم سے زیادہ', roman: 'Entry: Low-High' } },
];

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function getTimeLeft(drawDate: string | null | undefined, language: LanguageCode, now: Date) {
  if (!drawDate) return null;
  const parsed = new Date(drawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  // draw_date is admin-entered free text meant as Pakistan time (PKT, fixed
  // UTC+5, no DST). new Date() parses it using the VIEWER's local timezone,
  // so re-anchor the parsed wall-clock numbers to PKT explicitly rather than
  // trusting whatever timezone the visitor's device happens to be set to.
  const wallClockAsUtc = parsed.getTime() - parsed.getTimezoneOffset() * 60000;
  const draw = new Date(wallClockAsUtc - PKT_OFFSET_MS);
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

const HomeProductCard = memo(function HomeProductCard({
  product,
  drawSchedule,
  isFavorite,
  isCompactGrid,
  isMultiColumn,
  productCardWidth,
  productImageHeight,
  colors,
  t,
  onEnter,
  onToggleFavorite,
}: {
  product: Product;
  drawSchedule: DrawSchedule;
  isFavorite: boolean;
  isCompactGrid: boolean;
  isMultiColumn: boolean;
  productCardWidth?: number;
  productImageHeight: number;
  colors: HomeColors;
  t: (key: TranslationKey) => string;
  onEnter: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
}) {
  const [imageLoading, setImageLoading] = useState(Boolean(product.image_url));
  const [imageFailed, setImageFailed] = useState(false);
  const liveLink = product.live_link;
  const showImage = Boolean(product.image_url && !imageFailed);
  const currentEntries = product.current_entries || 0;
  const maxEntries = product.max_entries || 1;
  const progressPercent = Math.min((currentEntries / maxEntries) * 100, 100);
  const spotsLeft = Math.max(maxEntries - currentEntries, 0);
  const compactScheduleValue = isCompactGrid && !product.draw_date
    ? `${spotsLeft.toLocaleString()} ${t('spotsLeft')}`
    : drawSchedule.value;

  return (
    <View
      style={[
        styles.card,
        isMultiColumn && { width: productCardWidth, margin: 0 },
        isCompactGrid && styles.cardCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.verifiedBanner, isCompactGrid && styles.verifiedBannerCompact, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.iconText}>
          <CheckCircle2 color={colors.primary} size={isCompactGrid ? 13 : 15} />
          <Text numberOfLines={1} style={[styles.verifiedBannerText, isCompactGrid && styles.verifiedBannerTextCompact, { color: colors.primary }]}>
            {t('verifiedDraw')}
          </Text>
        </View>
        {liveLink && (
          <TouchableOpacity onPress={() => Linking.openURL(liveLink)}>
            <View style={[styles.liveBtn, isCompactGrid && styles.liveBtnCompact]}>
              <Play color="#ff4444" size={isCompactGrid ? 10 : 13} fill="#ff4444" />
              <Text numberOfLines={1} style={[styles.liveBtnText, isCompactGrid && styles.liveBtnTextCompact]}>{t('watchLive')}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: productImageHeight }}>
        {showImage ? (
          <>
            {imageLoading ? (
              <View style={[styles.productImageFallback, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.skeletonBlock, styles.productImageSkeleton, { backgroundColor: colors.borderSoft }]} />
              </View>
            ) : null}
            <ExpoImage
              source={{ uri: product.image_url || '' }}
              accessibilityLabel={`${product.name} prize`}
              cachePolicy="disk"
              transition={160}
              contentFit={isMultiColumn || isCompactGrid ? 'contain' : 'cover'}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageFailed(true);
              }}
              style={[
                styles.productImage,
                isMultiColumn && styles.productImageMultiColumn,
                { height: productImageHeight, opacity: imageLoading ? 0 : 1 },
              ]}
            />
          </>
        ) : (
          <View style={[styles.productImageFallback, { backgroundColor: colors.surfaceAlt }]}>
            <Ticket color={colors.gold} size={isCompactGrid ? 24 : 38} />
            <Text numberOfLines={1} style={[styles.productImageFallbackText, isCompactGrid && styles.productImageFallbackTextCompact, { color: colors.muted }]}>
              JeetoBaz Draw
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.cardBody, isCompactGrid && styles.cardBodyCompact]}>
        <View style={[styles.cardHeader, isCompactGrid && styles.cardHeaderCompact]}>
          {product.slug ? (
            <Link href={`/product/${product.slug}`} asChild>
              <TouchableOpacity style={styles.productNameLink} accessibilityRole="link">
                <Text
                  numberOfLines={isCompactGrid ? 2 : undefined}
                  style={[styles.productName, isCompactGrid && styles.productNameCompact, { color: colors.text }]}
                >
                  {product.name}
                </Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <Text
              numberOfLines={isCompactGrid ? 2 : undefined}
              style={[styles.productName, isCompactGrid && styles.productNameCompact, { color: colors.text }]}
            >
              {product.name}
            </Text>
          )}
          <TouchableOpacity onPress={() => onToggleFavorite(product.id)} accessibilityLabel={`${isFavorite ? t('removeFavorite') : t('addFavorite')}: ${product.name}`}>
            <Heart color={isFavorite ? '#ff4d67' : colors.muted} fill={isFavorite ? '#ff4d67' : 'transparent'} size={isCompactGrid ? 17 : 25} />
          </TouchableOpacity>
        </View>
        {product.description && (
          <Text
            numberOfLines={isCompactGrid ? 2 : undefined}
            style={[styles.description, isCompactGrid && styles.descriptionCompact, { color: colors.muted }]}
          >
            {product.description}
          </Text>
        )}

        <View style={[styles.countdownBox, isCompactGrid && styles.countdownBoxCompact, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          {!isCompactGrid && (
            <Text numberOfLines={1} style={[styles.countdownLabel, { color: colors.gold }]}>{drawSchedule.label}</Text>
          )}
          <Text numberOfLines={1} style={[styles.countdownTime, isCompactGrid && styles.countdownTimeCompact, { color: colors.gold }]}>{compactScheduleValue}</Text>
        </View>

        {product.draw_date && (
          <View style={styles.iconText}><CalendarDays color="#4a9eff" size={isCompactGrid ? 11 : 15} /><Text numberOfLines={1} style={[styles.drawDate, isCompactGrid && styles.drawDateCompact]}>{t('drawDate')}: {product.draw_date}</Text></View>
        )}

        <View style={[styles.priceRow, isCompactGrid && styles.priceRowCompact]}>
          <Text numberOfLines={1} style={[styles.originalPrice, isCompactGrid && styles.originalPriceCompact]}>Rs. {product.price?.toLocaleString()}</Text>
        </View>

        <View style={styles.iconText}><UsersRound color={colors.muted} size={isCompactGrid ? 11 : 15} /><Text numberOfLines={1} style={[styles.participants, isCompactGrid && styles.participantsCompact, { color: colors.muted }]}>{currentEntries.toLocaleString()} {t('participants')}</Text></View>

        <View style={[styles.progressBar, isCompactGrid && styles.progressBarCompact, { backgroundColor: colors.borderSoft }]}>
          <View style={[styles.progress, isCompactGrid && styles.progressCompact, { width: `${progressPercent}%` }]} />
        </View>

        <View style={[styles.spotsRow, isCompactGrid && styles.spotsRowCompact]}>
          <View style={styles.iconText}><Flame color="#ff6b6b" size={isCompactGrid ? 10 : 14} /><Text numberOfLines={1} style={[styles.spots, isCompactGrid && styles.spotsCompact]}>{spotsLeft.toLocaleString()} {t('spotsLeft')}</Text></View>
          <Text style={[styles.percent, isCompactGrid && styles.percentCompact]}>{Math.round(progressPercent)}%</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isCompactGrid && styles.buttonCompact]}
          onPress={() => onEnter(product)}
          accessibilityRole="button"
          accessibilityLabel={`${t('enterFor')} Rs.${product.entry_fee || 1}: ${product.name}`}
        >
          <Target color="#000" size={isCompactGrid ? 14 : 19} /><Text numberOfLines={1} style={[styles.buttonText, isCompactGrid && styles.buttonTextCompact]}>{t('enterFor')} Rs.{product.entry_fee || 1}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [hasHydratedLayout, setHasHydratedLayout] = useState(false);
  const responsiveWidth = hasHydratedLayout ? width : 390;
  const showPriceSidebar = responsiveWidth >= 700;
  const productAreaWidth = responsiveWidth;
  const columnCount = productAreaWidth >= 1250 ? 3 : 2;
  const isMultiColumn = columnCount > 1;
  const isCompactGrid = productAreaWidth < 680;
  const gridGap = 16;
  const gridPadding = isCompactGrid ? 10 : 16;
  const productCardWidth = isMultiColumn
    ? (productAreaWidth - (gridPadding * 2) - (gridGap * (columnCount - 1))) / columnCount
    : undefined;
  const productImageHeight = isCompactGrid && productCardWidth
    ? Math.max(82, Math.min(116, productCardWidth * 0.95))
    : isMultiColumn ? 250 : 200;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [category, setCategory] = useState<CategorySelection>('all');
  const [groupFilter, setGroupFilter] = useState<CategoryGroupKey | null>(null);
  const [selectedEntryFee, setSelectedEntryFee] = useState<number | null>(null);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [time, setTime] = useState(new Date());
  const [cacheInfo, setCacheInfo] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [homeAdImages, setHomeAdImages] = useState<string[]>([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [adsLoading, setAdsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollViewRef = useRef<ElementRef<typeof ScrollView>>(null);
  const scrollYRef = useRef(0);
  const pullStartYRef = useRef<number | null>(null);
  const hasFocusedHomeRef = useRef(false);
  const router = useRouter();
  const categoryParams = useLocalSearchParams<{ category?: string; group?: string }>();
  const deferredSearch = useDeferredValue(search);
  const deferredCategory = useDeferredValue(category);
  const deferredGroupFilter = useDeferredValue(groupFilter);
  const deferredSelectedEntryFee = useDeferredValue(selectedEntryFee);

  useEffect(() => {
    const categoryParam = categoryParams.category;
    const groupParam = categoryParams.group;
    if (typeof categoryParam === 'string' && PRODUCT_CATEGORIES.some((entry) => entry.key === categoryParam)) {
      setCategory(categoryParam as CategorySelection);
      setGroupFilter(null);
    } else if (typeof groupParam === 'string' && groupParam in CATEGORY_GROUP_LABELS) {
      setGroupFilter(groupParam as CategoryGroupKey);
      setCategory('all');
    } else {
      // No category/group param (e.g. the footer's "All Draws" or "And More" links) -
      // reset any active filter/search instead of leaving a previous filter applied.
      setCategory('all');
      setGroupFilter(null);
      setSearch('');
      setSelectedEntryFee(null);
    }
  }, [categoryParams.category, categoryParams.group]);
  const isCompact = responsiveWidth < 480;
  const isDark = theme.mode === 'dark';
  const colors = useMemo<HomeColors>(() => isDark ? {
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
  }, [isDark, theme.background, theme.border, theme.gold, theme.goldSoft, theme.mode, theme.muted, theme.primary, theme.primarySoft, theme.surface, theme.surfaceAlt, theme.text]);

  const filteredProducts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query);
      const productCategoryKey = getProductCategory(product.name);
      const matchesCategory = deferredGroupFilter
        ? PRODUCT_CATEGORIES.find((entry) => entry.key === productCategoryKey)?.group === deferredGroupFilter
        : deferredCategory === 'all' || productCategoryKey === deferredCategory;
      const matchesEntryFee = deferredSelectedEntryFee === null || (product.entry_fee || 1) === deferredSelectedEntryFee;
      return matchesSearch && matchesCategory && matchesEntryFee;
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'entry_low') return (a.entry_fee || 1) - (b.entry_fee || 1);
      return (b.current_entries || 0) - (a.current_entries || 0);
    });
  }, [deferredCategory, deferredGroupFilter, deferredSearch, deferredSelectedEntryFee, products, sortBy]);

  const isDefaultView = category === 'all' && groupFilter === null && search.trim() === '' && selectedEntryFee === null;

  const categoryPreviewCount = columnCount === 3 ? 6 : 4;

  const categorySections = useMemo(() => {
    if (!isDefaultView) return [];
    const productsByCategory = new Map<ProductCategoryKey, Product[]>();
    for (const product of products) {
      const key = getProductCategory(product.name);
      if (!key) continue;
      const existing = productsByCategory.get(key);
      if (existing) {
        existing.push(product);
      } else {
        productsByCategory.set(key, [product]);
      }
    }
    return PRODUCT_CATEGORIES
      .filter((entry) => productsByCategory.has(entry.key))
      .map((entry) => {
        const items = productsByCategory.get(entry.key)!;
        return {
          key: entry.key,
          label: entry.label,
          icon: entry.icon,
          total: items.length,
          preview: items.slice(0, categoryPreviewCount),
        };
      });
  }, [isDefaultView, products, categoryPreviewCount]);

  const trendingProducts = useMemo(() => {
    if (!isDefaultView) return [];
    return products
      .filter((product) => (product.current_entries || 0) > 0)
      .sort((a, b) => (b.current_entries || 0) - (a.current_entries || 0));
  }, [isDefaultView, products]);

  const trendingPreview = useMemo(() => trendingProducts.slice(0, 3), [trendingProducts]);

  const entryFeeCounts = useMemo(() => {
    return products.reduce<Record<number, number>>((counts, product) => {
      const fee = product.entry_fee || 1;
      counts[fee] = (counts[fee] || 0) + 1;
      return counts;
    }, {});
  }, [products]);

  const activeAdImage = homeAdImages.length > 0
    ? homeAdImages[activeAdIndex % homeAdImages.length]
    : null;

  const showPreviousAd = useCallback(() => {
    setActiveAdIndex((current) =>
      homeAdImages.length > 0
        ? (current - 1 + homeAdImages.length) % homeAdImages.length
        : 0
    );
  }, [homeAdImages.length]);

  const showNextAd = useCallback(() => {
    setActiveAdIndex((current) =>
      homeAdImages.length > 0 ? (current + 1) % homeAdImages.length : 0
    );
  }, [homeAdImages.length]);

  useEffect(() => {
    setHasHydratedLayout(true);
    fetchHomeAds();
    fetchAnnouncement();
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return subscribeHomeScrollToTop(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  useEffect(() => {
    if (homeAdImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveAdIndex((current) => (current + 1) % homeAdImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeAdIndex, homeAdImages.length]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isInitialProductLoad = !hasFocusedHomeRef.current;
      fetchProducts({ hydrateFromCache: isInitialProductLoad, showLoading: isInitialProductLoad });
      hasFocusedHomeRef.current = true;

      async function loadStoredState() {
        const favoritesKey = user ? `favorites:${user.id}` : null;
        const [storedPhone, accountFavorites, readNotificationIds] = await Promise.all([
          getStoredValue('userPhone'),
          favoritesKey ? getStoredStringArray(favoritesKey) : Promise.resolve([]),
          getStoredStringArray('readNotificationIds'),
        ]);
        if (!active) return;

        let storedFavorites = accountFavorites;
        if (favoritesKey && storedFavorites.length === 0) {
          const legacyFavorites = await getStoredStringArray('favorites');
          if (legacyFavorites.length > 0) {
            storedFavorites = legacyFavorites;
            await setStoredValue(favoritesKey, JSON.stringify(legacyFavorites));
            await removeStoredValues(['favorites']);
          }
        }

        let resolvedPhone = storedPhone || '';

        if (!resolvedPhone && user?.id) {
          const { data: profile } = await supabase
            .from('users')
            .select('phone, name')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (!active) return;
          if (profile?.phone) {
            resolvedPhone = profile.phone;
            setStoredValue('userPhone', profile.phone);
            setStoredValue('userName', profile.name || '');
          }
        }

        setUserPhone(resolvedPhone);
        setFavorites(storedFavorites);
        if (!resolvedPhone) {
          setUnreadCount(0);
          return;
        }
        const { data: notificationData } = await supabase
          .from('notifications')
          .select(HOME_NOTIFICATION_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(50);
        if (!active) return;
        setUnreadCount((notificationData || []).filter(
          (item) => (!item.target_phone || item.target_phone === resolvedPhone) && !readNotificationIds.includes(item.id)
        ).length);
      }

      loadStoredState();
      return () => { active = false; };
    }, [user])
  );

  async function fetchProducts({ hydrateFromCache = true, showLoading = true }: ProductFetchOptions = {}) {
    if (showLoading) setLoading(true);
    setLoadError(false);
    setCacheInfo('');
    const cached = hydrateFromCache ? await loadOfflineCache<Product[]>(ACTIVE_DRAWS_CACHE_KEY) : null;
    if (hydrateFromCache && cached?.data.length) {
      setProducts(cached.data);
      if (showLoading) setLoading(false);
    }

    const { data, error } = await supabase
      .from('products')
      .select(HOME_PRODUCT_COLUMNS)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(HOME_PRODUCTS_LIMIT);
    if (data) {
      setProducts(data);
      await saveOfflineCache(ACTIVE_DRAWS_CACHE_KEY, data);
    }
    if (error) {
      if (!data && cached) {
        setProducts(cached.data);
        setCacheInfo(`Showing saved draws from ${new Date(cached.savedAt).toLocaleString()}.`);
      } else {
        setLoadError(true);
      }
    }
    if (showLoading) setLoading(false);
  }

  async function refreshHome() {
    if (refreshing) return;
    setRefreshing(true);
    setPullDistance(PULL_TO_REFRESH_THRESHOLD);

    if (process.env.EXPO_OS === 'web') {
      window.location.reload();
      return;
    }

    try {
      await Promise.all([fetchProducts(), fetchHomeAds(), fetchAnnouncement()]);
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }

  function handleTouchStart(pageY: number) {
    pullStartYRef.current = scrollYRef.current <= 1 ? pageY : null;
  }

  function handleTouchMove(pageY: number) {
    if (pullStartYRef.current === null || refreshing) return;
    const distance = Math.max(0, Math.min(92, (pageY - pullStartYRef.current) * 0.55));
    setPullDistance(distance);
  }

  function handleTouchEnd() {
    pullStartYRef.current = null;
    if (pullDistance >= PULL_TO_REFRESH_THRESHOLD) {
      refreshHome();
    } else {
      setPullDistance(0);
    }
  }

  async function fetchHomeAds() {
    setAdsLoading(true);
    const cached = await loadOfflineCache<string[]>(HOME_ADS_CACHE_KEY);
    if (cached?.data.length) {
      setHomeAdImages(cached.data);
      setActiveAdIndex(0);
      setAdsLoading(false);
      void ExpoImage.prefetch(cached.data.slice(0, 2), 'disk');
    }

    const { images, error } = await getHomeAdImages();
    if (!error) {
      setHomeAdImages(images);
      setActiveAdIndex(0);
      await saveOfflineCache(HOME_ADS_CACHE_KEY, images);
      if (images.length > 0) {
        void ExpoImage.prefetch(images.slice(0, 2), 'disk');
      }
    }
    setAdsLoading(false);
  }

  async function fetchAnnouncement() {
    const { announcement: latestAnnouncement, error } = await getAnnouncement();
    if (!error) setAnnouncement(latestAnnouncement);
  }

  async function handleEnter(product: Product) {
    let phone = userPhone;
    let activeUser = user;

    if (!phone && !activeUser) {
      const { data: sessionData } = await supabase.auth.getSession();
      activeUser = sessionData.session?.user ?? null;
    }

    if (!phone && activeUser?.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('phone, name')
        .eq('auth_user_id', activeUser.id)
        .maybeSingle();

      if (profile?.phone) {
        phone = profile.phone;
        setUserPhone(phone);
        await Promise.all([
          setStoredValue('userPhone', phone),
          setStoredValue('userName', profile.name || ''),
        ]);
      } else {
        const metadataPhone = activeUser.user_metadata?.phone;
        if (typeof metadataPhone === 'string' && /^\+92\d{10}$/.test(metadataPhone)) {
          phone = metadataPhone;
          setUserPhone(phone);
          await Promise.all([
            setStoredValue('userPhone', phone),
            setStoredValue('userName', typeof activeUser.user_metadata?.name === 'string' ? activeUser.user_metadata.name : ''),
          ]);
        }
      }
    }

    if (!phone) {
      router.push(activeUser ? '/profile-setup' : '/login');
      return;
    }
    const { data: existing } = await supabase.rpc('check_entry_exists', {
      p_product_id: product.id,
      p_phone: phone,
    });
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
    if (!user) {
      router.push('/login');
      return;
    }
    const updated = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    await setStoredValue(`favorites:${user.id}`, JSON.stringify(updated));
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
                      setShowAllTrending(false);
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
                onPress={() => {
                  setSelectedEntryFee(fee);
                  setShowAllTrending(false);
                }}
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

  if (loadError) return <DataErrorState onRetry={() => fetchProducts()} />;

  return (
    <>
    <Head>
      <title>{HOME_TITLE}</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content={HOME_DESCRIPTION} />
      <link rel="canonical" href={HOME_URL} />
      <meta property="og:title" content={HOME_TITLE} />
      <meta property="og:description" content={HOME_DESCRIPTION} />
      <meta property="og:url" content={HOME_URL} />
      <meta property="og:site_name" content="JeetoBaz" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={HOME_OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@jeetobaz" />
      <meta name="twitter:title" content={HOME_TITLE} />
      <meta name="twitter:description" content={HOME_DESCRIPTION} />
      <meta name="twitter:image" content={HOME_TWITTER_IMAGE} />
      <script type="application/ld+json">{JSON.stringify(ORGANIZATION_STRUCTURED_DATA)}</script>
      <script type="application/ld+json">{JSON.stringify(WEBSITE_STRUCTURED_DATA)}</script>
      <script type="application/ld+json">{JSON.stringify(HOMEPAGE_WEBPAGE_SCHEMA)}</script>
    </Head>
    <HomeSkipLink />
    <ReferralFloatingBanner />
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={process.env.EXPO_OS === 'web' ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refreshHome} tintColor={colors.primary} colors={[colors.primary]} />
      )}
      onScroll={(event) => { scrollYRef.current = event.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
      onTouchStart={(event) => handleTouchStart(event.nativeEvent.pageY)}
      onTouchMove={(event) => handleTouchMove(event.nativeEvent.pageY)}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {process.env.EXPO_OS === 'web' && pullDistance > 0 ? (
        <View style={[styles.pullRefreshIndicator, { height: pullDistance, backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} size="small" animating={refreshing || pullDistance >= PULL_TO_REFRESH_THRESHOLD} accessibilityLabel="Refreshing" />
          <Text style={[styles.pullRefreshText, { color: colors.primary }]}>Loading JeetoBaz...</Text>
        </View>
      ) : null}
      <Modal visible={showPriceFilter && !showPriceSidebar} transparent animationType="slide" onRequestClose={() => setShowPriceFilter(false)} accessibilityLabel="Price filter">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowPriceFilter(false)}>
          <View style={styles.priceSheet} onStartShouldSetResponder={() => true}>
            <ScrollView showsVerticalScrollIndicator={false}>{renderPricePanel(true)}</ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <HomeMain>
      <HomeHeader unreadCount={unreadCount} />
      <HomePageHeading />

      <View style={[styles.trustBar, isCompact && styles.trustBarCompact, { backgroundColor: colors.primarySoft, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.iconText}><ShieldCheck color={colors.primary} size={15} /><Text style={[styles.trustItem, { color: colors.primary }]}>Locked Results</Text></View>
        <View style={styles.iconText}><LockKeyhole color={colors.primary} size={14} /><Text style={[styles.trustItem, { color: colors.primary }]}>{t('transparent')}</Text></View>
        <Text style={[styles.trustItem, { color: colors.primary }]}>Made for Pakistan</Text>
      </View>

      {announcement ? (
        <View style={[styles.announcementBanner, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          <Megaphone color={colors.gold} size={18} />
          <Text style={[styles.announcementText, { color: colors.text }]}>{announcement}</Text>
        </View>
      ) : null}

      {activeAdImage ? (
        <View style={[styles.adBannerCard, isCompact && styles.adBannerCardCompact, { backgroundColor: colors.surface, borderColor: colors.gold }]}>
          <ExpoImage
            source={{ uri: activeAdImage }}
            accessibilityLabel={`JeetoBaz featured offer ${activeAdIndex + 1} of ${homeAdImages.length}`}
            cachePolicy="disk"
            transition={180}
            contentFit="cover"
            style={styles.adBannerImage}
          />
          {homeAdImages.length > 1 ? (
            <>
              <TouchableOpacity
                style={[styles.adArrow, styles.adArrowLeft, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={showPreviousAd}
                accessibilityRole="button"
                accessibilityLabel="Show previous offer"
              >
                <ChevronLeft color={colors.gold} size={isCompact ? 24 : 28} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adArrow, styles.adArrowRight, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={showNextAd}
                accessibilityRole="button"
                accessibilityLabel="Show next offer"
              >
                <ChevronRight color={colors.gold} size={isCompact ? 24 : 28} />
              </TouchableOpacity>
              <View style={styles.adDots} pointerEvents="none">
                {homeAdImages.map((image, index) => (
                  <View
                    key={`${image}-${index}`}
                    style={[
                      styles.adDot,
                      { backgroundColor: index === activeAdIndex % homeAdImages.length ? colors.gold : colors.border },
                    ]}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : adsLoading ? (
        <View style={[styles.adBannerCard, styles.adBannerLoading, isCompact && styles.adBannerCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.skeletonBlock, styles.adBannerLoadingBar, { backgroundColor: colors.borderSoft }]} />
          <View style={[styles.skeletonBlock, styles.adBannerLoadingTitle, { backgroundColor: colors.goldSoft }]} />
          <Text style={[styles.adBannerLoadingText, { color: colors.muted }]}>Loading latest JeetoBaz offers...</Text>
        </View>
      ) : null}

      <HomeNavigation>
        <CategoryBrowser
          selectedCategory={category}
          onSelectCategory={(next) => {
            setCategory(next);
            setGroupFilter(null);
            setShowAllTrending(false);
          }}
          colors={colors}
        />
      </HomeNavigation>

      {cacheInfo ? (
        <View style={[styles.cacheBanner, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          <CircleAlert color={colors.gold} size={17} />
          <Text style={[styles.cacheText, { color: colors.gold }]}>{cacheInfo}</Text>
          <TouchableOpacity onPress={() => fetchProducts()}>
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
            onChangeText={(text) => {
              setSearch(text);
              setShowAllTrending(false);
            }}
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
        <View style={styles.sectionHeading}><Ticket color={colors.gold} size={20} /><Text role="heading" aria-level={2} style={[styles.howTitle, { color: colors.gold }]}>{t('howItWorks')}</Text></View>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>1</Text></View>
            <Text role="heading" aria-level={3} style={[styles.stepTitle, { color: colors.gold }]}>{t('entryStepTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('entryStepDesc')}</Text>
          </View>
          <View style={styles.stepArrow}><ArrowRight color={colors.primary} size={isCompact ? 15 : 20} /></View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>2</Text></View>
            <Text role="heading" aria-level={3} style={[styles.stepTitle, { color: colors.gold }]}>{t('liveDrawTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('liveDrawDesc')}</Text>
          </View>
          <View style={styles.stepArrow}><ArrowRight color={colors.primary} size={isCompact ? 15 : 20} /></View>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { borderColor: colors.gold }]}><Text style={[styles.stepNumberText, { color: colors.gold }]}>3</Text></View>
            <Text role="heading" aria-level={3} style={[styles.stepTitle, { color: colors.gold }]}>{t('prizeTitle')}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{t('prizeDesc')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.algorithmBox, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
        <View style={styles.iconText}><LockKeyhole color={colors.primary} size={18} /><Text role="heading" aria-level={2} style={[styles.algoTitle, { color: colors.primary }]}>{t('winnerAlgorithm')}</Text></View>
        <Text style={[styles.algoText, { color: colors.muted }]}>{t('winnerAlgorithmText')}</Text>
        <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
          <ShieldCheck color="white" size={15} /><Text style={styles.verifiedText}>{t('verifiedFairDraw')}</Text>
        </View>
      </View>

      {showPriceSidebar && renderHorizontalPriceBar()}

      <View style={styles.drawsLayout}>
        <View style={styles.drawsContent}>
          <View style={styles.resultsRow}>
            <View style={[styles.iconText, { flex: 1 }]}><Flame color={colors.gold} size={21} /><Text role="heading" aria-level={2} style={[styles.sectionTitle, { color: colors.gold }]}>{t('activeDraws')}</Text></View>
            <View style={styles.resultsMeta}>
              <Text style={[styles.resultsText, { color: colors.muted }]}>{filteredProducts.length} {t('found')}</Text>
              <Text style={[styles.sortedBy, { color: colors.primary }]}>
                {selectedEntryFee === null ? SORT_OPTIONS.find((option) => option.key === sortBy)?.labels[language] : `Entry Fee Rs.${selectedEntryFee.toLocaleString()}`}
              </Text>
            </View>
          </View>

          {groupFilter && (
            <View style={[styles.groupFilterChip, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
              <Text style={[styles.groupFilterText, { color: colors.gold }]}>Filtered by: {CATEGORY_GROUP_LABELS[groupFilter]}</Text>
              <TouchableOpacity onPress={() => setGroupFilter(null)} accessibilityRole="button" accessibilityLabel="Clear category filter">
                <Text style={[styles.groupFilterClear, { color: colors.gold }]}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && isDefaultView && !showAllTrending && trendingPreview.length > 0 && (
            <View style={styles.categorySection}>
              <View style={[styles.categorySectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.iconText}>
                  <TrendingUp color={colors.gold} size={19} strokeWidth={2} />
                  <Text role="heading" aria-level={3} style={[styles.categorySectionTitle, { color: colors.gold }]}>
                    Trending
                  </Text>
                </View>
                {trendingProducts.length > trendingPreview.length && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="See all trending draws"
                    onPress={() => setShowAllTrending(true)}
                  >
                    <Text style={[styles.categorySectionSeeAll, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn, isCompactGrid && styles.productGridCompact]}>
                {trendingPreview.map((p) => {
                  const drawSchedule = getDrawScheduleStatus(p, language, time);
                  return (
                    <HomeProductCard
                      key={p.id}
                      product={p}
                      drawSchedule={drawSchedule}
                      isFavorite={favorites.includes(p.id)}
                      isCompactGrid={isCompactGrid}
                      isMultiColumn={isMultiColumn}
                      productCardWidth={productCardWidth}
                      productImageHeight={productImageHeight}
                      colors={colors}
                      t={t}
                      onEnter={handleEnter}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {!loading && isDefaultView && showAllTrending && (
            <View style={styles.categorySection}>
              <View style={[styles.categorySectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.iconText}>
                  <TrendingUp color={colors.gold} size={19} strokeWidth={2} />
                  <Text role="heading" aria-level={3} style={[styles.categorySectionTitle, { color: colors.gold }]}>
                    Trending
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Clear trending view"
                  onPress={() => setShowAllTrending(false)}
                >
                  <Text style={[styles.categorySectionSeeAll, { color: colors.primary }]}>✕ Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn, isCompactGrid && styles.productGridCompact]}>
                {trendingProducts.map((p) => {
                  const drawSchedule = getDrawScheduleStatus(p, language, time);
                  return (
                    <HomeProductCard
                      key={p.id}
                      product={p}
                      drawSchedule={drawSchedule}
                      isFavorite={favorites.includes(p.id)}
                      isCompactGrid={isCompactGrid}
                      isMultiColumn={isMultiColumn}
                      productCardWidth={productCardWidth}
                      productImageHeight={productImageHeight}
                      colors={colors}
                      t={t}
                      onEnter={handleEnter}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {loading && (
            <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn, isCompactGrid && styles.productGridCompact]}>
              {Array.from({ length: isCompactGrid ? 4 : 6 }).map((_, index) => (
                <View
                  key={`home-skeleton-${index}`}
                  style={[
                    styles.card,
                    styles.skeletonCard,
                    isMultiColumn && { width: productCardWidth, margin: 0 },
                    isCompactGrid && styles.cardCompact,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.skeletonBlock, styles.skeletonBanner, { backgroundColor: colors.primarySoft }]} />
                  <View style={[styles.skeletonBlock, { height: productImageHeight, backgroundColor: colors.surfaceAlt }]} />
                  <View style={[styles.cardBody, isCompactGrid && styles.cardBodyCompact]}>
                    <View style={[styles.skeletonBlock, styles.skeletonTitle, { backgroundColor: colors.borderSoft }]} />
                    <View style={[styles.skeletonBlock, styles.skeletonLine, { backgroundColor: colors.borderSoft }]} />
                    <View style={[styles.skeletonBlock, styles.skeletonButton, { backgroundColor: colors.goldSoft }]} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {!loading && filteredProducts.length === 0 && (
            <View style={styles.emptyBox}>
              <Search color={colors.muted} size={46} />
              <Text style={[styles.emptyText, { color: colors.text }]}>{t('noDrawsFound')}</Text>
              <TouchableOpacity onPress={() => {
                setSearch('');
                setCategory('all');
                setSelectedEntryFee(null);
                setShowAllTrending(false);
              }}>
                <Text style={styles.clearSearch}>{t('clearSearch')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && filteredProducts.length > 0 && isDefaultView && !showAllTrending && (
          <View style={styles.categorySectionsList}>
            {categorySections.map((section) => (
              <View key={section.key} style={styles.categorySection}>
                <View style={[styles.categorySectionHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.iconText}>
                    <section.icon color={colors.gold} size={19} strokeWidth={2} />
                    <Text role="heading" aria-level={3} style={[styles.categorySectionTitle, { color: colors.gold }]}>
                      {section.label}
                    </Text>
                  </View>
                  {section.total > section.preview.length && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`See all ${section.label}`}
                      onPress={() => {
                        setCategory(section.key);
                        setGroupFilter(null);
                        setShowAllTrending(false);
                      }}
                    >
                      <Text style={[styles.categorySectionSeeAll, { color: colors.primary }]}>See All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn, isCompactGrid && styles.productGridCompact]}>
                  {section.preview.map((p) => {
                    const drawSchedule = getDrawScheduleStatus(p, language, time);
                    return (
                      <HomeProductCard
                        key={p.id}
                        product={p}
                        drawSchedule={drawSchedule}
                        isFavorite={favorites.includes(p.id)}
                        isCompactGrid={isCompactGrid}
                        isMultiColumn={isMultiColumn}
                        productCardWidth={productCardWidth}
                        productImageHeight={productImageHeight}
                        colors={colors}
                        t={t}
                        onEnter={handleEnter}
                        onToggleFavorite={toggleFavorite}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          )}

          {!loading && filteredProducts.length > 0 && !isDefaultView && (
          <View style={[styles.productGrid, isMultiColumn && styles.productGridMultiColumn, isCompactGrid && styles.productGridCompact]}>
            {filteredProducts.map((p) => {
              const drawSchedule = getDrawScheduleStatus(p, language, time);
              return (
                <HomeProductCard
                  key={p.id}
                  product={p}
                  drawSchedule={drawSchedule}
                  isFavorite={favorites.includes(p.id)}
                  isCompactGrid={isCompactGrid}
                  isMultiColumn={isMultiColumn}
                  productCardWidth={productCardWidth}
                  productImageHeight={productImageHeight}
                  colors={colors}
                  t={t}
                  onEnter={handleEnter}
                  onToggleFavorite={toggleFavorite}
                />
              );
            })}
          </View>
          )}
        </View>
      </View>

      <JeetoBazFooter
        onResetFilters={() => {
          setSearch('');
          setCategory('all');
          setGroupFilter(null);
          setSelectedEntryFee(null);
          setShowAllTrending(false);
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }}
      />
      </HomeMain>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d09' },
  pullRefreshIndicator: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  pullRefreshText: { fontSize: 13, fontWeight: '700' },
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
  announcementBanner: { marginHorizontal: 15, marginTop: 14, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  announcementText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  cacheBanner: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cacheText: { flex: 1, fontSize: 12, lineHeight: 17 },
  cacheRetry: { fontSize: 12, fontWeight: 'bold' },
  adBannerCard: { marginHorizontal: 15, marginTop: 16, borderRadius: 18, borderWidth: 1, height: 260, overflow: 'hidden', position: 'relative' },
  adBannerCardCompact: { height: 205 },
  adBannerImage: { width: '100%', height: '100%' },
  adArrow: { position: 'absolute', top: '50%', width: 44, height: 44, marginTop: -22, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.92 },
  adArrowLeft: { left: 12 },
  adArrowRight: { right: 12 },
  adBannerLoading: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18 },
  adBannerLoadingBar: { width: '72%', height: 18 },
  adBannerLoadingTitle: { width: '42%', height: 28 },
  adBannerLoadingText: { fontSize: 12, fontWeight: '700' },
  adDots: { position: 'absolute', left: 0, right: 0, bottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  adDot: { width: 7, height: 7, borderRadius: 4 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#04140e' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#071b13', borderRadius: 8, borderWidth: 1, borderColor: '#174a35', paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: 'white', fontSize: 14, paddingVertical: 10 },
  clearBtn: { color: '#aaa', fontSize: 16, padding: 5 },
  filterBtn: { width: 46, height: 46, backgroundColor: '#071b13', borderRadius: 8, borderWidth: 1, borderColor: '#174a35', alignItems: 'center', justifyContent: 'center' },
  entryFilterButton: { minHeight: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  entryFilterText: { fontSize: 12, fontWeight: '800' },
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
  stepDesc: { color: '#aaa', fontSize: 12, textAlign: 'center', lineHeight: 17 },
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
  pricePanelHint: { fontSize: 12, lineHeight: 16, marginTop: 4, marginBottom: 10 },
  pricePanelHintCompact: { fontSize: 12, lineHeight: 16, marginBottom: 12 },
  allPriceButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  allPriceText: { fontSize: 12, fontWeight: '800' },
  allPriceTextCompact: { fontSize: 13 },
  priceCount: { fontSize: 12, fontWeight: '700' },
  priceCountCompact: { fontSize: 12 },
  priceGroup: { marginTop: 15 },
  priceGroupTitle: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  priceGroupTitleCompact: { fontSize: 12, letterSpacing: 0.4, marginBottom: 8 },
  priceOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  priceOption: { width: '100%', minHeight: 34, borderRadius: 8, borderWidth: 1, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceOptionDisabled: { opacity: 0.36 },
  priceOptionText: { fontSize: 12, fontWeight: '800' },
  priceOptionTextCompact: { fontSize: 12 },
  priceOptionCount: { fontSize: 12, fontWeight: '700' },
  priceOptionCountCompact: { fontSize: 12 },
  clearPriceButton: { minHeight: 38, borderRadius: 9, borderWidth: 1, marginTop: 15, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  clearPriceText: { fontSize: 12, fontWeight: '800' },
  horizontalPriceBar: { marginHorizontal: 15, borderWidth: 1, borderRadius: 13, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  horizontalPriceHeading: { paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  horizontalPriceTitle: { fontSize: 13, fontWeight: '800' },
  horizontalPriceOptions: { gap: 6, paddingRight: 2 },
  horizontalPriceOption: { minWidth: 68, minHeight: 36, borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  horizontalPriceText: { fontSize: 12, fontWeight: '800' },
  horizontalPriceCount: { fontSize: 12, fontWeight: '700' },
  horizontalClearButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  drawsLayout: { width: '100%' },
  drawsLayoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 15, gap: 15 },
  priceSidebar: { width: 80, paddingTop: 15 },
  drawsContent: { flex: 1, minWidth: 0 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  groupFilterChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, marginHorizontal: 15, marginBottom: 10, paddingVertical: 9, paddingHorizontal: 13 },
  groupFilterText: { fontSize: 13, fontWeight: '700' },
  groupFilterClear: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1 },
  resultsMeta: { alignItems: 'flex-end', marginLeft: 12 },
  resultsText: { color: '#aaa', fontSize: 12 },
  sortedBy: { color: '#18a663', fontSize: 12, marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  clearSearch: { color: '#18a663', fontSize: 14, fontWeight: 'bold' },
  productGrid: { width: '100%' },
  productGridMultiColumn: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
  productGridCompact: { paddingHorizontal: 10, gap: 10 },
  categorySectionsList: { paddingBottom: 6 },
  categorySection: { width: '100%' },
  categorySectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1 },
  categorySectionTitle: { fontSize: 16, fontWeight: '800' },
  categorySectionCount: { fontSize: 12 },
  categorySectionSeeAll: { fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#071b13', margin: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#174a35' },
  cardCompact: { borderRadius: 11 },
  skeletonCard: { opacity: 0.92 },
  skeletonBlock: { borderRadius: 10 },
  skeletonBanner: { height: 31, borderRadius: 0 },
  skeletonTitle: { height: 18, width: '82%', marginBottom: 9 },
  skeletonLine: { height: 12, width: '62%', marginBottom: 12 },
  skeletonButton: { height: 40, width: '100%' },
  verifiedBanner: { backgroundColor: '#082d1e', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBannerCompact: { paddingHorizontal: 7, paddingVertical: 7, gap: 4 },
  verifiedBannerText: { color: '#18a663', fontSize: 12, fontWeight: 'bold' },
  verifiedBannerTextCompact: { fontSize: 12, lineHeight: 16, maxWidth: 112 },
  liveBtn: { backgroundColor: '#2b0d0d', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', gap: 4, alignItems: 'center' },
  liveBtnCompact: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6, gap: 2 },
  liveBtnText: { color: '#ff4444', fontSize: 12, fontWeight: 'bold' },
  liveBtnTextCompact: { fontSize: 12, lineHeight: 16, maxWidth: 48 },
  productImage: { width: '100%', height: 200 },
  productImageMultiColumn: { height: 250 },
  productImageFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 7 },
  productImageSkeleton: { width: '54%', height: '46%' },
  productImageFallbackText: { fontSize: 12, fontWeight: '800' },
  productImageFallbackTextCompact: { fontSize: 12 },
  cardBody: { padding: 15 },
  cardBodyCompact: { padding: 9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  productNameLink: { flex: 1 },
  cardHeaderCompact: { alignItems: 'flex-start', gap: 4, marginBottom: 5 },
  productName: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
  productNameCompact: { fontSize: 14, lineHeight: 18, minHeight: 36 },
  heartBtn: { fontSize: 24, marginLeft: 10 },
  description: { fontSize: 13, color: '#aaa', marginBottom: 10 },
  descriptionCompact: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  countdownBox: { backgroundColor: '#2a2105', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: '#FFD700' },
  countdownBoxCompact: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 7, marginBottom: 7, alignItems: 'center', justifyContent: 'center' },
  countdownLabel: { color: '#FFD700', fontSize: 13, flex: 1, marginRight: 10 },
  countdownTime: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'right', flexShrink: 1 },
  countdownTimeCompact: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
  drawDate: { color: '#4a9eff', fontSize: 12 },
  drawDateCompact: { fontSize: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceRowCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 6 },
  originalPrice: { fontSize: 18, color: '#FFD700', fontWeight: 'bold' },
  originalPriceCompact: { fontSize: 14 },
  participants: { fontSize: 13, color: '#aaa' },
  participantsCompact: { fontSize: 12, lineHeight: 16, flexShrink: 1 },
  progressBar: { backgroundColor: '#174a35', height: 8, borderRadius: 4, marginBottom: 6 },
  progressBarCompact: { height: 5, borderRadius: 3, marginBottom: 4 },
  progress: { backgroundColor: '#18a663', height: 8, borderRadius: 4 },
  progressCompact: { height: 5, borderRadius: 3 },
  spotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  spotsRowCompact: { marginBottom: 7, gap: 3 },
  spots: { color: '#ff6b6b', fontSize: 12 },
  spotsCompact: { fontSize: 12, lineHeight: 16, flexShrink: 1 },
  percent: { color: '#18a663', fontSize: 12, fontWeight: 'bold' },
  percentCompact: { fontSize: 12 },
  button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonCompact: { minHeight: 38, paddingHorizontal: 7, paddingVertical: 9, borderRadius: 7, gap: 4 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  buttonTextCompact: { fontSize: 12, lineHeight: 16, flexShrink: 1 },

});
