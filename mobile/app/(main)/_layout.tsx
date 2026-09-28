import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/providers/AuthProvider';
import { useInvitation } from '../../src/providers/InvitationProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { theme } from '../../src/theme';

function HomeGlyph({color}:{color:string}) {
  return <View style={nav.homeGlyph}>
    <View style={[nav.homeRoof,{borderColor:color}]}/>
    <View style={[nav.homeBody,{borderColor:color}]}/>
  </View>;
}

function GardenGlyph({color}:{color:string}) {
  return <View style={nav.gardenGlyph}>
    <View style={[nav.petal,nav.petalTop,{borderColor:color}]}/>
    <View style={[nav.petal,nav.petalRight,{borderColor:color}]}/>
    <View style={[nav.petal,nav.petalBottom,{borderColor:color}]}/>
    <View style={[nav.petal,nav.petalLeft,{borderColor:color}]}/>
    <View style={[nav.flowerCore,{backgroundColor:color}]}/>
  </View>;
}

function RootsGlyph({color}:{color:string}) {
  return <View style={[nav.rootsOuter,{borderColor:color}]}>
    <View style={[nav.rootsInner,{borderColor:color}]}/>
    <View style={[nav.rootsDot,{backgroundColor:color}]}/>
  </View>;
}

function NavIcon({color,kind}:{color:string;kind:'home'|'garden'|'roots'}) {
  return <View style={nav.iconWrap}>
    {kind==='home'?<HomeGlyph color={color}/>:kind==='garden'?<GardenGlyph color={color}/>:<RootsGlyph color={color}/>}
  </View>;
}

export default function ProductLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { token } = useInvitation();
  const { destination } = useOnboarding();

  if (!session) return <Redirect href={token ? '/sign-in' : '/'}/>;
  if (token) return <Redirect href="/invite/resume"/>;
  if (destination !== '/welcome') return <Redirect href={destination}/>;

  const shellWidth = Math.min(Math.max(width - 48, 280), 366);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 18 : 12);
  const barBottom = safeBottom + 8;
  const barHeight = 72;

  return (
    <Tabs
      key={session.user.id}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#416B58',
        tabBarInactiveTintColor: '#9A978E',
        tabBarStyle: {
          position: 'absolute',
          width: shellWidth,
          left: (width - shellWidth) / 2,
          bottom: barBottom,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 14,
          backgroundColor: 'rgba(255,252,247,0.985)',
          borderWidth: 1,
          borderColor: 'rgba(221,213,201,0.72)',
          borderRadius: 36,
          shadowColor: '#24352D',
          shadowOpacity: 0.085,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 7 },
          elevation: 8,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          height: 60,
          paddingTop: 6,
          paddingBottom: 5,
          margin: 0,
          borderRadius: 28,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          lineHeight: 13,
          fontWeight: '600',
          letterSpacing: 0.05,
          marginTop: 1,
          marginBottom: 0,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
          paddingBottom: barHeight + barBottom + 22,
        },
      }}
    >
      <Tabs.Screen name="today" options={{title:'Today',tabBarIcon:({color})=><NavIcon color={color} kind="home"/>}}/>
      <Tabs.Screen name="garden" options={{title:'Garden',tabBarIcon:({color})=><NavIcon color={color} kind="garden"/>}}/>
      <Tabs.Screen name="roots" options={{title:'Roots',tabBarIcon:({color})=><NavIcon color={color} kind="roots"/>}}/>
      <Tabs.Screen name="diary" options={{href:null}}/>
    </Tabs>
  );
}

const nav = StyleSheet.create({
  iconWrap:{width:24,height:24,alignItems:'center',justifyContent:'center'},
  homeGlyph:{width:22,height:21,position:'relative'},
  homeRoof:{position:'absolute',width:13,height:13,left:4.5,top:1.5,borderLeftWidth:1.8,borderTopWidth:1.8,transform:[{rotate:'45deg'}],borderTopLeftRadius:1.5},
  homeBody:{position:'absolute',width:14,height:11,left:4,bottom:1,borderWidth:1.8,borderTopWidth:0,borderBottomLeftRadius:1.5,borderBottomRightRadius:1.5},
  gardenGlyph:{width:22,height:22,position:'relative'},
  petal:{position:'absolute',width:7,height:9,borderWidth:1.4,borderRadius:6},
  petalTop:{left:7.5,top:0.5},
  petalRight:{right:1,top:6.5,transform:[{rotate:'90deg'}]},
  petalBottom:{left:7.5,bottom:0.5},
  petalLeft:{left:1,top:6.5,transform:[{rotate:'90deg'}]},
  flowerCore:{position:'absolute',width:4.5,height:4.5,borderRadius:3,left:8.75,top:8.75},
  rootsOuter:{width:20,height:20,borderWidth:1.4,borderRadius:10,alignItems:'center',justifyContent:'center'},
  rootsInner:{width:10,height:10,borderWidth:1.3,borderRadius:5,alignItems:'center',justifyContent:'center'},
  rootsDot:{width:2.5,height:2.5,borderRadius:2},
});
