import { StyleSheet, Text, View } from 'react-native';
import { Button, styles } from '../src/components/ui';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';

const steps = [
  ['Start with what feels off', 'Choose the pattern that’s been getting in the way lately. Routine, distance, the same argument, or something else. You’re not against each other. You’re on the same side against the pattern.'],
  ['Build your way out of it', 'You each get a small private move every day, aimed at the other person. Over time, those moments help you build new habits and break out of the cycle you keep falling into.'],
  ['Grow something together', 'Your digital flower grows as the journey unfolds. When it blooms, your path is complete and a real flower is planted in the Same Side Garden alongside flowers from other couples who took the same journey.'],
];
export default function HowItWorksScreen() {
  const { save, busy } = useOnboarding();
  return <FlowScreen><Text style={styles.eyebrow}>Different moves. Same side.</Text>
    <Text style={[styles.title,s.title]}>Small gestures{"\n"}Real connection</Text>
    <Text style={s.promise}>Habits that will last forever</Text>
    <View style={s.steps}>{steps.map(([title, body], i) => <View key={title} style={[styles.card,s.card]}><Text style={s.number}>{i + 1}</Text><View style={s.copy}><Text style={[styles.cardTitle,s.cardTitle]}>{title}</Text><Text style={[styles.body,s.body]}>{body}</Text></View></View>)}</View>
    <Button label="Continue" disabled={busy} onPress={() => { void save({ step: 'auth' }); }}/>
    <Button label="Back" secondary disabled={busy} onPress={() => { void save({ step: 'opening' }); }}/>
  </FlowScreen>;
}
const s=StyleSheet.create({title:{fontSize:39,lineHeight:44,letterSpacing:-1.2},promise:{fontFamily:'Georgia',fontSize:18,lineHeight:24,color:'#667C6A',marginTop:-4,marginBottom:6},steps:{gap:10},card:{padding:16,flexDirection:'row',alignItems:'flex-start',gap:14},number:{fontFamily:'Georgia',fontSize:31,lineHeight:35,color:'#405448',fontWeight:'700',minWidth:30},copy:{flex:1,gap:4},cardTitle:{fontSize:21,lineHeight:26},body:{fontSize:14,lineHeight:20}});
