import { useCallback,useEffect,useRef,useState } from 'react';
import { Pressable,Text,View } from 'react-native';
import { Button,Notice,Screen,styles } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState,useProductData } from '../../src/components/product';
import { getProgram } from '../../src/features/product';
import { readRoots,saveRoots,rootChoices,rootLabel,type RootChoice } from '../../src/features/roots';
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

export default function Roots(){
 const {session}=useAuth();const {save,busy:inviting}=useOnboarding();
 const load=useCallback(async()=>({program:await getProgram(session!.user.id),roots:await readRoots()}),[session!.user.id]);
 const state=useProductData(load);const [editing,setEditing]=useState(false);const [choices,setChoices]=useState<RootChoice[]>([]);const [busy,setBusy]=useState(false);const locked=useRef(false);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{if(state.data){setChoices(state.data.roots.choices);setEditing(false);setError(null);}},[state.data]);
 const saved=!!state.data?.roots.choices.length&&!editing;
 async function submit(){if(locked.current||!choices.length||choices.length>2)return;locked.current=true;setBusy(true);setError(null);try{await saveRoots(choices);setEditing(false);await state.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{locked.current=false;setBusy(false);}}
 function toggle(choice:RootChoice){setChoices(current=>current.includes(choice)?current.filter(x=>x!==choice):current.length<2?[...current,choice]:current);}
 const section={padding:20,borderRadius:24,borderWidth:1,borderColor:theme.colors.line,backgroundColor:theme.colors.card,gap:12} as const;
 const step=Math.min(4,Math.max(1,state.data?.program.week??1));const stepInfo=steps[step-1];
 return <Screen><AppHeader/><View style={{marginTop:24,gap:6}}><Text style={styles.eyebrow}>Roots</Text><Text style={[styles.title,{fontSize:34,lineHeight:40,letterSpacing:-.7}]}>A private space that helps shape what comes next.</Text></View>
  <LoadState {...state}/>{!state.loading&&state.data&&<View style={{gap:16}}>
   <View style={[section,{backgroundColor:'#F4EFE7'}]}><Text style={styles.eyebrow}>YOUR CURRENT STEP</Text><Text style={[styles.cardTitle,{fontSize:24,lineHeight:30}]}>{stepInfo.title}</Text><Text style={styles.small}>Step {step} of 4</Text><Text style={[styles.body,{marginTop:2}]}>{stepInfo.copy}</Text><Text style={[styles.body,{marginTop:2}]}>The check-ins below help Same Side understand what feels most useful right now, so the moves you receive can stay relevant to where you are.</Text></View>

   <View style={section}><Text style={styles.eyebrow}>WHAT WOULD HELP THIS WEEK?</Text>{!saved&&<><Text style={[styles.cardTitle,{fontSize:23,lineHeight:29}]}>What would you like a little more of between you?</Text><Text style={styles.body}>Choose up to two. Keep this as it is for as long as it still feels true.</Text></>}{saved?<><Text style={[styles.cardTitle,{fontSize:22,lineHeight:28}]}>What you’re making more room for</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{state.data.roots.choices.map(choice=><View key={choice} style={{paddingVertical:11,paddingHorizontal:16,borderRadius:999,backgroundColor:theme.colors.sageLight}}><Text style={styles.label}>{rootLabel(choice)}</Text></View>)}</View><Text style={styles.small}>Private to you. Change it whenever something else feels more important.</Text>{state.data.roots.can_edit&&<Pressable accessibilityRole="button" onPress={()=>{setChoices(state.data!.roots.choices);setEditing(true);}} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}}><Text style={styles.label}>Change what I need →</Text></Pressable>}</>:state.data.roots.can_edit?<><View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{rootChoices.map(choice=>{const selected=choices.includes(choice);const disabled=busy||(!selected&&choices.length===2);return <Pressable key={choice} accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={()=>toggle(choice)} style={{paddingVertical:11,paddingHorizontal:16,borderRadius:999,borderWidth:1,borderColor:selected?theme.colors.sage:theme.colors.line,backgroundColor:selected?theme.colors.sageLight:theme.colors.card,opacity:disabled&&!busy?.55:1}}><Text style={styles.label}>{rootLabel(choice)}</Text></Pressable>})}</View><Button label="Keep these" disabled={!choices.length} busy={busy} onPress={()=>{void submit();}}/>{editing&&<Button label="Cancel" secondary disabled={busy} onPress={()=>{setEditing(false);setError(null);}}/>}</>:<Text style={styles.body}>This check-in has come to a close for The Routine.</Text>}</View>
   {error&&<Notice>{error}</Notice>}

   <View style={section}><Text style={styles.eyebrow}>A LITTLE PERSPECTIVE</Text><Text style={styles.body}>A short idea connected to the pattern you’re working on, with one thing to notice in real life.</Text><TodaysRead date={state.data.program.today}/></View>

   {state.data.program.memberCount===1&&!state.data.program.relationshipClosed&&<View style={{marginTop:12,paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line}}><Text style={styles.eyebrow}>When you’re ready</Text><Text style={[styles.cardTitle,{fontSize:22,marginTop:5}]}>Bring your partner in</Text><Text style={[styles.body,{marginTop:6}]}>You can keep beginning on your own. Invite them whenever it feels right.</Text><Pressable accessibilityRole="button" disabled={inviting} onPress={()=>{void save({step:'invite'});}} style={{minHeight:48,justifyContent:'center',alignSelf:'flex-start'}}><Text style={styles.label}>{inviting?'A moment…':'Invite my partner →'}</Text></Pressable></View>}
   {state.data.program.relationshipClosed&&<View style={{marginTop:12,paddingTop:22,borderTopWidth:1,borderTopColor:theme.colors.line,gap:8}}><Text style={styles.eyebrow}>Your shared space</Text><Text style={[styles.cardTitle,{fontSize:22}]}>This garden is no longer connected.</Text><Text style={styles.body}>You can keep this space as it is. If you want to begin with someone new, use Relationship settings in Account to start fresh.</Text></View>}
  </View>}</Screen>;
}
