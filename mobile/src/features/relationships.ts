import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

function client() {
  if (!supabase) throw new Error('Same Side is not connected. Please try again later.');
  return supabase;
}

function message(error: { message?: string } | null, fallback: string) {
  const value = error?.message?.toLowerCase() ?? '';
  if (value.includes('relationship_full') || value.includes('invite_already_used')) return 'This invitation is no longer available.';
  if (value.includes('invite_expired')) return 'This invitation has expired. Ask your partner for a new one.';
  if (value.includes('invite_revoked') || value.includes('invalid_invite') || value.includes('invite_unavailable')) return 'This invitation is no longer available.';
  if (value.includes('own_invite')) return 'This invitation was created by this account.';
  if (value.includes('already_in_relationship')) return 'This account is already connected to a relationship.';
  return fallback;
}

export async function ensureRelationship() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await client().rpc('create_solo_relationship', { timezone_name: timezone });
  if (error || !data) throw new Error(message(error, 'We could not prepare your relationship. Please try again.'));
  return data as string;
}

export async function saveDisplayName(userId: string, displayName: string) {
  const name = displayName.trim();
  if (!name || name.length > 80) throw new Error('Enter the first name your partner will recognize.');
  const { error } = await client().from('profiles').update({ display_name: name }).eq('id', userId);
  if (error) throw new Error('We could not save your name. Please try again.');
  return name;
}

export async function createInvite() {
  const { data, error } = await client().rpc('create_relationship_invite', { valid_hours: 168 });
  if (error || typeof data !== 'string') throw new Error(message(error, 'We could not create your invitation. Please try again.'));
  return data;
}

export function invitationUrl(token: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/invite/${token}`;
  return Linking.createURL(`/invite/${token}`);
}

export type InvitePreview = { state: string; name: string | null };
export async function previewInvite(token: string): Promise<InvitePreview> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return { state: 'invalid', name: null };
  const { data, error } = await client().rpc('preview_relationship_invite', { raw_token: token });
  if (error) throw new Error('We could not open this invitation. Please try again.');
  const row = Array.isArray(data) ? data[0] : data;
  return { state: row?.invite_state ?? 'invalid', name: row?.display_name ?? null };
}

export async function acceptInvite(token: string) {
  const { data, error } = await client().rpc('accept_relationship_invite', { raw_token: token });
  if (error || !data) throw new Error(message(error, 'We could not join you together. Please try again.'));
  return data as string;
}

export async function getRelationshipState(userId: string) {
  const { data, error } = await client().from('relationship_members').select('relationship_id, member_role').eq('user_id', userId).is('left_at', null).maybeSingle();
  if (error) throw new Error('We could not load your relationship. Please try again.');
  if (!data) return null;
  const { count, error: countError } = await client().from('relationship_members').select('user_id', { count: 'exact', head: true }).eq('relationship_id', data.relationship_id).is('left_at', null);
  if (countError) throw new Error('We could not load your relationship. Please try again.');
  return { relationshipId: data.relationship_id as string, role: data.member_role as string, memberCount: count ?? 1 };
}

