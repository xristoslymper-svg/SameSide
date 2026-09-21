import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, compact = false }: PropsWithChildren<{ compact?: boolean }> ) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={[styles.page, compact && styles.pageCompact]}>{children}</View></ScrollView></SafeAreaView>;
}
export function Brand({ centered = false }: { centered?: boolean }) {
  return <View style={[styles.brand, centered && { justifyContent: 'center' }]} accessibilityLabel="Same Side"><View style={styles.mark} accessible={false}><View style={styles.ring}/><View style={[styles.ring, { marginLeft: -8 }]}/></View><Text style={styles.wordmark}>SAME SIDE</Text></View>;
}
export function Button({ label, onPress, busy = false, disabled = false, secondary = false }: {
  label: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} aria-disabled={disabled || busy} aria-busy={busy} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || busy) && styles.buttonDisabled, pressed && !disabled && !busy && styles.buttonPressed]}>
    {busy ? <ActivityIndicator color={secondary ? theme.colors.ink : theme.colors.white} accessibilityLabel="Please wait"/> : <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>}
  </Pressable>;
}
export function Notice({ children }: PropsWithChildren) {
  return <View style={styles.noticeWrap}><Text accessibilityRole="alert" style={styles.notice}>{children}</Text></View>;
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
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 44 },
  scrollCompact: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 38 },
  page: { width: '100%', maxWidth: 430, gap: 24 },
  pageCompact: { maxWidth: 390, gap: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 44 },
  mark: { flexDirection: 'row', alignItems: 'center' },
  ring: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.35, borderColor: theme.colors.ink },
  wordmark: { color: theme.colors.ink, fontSize: 12, letterSpacing: 3.4, fontWeight: '700' },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.heading, fontSize: 43, lineHeight: 48, letterSpacing: -1.35 },
  body: { color: theme.colors.muted, fontSize: 16, lineHeight: 24.5 },
  eyebrow: { color: theme.colors.sageMid, fontSize: 10.5, fontWeight: '800', letterSpacing: 2.1, textTransform: 'uppercase' },
  card: { backgroundColor: theme.colors.card, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.card, padding: 22, gap: 15, ...theme.shadow.card },
  cardTitle: { color: theme.colors.ink, fontSize: 24, lineHeight: 29, fontFamily: theme.fonts.heading, letterSpacing: -0.3 },
  label: { color: theme.colors.ink, fontSize: 13.5, lineHeight: 18, fontWeight: '700' },
  input: { backgroundColor: theme.colors.card, color: theme.colors.ink, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.input, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, minHeight: 54 },
  button: { minHeight: 54, borderRadius: theme.radius.button, backgroundColor: theme.colors.sage, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  secondary: { backgroundColor: theme.colors.cardWarm, borderWidth: 1, borderColor: theme.colors.line, shadowOpacity: 0, elevation: 0 },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: '700', letterSpacing: -0.05 },
  secondaryText: { color: theme.colors.ink },
  noticeWrap: { backgroundColor: '#F9EDEA', borderRadius: theme.radius.small, paddingHorizontal: 14, paddingVertical: 12 },
  notice: { color: theme.colors.error, fontSize: 14, lineHeight: 20 },
  small: { color: theme.colors.muted, fontSize: 12.5, lineHeight: 18.5 },
  loading: { minHeight: 400, justifyContent: 'center', alignItems: 'center', gap: 20 },
  botanical: { height: 172, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.rose, opacity: 0.35 },
  stem: { position: 'absolute', width: 2.5, height: 89, bottom: 8, backgroundColor: theme.colors.sageMid, borderRadius: 2 },
  leaf: { position: 'absolute', width: 36, height: 16, left: '42%', bottom: 35, backgroundColor: theme.colors.sageMid, borderTopLeftRadius: 20, borderBottomRightRadius: 20, transform: [{ rotate: '-25deg' }] },
  flower: { position: 'absolute', width: 48, height: 48, top: 30, alignItems: 'center', justifyContent: 'center' },
  petal: { position: 'absolute', width: 27, height: 39, borderRadius: 20, backgroundColor: theme.colors.coral },
  flowerCenter: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#DDBE74' },
});
