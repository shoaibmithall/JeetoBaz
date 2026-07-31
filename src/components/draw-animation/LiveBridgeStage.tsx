import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Dices, Radio } from 'lucide-react-native';
import type { DrawAnimationTheme } from './types';

type Props = {
  theme: DrawAnimationTheme;
  reducedMotion: boolean;
};

// Holding screen while the draw actually runs server-side. Deliberately has
// no progress bar or countdown — we have no real progress to report, and
// fabricating one would violate "animation never decides/anticipates the winner."
export function LiveBridgeStage({ theme, reducedMotion }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reducedMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: reducedMotion ? 1 : pulse.value }] }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={pulseStyle}>
        <Dices color={theme.gold} size={64} />
      </Animated.View>
      <View style={[styles.liveBadge, { backgroundColor: theme.dangerSoft }]}>
        <Radio color={theme.danger} size={14} />
        <Text style={[styles.liveText, { color: theme.danger }]}>LIVE</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Draw is live</Text>
      <Text style={[styles.note, { color: theme.muted }]}>Result will appear the moment it's ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  liveText: { fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold' },
  note: { fontSize: 13, textAlign: 'center' },
});
