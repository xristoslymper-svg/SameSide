import { useCallback,useEffect,useRef,useState } from 'react';
import { Pressable,StyleSheet,Text,View } from 'react-native';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState,useProductData } from '../../src/components/product';
import { getProgram } from '../../src/features/product';
import { readRoots,saveRoots,patternCopy,targetLabels,type RoutinePattern,type BehavioralTarget } from '../../src/features/roots';
import { readReflection,readRecentReflections } from '../../src/features/reflections';
import { useAuth } from '../../src/providers/AuthProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { DailyReflection } from '../../src/components/DailyNoticing';
import { theme } from '../../src/theme';

const steps=[
 {title:'Notice each other again',copy:'Bring attention back to the small things that routine can make easy to miss.'},
 {title:'Change the default',copy:'Put a little more warmth, choice and novelty into ordinary days.'},
 {title:'Change the pattern in the moment',copy:'Practise a different response when an old automatic reaction appears.'},
 {title:'Keep what works',copy:'Repeat the small changes that helped until they start to feel natural.'},
];
const patterns=Object.keys(patternCopy) as RoutinePattern[];

export default function Roots(){
 const {session}=useAuth();const {save,busy:inviting}=useOnboarding();
 const load=useCallback(async()=>{const program=await getProgram(session!.user.id);const [roots,reflection,recent]=await Promise.all([readRoots(),readReflection(),readRecentReflections(program.relationshipId)]);return{program,roots,reflection,recent};},[session!.user.id]);
 const state=useProductData(load);const [editing,setEditing]=useState(false);const [pattern,setPattern]=useState<RoutinePattern|null>(null);const [target,setTarget]=useState<BehavioralTarget|null>(null);const [busy,setBusy]=useState(false);const locked=useRef(false);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{if(state.data){setPattern(state.data.roots.pattern);setTarget(state.data.roots.target);setEditing(false);setError(null);}},[state.data]);
 const saved=!!state.data?.roots.pattern&&!!state.data?.roots.target&&!editing;
 async function submit(){if(locked.current||!pattern||!target)return;locked.current=true;setBusy(true);setError(null);try{await saveRoots(pattern,target);setEditing(false);await state.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{locked.current=false;setBusy(false);}}
 function choosePattern(next:RoutinePattern){setPattern(next);setTarget(null);}
 const step=Math.min(4,Math.max(1,state.data?.program.week??1));const stepInfo=steps[step-1];const checkStep=pattern?2:1;
 return <Screen compact>
  <AppHeader/>
  <View style={local.intro}><Text style={local.title}>Roots</Text><Text style={local.subtitle}>A private space to reflect.</Text></View>
  <LoadState {...state}/>
  {!state.loading&&state.data&&<View style={local.content}>
   <View style={local.pathNote}><Text style={styles.eyebrow}>YOUR CURRENT STEP</Text><View style={local.pathRow}><View style={{flex:1}}><Text style={local.pathTitle}>{stepInfo.title}</Text><Text style={local.pathCopy}>{stepInfo.copy}</Text></View><Text style={local.pathStep}>{step}/4</Text></View></View>

   <View style={local.checkCard}>
    <View style={local.checkTop}><View style={{flex:1}}><Text style={styles.eyebrow}>WHAT FEELS TRUE LATELY?</Text></View>{!saved&&<Text style={local.progress}>{checkStep} / 2</Text>}</View>
    {saved?<>
      <Text style={local.question}>{patternCopy[state.data.roots.pattern!].label}</Text>
      <View style={local.savedTarget}><View style={local.savedDot}/><Text style={local.savedTargetText}>{targetLabels[state.data.roots.target!]}</Text></View>
      <Text style={local.helper}>Private to you. This quietly helps Same Side choose actions that better fit what you’re in right now.</Text>
      {state.data.roots.can_edit&&<Pressable accessibilityRole="button" onPress={()=>{setPattern(state.data!.roots.pattern);setTarget(state.data!.roots.target);setEditing(true);}} style={local.textAction}><Text style={local.textActionText}>Change my check-in →</Text></Pressable>}
    </>:
    state.data.roots.can_edit?<>
      {!pattern?<>
        <Text style={local.question}>Choose what best matches how things have been between you.</Text>
        <View style={local.options}>{patterns.map(p=>{const selected=pattern===p;return <Pressable key={p} accessibilityRole="radio" accessibilityState={{checked:selected}} disabled={busy} onPress={()=>choosePattern(p)} style={({pressed})=>[local.option,pressed&&{opacity:.76}]}><View style={[local.radio,selected&&local.radioSelected]}>{selected&&<View style={local.radioInner}/>}</View><Text style={local.optionText}>{patternCopy[p].label}</Text></Pressable>})}</View>
      </>:<>
        <Pressable accessibilityRole="button" onPress={()=>{setPattern(null);setTarget(null);}} style={local.backAction}><Text style={local.backText}>← Back</Text></Pressable>
        <Text style={local.contextChoice}>{patternCopy[pattern].label}</Text>
        <Text style={local.question}>{patternCopy[pattern].followup}</Text>
        <Text style={local.helper}>Choose the one that feels closest. There’s no right answer.</Text>
        <View style={local.options}>{patternCopy[pattern].targets.map(t=>{const selected=target===t;return <Pressable key={t} accessibilityRole="radio" accessibilityState={{checked:selected}} disabled={busy} onPress={()=>setTarget(t)} style={({pressed})=>[local.option,selected&&local.optionSelected,pressed&&{opacity:.78}]}><View style={[local.radio,selected&&local.radioSelected]}>{selected&&<View style={local.radioInner}/>}</View><Text style={[local.optionText,selected&&{fontWeight:'700'}]}>{targetLabels[t]}</Text></Pressable>})}</View>
        <Button label="Save my answers" disabled={!target} busy={busy} onPress={()=>{void submit();}}/>
        {editing&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>{setPattern(state.data!.roots.pattern);setTarget(state.data!.roots.target);setEditing(false);setError(null);}} style={local.cancelAction}><Text style={local.cancelText}>Cancel</Text></Pressable>}
      </>}
    </>:<Text style={styles.body}>This check-in has come to a close for The Routine.</Text>}
   </View>
   {error&&<Notice>{error}</Notice>}

   <DailyReflection value={state.data.reflection} recent={state.data.recent}/>

   {state.data.program.memberCount===1&&!state.data.program.relationshipClosed&&<View style={local.quietSection}><Text style={styles.eyebrow}>WHEN YOU’RE READY</Text><Text style={local.quietTitle}>Bring your partner in</Text><Text style={local.quietBody}>You can keep beginning on your own. Invite them whenever it feels right.</Text><Pressable accessibilityRole="button" disabled={inviting} onPress={()=>{void save({step:'invite'});}} style={local.textAction}><Text style={local.textActionText}>{inviting?'A moment…':'Invite my partner →'}</Text></Pressable></View>}
   {state.data.program.relationshipClosed&&<View style={local.quietSection}><Text style={styles.eyebrow}>YOUR SHARED SPACE</Text><Text style={local.quietTitle}>This garden is no longer connected.</Text><Text style={local.quietBody}>You can keep this space as it is. If you want to begin with someone new, use Relationship settings in Account to start fresh.</Text></View>}
  </View>}
 </Screen>;
}

