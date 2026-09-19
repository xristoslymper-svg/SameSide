import { supabase } from '../lib/supabase';
export type Reflection = { date: string; text: string | null };
export async function readReflection(): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t open your private space. Please try again.');
 const { data, error } = await supabase.rpc('get_my_daily_reflection');
 if (error || !data) throw new Error('We couldn’t open your private space. Please try again.');
 return data;
}
export async function saveReflection(thought: string): Promise<Reflection> {
 if (!supabase) throw new Error('We couldn’t keep that thought yet. Please try again.');
 const { data, error } = await supabase.rpc('save_my_daily_reflection', { thought });
 if (error || !data) throw new Error('We couldn’t keep that thought yet. Your words are still here to try again.');
 return data;
}
