import { StyleSheet, Text, View } from 'react-native';
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
    <Text style={s.promise}>Habits that will last forever</Text>
    <View style={s.steps}>{steps.map(([title, body], i) => <View key={title} style={[styles.card,s.card]}><Text style={s.number}>{i + 1}</Text><View style={s.copy}><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.body,s.body]}>{body}</Text></View></View>)}</View>
    <Button label="Continue" disabled={busy} onPress={() => { void save({ step: 'auth' }); }}/>
    <Button label="Back" secondary disabled={busy} onPress={() => { void save({ step: 'opening' }); }}/>
  </FlowScreen>;
}
const s=StyleSheet.create({promise:{fontFamily:'Georgia',fontSize:19,lineHeight:25,color:'#667C6A',marginTop:-4,marginBottom:8},steps:{gap:11},card:{padding:17,flexDirection:'row',alignItems:'flex-start',gap:16},number:{fontFamily:'Georgia',fontSize:34,lineHeight:38,color:'#405448',fontWeight:'700',minWidth:32},copy:{flex:1,gap:5},body:{fontSize:14,lineHeight:20}});
