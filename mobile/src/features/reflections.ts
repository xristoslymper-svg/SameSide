import { supabase } from '../lib/supabase';
import { isDemo, demoDiaryRead, demoDiarySave } from '../lib/demo';

export type Reflection = { date: string; text: string | null };

async function readDemoDiary(): Promise<Reflection[]> {
 const entries = demoDiaryRead() as Reflection[];
 const today = await readReflection();
 const merged = today.text && !entries.some(entry => entry.date === today.date) ? [today, ...entries] : entries;
 return merged.filter(entry => !!entry.text).sort((a,b) => b.date.localeCompare(a.date));
}

export async function readReflection(): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t open your private space. Please try again.');
 const { data, error } = await supabase.rpc('get_my_daily_reflection');
 if (error || !data) throw new Error('We couldn’t open your private space. Please try again.');
 return data;
}

export async function readRecentReflections(relationshipId: string, limit = 5): Promise<Reflection[]> {
 if (isDemo) return (await readDemoDiary()).slice(0, limit);
 if (!supabase) throw new Error('We couldn’t open your diary. Please try again.');
 const { data, error } = await supabase.from('daily_reflections').select('reflection_date,body').eq('relationship_id', relationshipId).order('reflection_date', { ascending: false }).limit(limit);
 if (error) throw new Error('We couldn’t open your diary. Please try again.');
 return (data ?? []).map(row => ({ date: row.reflection_date as string, text: row.body as string }));
}

export async function readAllReflections(relationshipId: string): Promise<Reflection[]> {
 if (isDemo) return readDemoDiary();
 if (!supabase) throw new Error('We couldn’t open your diary. Please try again.');
 const { data, error } = await supabase.from('daily_reflections').select('reflection_date,body').eq('relationship_id', relationshipId).order('reflection_date', { ascending: false });
 if (error) throw new Error('We couldn’t open your diary. Please try again.');
 return (data ?? []).map(row => ({ date: row.reflection_date as string, text: row.body as string }));
}

export async function saveReflection(thought: string): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t keep that thought yet. Please try again.');
 const { data, error } = await supabase.rpc('save_my_daily_reflection', { thought });
 if (error || !data) throw new Error('We couldn’t keep that thought yet. Your words are still here to try again.');
 const result = data as Reflection;
 if (isDemo) {
  const current = demoDiaryRead() as Reflection[];
  demoDiarySave([result, ...current.filter(entry => entry.date !== result.date)]);
 }
 return result;
}
