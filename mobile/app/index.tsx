import { DemoEntry } from '../src/components/DemoControls';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Button, styles } from '../src/components/ui';
import { OpeningMedia } from '../src/components/OpeningMedia';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';

export default function OpeningScreen() {
  const { save, busy } = useOnboarding();
  const { width } = useWindowDimensions();
  const heroSize = Math.min(34, (width - 56) / 9.7);
  return <FlowScreen><OpeningMedia/>
    <View style={{ gap: 12, marginTop: -12, paddingHorizontal: 4 }}><Text style={[styles.title, { fontSize: heroSize, lineHeight: heroSize * 1.08 }]}>A pattern breaks{"\n"}A garden flourishes</Text>
      <Text style={styles.body}>Daily gestures of care, gratitude and attention that bring you closer again</Text></View>
    <Button label="Start together" disabled={busy} onPress={() => { void save({ intent: 'together', step: 'how' }); }}/>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ intent: 'solo', step: 'how' }); }} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={styles.body}>Start on my own</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ step: 'auth' }); }} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={styles.small}>Already have an account? Sign in</Text></Pressable>
    <DemoEntry/>
  </FlowScreen>;
}
