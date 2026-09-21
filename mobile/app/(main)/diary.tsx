import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState, useProductData } from '../../src/components/product';
import { Screen, styles } from '../../src/components/ui';
import { getProgram } from '../../src/features/product';
import { readAllReflections } from '../../src/features/reflections';
import { useAuth } from '../../src/providers/AuthProvider';
import { theme } from '../../src/theme';

function fullDate(date:string){
 try{return new Date(`${date}T00:00:00`).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});}catch{return date;}
}
function monthLabel(date:string){
 try{return new Date(`${date}T00:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'});}catch{return date.slice(0,7);}
}

export default function Diary(){
 const router=useRouter();
 const {session}=useAuth();
 const load=useCallback(async()=>{const program=await getProgram(session!.user.id);return{entries:await readAllReflections(program.relationshipId)};},[session!.user.id]);
 const state=useProductData(load);
 const groups=state.data?.entries.reduce<Record<string,typeof state.data.entries>>((acc,entry)=>{const key=monthLabel(entry.date);(acc[key]??=[]).push(entry);return acc;},{});
 return <Screen compact>
  <AppHeader/>
  <Pressable accessibilityRole="button" onPress={()=>router.back()} style={local.back}><Text style={local.backText}>← Roots</Text></Pressable>
  <View style={local.heading}><Text style={local.title}>Diary</Text><Text style={local.private}>🔒 Private to you</Text></View>
  <LoadState {...state}/>
  {!state.loading&&state.data&&<View style={local.content}>
   {state.data.entries.length===0?<Text style={styles.body}>Your entries will appear here.</Text>:
    Object.entries(groups??{}).map(([month,entries])=><View key={month} style={local.month}>
      <Text style={styles.eyebrow}>{month.toUpperCase()}</Text>
      {entries.map(entry=><View key={entry.date} style={local.entry}>
        <Text style={local.date}>{fullDate(entry.date)}</Text>
        <Text style={local.body}>{entry.text}</Text>
      </View>)}
    </View>)}
  </View>}
 </Screen>;
}

const local=StyleSheet.create({
 back:{alignSelf:'flex-start',paddingVertical:8,marginTop:6},backText:{fontSize:13,fontWeight:'700',color:theme.colors.sage},
 heading:{marginTop:8,marginBottom:22,gap:5},title:{fontFamily:theme.fonts.heading,fontSize:35,lineHeight:40,color:theme.colors.ink,letterSpacing:-.9},private:{fontSize:12.5,color:theme.colors.muted},
 content:{gap:26},month:{gap:4},entry:{paddingVertical:15,borderBottomWidth:1,borderBottomColor:theme.colors.line,gap:6},date:{fontSize:12,fontWeight:'700',color:theme.colors.muted},body:{fontSize:14,lineHeight:21,color:theme.colors.inkSoft},
});
