import { DemoEntry } from '../src/components/DemoControls';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand, Button, styles } from '../src/components/ui';
import { OpeningMedia } from '../src/components/OpeningMedia';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { theme } from '../src/theme';

export default function OpeningScreen() {
  const { save, busy } = useOnboarding();
  return <FlowScreen immersive>
    <View style={local.hero}>
      <OpeningMedia/>
      <View style={local.heroTop}>
        <Brand centered/>
        <Text style={local.brandTitle}>Same Side</Text>
        <Text style={local.tagline}>A deeper connection{`\n`}lives in the everyday.</Text>
      </View>
      <View style={local.heroBottom}>
        <Button label="Get started" disabled={busy} onPress={() => { void save({ intent: 'together', step: 'how' }); }}/>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ step: 'auth' }); }} style={({pressed})=>[local.secondaryAction,pressed&&{opacity:.72}]}><Text style={local.secondaryText}>I already have an account</Text></Pressable>
      </View>
    </View>
    <View style={local.afterHero}>
      <Text style={styles.eyebrow}>START YOUR WAY</Text>
      <Text style={[styles.cardTitle,{fontSize:22,lineHeight:28}]}>Begin together, or take the first small step yourself.</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ intent: 'solo', step: 'how' }); }} style={({pressed})=>[local.soloAction,pressed&&{opacity:.7}]}><Text style={local.soloText}>Start on my own →</Text></Pressable>
      <DemoEntry/>
    </View>
  </FlowScreen>;
}

const local=StyleSheet.create({
 hero:{position:'relative',borderRadius:32,overflow:'hidden',...theme.shadow.floating},
 heroTop:{position:'absolute',top:28,left:24,right:24,alignItems:'center',gap:8},
 brandTitle:{fontFamily:theme.fonts.heading,fontSize:30,lineHeight:35,color:theme.colors.ink,letterSpacing:-.5},
 tagline:{fontFamily:theme.fonts.heading,fontSize:17,lineHeight:23,color:theme.colors.inkSoft,textAlign:'center',marginTop:2},
 heroBottom:{position:'absolute',left:18,right:18,bottom:18,gap:10,padding:12,borderRadius:24,backgroundColor:'rgba(248,243,235,.86)'},
 secondaryAction:{minHeight:48,borderRadius:18,backgroundColor:'rgba(255,253,249,.82)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(232,224,213,.95)'},
 secondaryText:{color:theme.colors.ink,fontSize:14,fontWeight:'700'},
 afterHero:{paddingTop:28,paddingBottom:8,gap:10},
 soloAction:{minHeight:44,justifyContent:'center',alignSelf:'flex-start'},
 soloText:{fontSize:14,fontWeight:'700',color:theme.colors.sage},
});
