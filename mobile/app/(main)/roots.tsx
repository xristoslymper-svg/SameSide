import { useCallback,useEffect,useRef,useState } from 'react';
import { Pressable,Text,View } from 'react-native';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState,useProductData } from '../../src/components/product';
import { getProgram } from '../../src/features/product';
import { readRoots,saveRoots,patternCopy,targetLabels,type RoutinePattern,type BehavioralTarget } from '../../src/features/roots';
import { useAuth } from '../../src/providers/AuthProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { TodaysRead } from '../../src/components/DailyNoticing';
import { theme } from '../../src/theme';

const steps=[
 {title:'Notice each other again',copy:'You’re starting by bringing attention back to the small things that routine can make easy to miss.'},
 {title:'Change the default',copy:'You’re interrupting autopilot by putting more warmth, choice and novelty into ordinary days.'},
 {title:'Change the pattern in the moment',copy:'You’re practising different responses when the old automatic reactions start to show up.'},
 {title:'Keep what works',copy:'You’re reinforcing the changes that helped so they can become part of everyday life.'},
];
const patterns=Object.keys(patternCopy) as RoutinePattern[];

export default function Roots(){
 const {session}=useAuth();const {save,busy:inviting}=useOnboarding();
 const load=useCallback(async()=>({program:await getProgram(session!.user.id),roots:await readRoots()}),[session!.user.id]);
 const state=useProductData(load);const [editing,setEditing]=useState(false);const [pattern,setPattern]=useState<RoutinePattern|null>(null);const [target,setTarget]=useState<BehavioralTarget|null>(null);const [busy,setBusy]=useState(false);const locked=useRef(false);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{if(state.data){setPattern(state.data.roots.pattern);setTarget(state.data.roots.target);setEditing(false);setError(null);}},[state.data]);
 const saved=!!state.data?.roots.pattern&&!!state.data?.roots.target&&!editing;
 async function submit(){if(locked.current||!pattern||!target)return;locked.current=true;setBusy(true);setError(null);try{await saveRoots(pattern,target);setEditing(false);await state.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{locked.current=false;setBusy(false);}}
 function choosePattern(next:RoutinePattern){setPattern(next);setTarget(null);}
 const section={padding:20,borderRadius:24,borderWidth:1,borderColor:theme.colors.line,backgroundColor:theme.colors.card,gap:12} as const;
 const option=(selected:boolean)=>({paddingVertical:14,paddingHorizontal:16,borderRadius:18,borderWidth:1,borderColor:selected?theme.colors.sage:theme.colors.line,backgroundColor:selected?theme.colors.sageLight:theme.colors.card} as const);
 const step=Math.min(4,Math.max(1,state.data?.program.week??1));const stepInfo=steps[step-1];
 return <Screen><AppHeader/><View style={{marginTop:24,gap:6}}><Text style={styles.eyebrow}>Roots</Text><Text style={[styles.title,{fontSize:34,lineHeight:40,letterSpacing:-.7}]}>A private space that helps shape what comes next.</Text></View>
  <LoadState {...state}/>{!state.loading&&state.data&&<View style={{gap:16}}>
   <View style={[section,{backgroundColor:'#F4EFE7'}]}><Text style={styles.eyebrow}>YOUR CURRENT STEP</Text><Text style={[styles.cardTitle,{fontSize:24,lineHeight:30}]}>{stepInfo.title}</Text><Text style={styles.small}>Step {step} of 4</Text><Text style={[styles.body,{marginTop:2}]}>{stepInfo.copy}</Text><Text style={[styles.body,{marginTop:2}]}>Your private check-in helps Same Side choose small actions that fit the pattern you’re actually in.</Text></View>

   <View style={section}><Text style={styles.eyebrow}>WHAT FEELS TRUE LATELY?</Text>
    {saved?<><Text style={[styles.cardTitle,{fontSize:22,lineHeight:28}]}>{patternCopy[state.data.roots.pattern!].label}</Text><View style={{paddingVertical:11,paddingHorizontal:16,borderRadius:999,backgroundColor:theme.colors.sageLight,alignSelf:'flex-start'}}><Text style={styles.label}>{targetLabels[state.data.roots.target!]}</Text></View><Text style={styles.small}>Private to you. This quietly shapes which Routine actions are more likely to come next.</Text>{state.data.roots.can_edit&&<Pressable accessibilityRole="button" onPress={()=>{setPattern(state.data!.roots.pattern);setTarget(state.data!.roots.target);setEditing(true);}} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}}><Text style={styles.label}>Change my check-in →</Text></Pressable>}</>:
    state.data.roots.can_edit?<><Text style={[styles.cardTitle,{fontSize:23,lineHeight:29}]}>Choose what best matches how things have been between you.</Text><View style={{gap:9}}>{patterns.map(p=><Pressable key={p} accessibilityRole="button" accessibilityState={{selected:pattern===p}} disabled={busy} onPress={()=>choosePattern(p)} style={option(pattern===p)}><Text style={styles.label}>{patternCopy[p].label}</Text></Pressable>)}</View>
    {pattern&&<View style={{gap:10,marginTop:8,paddingTop:18,borderTopWidth:1,borderTopColor:theme.colors.line}}><Text style={[styles.cardTitle,{fontSize:21,lineHeight:27}]}>{patternCopy[pattern].followup}</Text><Text style={styles.small}>Choose the one that feels closest. There’s no right answer.</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}>{patternCopy[pattern].targets.map(t=><Pressable key={t} accessibilityRole="button" accessibilityState={{selected:target===t}} disabled={busy} onPress={()=>setTarget(t)} style={{paddingVertical:11,paddingHorizontal:15,borderRadius:999,borderWidth:1,borderColor:target===t?theme.colors.sage:theme.colors.line,backgroundColor:target===t?theme.colors.sageLight:theme.colors.card}}><Text style={styles.label}>{targetLabels[t]}</Text></Pressable>)}</View></View>}
    <Button label="Keep this" disabled={!pattern||!target} busy={busy} onPress={()=>{void submit();}}/>{editing&&<Button label="Cancel" secondary disabled={busy} onPress={()=>{setPattern(state.data!.roots.pattern);setTarget(state.data!.roots.target);setEditing(false);setError(null);}}/>}</>:<Text style={styles.body}>This check-in has come to a close for The Routine.</Text>}</View>
   {error&&<Notice>{error}</Notice>}

   <View style={section}><Text style={styles.eyebrow}>A LITTLE PERSPECTIVE</Text><Text style={styles.body}>A short idea connected to the pattern you’re working on, with one thing to notice in real life.</Text><TodaysRead date={state.data.program.today}/></View>

   {state.data.program.memberCount===1&&!state.data.program.relationshipClosed&&<View style={{marginTop:12,paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line}}><Text style={styles.eyebrow}>When you’re ready</Text><Text style={[styles.cardTitle,{fontSize:22,marginTop:5}]}>Bring your partner in</Text><Text style={[styles.body,{marginTop:6}]}>You can keep beginning on your own. Invite them whenever it feels right.</Text><Pressable accessibilityRole="button" disabled={inviting} onPress={()=>{void save({step:'invite'});}} style={{minHeight:48,justifyContent:'center',alignSelf:'flex-start'}}><Text style={styles.label}>{inviting?'A moment…':'Invite my partner →'}</Text></Pressable></View>}
   {state.data.program.relationshipClosed&&<View style={{marginTop:12,paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line,gap:8}}><Text style={styles.eyebrow}>Your shared space</Text><Text style={[styles.cardTitle,{fontSize:22}]}>This garden is no longer connected.</Text><Text style={styles.body}>You can keep this space as it is. If you want to begin with someone new, use Relationship settings in Account to start fresh.</Text></View>}
  </View>}</Screen>;
}
