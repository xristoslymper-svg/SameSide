import { Text } from 'react-native';
import { Button, styles } from '../src/components/ui';
import { Choice, FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';

export default function StartingModeScreen() {
  const { progress, save, busy } = useOnboarding();
  return <FlowScreen><Text style={styles.eyebrow}>Your first step</Text><Text style={styles.title}>How would you{"\n"}like to begin?</Text>
    <Text style={styles.body}>You can begin today, at your own pace.</Text>
    <Choice title="Start together" description="Begin as a pair. You’ll each get your own private actions from the start." selected={progress.intent === 'together'} disabled={busy} onPress={() => { void save({ intent: 'together' }); }}/>
    <Choice title="Start on my own" description="Make the first move. Your partner can join when they’re ready." selected={progress.intent === 'solo'} disabled={busy} onPress={() => { void save({ intent: 'solo' }); }}/>
    <Button label="Continue" disabled={busy || !progress.intent} onPress={() => { void save({ step: 'auth' }); }}/>
    <Button label="Back" secondary disabled={busy} onPress={() => { void save({ step: 'how' }); }}/>
  </FlowScreen>;
}
