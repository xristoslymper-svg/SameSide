-- Read the current user's Roots pulse through a private SECURITY DEFINER helper.
-- public.root_pulses is intentionally not directly readable by authenticated clients.

create or replace function private.read_my_root_pulse() returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  r public.relationships%rowtype;
  day_no integer;
  wk integer;
  p public.root_pulses%rowtype;
begin
  if u is null then raise exception using message='not_authenticated'; end if;

  select rel.* into r
  from public.relationships rel
  join public.relationship_members m on m.relationship_id=rel.id
  where m.user_id=u and m.left_at is null and rel.status='active';

  if r.id is null then raise exception using message='no_active_relationship'; end if;

  day_no:=(statement_timestamp() at time zone r.timezone)::date-r.path_started_at+1;
  wk:=least(4,greatest(1,((day_no-1)/7)+1));

  select * into p
  from public.root_pulses
  where relationship_id=r.id and user_id=u and week_no=wk;

  return jsonb_build_object(
    'pattern',p.routine_pattern,
    'target',p.behavioral_target,
    'can_edit',r.active_path='routine' and day_no between 1 and 28,
    'week_no',wk
  );
end $$;

revoke all on function private.read_my_root_pulse() from public,anon,authenticated;

create or replace function public.get_my_root_pulse() returns jsonb
language sql
stable
set search_path=''
as $$
  select private.read_my_root_pulse()
$$;

revoke all on function public.get_my_root_pulse() from public,anon;
grant execute on function public.get_my_root_pulse() to authenticated;
