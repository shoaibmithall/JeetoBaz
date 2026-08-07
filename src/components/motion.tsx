import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
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

const styles = StyleSheet.create({
  shineBand: { position: 'absolute', top: -40, bottom: -40 },
  shineGradient: { flex: 1 },
});
