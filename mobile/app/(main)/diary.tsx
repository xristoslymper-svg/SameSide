import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState, useProductData } from '../../src/components/product';
import { Screen } from '../../src/components/ui';
import { getProgram } from '../../src/features/product';
import { readAllReflections } from '../../src/features/reflections';
import { useAuth } from '../../src/providers/AuthProvider';
import { theme } from '../../src/theme';

function parts(date:string){
 try { const d=new Date(`${date}T00:00:00`); return {day:d.toLocaleDateString(undefined,{day:'2-digit'}),weekday:d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase(),month:d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}; }
 catch { return {day:date.slice(-2),weekday:'',month:date.slice(0,7)}; }
}

export default function Diary(){
 const router=useRouter();
 const {session}=useAuth();
 const load=useCallback(async()=>{const program=await getProgram(session!.user.id);return{entries:await readAllReflections(program.relationshipId)};},[session!.user.id]);
 const state=useProductData(load);
 const groups=state.data?.entries.reduce<Record<string,typeof state.data.entries>>((acc,entry)=>{const key=parts(entry.date).month;(acc[key]??=[]).push(entry);return acc;},{});
 return <Screen compact>
  <AppHeader/>
  <Pressable accessibilityRole="button" onPress={()=>router.back()} style={local.back}><Text style={local.backText}>← Roots</Text></Pressable>
  <View style={local.heading}>
   <View style={local.titleRow}><Text style={local.title}>Diary</Text><View style={local.lockPill}><Text style={local.lockText}>Private</Text></View></View>
   <Text style={local.subtitle}>{state.data?.entries.length ? `${state.data.entries.length} ${state.data.entries.length===1?'entry':'entries'}` : 'Your thoughts, kept here.'}</Text>
  </View>
  <LoadState {...state}/>
  {!state.loading&&state.data&&<View style={local.content}>
   {state.data.entries.length===0?<View style={local.empty}><Text style={local.emptyMark}>✎</Text><Text style={local.emptyTitle}>Nothing here yet</Text><Text style={local.emptyCopy}>Write your first entry from Roots.</Text></View>:
    Object.entries(groups??{}).map(([month,entries])=><View key={month} style={local.month}>
      <Text style={local.monthLabel}>{month.toUpperCase()}</Text>
      {entries.map(entry=>{const d=parts(entry.date);return <View key={entry.date} style={local.entryCard}>
        <View style={local.dateBlock}><Text style={local.day}>{d.day}</Text><Text style={local.weekday}>{d.weekday}</Text></View>
        <View style={local.divider}/>
        <Text style={local.body}>{entry.text}</Text>
      </View>})}
    </View>)}
  </View>}
 </Screen>;
}

const local=StyleSheet.create({
 back:{alignSelf:'flex-start',paddingVertical:8,marginTop:6},backText:{fontSize:13,fontWeight:'700',color:theme.colors.sage},
 heading:{marginTop:8,marginBottom:24,gap:5},titleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontFamily:theme.fonts.heading,fontSize:38,lineHeight:44,color:theme.colors.ink,letterSpacing:-1},subtitle:{fontSize:13,color:theme.colors.muted},
 lockPill:{paddingHorizontal:12,paddingVertical:7,borderRadius:999,backgroundColor:theme.colors.sageWash},lockText:{fontSize:11.5,fontWeight:'700',color:theme.colors.sage},
 content:{gap:28},month:{gap:11},monthLabel:{fontSize:10.5,fontWeight:'800',letterSpacing:2,color:theme.colors.sageMid,marginLeft:3},
 entryCard:{backgroundColor:theme.colors.card,borderWidth:1,borderColor:theme.colors.line,borderRadius:22,padding:18,flexDirection:'row',alignItems:'flex-start',gap:15,...theme.shadow.card},dateBlock:{width:38,alignItems:'center',paddingTop:1},day:{fontFamily:theme.fonts.heading,fontSize:25,lineHeight:27,color:theme.colors.ink},weekday:{fontSize:9,fontWeight:'800',letterSpacing:1.1,color:theme.colors.mutedSoft,marginTop:4},divider:{width:1,alignSelf:'stretch',backgroundColor:theme.colors.line},body:{flex:1,fontFamily:theme.fonts.heading,fontSize:16,lineHeight:24,color:theme.colors.inkSoft},
 empty:{backgroundColor:theme.colors.card,borderWidth:1,borderColor:theme.colors.line,borderRadius:24,padding:28,alignItems:'center',gap:7,...theme.shadow.card},emptyMark:{fontFamily:theme.fonts.heading,fontSize:28,color:theme.colors.sageMid},emptyTitle:{fontFamily:theme.fonts.heading,fontSize:20,color:theme.colors.ink},emptyCopy:{fontSize:13,color:theme.colors.muted},
});
