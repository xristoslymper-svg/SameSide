import { supabase } from '../lib/supabase';

export const routinePatterns = ['low_connection','logistics_only','low_novelty','low_affection','fragmented_attention','low_anticipation','doing_well'] as const;
export type RoutinePattern = typeof routinePatterns[number];
export const behavioralTargets = ['curiosity','emotional_conversation','playfulness','novelty','spontaneity','quality_attention','physical_affection','verbal_affection','shared_experience','anticipation','appreciation','support'] as const;
export type BehavioralTarget = typeof behavioralTargets[number];
export type RootsPulse = { pattern: RoutinePattern|null; target: BehavioralTarget|null; can_edit: boolean; week_no: number };

export const patternCopy: Record<RoutinePattern,{label:string;followup:string;targets:BehavioralTarget[]}> = {
 low_connection:{label:'We’re together a lot, but not really connecting',followup:'What would make time together feel more connected?',targets:['curiosity','emotional_conversation','quality_attention','shared_experience']},
 logistics_only:{label:'Most of our conversations are practical',followup:'What tends to get lost?',targets:['curiosity','emotional_conversation','playfulness','quality_attention']},
 low_novelty:{label:'We keep doing the same things together',followup:'What has faded most?',targets:['novelty','spontaneity','playfulness','shared_experience']},
 low_affection:{label:'Affection has become less spontaneous',followup:'Which kind of warmth would you like to make more room for?',targets:['physical_affection','verbal_affection','appreciation']},
 fragmented_attention:{label:'We rarely give each other our full attention',followup:'What would help you feel more present with each other?',targets:['quality_attention','curiosity','emotional_conversation']},
 low_anticipation:{label:'We don’t really look forward to time together',followup:'What would you like to bring back?',targets:['anticipation','novelty','spontaneity','shared_experience','playfulness']},
 doing_well:{label:'We’re actually doing pretty well',followup:'What would you love to keep growing?',targets:['appreciation','playfulness','quality_attention','physical_affection','shared_experience','anticipation']},
};
export const targetLabels:Record<BehavioralTarget,string>={
 curiosity:'Curiosity about each other',emotional_conversation:'Real conversations',playfulness:'Laughing and being silly',novelty:'Trying new things',spontaneity:'Spontaneous moments',quality_attention:'Full attention',physical_affection:'Affectionate touch',verbal_affection:'Warm words',shared_experience:'Time that feels shared',anticipation:'Something to look forward to',appreciation:'Feeling appreciated',support:'Feeling supported',
};

export async function readRoots():Promise<RootsPulse>{
 if(!supabase) throw new Error('We couldn’t open your check-in. Please try again.');
 const {data,error}=await supabase.rpc('get_my_root_pulse');
 if(error||!data) throw new Error('We couldn’t open your check-in. Please try again.');
 return data as RootsPulse;
}
export async function saveRoots(pattern:RoutinePattern,target:BehavioralTarget):Promise<RootsPulse>{
 if(!supabase) throw new Error('We couldn’t save that just yet. Please try again.');
 const {data,error}=await supabase.rpc('save_my_root_pulse',{pattern,target});
 if(error||!data) throw new Error(error?.message.includes('roots_period_not_available')?'This check-in has ended. Your saved Roots are still here.':'We couldn’t save that just yet. Your choices are still here to try again.');
 return data as RootsPulse;
}
