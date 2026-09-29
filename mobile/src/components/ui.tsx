import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, compact = false, immersive = false }: PropsWithChildren<{ compact?: boolean; immersive?: boolean }> ) {
  if (immersive) return <SafeAreaView edges={[]} style={styles.safe}><View style={styles.immersivePage}>{children}</View></SafeAreaView>;
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
  immersivePage: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: theme.colors.background, overflow: 'hidden' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36 },
  scrollCompact: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 28 },
  page: { width: '100%', maxWidth: 390, gap: 20 },
  pageCompact: { maxWidth: 390, gap: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  mark: { flexDirection: 'row', alignItems: 'center' },
  ring: { width: 22, height: 22, borderRadius: 12, borderWidth: 1.1, borderColor: theme.colors.ink },
  wordmark: { color: theme.colors.ink, fontSize: 10.5, letterSpacing: 3, fontWeight: '600' },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.heading, fontSize: 36, lineHeight: 43, letterSpacing: -0.8 , fontWeight: '400'},
  body: { color: theme.colors.inkSoft, fontSize: 15, lineHeight: 24 },
  eyebrow: { color: theme.colors.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.7, textTransform: 'uppercase' , lineHeight: 15},
  card: { backgroundColor: theme.colors.card, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.card, padding: 21, gap: 16, ...theme.shadow.card , shadowOpacity: 0, elevation: 0},
  cardTitle: { color: theme.colors.ink, fontSize: 23, lineHeight: 30, fontFamily: theme.fonts.heading, letterSpacing: -0.5 , fontWeight: '400'},
  label: { color: theme.colors.ink, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  input: { backgroundColor: theme.colors.backgroundElevated, color: theme.colors.ink, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.input, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, minHeight: 52 },
  button: { minHeight: 52, borderRadius: theme.radius.button, backgroundColor: theme.colors.sage, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card , shadowOpacity: 0, elevation: 0},
  secondary: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.lineStrong, shadowOpacity: 0, elevation: 0 },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  buttonText: { color: theme.colors.white, fontSize: 14, fontWeight: '600', letterSpacing: 0 },
  secondaryText: { color: theme.colors.ink },
  noticeWrap: { backgroundColor: '#F7EAE6', borderRadius: theme.radius.small, paddingHorizontal: 14, paddingVertical: 12 },
  notice: { color: theme.colors.error, fontSize: 14, lineHeight: 20 },
  small: { color: theme.colors.muted, fontSize: 13, lineHeight: 20 },
  loading: { minHeight: 400, justifyContent: 'center', alignItems: 'center', gap: 20 },
  botanical: { height: 140, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.rose, opacity: 0.18 },
  stem: { position: 'absolute', width: 2.5, height: 89, bottom: 8, backgroundColor: theme.colors.sageMid, borderRadius: 2 },
  leaf: { position: 'absolute', width: 36, height: 16, left: '42%', bottom: 35, backgroundColor: theme.colors.sageMid, borderTopLeftRadius: 20, borderBottomRightRadius: 20, transform: [{ rotate: '-25deg' }] },
  flower: { position: 'absolute', width: 48, height: 48, top: 30, alignItems: 'center', justifyContent: 'center' },
  petal: { position: 'absolute', width: 27, height: 39, borderRadius: 20, backgroundColor: theme.colors.coral },
  flowerCenter: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.champagne },
});
