import type { AppThemes } from '@/constants/theme';

export type DrawAnimationTheme = (typeof AppThemes)[keyof typeof AppThemes];

// The subset of the public draw result the reveal stages need — same shape
// get_public_draw_result returns, trimmed to what's displayed mid-animation.
export type DrawRevealResult = {
  winner_name: string;
  masked_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
};
