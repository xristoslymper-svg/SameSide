import { supabase } from '../lib/supabase';

export type RoutineFocus = 'fun' | 'affection' | 'conversation' | 'appreciation' | 'time' | 'novelty';

function client() {
  if (!supabase) throw new Error('Same Side is not connected. Please try again later.');
  return supabase;
}

export async function saveRoutinePreferences(focuses: RoutineFocus[]) {
  const { data, error } = await client().rpc('save_my_routine_preferences', { focuses });
  if (error) throw new Error('We could not save your choices. Please try again.');
  return (data ?? []) as RoutineFocus[];
}

export async function getRoutinePreferences() {
  const { data, error } = await client().rpc('get_my_routine_preferences');
  if (error) throw new Error('We could not load your choices. Please try again.');
  return (data ?? []) as RoutineFocus[];
}
