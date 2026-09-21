import { useCallback,useState } from 'react';
import { Pressable,StyleSheet,Text,View,useWindowDimensions } from 'react-native';
import { router,useFocusEffect } from 'expo-router';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { useProductData } from '../../src/components/product';
import { AppHeader } from '../../src/components/AppHeader';
import { FlowerStory } from '../../src/components/FlowerStory';
import { BotanicalFlower } from '../../src/components/BotanicalFlower';
import { CommunityGarden } from '../../src/components/CommunityGarden';
import { findFlower,type FlowerId } from '../../src/features/flowers';
import { sharedGrowth } from '../../src/features/growth';
import { getGardenState,getPhysicalGardenState,getProgram } from '../../src/features/product';
import { useAuth } from '../../src/providers/AuthProvider';
import { theme } from '../../src/theme';

export default function Garden(){
 const {session}=useAuth();const [communityOpen,setCommunityOpen]=useState(false);const [story,setStory]=useState<FlowerId|null>(null);useFocusEffect(useCallback(()=>()=>{setStory(null);setCommunityOpen(false);},[]));const {width}=useWindowDimensions();
 const state=useProductData(useCallback(async()=>{const [garden,program,physical]=await Promise.all([getGardenState(),getProgram(session!.user.id),getPhysicalGardenState()]);return{garden,program,physical};},[session!.user.id]));
 const flower=findFlower(state.data?.program.selectedFlower??null);const stage=sharedGrowth(state.data?.garden.stage_key??'seed',state.data?.program.day??1);const paired=state.data?.program.memberCount===2;const partner=state.data?.program.partnerName;
 const physicalStatus=state.data?.physical.status;const physicalTitle=physicalStatus==='photo_ready'?'Your garden update is ready.':physicalStatus==='planted'?'Your flower is now part of the Same Side Garden.':physicalStatus==='ready_to_plant'?'Your bloom is ready for the Same Side Garden.':'When this blooms, we’ll plant the flower you chose in the Same Side Garden.';
 return <Screen compact>
  <AppHeader/>
  <View style={local.intro}><Text style={local.title}>Our Garden</Text><Text style={local.subtitle}>Small moments. A stronger us.</Text></View>
  <View style={local.gardenCanvas}>
   <View style={local.canvasHeader}><View><Text style={styles.eyebrow}>THE ROUTINE</Text><Text style={local.flowerName}>{flower?flower.name:'Your flower'}</Text></View>{state.data&&<View style={local.stagePill}><Text style={local.stagePillText}>{stage.bloom?'IN BLOOM':`WEEK ${state.data.program.week}`}</Text></View>}</View>
   <View style={local.flowerWrap}><BotanicalFlower flower={flower?.id??'cosmos'} state={stage} size={Math.min(width-68,330)} label={flower?undefined:state.loading?'Botanical flower loading':'Botanical preview — choose your shared flower'}/></View>
   <Text style={local.stageTitle}>{flower?stage.title:'Choose what you’ll grow together.'}</Text>
   {flower&&<Text style={local.meaning}>{flower.meaning}</Text>}
  </View>
  <View style={local.statusCard}>
   <Text style={local.statusKicker}>{paired?'GROWING TOGETHER':'GROWING FOR NOW'}</Text>
   <Text style={local.statusTitle}>{paired?(partner?`You and ${partner} are growing this together.`:'You are growing this together.'):'Your partner can join this garden whenever they’re ready.'}</Text>
   <Text style={local.statusBody}>There’s no streak to protect. Each completed move simply gives the garden another reason to grow.</Text>
   {state.loading&&!state.data&&<Text style={styles.small}>Bringing your flower into view…</Text>}
   {state.error&&<><Notice>{state.error}</Notice><Button label="Try again" secondary onPress={()=>{void state.refresh();}}/></>}
   {state.data&&!flower&&<Button label="Choose your flower" onPress={()=>router.push('/choose-flower?returnTo=garden')}/>} 
   {flower&&<Pressable accessibilityRole="button" onPress={()=>setStory(flower.id)} style={local.textAction}><Text style={local.textActionText}>About your flower →</Text></Pressable>}
  </View>
  <Pressable accessibilityRole="button" onPress={()=>setCommunityOpen(true)} style={({pressed})=>[local.communityCard,pressed&&{opacity:.82}]}>
   <View style={local.communityTop}><Text style={styles.eyebrow}>SAME SIDE GARDEN</Text><Text style={local.communityArrow}>↗</Text></View>
   <Text style={local.communityTitle}>{physicalTitle}</Text>
   <Text style={local.communityBody}>See the garden and the stories of other couples growing alongside you.</Text>
  </Pressable>
  <FlowerStory flower={story} close={()=>setStory(null)}/><CommunityGarden visible={communityOpen} close={()=>setCommunityOpen(false)}/>
 </Screen>;
}

const local=StyleSheet.create({
 intro:{marginTop:18,marginBottom:18},
 title:{fontFamily:theme.fonts.heading,fontSize:35,lineHeight:40,color:theme.colors.ink,letterSpacing:-.9},
 subtitle:{fontSize:13.5,lineHeight:20,color:theme.colors.muted,marginTop:3},
 gardenCanvas:{backgroundColor:'#F2EBDD',borderRadius:30,paddingTop:22,paddingHorizontal:20,paddingBottom:24,borderWidth:1,borderColor:'#E4D9C8',...theme.shadow.card},
 canvasHeader:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:14},
 flowerName:{fontFamily:theme.fonts.heading,fontSize:23,lineHeight:29,color:theme.colors.ink,marginTop:4,textTransform:'capitalize'},
 stagePill:{backgroundColor:'rgba(255,253,249,.72)',borderRadius:999,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderColor:'rgba(217,208,195,.8)'},
 stagePillText:{fontSize:9.5,letterSpacing:1.1,fontWeight:'800',color:theme.colors.sage},
 flowerWrap:{alignItems:'center',marginTop:2,marginBottom:2,minHeight:330,justifyContent:'center'},
 stageTitle:{fontFamily:theme.fonts.heading,fontSize:23,lineHeight:29,color:theme.colors.ink,textAlign:'center'},
 meaning:{fontSize:13.5,lineHeight:20,color:theme.colors.muted,textAlign:'center',marginTop:6,paddingHorizontal:12},
 statusCard:{marginTop:18,backgroundColor:theme.colors.card,borderRadius:24,padding:21,borderWidth:1,borderColor:theme.colors.line,gap:9,...theme.shadow.card},
 statusKicker:{fontSize:10,letterSpacing:1.55,fontWeight:'800',color:theme.colors.sageMid},
 statusTitle:{fontFamily:theme.fonts.heading,fontSize:21,lineHeight:27,color:theme.colors.ink},
 statusBody:{fontSize:13.5,lineHeight:20.5,color:theme.colors.muted},
 textAction:{minHeight:42,justifyContent:'center',alignSelf:'flex-start',marginTop:2},
 textActionText:{fontSize:13.5,fontWeight:'700',color:theme.colors.sage},
 communityCard:{marginTop:16,marginBottom:8,paddingVertical:20,paddingHorizontal:20,borderRadius:24,backgroundColor:theme.colors.cardWarm,borderWidth:1,borderColor:theme.colors.line,gap:7},
 communityTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 communityArrow:{fontSize:17,color:theme.colors.sage},
 communityTitle:{fontFamily:theme.fonts.heading,fontSize:20,lineHeight:25,color:theme.colors.ink},
 communityBody:{fontSize:13,lineHeight:19.5,color:theme.colors.muted},
});
