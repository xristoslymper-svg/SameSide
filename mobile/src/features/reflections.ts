import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';

export type Reflection = { date: string; text: string | null };

export async function readReflection(): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t open your private space. Please try again.');
 const { data, error } = await supabase.rpc('get_my_daily_reflection');
 if (error || !data) throw new Error('We couldn’t open your private space. Please try again.');
 return data;
}

export async function readRecentReflections(relationshipId: string, limit = 5): Promise<Reflection[]> {
 // The isolated demo implements the reflection RPCs, but it does not expose the
 // underlying daily_reflections REST table. Recent history is therefore empty
 // in demo rather than failing the whole Roots screen.
 if (isDemo) return [];
 if (!supabase) throw new Error('We couldn’t open your diary. Please try again.');
 const { data, error } = await supabase
  .from('daily_reflections')
  .select('reflection_date,body')
  .eq('relationship_id', relationshipId)
  .order('reflection_date', { ascending: false })
  .limit(limit);
 if (error) throw new Error('We couldn’t open your diary. Please try again.');
 return (data ?? []).map(row => ({ date: row.reflection_date as string, text: row.body as string }));
}

export async function saveReflection(thought: string): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t keep that thought yet. Please try again.');
 const { data, error } = await supabase.rpc('save_my_daily_reflection', { thought });
 if (error || !data) throw new Error('We couldn’t keep that thought yet. Your words are still here to try again.');
 return data;
}
