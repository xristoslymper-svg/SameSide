import { useCallback,useState } from 'react';
import { Pressable,StyleSheet,Text,View,useWindowDimensions } from 'react-native';
import { router,useFocusEffect } from 'expo-router';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { useProductData } from '../../src/components/product';
import { AppHeader } from '../../src/components/AppHeader';
import { FlowerStory } from '../../src/components/FlowerStory';
import { BotanicalFlower } from '../../src/components/BotanicalFlower';
import { findFlower,type FlowerId } from '../../src/features/flowers';
import { sharedGrowth } from '../../src/features/growth';
import { getGardenState,getProgram } from '../../src/features/product';
import { useAuth } from '../../src/providers/AuthProvider';
import { theme } from '../../src/theme';

export default function Garden(){
 const {session}=useAuth();const [story,setStory]=useState<FlowerId|null>(null);useFocusEffect(useCallback(()=>()=>{setStory(null);},[]));const {width}=useWindowDimensions();
 const state=useProductData(useCallback(async()=>{const program=await getProgram(session!.user.id);if(!program.routineActivated)return{garden:null,program};const garden=await getGardenState();return{garden,program};},[session!.user.id]));
 const flower=findFlower(state.data?.program.selectedFlower??null);const waiting=!!state.data&&!state.data.program.routineActivated;const stage=sharedGrowth(state.data?.garden?.stage_key??'seed',state.data?.program.day??1);const paired=state.data?.program.memberCount===2;const partner=state.data?.program.partnerName;
 return <Screen compact>
  <AppHeader/>
  <View style={local.intro}><Text style={local.title}>Our Garden</Text><Text style={local.subtitle}>Small moments. A stronger us.</Text></View>
  <View style={local.gardenCanvas}>
   <View style={local.canvasHeader}><View><Text style={styles.eyebrow}>THE ROUTINE</Text><Text style={local.flowerName}>{flower?flower.name:'Your flower'}</Text></View>{state.data&&<View style={local.stagePill}><Text style={local.stagePillText}>{stage.bloom?'IN BLOOM':`WEEK ${state.data.program.week} OF 4`}</Text></View>}</View>
   <View style={local.flowerWrap}><BotanicalFlower flower={flower?.id??'cosmos'} state={stage} size={Math.min(width-68,330)} label={flower?undefined:state.loading?'Botanical flower loading':'Botanical preview — choose your shared flower'}/></View>
   <Text style={local.stageTitle}>{waiting?'Your flower is waiting for Day 1.':flower?stage.title:'Choose what you’ll grow together.'}</Text>
   {flower&&<Text style={local.meaning}>{flower.meaning}</Text>}
  </View>
  <View style={local.statusCard}>
   <Text style={local.statusKicker}>{waiting?'READY WHEN YOU BOTH ARE':paired?'GROWING TOGETHER':'YOUR GARDEN'}</Text>
   <Text style={local.statusTitle}>{waiting?(paired?'You’re both here. The Routine starts when setup is complete.':'Your partner needs to join before the flower starts growing.'):paired?(partner?`You and ${partner} are growing this together.`:'You are growing this together.'):'Your shared flower is here.'}</Text>
   <Text style={local.statusBody}>{waiting?'Day 1 unlocks for both of you at the same time.':'There’s no streak to protect. Each completed Move gives the garden another reason to grow.'}</Text>
   {state.loading&&!state.data&&<Text style={styles.small}>Bringing your flower into view…</Text>}
   {state.error&&<><Notice>{state.error}</Notice><Button label="Try again" secondary onPress={()=>{void state.refresh();}}/></>}
   {state.data&&!flower&&<Button label="Choose your flower" onPress={()=>router.push('/choose-flower?returnTo=garden')}/>} 
   {flower&&<Pressable accessibilityRole="button" onPress={()=>setStory(flower.id)} style={local.textAction}><Text style={local.textActionText}>About your flower →</Text></Pressable>}
  </View>
  <FlowerStory flower={story} close={()=>setStory(null)}/>
 </Screen>;
}

const local=StyleSheet.create({
 intro:{marginTop:24,marginBottom:24},
 title:{fontFamily:theme.fonts.heading,fontSize:32,lineHeight:39,color:theme.colors.ink,letterSpacing:-0.8, fontWeight: '400'},
 subtitle:{fontSize:13,lineHeight:21,color:theme.colors.muted,marginTop:6},
 gardenCanvas:{backgroundColor:theme.colors.sageWash,borderRadius:theme.radius.card,paddingTop:22,paddingHorizontal:20,paddingBottom:22,borderWidth:0,borderColor:theme.colors.lineStrong,...theme.shadow.card, shadowOpacity: 0, elevation: 0},
 canvasHeader:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:14},
 flowerName:{fontFamily:theme.fonts.heading,fontSize:28,lineHeight:35,color:theme.colors.ink,marginTop:7,textTransform:'capitalize'},
 stagePill:{backgroundColor:theme.colors.card,borderRadius:999,paddingHorizontal:10,paddingVertical:7,borderWidth:0,borderColor:theme.colors.lineStrong},
 stagePillText:{fontSize:10,letterSpacing:0.8,fontWeight:'600',color:theme.colors.sage},
 flowerWrap:{alignItems:'center',marginTop:-10,marginBottom:-10,minHeight:0,justifyContent:'center'},
 stageTitle:{fontFamily:theme.fonts.heading,fontSize:22,lineHeight:29,color:theme.colors.ink,textAlign:'center'},
 meaning:{fontSize:13,lineHeight:20,color:theme.colors.muted,textAlign:'center',marginTop:6,paddingHorizontal:12},
 statusCard:{marginTop:24,backgroundColor:'transparent',borderRadius:0,padding:0,borderWidth:0,borderColor:theme.colors.line,gap:10,...theme.shadow.card, paddingTop: 4, shadowOpacity: 0, elevation: 0},
 statusKicker:{fontSize:10,letterSpacing:1.55,fontWeight:'600',color:theme.colors.muted},
 statusTitle:{fontFamily:theme.fonts.heading,fontSize:22,lineHeight:29,color:theme.colors.ink},
 statusBody:{fontSize:14,lineHeight:23,color:theme.colors.muted},
 textAction:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',marginTop:8},
 textActionText:{fontSize:13.5,fontWeight:'500',color:theme.colors.sage},
});