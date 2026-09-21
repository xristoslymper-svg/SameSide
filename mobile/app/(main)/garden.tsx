import { useCallback,useState } from 'react';
import { Pressable,Text,View,useWindowDimensions } from 'react-native';
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
export default function Garden(){
 const {session}=useAuth();const [communityOpen,setCommunityOpen]=useState(false);const [story,setStory]=useState<FlowerId|null>(null);useFocusEffect(useCallback(()=>()=>{setStory(null);setCommunityOpen(false);},[]));const {width}=useWindowDimensions();
 const state=useProductData(useCallback(async()=>{const [garden,program,physical]=await Promise.all([getGardenState(),getProgram(session!.user.id),getPhysicalGardenState()]);return{garden,program,physical};},[session!.user.id]));
 const flower=findFlower(state.data?.program.selectedFlower??null);const stage=sharedGrowth(state.data?.garden.stage_key??'seed',state.data?.program.day??1);const paired=state.data?.program.memberCount===2;const partner=state.data?.program.partnerName;
 const physicalStatus=state.data?.physical.status;const physicalTitle=physicalStatus==='photo_ready'?'Your garden update is ready.':physicalStatus==='planted'?'Your flower is now part of the Same Side Garden.':physicalStatus==='ready_to_plant'?'Your bloom is ready for the Same Side Garden.':'When this blooms, we’ll plant the flower you chose in the Same Side Garden.';
 return <Screen compact><View style={{marginBottom:18}}><AppHeader/></View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><Text style={styles.eyebrow}>Your flower</Text><Text style={[styles.small,{textTransform:'uppercase',letterSpacing:.8}]}>The Routine</Text></View>
  <View style={{alignItems:'center',marginTop:20,gap:5}}>{flower&&stage.bloom&&<Text style={styles.eyebrow}>It bloomed</Text>}<Text style={[styles.cardTitle,{fontSize:27}]}>{flower?`Your ${flower.name}${stage.bloom?' bloomed':''}`:'What will you grow?'}</Text><Text style={styles.small}>{flower?.meaning??(state.loading?'A little space for what grows between you.':'Every flower carries a story.')}</Text>{state.data&&<Text style={[styles.small,{marginTop:7,textAlign:'center',maxWidth:320}]}>{paired?(partner?`This is the flower you are growing with ${partner}.`:'This is the flower you are growing together.'):'This is your flower for now. When your partner joins, you’ll grow it together.'}</Text>}</View>
  <BotanicalFlower flower={flower?.id??'cosmos'} state={stage} size={Math.min(width-44,340)} label={flower?undefined:state.loading?'Botanical flower loading':'Botanical preview — choose your shared flower'}/>
  <View style={{alignItems:'center',gap:8}}>{state.loading&&!state.data&&<Text style={styles.small}>Bringing your flower into view…</Text>}{state.error&&<><Notice>{state.error}</Notice><Button label="Try again" secondary onPress={()=>{void state.refresh();}}/></>}{state.data&&<><Text style={[styles.body,{textAlign:'center'}]}>{flower?stage.title:'Choose what you’ll grow together.'}</Text>{!flower?<Button label="Choose your flower" onPress={()=>router.push('/choose-flower?returnTo=garden')}/>:<Pressable accessibilityRole="button" style={{minHeight:44,justifyContent:'center',marginTop:6}} onPress={()=>setStory(flower.id)}><Text style={styles.small}>About your flower</Text></Pressable>}</>}</View>
  <Pressable accessibilityRole="button" onPress={()=>setCommunityOpen(true)} style={{marginTop:24,paddingVertical:16,paddingHorizontal:18,borderRadius:20,backgroundColor:'#F4EFE7'}}><Text style={[styles.eyebrow,{marginBottom:6}]}>SAME SIDE GARDEN</Text><Text style={[styles.cardTitle,{fontSize:20,lineHeight:25}]}>{physicalTitle}</Text><Text style={[styles.small,{marginTop:6,lineHeight:19}]}>See the garden and the stories of other couples growing alongside you.</Text><Text style={[styles.label,{marginTop:10}]}>Visit the garden →</Text></Pressable>
  <FlowerStory flower={story} close={()=>setStory(null)}/><CommunityGarden visible={communityOpen} close={()=>setCommunityOpen(false)}/>
 </Screen>;
}
