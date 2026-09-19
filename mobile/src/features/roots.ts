import { supabase } from '../lib/supabase';

export const rootChoices = ['affection', 'fun', 'conversation', 'spontaneity', 'attention', 'support'] as const;
export type RootChoice = typeof rootChoices[number];
export type RootsState = { choices: RootChoice[]; can_edit: boolean };
export const rootLabel = (choice: RootChoice) => choice[0].toUpperCase() + choice.slice(1);
export async function readRoots(): Promise<RootsState> {
  if (!supabase) throw new Error('We couldn’t open your check-in. Please try again.');
  const { data, error } = await supabase.rpc('get_my_root_preferences');
  if (error || !data) throw new Error('We couldn’t open your check-in. Please try again.');
  return data;
}
export async function saveRoots(choices: RootChoice[]): Promise<RootsState> {
  if (!supabase) throw new Error('We couldn’t save that just yet. Please try again.');
  const { data, error } = await supabase.rpc('save_my_root_preferences', { choices });
  if (error || !data) throw new Error(error?.message.includes('roots_period_not_available')
    ? 'This check-in has ended. Your saved roots are still here.'
    : 'We couldn’t save that just yet. Your choices are still here to try again.');
  return data;
}
