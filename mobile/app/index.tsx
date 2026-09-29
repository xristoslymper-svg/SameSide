import { DemoEntry } from '../src/components/DemoControls';
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { OpeningMedia } from '../src/components/OpeningMedia';
import { FlowScreen } from '../src/components/onboarding';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { useAuth } from '../src/providers/AuthProvider';
import { useInvitation } from '../src/providers/InvitationProvider';
import { theme } from '../src/theme';

export default function OpeningScreen() {
  const { session } = useAuth();
  const { token: pendingInvitation } = useInvitation();
  const { save, busy, destination } = useOnboarding();
  const insets = useSafeAreaInsets();
  // A partner may close the app after opening/accepting an invite but before
  // finishing setup. The persisted bearer token must win over normal onboarding
  // routing so the pairing can safely resume (acceptance is idempotent server-side).
  if (pendingInvitation) return <Redirect href={session ? '/invite/resume' : '/sign-in'}/>;
  if (session) return <Redirect href={destination}/>;
  return <FlowScreen immersive>
    <View style={local.screen}>
      <OpeningMedia/>

      <View style={local.content}>
        <View style={local.photoContentZone}>
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
            <Button label="Get Started" disabled={busy} onPress={() => { void save({ step: 'how' }); }}/>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void save({ step: 'auth' }); }} style={({pressed})=>[local.secondaryAction,pressed&&{opacity:.78}]}>
              <Text style={local.secondaryText}>I already have an account</Text>
            </Pressable>
            <DemoEntry quiet/>
          </View>
        </View>
      </View>
    </View>
  </FlowScreen>;
}

const local=StyleSheet.create({
 screen:{flex:1,position:'relative',backgroundColor:theme.colors.sand},
 content:{...StyleSheet.absoluteFillObject},
 photoContentZone:{flex:1,position:'relative',minHeight:0},
 ctaZone:{flexShrink:0,paddingTop:18,paddingHorizontal:24,backgroundColor:'transparent'},
 heroTop:{position:'absolute',left:24,right:24,alignItems:'center'},
 logoMark:{flexDirection:'row',alignItems:'center',justifyContent:'center',height:34,marginBottom:5},
 logoRing:{width:29,height:29,borderRadius:15,borderWidth:1.3,borderColor:theme.colors.ink},
 brandTitle:{fontFamily:theme.fonts.heading,fontSize:36,lineHeight:43,color:theme.colors.ink,letterSpacing:-0.8,textAlign:'center'},
 motto:{fontFamily:theme.fonts.heading,fontSize:17,lineHeight:25,color:theme.colors.ink,textAlign:'center',marginTop:8},
 tagline:{fontFamily:theme.fonts.heading,fontSize:15,lineHeight:23,color:theme.colors.inkSoft,textAlign:'center',marginTop:5},
 actions:{gap:10},
 secondaryAction:{minHeight:48,borderRadius:theme.radius.button,backgroundColor:theme.colors.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.colors.lineStrong},
 secondaryText:{color:theme.colors.ink,fontSize:14,fontWeight:'500'},
});
