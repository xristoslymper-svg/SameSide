import { Text, View } from 'react-native';
import { Button, styles } from '../src/components/ui';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';

const steps = [
  ['One action per day', 'Small habits that shift your relationship, day by day'],
  ['Private actions', "When you’re together, each person gets something of their own. Neither sees the other’s move."],
  ['Let it bloom', 'Choose a flower and grow it together. When it blooms here, we’ll plant one for real in the Same Side Garden.'],
];
export default function HowItWorksScreen() {
  const { save, busy } = useOnboarding();
  return <FlowScreen><Text style={styles.eyebrow}>Different moves. Same side.</Text>
    <Text style={styles.title}>Small gestures{"\n"}Real connection</Text>
    {steps.map(([title, body], i) => <View key={title} style={styles.card}><Text style={styles.eyebrow}>{'0' + (i + 1)}</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{body}</Text></View>)}
    <Button label="Continue" disabled={busy} onPress={() => { void save({ step: 'mode' }); }}/>
    <Button label="Back" secondary disabled={busy} onPress={() => { void save({ step: 'opening' }); }}/>
  </FlowScreen>;
}
