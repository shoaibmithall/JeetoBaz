import { forwardRef } from 'react';

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (message: string) => void;
  action?: string;
};

// Cloudflare Turnstile only ships a web widget. Native builds render nothing
// and never call onVerify, so a captchaToken is simply omitted on native.
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget() {
    return null;
  }
);
