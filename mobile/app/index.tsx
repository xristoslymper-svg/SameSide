import { DemoEntry } from '../src/components/DemoControls';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { OpeningMedia } from '../src/components/OpeningMedia';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { theme } from '../src/theme';

export default function OpeningScreen() {
  const { save, busy } = useOnboarding();
  const insets = useSafeAreaInsets();
  return <FlowScreen immersive>
    <View style={local.screen}>
      <OpeningMedia/>
      <View style={[local.heroTop,{top:Math.max(insets.top + 24,48)}]}>
        <View style={local.logoMark} accessibilityLabel="Same Side">
          <View style={local.logoRing}/><View style={[local.logoRing,{marginLeft:-9}]}/>
        </View>
        <Text style={local.brandTitle}>Same Side</Text>
        <Text style={local.motto}>Together against the problem.</Text>
        <Text style={local.tagline}>Small steps. A better us.</Text>
      </View>

      <View style={[local.actions,{bottom:Math.max(insets.bottom + 14,20)}]}>
        <Button label="Get Started" disabled={busy} onPress={() => { void save({ intent: null, step: 'how' }); }}/>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ step: 'auth' }); }} style={({pressed})=>[local.secondaryAction,pressed&&{opacity:.78}]}>
          <Text style={local.secondaryText}>I already have an account</Text>
        </Pressable>
        <DemoEntry quiet/>
      </View>
    </View>
  </FlowScreen>;
}

const local=StyleSheet.create({
 screen:{flex:1,position:'relative',backgroundColor:'#E7DED2'},
 heroTop:{position:'absolute',left:24,right:24,alignItems:'center'},
 logoMark:{flexDirection:'row',alignItems:'center',justifyContent:'center',height:38,marginBottom:7},
 logoRing:{width:31,height:31,borderRadius:16,borderWidth:1.35,borderColor:theme.colors.ink},
 brandTitle:{fontFamily:theme.fonts.heading,fontSize:34,lineHeight:39,color:theme.colors.ink,letterSpacing:-.7,textAlign:'center'},
 motto:{fontFamily:theme.fonts.heading,fontSize:17,lineHeight:23,color:theme.colors.ink,textAlign:'center',marginTop:10},
 tagline:{fontFamily:theme.fonts.heading,fontSize:15,lineHeight:20,color:theme.colors.inkSoft,textAlign:'center',marginTop:7},
 actions:{position:'absolute',left:24,right:24,gap:9},
 secondaryAction:{minHeight:52,borderRadius:18,backgroundColor:'rgba(255,253,249,.92)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(232,224,213,.92)'},
 secondaryText:{color:theme.colors.ink,fontSize:13.5,fontWeight:'700'},
});
