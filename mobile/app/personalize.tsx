import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Loading, Notice, styles } from '../src/components/ui';
import { Choice, FlowScreen } from '../src/components/onboarding';
import { useOnboarding, type Focus } from '../src/providers/OnboardingProvider';
import { ensureRelationship, getRelationshipState } from '../src/features/relationships';
import { saveRoutinePreferences } from '../src/features/personalization';
import { useAuth } from '../src/providers/AuthProvider';

const choices:[Focus,string][]=[['fun','Fun'],['affection','Affection'],['conversation','Good conversations'],['appreciation','Feeling appreciated'],['time','Time together'],['novelty','Something new']];

export default function PersonalizeScreen(){
 const {session}=useAuth();
 const {progress,save,busy,destination}=useOnboarding();
 const [starting,setStarting]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [role,setRole]=useState<string|null>(null);
 const [roleLoaded,setRoleLoaded]=useState(false);
 const selected=progress.focus??[];

 useEffect(()=>{let active=true;if(!session)return;setRoleLoaded(false);void getRelationshipState(session.user.id).then(r=>{if(active)setRole(r?.role??null);}).catch(()=>{if(active)setRole(null);}).finally(()=>{if(active)setRoleLoaded(true);});return()=>{active=false};},[session]);

 if(destination!=='/personalize') return <Redirect href={destination}/>;
 if(!roleLoaded) return <Loading/>;

 async function toggle(focus:Focus){
  const exists=selected.includes(focus);
  if(!exists&&selected.length>=3){setError('Choose up to three.');return;}
  setError(null);
  await save({focus:exists?selected.filter(x=>x!==focus):[...selected,focus]});
 }

 async function start(){
  if(starting||selected.length===0)return;
  setStarting(true);setError(null);
  try{
   await ensureRelationship();
   const relationship=await getRelationshipState(session!.user.id);
   await saveRoutinePreferences(selected);
   await save({step:relationship?.role==='member_b'?'done':'flower'});
  }catch(cause){
   setError(cause instanceof Error?cause.message:'Please try again.');
  }finally{setStarting(false);}
 }

 return <FlowScreen>
  <Text style={styles.eyebrow}>{role==='member_b'?'YOUR PART OF THE SETUP':'A LITTLE INTENTION'}</Text>
  <Text style={[styles.title,{fontSize:36,lineHeight:43,letterSpacing:-0.8}]}>What feels most{'\n'}missing lately?</Text>
  <Text style={[styles.body,{fontSize:15,lineHeight:24}]}>Choose up to three. We’ll use your answers to personalize the daily actions you both receive.</Text>
  <View style={{gap:10}}>{choices.map(([focus,title])=><Choice compact key={focus} title={title} selected={selected.includes(focus)} disabled={busy} onPress={()=>{void toggle(focus);}}/>)}</View>
  {error&&<Notice>{error}</Notice>}
  <Button label={role==='member_b'?'Finish setup':'Continue'} busy={starting} disabled={busy||selected.length===0} onPress={()=>{void start();}}/>
  {role!=='member_b'&&<Button label="Back to your path" secondary disabled={busy} onPress={()=>{void save({step:'path'});}}/>}
 </FlowScreen>;
}
