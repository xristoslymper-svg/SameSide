import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';
import { sessionStorage } from '../lib/storage';

export type Reflection = { date: string; text: string | null };
const demoDiaryKey = 'same-side.demo.diary.v1';

async function readDemoDiary(): Promise<Reflection[]> {
 const raw = await sessionStorage.getItem(demoDiaryKey);
 let entries: Reflection[] = [];
 try { entries = raw ? JSON.parse(raw) as Reflection[] : []; } catch { entries = []; }
 // Preserve an entry written before the archive existed.
 const today = await readReflection();
 if (today.text && !entries.some(entry => entry.date === today.date)) entries.push(today);
 return entries.filter(entry => !!entry.text).sort((a,b) => b.date.localeCompare(a.date));
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
  const current = await readDemoDiary();
  const next = [result, ...current.filter(entry => entry.date !== result.date)];
  await sessionStorage.setItem(demoDiaryKey, JSON.stringify(next));
 }
 return result;
}
