import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SetupExit } from '../src/components/SetupExit';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';

const paths = [
  ['routine', '🌿', 'The Routine', 'Bring back attention, warmth and spontaneity when everyday life starts running on autopilot.', 'Included', true],
  ['same-fight', '💬', 'The Same Fight', 'Shift the pattern behind arguments that keep repeating.', '€14.99', false],
  ['distance', '↔', 'The Distance', 'Find your way back to feeling close and connected.', '€14.99', false],
  ['spark', '✨', 'The Spark', 'Bring more affection, playfulness and intimacy into everyday life.', '€14.99', false],
  ['communication-gap', '👂', 'The Communication Gap', 'Make more room to listen, understand and feel heard.', '€14.99', false],
  ['imbalance', '⚖', 'The Imbalance', 'Reset the everyday effort that can start to feel one-sided.', '€14.99', false],
  ['trust-gap', '🤝', 'The Trust Gap', 'Build consistency, openness and reassurance through small actions.', '€14.99', false],
  ['next-chapter', '🧭', 'The Next Chapter', 'Reconnect around what you want to build and experience together.', '€14.99', false],
] as const;

export default function ChoosePathScreen() {
  const { save, busy } = useOnboarding();

  return (
    <FlowScreen>
      <Text style={s.eyebrow}>CHOOSE YOUR PATH</Text>
      <Text style={s.title}>What would you like{'\n'}to shift?</Text>
      <Text style={s.intro}>Choose the place you'd like to start. You can explore another path later.</Text>

      <View style={s.list}>
        {paths.map(([id, icon, title, description, price, available]) => {
          const inside = <>
            <View style={s.top}>
              <View style={s.nameRow}><Text style={s.icon}>{icon}</Text><Text style={s.pathTitle}>{title}</Text></View>
              <View style={[s.price, available && s.included]}>
                <Text style={[s.priceText, available && s.includedText]}>{available ? 'INCLUDED' : `🔒  ${price}`}</Text>
              </View>
            </View>
            <Text style={s.description}>{description}</Text>
            <View style={s.metaRow}>
              <Text style={s.meta}>4-week path</Text>
              <Text style={[s.action, !available && s.lockedAction]}>{available ? 'Start here  →' : 'Coming soon'}</Text>
            </View>
          </>;

          return available ? (
            <Pressable key={id} disabled={busy}
              onPress={() => void save({ path: 'routine', step: 'personalize' })}
              style={({ pressed }) => [s.card, s.availableCard, pressed && s.pressed]}>
              {inside}
            </Pressable>
          ) : <View key={id} style={[s.card, s.lockedCard]}>{inside}</View>;
        })}
      </View>

      <View style={s.quiz}>
        <Text style={s.quizTitle}>Not sure where to start?</Text>
        <Text style={s.quizBody}>Take a quick 10-question check-in and we'll suggest a path to begin with.</Text>
        <View style={s.quizButton}><Text style={s.quizButtonText}>Take the questionnaire →</Text></View>
        <Text style={s.soon}>Coming soon</Text>
      </View>

      <SetupExit />
    </FlowScreen>
  );
}

const s = StyleSheet.create({
  eyebrow:{color:'#667C6A',fontSize:13,fontWeight:'700',letterSpacing:3,marginBottom:14},
  title:{color:'#344B3D',fontFamily:'Georgia',fontSize:42,lineHeight:47,marginBottom:14},
  intro:{color:'#817A72',fontSize:17,lineHeight:25,maxWidth:520,marginBottom:28},
  list:{gap:14},
  card:{borderRadius:24,borderWidth:1,paddingHorizontal:20,paddingVertical:19},
  availableCard:{backgroundColor:'#F1F5EE',borderColor:'#A8B8A7'},
  lockedCard:{backgroundColor:'#FFFCF7',borderColor:'#E4DDD2'},
  pressed:{opacity:.82,transform:[{scale:.995}]},
  top:{alignItems:'flex-start',flexDirection:'row',justifyContent:'space-between',gap:12},
  nameRow:{alignItems:'center',flexDirection:'row',flex:1,gap:10},
  icon:{fontSize:20},
  pathTitle:{color:'#344B3D',flexShrink:1,fontFamily:'Georgia',fontSize:23,lineHeight:29},
  price:{backgroundColor:'#F3EEE7',borderRadius:999,paddingHorizontal:11,paddingVertical:7},
  included:{backgroundColor:'#DDE9DA'},
  priceText:{color:'#746E67',fontSize:11,fontWeight:'700',letterSpacing:.5},
  includedText:{color:'#536D58',letterSpacing:1},
  description:{color:'#777169',fontSize:15,lineHeight:22,marginTop:13,maxWidth:560},
  metaRow:{alignItems:'center',flexDirection:'row',justifyContent:'space-between',marginTop:17},
  meta:{color:'#9A938A',fontSize:12,fontWeight:'600',letterSpacing:.5,textTransform:'uppercase'},
  action:{color:'#58705D',fontSize:14,fontWeight:'700'},
  lockedAction:{color:'#A39C94',fontWeight:'600'},
  quiz:{alignItems:'center',backgroundColor:'#F5EFE8',borderRadius:24,marginTop:28,paddingHorizontal:22,paddingVertical:26},
  quizTitle:{color:'#344B3D',fontFamily:'Georgia',fontSize:23,textAlign:'center'},
  quizBody:{color:'#7E776F',fontSize:15,lineHeight:22,marginTop:9,maxWidth:430,textAlign:'center'},
  quizButton:{borderColor:'#B9B0A5',borderRadius:999,borderWidth:1,marginTop:18,paddingHorizontal:20,paddingVertical:12},
  quizButtonText:{color:'#596C5D',fontSize:14,fontWeight:'700'},
  soon:{color:'#A09991',fontSize:11,letterSpacing:1,marginTop:8,textTransform:'uppercase'},
});
