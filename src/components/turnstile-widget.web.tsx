import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Failed to load Turnstile script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (message: string) => void;
  action?: string;
};

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError, action }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);
    const [errorMessage, setErrorMessage] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    }, [onError, onExpire, onVerify]);

    useImperativeHandle(ref, () => ({
      reset() {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      const reportError = (message: string) => {
        onExpireRef.current?.();
        setErrorMessage(message);
        onErrorRef.current?.(message);
      };

      setErrorMessage('');

      if (!SITE_KEY) {
        reportError('Verification is temporarily unavailable. Please try again later.');
        return;
      }

      let cancelled = false;

      loadTurnstileScript()
        .then(() => {
          if (cancelled) return;
          if (!containerRef.current || !window.turnstile) {
            reportError('Verification could not be loaded. Please try again.');
            return;
          }
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            ...(action ? { action } : {}),
            callback: (token: string) => {
              setErrorMessage('');
              onVerifyRef.current(token);
            },
            'expired-callback': () => onExpireRef.current?.(),
            'error-callback': () => {
              reportError('Verification failed to load. Please try again.');
            },
          });
        })
        .catch(() => {
          if (!cancelled) {
            reportError('Verification could not be loaded. Check your connection and try again.');
          }
        });

      return () => {
        cancelled = true;
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [action, retryCount]);

    if (errorMessage) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {SITE_KEY ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setErrorMessage('');
                setRetryCount((count) => count + 1);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry verification</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <div ref={containerRef} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  errorContainer: { alignItems: 'center', gap: 8, marginVertical: 12 },
  errorText: { color: '#ff4444', fontSize: 13, textAlign: 'center' },
  retryButton: { paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: '#18a663', fontSize: 13, fontWeight: '600' },
});
