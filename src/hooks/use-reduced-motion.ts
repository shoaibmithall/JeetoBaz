import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// react-native-web maps this straight to the `prefers-reduced-motion` media
// query, so this one hook covers web and native without branching.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduced(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduced(enabled);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
