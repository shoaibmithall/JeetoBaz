import { StyleSheet, View } from 'react-native';
import { Crown, Gift, Sparkles, Star } from 'lucide-react-native';
import { FloatingView } from '@/components/motion';

/**
 * Ambient brand decoration for the login/signup header and card. Contained
 * (not page-wide) because both surfaces are opaque and nearly full-width, so
 * anything placed outside them would be invisible. Purely decorative --
 * absolutely positioned, non-interactive, and reuses FloatingView so it
 * respects reduced-motion automatically.
 */
export function AuthHeaderGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.headerGlow, styles.headerGlowGold]} />
      <View style={[styles.headerGlow, styles.headerGlowGreen]} />
      <FloatingView style={styles.headerIconLeft}>
        <Star color="#FFD700" size={20} strokeWidth={1.5} />
      </FloatingView>
      <FloatingView style={styles.headerIconRight}>
        <Sparkles color="#FFD700" size={22} strokeWidth={1.5} />
      </FloatingView>
    </View>
  );
}

export function AuthCardGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.cardGlow, styles.cardGlowGold]} />
      <View style={[styles.cardGlow, styles.cardGlowGreen]} />
      <FloatingView style={styles.cardIconTopRight}>
        <Crown color="#FFD700" size={26} strokeWidth={1.5} />
      </FloatingView>
      <FloatingView style={styles.cardIconBottomLeft}>
        <Gift color="#18a663" size={22} strokeWidth={1.5} />
      </FloatingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGlow: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  headerGlowGold: { width: 220, height: 220, backgroundColor: '#FFD700', top: -140, left: '50%', marginLeft: -110 },
  headerGlowGreen: { width: 180, height: 180, backgroundColor: '#18a663', bottom: -120, right: -60 },
  headerIconLeft: { position: 'absolute', top: 18, left: 16, opacity: 0.22 },
  headerIconRight: { position: 'absolute', top: 24, right: 18, opacity: 0.22 },

  cardGlow: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  cardGlowGold: { width: 200, height: 200, backgroundColor: '#FFD700', top: -90, right: -80 },
  cardGlowGreen: { width: 160, height: 160, backgroundColor: '#18a663', bottom: -80, left: -70 },
  cardIconTopRight: { position: 'absolute', top: 14, right: 16, opacity: 0.18 },
  cardIconBottomLeft: { position: 'absolute', bottom: 14, left: 16, opacity: 0.16 },
});
