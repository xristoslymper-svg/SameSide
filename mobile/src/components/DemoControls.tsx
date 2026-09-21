import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { demoAvailable, exitDemo, isDemo, startDemo, type DemoScenario } from '../lib/demo';
import { supabase } from '../lib/supabase';
import { Button, Notice, Screen, styles } from './ui';

export function DemoEntry({ quiet = false }: { quiet?: boolean } = {}) {
 if(!demoAvailable||isDemo)return null;
 if(quiet)return <Pressable accessibilityRole="button" onPress={()=>startDemo()} style={({pressed})=>({minHeight:40,alignItems:'center',justifyContent:'center',opacity:pressed?0.72:1})}><Text style={[styles.small,{fontWeight:'700'}]}>Explore demo — no sign-in</Text></Pressable>;
 return <Button label="Explore demo — no sign-in" secondary onPress={()=>startDemo()}/>;
}
export function DemoControls() {
 const [open,setOpen]=useState(false);
 if(!isDemo)return null;
 return <><View style={{backgroundColor:'#E8EDE5',flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16}}>
  <Text style={styles.small}>DEMO · Sample data only</Text><Pressable accessibilityRole="button" onPress={()=>setOpen(true)} style={{minHeight:40,justifyContent:'center'}}><Text style={styles.label}>Demo controls</Text></Pressable>
 </View>{open&&<Modal visible onRequestClose={()=>setOpen(false)}><Screen>
  <Button label="Close demo controls" secondary onPress={()=>setOpen(false)}/>
  <Text style={styles.cardTitle}>Explore Same Side</Text><Text style={styles.body}>These scenarios replace only this tab’s sample data. No real accounts, emails or garden history are changed.</Text>
  {([['fresh','Restart demo from beginning'],['solo','Solo · Week 1'],['paired','Paired · Week 1'],['legacy','Choose a missing flower'],['week3','Week 3 · Established plant'],['bloom','Week 4 · Full bloom']] as [DemoScenario,string][]).map(([value,label])=><Button key={value} label={label} secondary onPress={()=>startDemo(value)}/>)}
  <Button label="Exit demo — return to real app" onPress={exitDemo}/>
 </Screen></Modal>}</>;
}
export function DemoSignIn() {
 const [error,setError]=useState(false);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;void supabase!.auth.signInWithPassword({email:'tester@example.test',password:'demo-only-not-a-real-password'}).then(({error})=>{if(active&&error)setError(true);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[retry]);
 return <Screen><Text style={styles.cardTitle}>Your demo space</Text><Text style={styles.body}>Continuing without an email or password…</Text>{error&&<><Notice>Could not open the local demo.</Notice><Button label="Try demo again" onPress={()=>{setError(false);setRetry(n=>n+1);}}/></>}</Screen>;
}
