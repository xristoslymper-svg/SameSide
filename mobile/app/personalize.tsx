import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Notice, styles } from '../src/components/ui';
import { Choice, FlowScreen } from '../src/components/onboarding';
import { useOnboarding, type Focus } from '../src/providers/OnboardingProvider';
const choices:[Focus,string][]=[['fun','Fun'],['affection','Affection'],['conversation','Good conversations'],['appreciation','Feeling appreciated'],['time','Time together'],['novelty','Something new']];
export default function PersonalizeScreen(){const {progress,save,busy}=useOnboarding();const [starting,setStarting]=useState(false);const [error,setError]=useState<string|null>(null);const selected=progress.focus??[];
 async function toggle(focus:Focus){const exists=selected.includes(focus);if(!exists&&selected.length>=3){setError('Choose up to three.');return;}setError(null);await save({focus:exists?selected.filter(x=>x!==focus):[...selected,focus]});}
 async function start(){if(starting)return;setStarting(true);setError(null);try{await save({step:'flower'});}catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{setStarting(false);}}
 return <FlowScreen><Text style={styles.eyebrow}>A little intention</Text><Text style={[styles.title,{fontSize:35,lineHeight:40,letterSpacing:-1}]}>What feels most{`\n`}missing lately?</Text><Text style={[styles.body,{fontSize:15,lineHeight:22}]}>Choose up to three.</Text><View style={{gap:10}}>{choices.map(([focus,title])=><Choice compact key={focus} title={title} selected={selected.includes(focus)} disabled={busy} onPress={()=>{void toggle(focus);}}/>)}</View>{error&&<Notice>{error}</Notice>}<Button label="Continue" busy={starting} disabled={busy} onPress={()=>{void start();}}/><Button label="Back to your path" secondary disabled={busy} onPress={()=>{void save({step:'path'});}}/></FlowScreen>;
}