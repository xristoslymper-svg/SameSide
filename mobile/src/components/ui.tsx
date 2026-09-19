import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, compact = false }: PropsWithChildren<{ compact?: boolean }> ) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={[styles.scroll, compact && { paddingHorizontal: 22, paddingVertical: 24 }]} keyboardShouldPersistTaps="handled"><View style={[styles.page, compact && { maxWidth: 386, gap: 0 }]}>{children}</View></ScrollView></SafeAreaView>;
}
export function Brand() {
  return <View style={styles.brand} accessibilityLabel="Same Side"><View style={styles.mark} accessible={false}><View style={styles.ring}/><View style={[styles.ring, { marginLeft: -9 }]}/></View><Text style={styles.wordmark}>SAME SIDE</Text></View>;
}
export function Button({ label, onPress, busy = false, disabled = false, secondary = false }: {
  label: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} aria-disabled={disabled || busy} aria-busy={busy} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || busy) && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}>
    {busy ? <ActivityIndicator color={secondary ? theme.colors.ink : theme.colors.white} accessibilityLabel="Please wait"/> : <Text style={[styles.buttonText, secondary && { color: theme.colors.ink }]}>{label}</Text>}
  </Pressable>;
}
export function Notice({ children }: PropsWithChildren) {
  return <Text accessibilityRole="alert" style={styles.notice}>{children}</Text>;
}
export function Loading() {
  return <Screen><Brand/><View style={styles.loading}><ActivityIndicator color={theme.colors.sage} size="large"/><Text style={styles.body}>A moment for you.</Text></View></Screen>;
}
export function Botanical() {
  return <View style={styles.botanical} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={styles.halo}/><View style={styles.stem}/><View style={styles.leaf}/><View style={[styles.leaf, { left: '49%', bottom: 47, transform: [{ rotate: '25deg' }] }]}/>
    <View style={styles.flower}>{[0,72,144,216,288].map(degrees => <View key={degrees} style={[styles.petal, { transform: [{ rotate: `${degrees}deg` }, { translateY: -16 }] }]}/>)}<View style={styles.flowerCenter}/></View>
  </View>;
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  page: { width: '100%', maxWidth: 440, gap: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, mark: { flexDirection: 'row' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: theme.colors.ink },
  wordmark: { color: theme.colors.ink, fontSize: 12, letterSpacing: 3, fontWeight: '700' },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.heading, fontSize: 44, lineHeight: 49, letterSpacing: -1.6 },
  body: { color: theme.colors.muted, fontSize: 16, lineHeight: 25 },
  eyebrow: { color: theme.colors.sage, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  card: { backgroundColor: theme.colors.card, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.card, padding: 24, gap: 17 },
  cardTitle: { color: theme.colors.ink, fontSize: 24, fontFamily: theme.fonts.heading },
  label: { color: theme.colors.ink, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: theme.colors.background, color: theme.colors.ink, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.input, padding: 16, fontSize: 16, minHeight: 54 },
  button: { minHeight: 54, borderRadius: theme.radius.button, backgroundColor: theme.colors.sage, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.line },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: '600' },
  notice: { color: theme.colors.error, fontSize: 14, lineHeight: 21 },
  small: { color: theme.colors.muted, fontSize: 12, lineHeight: 19 },
  loading: { minHeight: 400, justifyContent: 'center', alignItems: 'center', gap: 20 },
  botanical: { height: 172, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.rose, opacity: 0.45 },
  stem: { position: 'absolute', width: 3, height: 89, bottom: 8, backgroundColor: theme.colors.sage, borderRadius: 2 },
  leaf: { position: 'absolute', width: 36, height: 16, left: '42%', bottom: 35, backgroundColor: theme.colors.sage, borderTopLeftRadius: 20, borderBottomRightRadius: 20, transform: [{ rotate: '-25deg' }] },
  flower: { position: 'absolute', width: 48, height: 48, top: 30, alignItems: 'center', justifyContent: 'center' },
  petal: { position: 'absolute', width: 27, height: 39, borderRadius: 20, backgroundColor: theme.colors.coral },
  flowerCenter: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E8C46A' },
});
