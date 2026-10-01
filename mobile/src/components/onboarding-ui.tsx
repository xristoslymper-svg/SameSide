import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand as OriginalBrand, styles as base } from './ui';
import { theme } from '../theme';

// Presentation for the entry/setup flow; the main app keeps its existing UI.
export { Screen, Notice, Loading } from './ui';
export function Brand({ centered = false }: { centered?: boolean }) {
  return <View style={styles.header}><OriginalBrand centered={centered}/><View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.headerArt}><Image source={require('../../assets/today-ivory-botanical-v2.png')} style={styles.art} resizeMode="contain"/></View></View>;
}
export function Botanical() {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.botanical}><Image source={require('../../assets/today-ivory-botanical-v2.png')} resizeMode="contain" style={styles.botanicalImage}/></View>;
}
export function Button({ label, onPress, busy = false, disabled = false, secondary = false }: {
  label: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} aria-disabled={disabled || busy} aria-busy={busy} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || busy) && styles.buttonDisabled, pressed && !disabled && !busy && styles.buttonPressed]}>
    {busy ? <ActivityIndicator color={secondary ? theme.colors.ink : theme.colors.white} accessibilityLabel="Please wait"/> : <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>}
  </Pressable>;
}
export const styles = StyleSheet.create({
  ...base,
  header: { minHeight: 88, justifyContent: 'center', position: 'relative', marginBottom: 8 },
  headerArt: { position: 'absolute', right: -12, top: -18, width: 100, height: 138 },
  art: { width: '100%', height: '100%' },
  title: { ...base.title, fontSize: 40, lineHeight: 46, letterSpacing: -1.3, color: '#203A2C' },
  card: { ...base.card, borderRadius: 26, borderColor: 'rgba(255,255,255,.8)', backgroundColor: '#FFFCF5', padding: 22, shadowColor: '#85745C', shadowOpacity: .075, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  cardTitle: { ...base.cardTitle, fontSize: 25, lineHeight: 32, letterSpacing: -.7 },
  input: { ...base.input, borderRadius: 18, borderColor: '#D7DACB', backgroundColor: '#F8F6EF', minHeight: 54 },
  button: { ...base.button, minHeight: 54, borderRadius: 999, backgroundColor: '#2E5541', borderWidth: 1, borderColor: '#476B52', shadowColor: '#34513D', shadowOpacity: .15, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  secondary: { ...base.secondary, backgroundColor: '#FFFCF5', borderColor: '#C7CDBB' },
  buttonText: { ...base.buttonText, fontSize: 15, lineHeight: 22, fontWeight: '500', letterSpacing: .1 },
  botanical: { height: 154, alignItems: 'center', justifyContent: 'center', marginTop: -12 },
  botanicalImage: { width: 138, height: 184, transform: [{ translateX: -24 }] },
});
