import { useCallback,useState } from 'react';
import { Pressable,Text,View,useWindowDimensions } from 'react-native';
import { router,useFocusEffect } from 'expo-router';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { useProductData } from '../../src/components/product';
import { AppHeader } from '../../src/components/AppHeader';
import { FlowerStory } from '../../src/components/FlowerStory';
import { BotanicalFlower } from '../../src/components/BotanicalFlower';
import { RealGarden } from '../../src/components/RealGarden';
import { CommunityGarden } from '../../src/components/CommunityGarden';
import { findFlower,type FlowerId } from '../../src/features/flowers';
import { sharedGrowth } from '../../src/features/growth';
import { getGardenState,getPhysicalGardenState,getProgram } from '../../src/features/product';
import { useAuth } from '../../src/providers/AuthProvider';
export default function Garden(){
 const {session}=useAuth();const [learn,setLearn]=useState(false);const [communityOpen,setCommunityOpen]=useState(false);const [story,setStory]=useState<FlowerId|null>(null);useFocusEffect(useCallback(()=>()=>{setStory(null);setLearn(false);setCommunityOpen(false);},[]));const {width}=useWindowDimensions();
 const state=useProductData(useCallback(async()=>{const [garden,program,physical]=await Promise.all([getGardenState(),getProgram(session!.user.id),getPhysicalGardenState()]);return{garden,program,physical};},[session!.user.id]));
 const flower=findFlower(state.data?.program.selectedFlower??null);const stage=sharedGrowth(state.data?.garden.stage_key??'seed',state.data?.program.day??1);const paired=state.data?.program.memberCount===2;const partner=state.data?.program.partnerName;
 const physicalStatus=state.data?.physical.status;const physicalTitle=physicalStatus==='photo_ready'?'A garden update is ready.':physicalStatus==='planted'?'Your flower has been planted.':physicalStatus==='ready_to_plant'?'Your bloom is ready to be planted.':stage.bloom&&flower?'Your bloom is ready for its next chapter.':'When this blooms, something real begins.';
 return <Screen compact><View style={{marginBottom:18}}><AppHeader/></View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><Text style={styles.eyebrow}>Your garden</Text><Text style={[styles.small,{textTransform:'uppercase',letterSpacing:.8}]}>The Routine{state.data?` · Week ${state.data.program.week}`:''}</Text></View>
  <View style={{alignItems:'center',marginTop:20,gap:5}}>{flower&&stage.bloom&&<Text style={styles.eyebrow}>It bloomed</Text>}<Text style={[styles.cardTitle,{fontSize:27}]}>{flower?`Your ${flower.name}${stage.bloom?' bloomed':''}`:'What will you grow?'}</Text><Text style={styles.small}>{flower?.meaning??(state.loading?'A little space for what grows between you.':'Every flower carries a story.')}</Text>{state.data&&<Text style={[styles.small,{marginTop:6,textAlign:'center',maxWidth:320}]}>{paired?(partner?`This is the garden you share with ${partner}. Your private moves shape it without showing who did what.`:'This flower is shared. Your private moves shape one garden without showing who did what.'):'This is your garden for now. When your partner joins, you’ll grow the same flower together.'}</Text>}</View>
  <BotanicalFlower flower={flower?.id??'cosmos'} state={stage} size={Math.min(width-44,340)} label={flower?undefined:state.loading?'Botanical garden loading':'Botanical preview — choose your shared flower'}/>
  <View style={{alignItems:'center',gap:8}}>{state.loading&&!state.data&&<Text style={styles.small}>Bringing your garden into view…</Text>}{state.error&&<><Notice>{state.error}</Notice><Button label="Try again" secondary onPress={()=>{void state.refresh();}}/></>}{state.data&&<><Text style={[styles.body,{textAlign:'center'}]}>{flower?stage.title:'Choose what you’ll grow together.'}</Text>{!flower?<Button label="Choose your flower" onPress={()=>router.push('/choose-flower?returnTo=garden')}/>:<Pressable accessibilityRole="button" style={{minHeight:44,justifyContent:'center',marginTop:8}} onPress={()=>setStory(flower.id)}><Text style={styles.small}>About your flower</Text></Pressable>}</>}</View>
  <Pressable accessibilityRole="button" onPress={()=>setLearn(true)} style={{marginTop:28,paddingVertical:18,paddingHorizontal:18,borderRadius:22,backgroundColor:'#F4EFE7'}}><Text style={styles.eyebrow}>FROM HERE TO THE REAL GARDEN</Text><Text style={[styles.cardTitle,{fontSize:20,marginTop:5}]}>{physicalTitle}</Text><Text style={[styles.small,{marginTop:6}]}>{physicalStatus==='planted'||physicalStatus==='photo_ready'?'See the real-garden status →':'See how your digital flower becomes part of the Same Side garden →'}</Text></Pressable>
  <View style={{marginTop:34,paddingTop:28,borderTopWidth:1,borderTopColor:'#ddd6c9',gap:9}}><Text style={styles.eyebrow}>COMMUNITY</Text><Text style={[styles.cardTitle,{fontSize:25}]}>Stories growing alongside yours.</Text><Text style={styles.body}>Wander through flowers from other journeys and discover the stories behind them.</Text><Button label="Walk through the garden" secondary onPress={()=>setCommunityOpen(true)}/></View>
  <FlowerStory flower={story} close={()=>setStory(null)}/><RealGarden visible={learn} close={()=>setLearn(false)} state={state.data?.physical}/><CommunityGarden visible={communityOpen} close={()=>setCommunityOpen(false)}/>
 </Screen>;
}
