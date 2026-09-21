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
      <View style={local.photoZone}>
        <OpeningMedia/>
        <View style={[local.heroTop,{top:Math.max(insets.top + 18,40)}]}>
          <View style={local.logoMark} accessibilityLabel="Same Side">
            <View style={local.logoRing}/><View style={[local.logoRing,{marginLeft:-9}]}/>
          </View>
          <Text style={local.brandTitle}>Same Side</Text>
          <Text style={local.motto}>Together against the problem.</Text>
          <Text style={local.tagline}>Small steps. A better us.</Text>
        </View>
      </View>

      <View style={[local.ctaZone,{paddingBottom:Math.max(insets.bottom + 10,16)}]}>
        <View style={local.actions}>
          <Button label="Get Started" disabled={busy} onPress={() => { void save({ intent: null, step: 'how' }); }}/>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ step: 'auth' }); }} style={({pressed})=>[local.secondaryAction,pressed&&{opacity:.78}]}>
            <Text style={local.secondaryText}>I already have an account</Text>
          </Pressable>
          <DemoEntry quiet/>
        </View>
      </View>
    </View>
  </FlowScreen>;
}

const local=StyleSheet.create({
 screen:{flex:1,backgroundColor:'#D8D1C5'},
 photoZone:{flex:1,position:'relative',overflow:'hidden',minHeight:0},
 ctaZone:{flexShrink:0,backgroundColor:'rgba(216,209,197,.97)',paddingTop:14,paddingHorizontal:24},
 heroTop:{position:'absolute',left:24,right:24,alignItems:'center'},
 logoMark:{flexDirection:'row',alignItems:'center',justifyContent:'center',height:34,marginBottom:5},
 logoRing:{width:29,height:29,borderRadius:15,borderWidth:1.3,borderColor:theme.colors.ink},
 brandTitle:{fontFamily:theme.fonts.heading,fontSize:33,lineHeight:38,color:theme.colors.ink,letterSpacing:-.7,textAlign:'center'},
 motto:{fontFamily:theme.fonts.heading,fontSize:16.5,lineHeight:22,color:theme.colors.ink,textAlign:'center',marginTop:8},
 tagline:{fontFamily:theme.fonts.heading,fontSize:14.5,lineHeight:19,color:theme.colors.inkSoft,textAlign:'center',marginTop:5},
 actions:{gap:8},
 secondaryAction:{minHeight:48,borderRadius:18,backgroundColor:'rgba(255,253,249,.96)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(232,224,213,.92)'},
 secondaryText:{color:theme.colors.ink,fontSize:13.5,fontWeight:'700'},
});
