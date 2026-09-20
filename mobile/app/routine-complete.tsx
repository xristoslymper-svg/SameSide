import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { Pressable,Text,View } from 'react-native';
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
 return <Screen compact><AppHeader/><LoadState {...state}/>{state.data&&<><View style={{marginTop:34,alignItems:'center',gap:10}}><Text style={styles.eyebrow}>THE ROUTINE · COMPLETE</Text><Text style={[styles.title,{fontSize:40,lineHeight:44,textAlign:'center'}]}>{flower?`Your ${flower.name} bloomed`:'Your flower bloomed'}</Text>{flower&&<Text style={styles.small}>{flower.meaning}</Text>}</View><BotanicalFlower flower={flower?.id??'cosmos'} size={300}/><View style={{gap:12,marginTop:12}}><Text style={[styles.cardTitle,{fontSize:24,lineHeight:30}]}>You started with something small.</Text><Text style={styles.body}>Little moments became something you grew together. There was nothing to keep perfect, and nothing was lost on the days life got busy.</Text></View><View style={{marginTop:30,paddingTop:24,borderTopWidth:1,borderTopColor:theme.colors.line,gap:12}}><Text style={styles.eyebrow}>Take one thing with you</Text><Text style={[styles.cardTitle,{fontSize:22}]}>What would you like to keep doing?</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{keepers.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:choice===value}} onPress={()=>{void keep(value);}} style={{width:'47%',flexGrow:1,minHeight:58,padding:14,borderRadius:22,borderWidth:1,borderColor:choice===value?theme.colors.sage:theme.colors.line,backgroundColor:choice===value?theme.colors.sageLight:theme.colors.card,alignItems:'center',justifyContent:'center'}}><Text style={styles.label}>{value}</Text></Pressable>)}</View>{choice&&<Text style={styles.small}>Keep it lightly. This isn’t a streak or a promise to be perfect.</Text>}</View><View style={{marginTop:30,gap:10}}><Button label="See our garden" onPress={()=>router.replace('/garden')}/><Button label="Back to Today" secondary onPress={()=>router.replace('/today')}/></View></>}</Screen>;
}
