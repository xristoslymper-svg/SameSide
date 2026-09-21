import { isDemo, demoToday } from '../lib/demo';
import { supabase } from '../lib/supabase';
import { journeyDay, relationshipDate } from './growth';
import { getRelationshipOverview } from './relationships';

export type Move = { id: string; task_title: string; task_body: string; task_minutes: number; task_why?: string | null; status: string; program_day: number; slot: number; assigned_for_date: string };
export type SharedGardenState = { stage_key: 'seed'|'roots'|'shoot'|'leaves'|'established'|'bud'|'opening'|'bloom'; bloom: boolean; programme_complete: boolean };
export type PhysicalGardenState = { status: 'growing'|'ready_to_plant'|'planted'|'photo_ready'; batch: string | null; plantedAt: string | null; photoUrl: string | null };
function client() {
  if (!supabase) throw new Error('We could not connect. Please try again.');
  return supabase;
}
export async function getMove(slot = 0): Promise<Move> {
  const { data, error } = await client().rpc('get_or_create_today_assignment', { requested_slot: slot });
  if (error) {
    if (error.message.includes('path_not_available') || error.message.includes('path_complete')) throw new Error('No new move today. Your flower is still here to enjoy.');
    if (error.message.includes('daily_limit_reached')) throw new Error('That’s plenty for today. Your flower is here to enjoy.');
    if (error.message.includes('previous_slot_not_completed')) throw new Error('Let’s come back to your current move. Try again to bring it up.');
    throw new Error('We could not load your move. Please try again.');
  }
  const move = Array.isArray(data) ? data[0] : data;
  if (!move?.id || !move.task_title || !move.task_body) throw new Error('We could not load your move. Please try again.');
  return move;
}
export async function getTodayMove(userId: string): Promise<Move> {
  const primary = await getMove();
  if (primary.status !== 'completed') return primary;
  let response = await client().from('task_assignments')
    .select('id,task_title,task_body,task_minutes,task_why,status,program_day,slot,assigned_for_date')
    .eq('user_id', userId).eq('assigned_for_date', primary.assigned_for_date).eq('contract_version', 1)
    .order('slot', { ascending: false }).limit(1).maybeSingle();
  if (response.error?.code === '42703' || response.error?.code === 'PGRST204') {
    response = await client().from('task_assignments')
      .select('id,task_title,task_body,task_minutes,status,program_day,slot,assigned_for_date')
      .eq('user_id', userId).eq('assigned_for_date', primary.assigned_for_date).eq('contract_version', 1)
      .order('slot', { ascending: false }).limit(1).maybeSingle();
  }
  if (response.error) throw new Error('We could not bring up your move. Please try again.');
  return (response.data as Move | null) ?? primary;
}
export async function completeMove(id: string) {
  const { error } = await client().rpc('complete_assignment', { assignment_id: id });
  if (error) throw new Error(error.message.includes('assignment_not_eligible')
    ? 'This move is no longer available. Try again to see today’s move.'
    : 'We couldn’t save that just yet. Please try again.');
}
export async function getGardenState(): Promise<SharedGardenState> {
  const { data, error } = await client().rpc('get_shared_garden_state');
  if (error) throw new Error('We could not load your garden. Please try again.');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.stage_key) throw new Error('We could not load your garden. Please try again.');
  return { stage_key: row.stage_key, bloom: !!row.bloom, programme_complete: !!row.programme_complete } as SharedGardenState;
}
export async function getPhysicalGardenState(): Promise<PhysicalGardenState> {
  const { data, error } = await client().rpc('get_physical_garden_state');
  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.status) return { status: row.status, batch: row.batch ?? null, plantedAt: row.planted_at ?? null, photoUrl: row.photo_url ?? null } as PhysicalGardenState;
  }
  return { status: 'growing', batch: null, plantedAt: null, photoUrl: null };
}
export async function getProgram(userId: string) {
  const membership = await getRelationshipOverview(userId);
  if (!membership) throw new Error('We could not open your space. Please try again.');
  let { data, error } = await client().from('relationships').select('active_path,selected_flower,legacy_flower_choice,path_started_at,timezone').eq('id', membership.relationshipId).single();
  if (error?.code === '42703' || error?.code === 'PGRST204') {
    const old = await client().from('relationships').select('active_path,selected_flower,path_started_at,timezone').eq('id', membership.relationshipId).single();
    data = old.data ? { ...old.data, legacy_flower_choice: false } : null; error = old.error;
  }
  if (error || data?.active_path !== 'routine') throw new Error('We could not open your space. Please try again.');
  if (!data.path_started_at) throw new Error('We could not load your journey dates. Please try again.');
  const today = isDemo ? demoToday() : relationshipDate(data.timezone ?? 'UTC');
  const day = journeyDay(data.path_started_at, today);
  return { ...membership, name: 'The Routine', selectedFlower: data.selected_flower as string | null,
    canChooseFlower: membership.role === 'member_a' || data.legacy_flower_choice === true,
    relationshipClosed: membership.hasDeparture,
    startDate: data.path_started_at as string, today, day, week: Math.min(4, Math.ceil(Math.min(day,28) / 7)) };
}