const local=StyleSheet.create({
 intro:{marginTop:18,marginBottom:22},
 title:{fontFamily:theme.fonts.heading,fontSize:35,lineHeight:40,color:theme.colors.ink,letterSpacing:-.9},
 subtitle:{fontSize:13.5,lineHeight:20,color:theme.colors.muted,marginTop:3},
 content:{gap:18},
 pathNote:{paddingHorizontal:2,paddingBottom:2},
 pathRow:{flexDirection:'row',alignItems:'flex-start',gap:16,marginTop:7},
 pathTitle:{fontFamily:theme.fonts.heading,fontSize:19,lineHeight:25,color:theme.colors.ink},
 pathCopy:{fontSize:13,lineHeight:19.5,color:theme.colors.muted,marginTop:4},
 pathStep:{fontSize:11,fontWeight:'800',color:theme.colors.mutedSoft,letterSpacing:.6,marginTop:3},
 checkCard:{backgroundColor:theme.colors.card,borderWidth:1,borderColor:theme.colors.line,borderRadius:28,padding:20,gap:14,...theme.shadow.card},
 checkTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
 progress:{fontSize:11,fontWeight:'800',color:theme.colors.mutedSoft,letterSpacing:.7},
 question:{fontFamily:theme.fonts.heading,fontSize:24,lineHeight:30,color:theme.colors.ink,letterSpacing:-.3},
 helper:{fontSize:12.5,lineHeight:18.5,color:theme.colors.muted},
 options:{gap:7},
 option:{minHeight:54,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:theme.colors.line},
 optionSelected:{backgroundColor:theme.colors.sageWash,borderRadius:15,borderBottomWidth:0},
 radio:{width:20,height:20,borderRadius:10,borderWidth:1.4,borderColor:'#9A948A',alignItems:'center',justifyContent:'center'},
 radioSelected:{borderColor:theme.colors.sage,backgroundColor:theme.colors.sage},
 radioInner:{width:6,height:6,borderRadius:3,backgroundColor:theme.colors.white},
 optionText:{flex:1,fontSize:13.5,lineHeight:19,color:theme.colors.inkSoft},
 contextChoice:{fontSize:12.5,lineHeight:18,color:theme.colors.sage,fontWeight:'700'},
 backAction:{minHeight:36,justifyContent:'center',alignSelf:'flex-start',marginBottom:-4},
 backText:{fontSize:12.5,fontWeight:'700',color:theme.colors.muted},
 savedTarget:{flexDirection:'row',alignItems:'center',gap:9,alignSelf:'flex-start',paddingHorizontal:13,paddingVertical:9,borderRadius:999,backgroundColor:theme.colors.sageWash},
 savedDot:{width:7,height:7,borderRadius:4,backgroundColor:theme.colors.sage},
 savedTargetText:{fontSize:12.5,fontWeight:'700',color:theme.colors.ink},
 textAction:{minHeight:42,justifyContent:'center',alignSelf:'flex-start'},
 textActionText:{fontSize:13.5,fontWeight:'700',color:theme.colors.sage},
 cancelAction:{minHeight:40,justifyContent:'center',alignItems:'center'},
 cancelText:{fontSize:13,color:theme.colors.muted,fontWeight:'600'},
 quietSection:{paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line,gap:7},
 quietTitle:{fontFamily:theme.fonts.heading,fontSize:20,lineHeight:26,color:theme.colors.ink},
 quietBody:{fontSize:13.5,lineHeight:20.5,color:theme.colors.muted},
});
