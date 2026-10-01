import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Button, styles } from '../src/components/onboarding-ui';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { useAuth } from '../src/providers/AuthProvider';
import { theme } from '../src/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const mechanics = [
  ['01', 'Choose your path', 'Start with the journey that best matches what you want to change or strengthen in your relationship.'],
  ['02', 'Make it personal', 'A few questions help Same Side understand what each of you needs, so your experience and daily actions can be shaped around you.'],
  ['03', 'Get a small action each day', 'You each receive your own private, CBT (Cognitive Behavioral Therapy) informed daily Move. Something small and practical to try in real life.'],
  ['04', 'Move through it together', 'Your Moves may be different, but you progress through the same journey as a couple, one day at a time.'],
];

function ExpandCard({title,summary,button,open,onToggle,children}:{title:string;summary:string;button:string;open:boolean;onToggle:()=>void;children:React.ReactNode}) {
  return <View style={[styles.card,s.card,open&&s.cardOpen]}>
    <Text style={s.cardTitle}>{title}</Text>
    <Text style={s.cardSummary}>{summary}</Text>
    {open&&<View style={s.expanded}>{children}</View>}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={onToggle} style={({pressed})=>[s.readMore,pressed&&s.readMorePressed]}>
      <Text style={s.readMoreText}>{open?'Show less':button}</Text>
      <Text style={[s.arrow,open&&s.arrowOpen]}>↓</Text>
    </Pressable>
  </View>;
}

export default function HowItWorksScreen() {
  const { session } = useAuth();
  const { save, busy, destination } = useOnboarding();
  const [open,setOpen]=useState<'about'|'how'|null>(null);
  if (session) return <Redirect href={destination}/>;

  function toggle(section:'about'|'how') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(value=>value===section?null:section);
  }

  return <FlowScreen>
    <Text style={styles.eyebrow}>ONE ROUTINE. TWO PEOPLE.</Text>
    <Text style={[styles.title,s.title]}>Small gestures{"\n"}Real connection</Text>
    <Text style={s.promise}>Changes worth keeping</Text>

    <View style={s.cards}>
      <ExpandCard
        title="What is Same Side?"
        summary="Together against the problem, not against each other."
        button="What we believe"
        open={open==='about'}
        onToggle={()=>toggle('about')}>
        <Text style={s.aboutBody}>Same Side is built on a simple belief: you and your partner are on the same team, even when you’re stuck in patterns that make it feel otherwise.</Text>
        <Text style={s.aboutBody}>Through small, CBT (Cognitive Behavioral Therapy) informed daily actions, Same Side helps you interrupt those patterns, respond differently, and gradually bring back the sense of being two people working together, not against each other.</Text>
      </ExpandCard>

      <ExpandCard
        title="How does Same Side work?"
        summary="A shared journey, personalized for the two of you."
        button="See how it works"
        open={open==='how'}
        onToggle={()=>toggle('how')}>
        <Text style={s.howIntro}>Same Side guides you through relationship journeys focused on different patterns or areas you want to work on together.</Text>
        <View style={s.mechanics}>
          {mechanics.map(([number,title,body])=><View key={number} style={s.mechanic}>
            <Text style={s.number}>{number}</Text>
            <View style={s.mechanicCopy}><Text style={s.mechanicTitle}>{title}</Text><Text style={s.mechanicBody}>{body}</Text></View>
          </View>)}
        </View>
      </ExpandCard>
    </View>

    <View style={s.actions}>
      <Button label="Continue" disabled={busy} onPress={() => { void save({ step: 'auth' }); }}/>
      <Button label="Back" secondary disabled={busy} onPress={() => { void save({ step: 'opening' }); }}/>
    </View>
  </FlowScreen>;
}

const s=StyleSheet.create({
  title:{fontSize:40,lineHeight:46,letterSpacing:-1.3},
  promise:{fontFamily:theme.fonts.heading,fontSize:18,lineHeight:26,color:theme.colors.sageMid,marginTop:-4,marginBottom:8},
  cards:{gap:18,marginTop:2},
  card:{paddingHorizontal:21,paddingTop:22,paddingBottom:14,borderRadius:26,backgroundColor:'#FFFCF5',borderColor:'rgba(255,255,255,.8)',shadowOpacity:.075,elevation:2},
  cardOpen:{backgroundColor:theme.colors.card},
  cardTitle:{fontFamily:theme.fonts.heading,fontSize:25,lineHeight:32,color:theme.colors.ink,fontWeight:'400',letterSpacing:-0.25},
  cardSummary:{fontSize:14.5,lineHeight:23,color:theme.colors.inkSoft,marginTop:7,maxWidth:330},
  expanded:{marginTop:20,paddingTop:18,borderTopWidth:1,borderTopColor:theme.colors.line,gap:12},
  aboutBody:{fontSize:14,lineHeight:23,color:theme.colors.inkSoft},
  howIntro:{fontSize:14,lineHeight:23,color:theme.colors.inkSoft,marginBottom:2},
  mechanics:{gap:0},
  mechanic:{flexDirection:'row',gap:14,paddingVertical:14,borderTopWidth:1,borderTopColor:theme.colors.line},
  number:{fontFamily:theme.fonts.heading,fontSize:13,lineHeight:21,color:theme.colors.sageMid,minWidth:24},
  mechanicCopy:{flex:1,gap:3},
  mechanicTitle:{fontFamily:theme.fonts.heading,fontSize:18,lineHeight:24,color:theme.colors.ink,fontWeight:'400'},
  mechanicBody:{fontSize:13.5,lineHeight:21,color:theme.colors.muted},
  readMore:{minHeight:43,marginTop:13,borderTopWidth:1,borderTopColor:theme.colors.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:12},
  readMorePressed:{opacity:.6},
  readMoreText:{fontSize:12.5,lineHeight:18,color:theme.colors.sage,fontWeight:'600',letterSpacing:.15},
  arrow:{fontSize:17,lineHeight:20,color:theme.colors.sageMid,transform:[{rotate:'0deg'}]},
  arrowOpen:{transform:[{rotate:'180deg'}]},
  actions:{gap:10,marginTop:2},
});
