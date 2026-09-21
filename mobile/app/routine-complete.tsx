import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { Pressable,StyleSheet,Text,View } from 'react-native';
import { BotanicalFlower } from '../src/components/BotanicalFlower';
import { AppHeader } from '../src/components/AppHeader';
import { LoadState,useProductData } from '../src/components/product';
import { Button,Screen,styles } from '../src/components/ui';
import { findFlower } from '../src/features/flowers';
import { getGardenState,getProgram } from '../src/features/product';
import { sessionStorage } from '../src/lib/storage';
import { useAuth } from '../src/providers/AuthProvider';
import { theme } from '../src/theme';

const keepers=['Notice each other','Make time','Surprise each other','Say the small things'];
export default function RoutineComplete(){
 const {session}=useAuth();const state=useProductData(useCallback(async()=>{const [program,garden]=await Promise.all([getProgram(session!.user.id),getGardenState()]);return{program,garden};},[session!.user.id]));const [choice,setChoice]=useState<string|null>(null);const flower=findFlower(state.data?.program.selectedFlower??null);
 async function keep(value:string){setChoice(value);if(state.data)await sessionStorage.setItem(`same-side.routine-keeper.${session!.user.id}.${state.data.program.relationshipId}`,value);}
 return <Screen compact><AppHeader/><LoadState {...state}/>{state.data&&<>
  <View style={local.hero}>
   <BotanicalFlower flower={flower?.id??'cosmos'} size={280}/>
   <Text style={local.title}>You did it!</Text>
   <Text style={local.subtitle}>Another small step for a stronger us.</Text>
   <View style={local.reflectionCard}><Text style={local.sprout}>❧</Text><Text style={local.reflection}>Your reflections help you understand what matters most — and create more of it together.</Text></View>
  </View>
  <View style={local.keepSection}><Text style={styles.eyebrow}>TAKE ONE THING WITH YOU</Text><Text style={local.keepTitle}>What would you like to keep doing?</Text><View style={local.keepGrid}>{keepers.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:choice===value}} onPress={()=>{void keep(value);}} style={({pressed})=>[local.keepChoice,choice===value&&local.keepChoiceSelected,pressed&&{opacity:.76}]}><View style={[local.choiceDot,choice===value&&local.choiceDotSelected]}/><Text style={[local.choiceText,choice===value&&{fontWeight:'700'}]}>{value}</Text></Pressable>)}</View>{choice&&<Text style={local.helper}>Keep it lightly. This isn’t a streak or a promise to be perfect.</Text>}</View>
  <View style={local.actions}><Button label="Back to Today" onPress={()=>router.replace('/today')}/><Button label="Explore your Garden" secondary onPress={()=>router.replace('/garden')}/></View>
 </>}</Screen>;
}

const local=StyleSheet.create({
 hero:{marginTop:20,alignItems:'center',gap:10,paddingBottom:8},
 title:{fontFamily:theme.fonts.heading,fontSize:39,lineHeight:44,color:theme.colors.ink,letterSpacing:-1,textAlign:'center'},
 subtitle:{fontSize:15,lineHeight:22,color:theme.colors.muted,textAlign:'center',maxWidth:250},
 reflectionCard:{width:'100%',marginTop:18,backgroundColor:theme.colors.cardWarm,borderRadius:24,padding:20,alignItems:'center',gap:8,borderWidth:1,borderColor:theme.colors.line},
 sprout:{fontSize:24,color:theme.colors.sage},
 reflection:{fontSize:13.5,lineHeight:20.5,color:theme.colors.inkSoft,textAlign:'center',maxWidth:290},
 keepSection:{marginTop:26,paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line,gap:12},
 keepTitle:{fontFamily:theme.fonts.heading,fontSize:22,lineHeight:28,color:theme.colors.ink},
 keepGrid:{gap:7},
 keepChoice:{minHeight:52,flexDirection:'row',alignItems:'center',gap:11,paddingHorizontal:13,borderBottomWidth:1,borderBottomColor:theme.colors.line},
 keepChoiceSelected:{backgroundColor:theme.colors.sageWash,borderRadius:15,borderBottomWidth:0},
 choiceDot:{width:18,height:18,borderRadius:9,borderWidth:1.3,borderColor:'#9B9489'},
 choiceDotSelected:{backgroundColor:theme.colors.sage,borderColor:theme.colors.sage},
 choiceText:{fontSize:13.5,lineHeight:19,color:theme.colors.inkSoft},
 helper:{fontSize:12.5,lineHeight:18.5,color:theme.colors.muted},
 actions:{marginTop:28,gap:10,marginBottom:8},
});
