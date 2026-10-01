import type { ComponentProps } from 'react';
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

function Glyph({route,color}:{route:string;color:string}) {
  if(route==='today') return <HomeGlyph color={color}/>;
  if(route==='garden') return <GardenGlyph color={color}/>;
  return <RootsGlyph color={color}/>;
}

function FloatingTabBar({state,descriptors,navigation}:BottomTabBarProps) {
  const insets=useSafeAreaInsets();
  const visible=state.routes.filter(route=>route.name==='today'||route.name==='garden'||route.name==='roots');

  return <View pointerEvents="box-none" style={[nav.floatingWrap,{bottom:Math.max(insets.bottom,12)+16}]}>
    <View style={nav.floatingBar}>
      {visible.map(route=>{
        const index=state.routes.findIndex(item=>item.key===route.key);
        const focused=state.index===index;
        const color=focused?theme.colors.sage:theme.colors.muted;
        const label=route.name==='today'?'Today':route.name==='garden'?'Garden':'Roots';
        return <Pressable
          key={route.key}
          accessibilityRole="button"
          accessibilityState={focused?{selected:true}:{}}
          accessibilityLabel={label}
          onPress={()=>{
            const event=navigation.emit({type:'tabPress',target:route.key,canPreventDefault:true});
            if(!focused&&!event.defaultPrevented)navigation.navigate(route.name,route.params);
          }}
          onLongPress={()=>navigation.emit({type:'tabLongPress',target:route.key})}
          style={({pressed})=>[nav.tab,focused&&nav.tabActive,pressed&&nav.tabPressed]}>
          <View style={nav.iconBox}><Glyph route={route.name} color={color}/></View>
          <Text style={[nav.label,{color},focused&&nav.labelActive]}>{label}</Text>
          {focused&&<View style={nav.activeMark}/>}
        </Pressable>;
      })}
    </View>
  </View>;
}

export default function ProductLayout() {
  const { session } = useAuth();
  const { token } = useInvitation();
  const { destination } = useOnboarding();

  if (!session) return <Redirect href={token ? '/sign-in' : '/'}/>;
  if (token) return <Redirect href="/invite/resume"/>;
  if (destination !== '/welcome') return <Redirect href={destination}/>;

  return (
    <Tabs
      key={session.user.id}
      tabBar={props=><FloatingTabBar {...props}/>}
      screenOptions={{
        headerShown:false,
        tabBarHideOnKeyboard:true,
        sceneStyle:{backgroundColor:theme.colors.background,paddingBottom:128},
      }}>
      <Tabs.Screen name="today" options={{title:'Today'}}/>
      <Tabs.Screen name="garden" options={{title:'Garden'}}/>
      <Tabs.Screen name="roots" options={{title:'Roots'}}/>
      <Tabs.Screen name="diary" options={{href:null}}/>
    </Tabs>
  );
}

const nav=StyleSheet.create({
  floatingWrap:{
    position:'absolute',
    left:20,
    right:20,
    zIndex:50,
    alignItems:'center',
  },
  floatingBar:{
    width:'100%',
    maxWidth:390,
    height:72,
    flexDirection:'row',
    alignItems:'stretch',
    paddingHorizontal:8,
    paddingVertical:6,
    borderRadius:22,
    backgroundColor:theme.colors.card,
    borderWidth:1,
    borderColor:theme.colors.line,
    shadowColor:'#24352D',
    shadowOpacity:0.04,
    shadowRadius:16,
    shadowOffset:{width:0,height:6},
    elevation:3,
  },
  tab:{
    flex:1,
    minWidth:0,
    borderRadius:14,
    alignItems:'center',
    justifyContent:'center',
    paddingTop:5,
    paddingBottom:5,
    position:'relative',
  },
  tabActive:{backgroundColor:'transparent'},
  tabPressed:{opacity:.68},
  iconBox:{height:22,alignItems:'center',justifyContent:'center',marginBottom:2},
  label:{fontSize:12,lineHeight:17,fontWeight:'500',letterSpacing:.04,textAlign:'center'},
  labelActive:{fontWeight:'700'},
  activeMark:{position:'absolute',bottom:1,width:14,height:1.5,borderRadius:2,backgroundColor:theme.colors.sage,opacity:.72},

  homeGlyph:{width:22,height:21,position:'relative'},
  homeRoof:{position:'absolute',width:13,height:13,left:4.5,top:1.5,borderLeftWidth:1.8,borderTopWidth:1.8,transform:[{rotate:'45deg'}],borderTopLeftRadius:1.5},
  homeBody:{position:'absolute',width:14,height:11,left:4,bottom:1,borderWidth:1.8,borderTopWidth:0,borderBottomLeftRadius:1.5,borderBottomRightRadius:1.5},
  gardenGlyph:{width:22,height:22,position:'relative'},
  petal:{position:'absolute',width:7,height:9,borderWidth:1.4,borderRadius:6},
  petalTop:{left:7.5,top:.5},
  petalRight:{right:1,top:6.5,transform:[{rotate:'90deg'}]},
  petalBottom:{left:7.5,bottom:.5},
  petalLeft:{left:1,top:6.5,transform:[{rotate:'90deg'}]},
  flowerCore:{position:'absolute',width:4.5,height:4.5,borderRadius:3,left:8.75,top:8.75},
  rootsOuter:{width:20,height:20,borderWidth:1.4,borderRadius:10,alignItems:'center',justifyContent:'center'},
  rootsInner:{width:10,height:10,borderWidth:1.3,borderRadius:5,alignItems:'center',justifyContent:'center'},
  rootsDot:{width:2.5,height:2.5,borderRadius:2},
});
