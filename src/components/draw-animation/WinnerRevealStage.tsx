import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import type { DrawAnimationTheme, DrawRevealResult } from './types';

type Props = {
  theme: DrawAnimationTheme;
  result: DrawRevealResult;
  myTicket: string | null;
  reducedMotion: boolean;
  onDone: () => void;
};

const CONFETTI_COLORS = ['#FFD700', '#18a663', '#ff4444', '#4a9eff', '#ffffff'];
const CONFETTI_COUNT = 18;
const AUTO_ADVANCE_MS = 4000;

function ConfettiPiece({ index }: { index: number }) {
  const fall = useSharedValue(0);
  const left = useMemo(() => 4 + ((index * 37) % 92), [index]);
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const delay = (index % 6) * 120;

  useEffect(() => {
    fall.value = withDelay(delay, withTiming(1, { duration: 1800 + (index % 5) * 200, easing: Easing.in(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - fall.value * 0.6,
    transform: [{ translateY: fall.value * 260 }, { rotate: `${fall.value * 360 * (index % 2 === 0 ? 1 : -1)}deg` }],
  }));

  return <Animated.View style={[styles.confetti, { left: `${left}%`, backgroundColor: color }, style]} />;
}

export function WinnerRevealStage({ theme, result, myTicket, reducedMotion, onDone }: Props) {
  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardScale = useSharedValue(reducedMotion ? 1 : 0.85);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: reducedMotion ? 200 : 500 });
    cardScale.value = withTiming(1, { duration: reducedMotion ? 200 : 500, easing: Easing.out(Easing.back(1.4)) });

    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);

  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ scale: cardScale.value }] }));
  const isMyWin = !!myTicket && myTicket === result.winner_ticket_number;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!reducedMotion && Array.from({ length: CONFETTI_COUNT }).map((_, index) => <ConfettiPiece key={index} index={index} />)}

      <Animated.View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.gold }, cardStyle]}>
        <Trophy color={theme.gold} size={72} />
        <Text style={[styles.congrats, { color: theme.gold }]}>CONGRATULATIONS!</Text>
        <Text style={[styles.winnerName, { color: theme.text }]}>{result.winner_name}</Text>
        <Text style={[styles.winnerTicket, { color: theme.muted }]}>Ticket: {result.winner_ticket_number}</Text>
        {isMyWin ? <Text style={[styles.yourWin, { color: theme.danger }]}>🎉 This is YOUR winning ticket!</Text> : null}
      </Animated.View>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: theme.gold }]}
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel="Continue to result"
      >
        <Text style={[styles.continueText, { color: theme.buttonText }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24, overflow: 'hidden' },
  confetti: { position: 'absolute', top: 0, width: 8, height: 14, borderRadius: 2 },
  card: { alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 2, paddingVertical: 32, paddingHorizontal: 28, width: '100%', maxWidth: 360 },
  congrats: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  winnerName: { fontSize: 20, fontWeight: 'bold' },
  winnerTicket: { fontSize: 14, fontFamily: 'monospace' },
  yourWin: { fontSize: 14, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  continueButton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  continueText: { fontSize: 15, fontWeight: 'bold' },
});
