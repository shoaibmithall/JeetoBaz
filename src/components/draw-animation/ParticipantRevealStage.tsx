import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SkipForward, Ticket } from 'lucide-react-native';
import { deterministicShuffle, sampleStepIndices, stepDelayMs } from '@/lib/deterministic-shuffle';
import type { DrawAnimationTheme } from './types';

type Props = {
  theme: DrawAnimationTheme;
  ticketNumbers: string[];
  winnerTicketNumber: string;
  seed: string;
  myTicket: string | null;
  reducedMotion: boolean;
  onDone: () => void;
};

const MAX_STEPS = 50;

// Walks the deterministically-shuffled ticket list from its start up to the
// winner's position, decelerating as it approaches. The sequence itself —
// which tickets appear and in what order — is 100% a function of `seed`,
// so it is identical on every refresh and every replay.
export function ParticipantRevealStage({ theme, ticketNumbers, winnerTicketNumber, seed, myTicket, reducedMotion, onDone }: Props) {
  const shuffled = useMemo(() => deterministicShuffle(ticketNumbers, seed), [ticketNumbers, seed]);
  const winnerIndex = useMemo(() => {
    const index = shuffled.indexOf(winnerTicketNumber);
    return index === -1 ? Math.max(0, shuffled.length - 1) : index;
  }, [shuffled, winnerTicketNumber]);
  const steps = useMemo(() => sampleStepIndices(winnerIndex, MAX_STEPS), [winnerIndex]);

  const [stepPos, setStepPos] = useState(0);
  const [settled, setSettled] = useState(false);
  const finishedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useSharedValue(1);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  }

  useEffect(() => {
    finishedRef.current = false;

    if (reducedMotion) {
      setStepPos(steps.length - 1);
      setSettled(true);
      timeoutRef.current = setTimeout(finish, 700);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    function advance(pos: number) {
      if (finishedRef.current) return;
      setStepPos(pos);
      if (pos >= steps.length - 1) {
        setSettled(true);
        pulse.value = withSequence(withTiming(1.25, { duration: 220 }), withTiming(1, { duration: 180 }));
        timeoutRef.current = setTimeout(finish, 900);
        return;
      }
      timeoutRef.current = setTimeout(() => advance(pos + 1), stepDelayMs(pos, steps.length));
    }

    advance(0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pulse` and `finish` are stable across the stage's lifetime
  }, [reducedMotion, steps]);

  function handleSkip() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    finish();
  }

  const currentTicket = shuffled[steps[stepPos]] ?? winnerTicketNumber;
  const isMine = currentTicket === myTicket;

  const displayStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.skipButton, { borderColor: theme.border }]}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip to winner reveal"
      >
        <SkipForward color={theme.subtle} size={16} />
        <Text style={[styles.skipText, { color: theme.subtle }]}>Skip</Text>
      </TouchableOpacity>

      <Ticket color={theme.gold} size={40} />
      <Text style={[styles.title, { color: theme.text }]}>Revealing Tickets…</Text>

      <Animated.View style={[styles.display, { backgroundColor: theme.surface, borderColor: settled ? theme.gold : theme.border }, displayStyle]}>
        <Text style={[styles.displayText, { color: isMine ? theme.danger : theme.text }]}>{currentTicket}</Text>
        {isMine && <Text style={[styles.mineTag, { color: theme.danger }]}>YOUR TICKET</Text>}
      </Animated.View>

      <Text style={[styles.progress, { color: theme.muted }]}>{stepPos + 1} of {steps.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 },
  skipButton: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold' },
  display: { minWidth: 220, borderRadius: 18, borderWidth: 2, paddingVertical: 28, paddingHorizontal: 32, alignItems: 'center', gap: 6 },
  displayText: { fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace' },
  mineTag: { fontSize: 11, fontWeight: 'bold' },
  progress: { fontSize: 13 },
});
