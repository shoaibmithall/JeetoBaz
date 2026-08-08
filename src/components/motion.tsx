import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Pressable wrapper that scales down slightly on press-in and springs back on
 * release -- the touch equivalent of a hover-lift. Also carries the native
 * Android ripple that `Pressable` already supports out of the box.
 */
export function PressScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  children,
  android_ripple,
  ...pressableProps
}: PressableProps & { scaleTo?: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...pressableProps}
        style={style}
        onPressIn={(event) => {
          if (!reducedMotion) scale.value = withTiming(scaleTo, { duration: 90 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!reducedMotion) scale.value = withSpring(1, { damping: 14, stiffness: 220 });
          onPressOut?.(event);
        }}
        android_ripple={android_ripple ?? { color: 'rgba(255,255,255,0.25)', foreground: true }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Rolls a number up from 0 to `value` on mount/change via plain
 * requestAnimationFrame (no worklets needed for a text-only tween).
 */
export function AnimatedCounter({
  value,
  duration = 800,
  formatter,
  style,
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion || value <= 0) {
      setDisplay(value);
      return;
    }
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reducedMotion]);

  return <Text style={style}>{formatter ? formatter(display) : display.toLocaleString()}</Text>;
}

/** Slow, gentle vertical float loop -- no mouse-tracking, works on touch and desktop alike. */
export function FloatingView({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Diagonal light sweep that passes over prize card images every few seconds.
 * Purely decorative -- rendered non-interactive and skipped under reduced motion.
 */
export function ShineSweep({ width, delay = 0 }: { width: number; delay?: number }) {
  const reducedMotion = useReducedMotion();
  const bandWidth = Math.max(width * 0.35, 40);
  const translateX = useSharedValue(-bandWidth * 2);

  useEffect(() => {
    if (reducedMotion || !width) return;
    translateX.value = -bandWidth * 2;
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withDelay(3200, withTiming(width + bandWidth, { duration: 1400, easing: Easing.inOut(Easing.quad) })),
          withTiming(-bandWidth * 2, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [reducedMotion, width, bandWidth, delay, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { rotate: '18deg' }] }));

  if (reducedMotion || !width) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.shineBand, { width: bandWidth }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shineGradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * One-shot "elastic pop" entrance: scales past its final size and settles back,
 * with a matching fade-in. Intended for small brand elements (logo/wordmark)
 * that should draw the eye once on mount, not loop.
 */
export function ElasticPopIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.15, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(0.95, { duration: 140, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
      ),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
  }, [reducedMotion, delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * One-shot fade-up entrance: rises into place and fades in. Intended for text
 * that should settle in shortly after a sibling element's own entrance.
 */
export function FadeInUpOnce({
  children,
  delay = 0,
  distance = 12,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(reducedMotion ? 0 : distance);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    translateY.value = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
  }, [reducedMotion, delay, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Auto-scrolling horizontal row that loops seamlessly (the list is rendered twice
 * back-to-back, and the scroll position wraps once it passes the first copy).
 * Pauses on touch/drag (and mouse hover on web) and resumes shortly after the
 * user lets go -- manual swiping always wins over the auto-scroll.
 */
export function MarqueeRow<T>({
  items,
  keyExtractor,
  renderItem,
  itemWidth,
  gap,
  leadingPadding = 0,
  speed = 30,
  style,
}: {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  itemWidth: number;
  gap: number;
  leadingPadding?: number;
  speed?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oneSetWidth = items.length * (itemWidth + gap);
  const canLoop = !reducedMotion && items.length > 1 && oneSetWidth > 0;

  useEffect(() => {
    if (!canLoop) return;
    let raf: number;
    let lastTime = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (!pausedRef.current) {
        offsetRef.current += speed * dt;
        if (offsetRef.current >= oneSetWidth) offsetRef.current -= oneSetWidth;
        scrollRef.current?.scrollTo({ x: offsetRef.current, animated: false });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [canLoop, oneSetWidth, speed]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }

  function resumeAfterDelay() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 1500);
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onTouchStart={pause}
      onTouchEnd={resumeAfterDelay}
      onScrollBeginDrag={pause}
      onScrollEndDrag={resumeAfterDelay}
      style={style}
      contentContainerStyle={[styles.marqueeRow, { paddingLeft: leadingPadding, gap }]}
    >
      {items.map((item, index) => (
        <View key={`${keyExtractor(item, index)}-a`}>{renderItem(item, index)}</View>
      ))}
      {canLoop && items.map((item, index) => (
        <View key={`${keyExtractor(item, index)}-b`}>{renderItem(item, index)}</View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shineBand: { position: 'absolute', top: -40, bottom: -40 },
  shineGradient: { flex: 1 },
  marqueeRow: { flexDirection: 'row' },
});
