import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import type { DrawAnimationTheme } from './types';

const CHECKLIST = ['Entries Locked', 'Integrity Verified', 'Preparing Draw'];
const STAGGER_MS = 550;

function ChecklistItem({
  label,
  theme,
  delayMs,
  reducedMotion,
}: {
  label: string;
  theme: DrawAnimationTheme;
  delayMs: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const scale = useSharedValue(reducedMotion ? 1 : 0.7);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 300 }));
    scale.value = withDelay(delayMs, withSequence(withTiming(1.15, { duration: 200 }), withTiming(1, { duration: 150 })));
  }, [reducedMotion, delayMs, opacity, scale]);

  const rowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.row, rowStyle]}>
      <Animated.View style={iconStyle}>
        <CheckCircle2 color={theme.primary} size={22} />
      </Animated.View>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
    </Animated.View>
  );
}

type Props = {
  theme: DrawAnimationTheme;
  reducedMotion: boolean;
};

export function VerificationStage({ theme, reducedMotion }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ShieldCheck color={theme.primary} size={56} />
      <Text style={[styles.title, { color: theme.text }]}>Verifying Draw Integrity</Text>
      <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {CHECKLIST.map((label, index) => (
          <ChecklistItem key={label} label={label} theme={theme} delayMs={index * STAGGER_MS} reducedMotion={reducedMotion} />
        ))}
      </View>
      <Text style={[styles.note, { color: theme.muted }]}>The draw will begin shortly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
  list: { width: '100%', maxWidth: 360, borderRadius: 15, borderWidth: 1, padding: 20, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 13 },
});
