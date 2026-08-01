import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RotateCcw, X } from 'lucide-react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { ParticipantRevealStage } from './ParticipantRevealStage';
import { WinnerRevealStage } from './WinnerRevealStage';
import type { DrawAnimationTheme, DrawRevealResult } from './types';

type Props = {
  theme: DrawAnimationTheme;
  result: DrawRevealResult;
  ticketNumbers: string[];
  productId: string;
  myTicket: string | null;
  onClose: () => void;
};

type ReplayPhase = 'intro' | 'participant' | 'winner';
const INTRO_HOLD_MS = 1600;

// Replays the already-recorded draw from stored draw_results + ticket
// numbers — no new draw ever runs here. Same seed as the live reveal, so
// the sequence is identical every time it's replayed.
export function DrawReplayOverlay({ theme, result, ticketNumbers, productId, myTicket, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<ReplayPhase>('intro');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('participant'), reducedMotion ? 500 : INTRO_HOLD_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close replay">
          <X color={theme.subtle} size={22} />
        </TouchableOpacity>

        <View style={[styles.banner, { backgroundColor: theme.infoSoft, borderColor: theme.info }]}>
          <RotateCcw color={theme.info} size={15} />
          <Text style={[styles.bannerText, { color: theme.info }]}>Replay of the recorded draw</Text>
        </View>

        {phase === 'intro' && (
          <View style={styles.introBody}>
            <ActivityIndicator size="large" color={theme.primary} accessibilityLabel="Loading replay" />
          </View>
        )}

        {phase === 'participant' && (
          <ParticipantRevealStage
            theme={theme}
            ticketNumbers={ticketNumbers}
            winnerTicketNumber={result.winner_ticket_number}
            seed={`${productId}:${result.winner_ticket_number}`}
            myTicket={myTicket}
            reducedMotion={reducedMotion}
            onDone={() => setPhase('winner')}
          />
        )}

        {phase === 'winner' && <WinnerRevealStage theme={theme} result={result} myTicket={myTicket} reducedMotion={reducedMotion} onDone={onClose} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 6 },
  banner: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 7, marginTop: 20, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  bannerText: { fontSize: 13, fontWeight: 'bold' },
  introBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
