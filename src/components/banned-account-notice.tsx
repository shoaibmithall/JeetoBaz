import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

// AuthProvider already force-signs-out a banned user; this just surfaces why, once per ban, so
// the sign-out doesn't look like an unexplained bug.
export function BannedAccountNotice() {
  const { isBanned, banReason } = useAuth();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isBanned) {
      shownRef.current = false;
      return;
    }
    if (shownRef.current) return;
    shownRef.current = true;

    const message = banReason
      ? `Your JeetoBaz account has been suspended. Reason: ${banReason}. Contact support if you believe this is a mistake.`
      : 'Your JeetoBaz account has been suspended. Contact support if you believe this is a mistake.';

    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Account Suspended', message);
    }
  }, [isBanned, banReason]);

  return null;
}
