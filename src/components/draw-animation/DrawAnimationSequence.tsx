import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { DrawSessionState, Product } from '@/types/database';
import { EntriesLockedStage } from './EntriesLockedStage';
import { VerificationStage } from './VerificationStage';
import { LiveBridgeStage } from './LiveBridgeStage';
import { ParticipantRevealStage } from './ParticipantRevealStage';
import { WinnerRevealStage } from './WinnerRevealStage';
import type { DrawAnimationTheme, DrawRevealResult } from './types';

export const RESULT_STATES: DrawSessionState[] = ['winner_selected', 'result_published', 'completed'];

type Props = {
  theme: DrawAnimationTheme;
  product: Product;
  sessionState: DrawSessionState;
  myTicket: string | null;
  onRevealComplete: () => void;
};

type PreStage = 'locked' | 'verifying' | 'bridge';
type RevealPhase = 'participant' | 'winner';

// Full-screen cinematic sequence for the Draw Lobby. Pre-result stages
// (locked/verifying/bridge) mirror the real draw_sessions.state — they hold
// until the backend actually moves forward. The reveal stages only start
// once a public draw result exists, so they never anticipate a winner.
export function DrawAnimationSequence({ theme, product, sessionState, myTicket, onRevealComplete }: Props) {
  const reducedMotion = useReducedMotion();
  const [result, setResult] = useState<DrawRevealResult | null>(null);
  const [ticketNumbers, setTicketNumbers] = useState<string[] | null>(null);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('participant');
  const revealStartedRef = useRef(false);

  const isResultState = RESULT_STATES.includes(sessionState);

  useEffect(() => {
    if (!isResultState || revealStartedRef.current) return;
    revealStartedRef.current = true;

    (async () => {
      const [{ data: resultData }, { data: ticketData }] = await Promise.all([
        supabase.rpc('get_public_draw_result', { requested_product_id: product.id }),
        supabase.rpc('get_draw_ticket_numbers', { p_product_id: product.id }),
      ]);

      if (!resultData?.[0]) {
        // Rare race between the state flip and the result row being readable — the
        // result page itself will retry the fetch, so just hand off to it.
        onRevealComplete();
        return;
      }

      setResult(resultData[0]);
      setTicketNumbers((ticketData || []).map((row) => row.ticket_number));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onRevealComplete/product.id are stable for this mount
  }, [isResultState, product.id]);

  const preStage: PreStage | null = useMemo(() => {
    if (isResultState) return null;
    if (sessionState === 'running') return 'bridge';
    if (sessionState === 'verifying' || sessionState === 'ready') return 'verifying';
    if (sessionState === 'locked') return 'locked';
    return null;
  }, [sessionState, isResultState]);

  if (preStage === 'locked') {
    return <EntriesLockedStage theme={theme} totalTickets={product.current_entries || 0} reducedMotion={reducedMotion} />;
  }
  if (preStage === 'verifying') {
    return <VerificationStage theme={theme} reducedMotion={reducedMotion} />;
  }
  if (preStage === 'bridge') {
    return <LiveBridgeStage theme={theme} reducedMotion={reducedMotion} />;
  }

  if (isResultState) {
    if (!result || !ticketNumbers) {
      return (
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} accessibilityLabel="Loading" />
        </View>
      );
    }

    if (revealPhase === 'participant') {
      return (
        <ParticipantRevealStage
          theme={theme}
          ticketNumbers={ticketNumbers}
          winnerTicketNumber={result.winner_ticket_number}
          seed={`${product.id}:${result.winner_ticket_number}`}
          myTicket={myTicket}
          reducedMotion={reducedMotion}
          onDone={() => setRevealPhase('winner')}
        />
      );
    }

    return <WinnerRevealStage theme={theme} result={result} myTicket={myTicket} reducedMotion={reducedMotion} onDone={onRevealComplete} />;
  }

  return null;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
