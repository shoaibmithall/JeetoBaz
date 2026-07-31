import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LockKeyhole } from 'lucide-react-native';
import type { DrawAnimationTheme } from './types';

type Props = {
  theme: DrawAnimationTheme;
  totalTickets: number;
  reducedMotion: boolean;
};

export function EntriesLockedStage({ theme, totalTickets, reducedMotion }: Props) {
  const leftDoor = useSharedValue(reducedMotion ? 0 : -1);
  const rightDoor = useSharedValue(reducedMotion ? 0 : 1);
  const lockOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const textOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const doorTiming = { duration: 900, easing: Easing.out(Easing.cubic) };
    leftDoor.value = withTiming(0, doorTiming);
    rightDoor.value = withTiming(0, doorTiming);
    lockOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    textOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));
  }, [reducedMotion, leftDoor, rightDoor, lockOpacity, textOpacity]);

  const leftDoorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${leftDoor.value * 100}%` }],
  }));
  const rightDoorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${rightDoor.value * 100}%` }],
  }));
  const lockStyle = useAnimatedStyle(() => ({ opacity: lockOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.doorTrack}>
        <Animated.View style={[styles.door, styles.doorLeft, { backgroundColor: theme.surface, borderColor: theme.border }, leftDoorStyle]} />
        <Animated.View style={[styles.door, styles.doorRight, { backgroundColor: theme.surface, borderColor: theme.border }, rightDoorStyle]} />
      </View>
      <Animated.View style={lockStyle}>
        <LockKeyhole color={theme.gold} size={64} />
      </Animated.View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.title, { color: theme.text }]}>Entries Frozen</Text>
        <Text style={[styles.subtitle, { color: theme.subtle }]}>Total: {totalTickets.toLocaleString()} tickets</Text>
        <Text style={[styles.note, { color: theme.muted }]}>No further entries can be added to this draw.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  doorTrack: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  door: { flex: 1, borderWidth: 1 },
  doorLeft: { borderRightWidth: 2, borderRightColor: '#FFD700' },
  doorRight: { borderLeftWidth: 2, borderLeftColor: '#FFD700' },
  textBlock: { alignItems: 'center', gap: 6 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, textAlign: 'center' },
});
