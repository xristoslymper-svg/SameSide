-- Keep client wrappers invoker-safe while private functions enforce auth.uid() ownership.
create index if not exists routine_member_preferences_user_idx
on private.routine_member_preferences(user_id);

create or replace function private.read_my_routine_preferences()
returns text[]
language sql stable security definer set search_path='' as $$
 select coalesce((
   select p.onboarding_focus
   from private.routine_member_preferences p
   join public.relationship_members m on m.relationship_id=p.relationship_id and m.user_id=p.user_id and m.left_at is null
   where p.user_id=auth.uid()
   limit 1
 ),'{}'::text[])
$$;

create or replace function public.get_my_routine_preferences()
returns text[]
language sql stable security invoker set search_path='' as $$
 select private.read_my_routine_preferences()
$$;

create or replace function private.read_my_root_pulse() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; active_days integer; wk integer; p public.root_pulses%rowtype;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active';
 if r.id is null then raise exception using message='no_active_relationship'; end if;
 select count(distinct g.event_date)::integer into active_days from public.garden_events g
 where g.relationship_id=r.id and g.event_date>=r.path_started_at;
 active_days:=coalesce(active_days,0); wk:=least(4,(least(active_days,27)/7)+1);
 select * into p from public.root_pulses where relationship_id=r.id and user_id=u and week_no=wk;
 return jsonb_build_object('pattern',p.routine_pattern,'target',p.behavioral_target,
   'can_edit',r.active_path='routine' and active_days<28,'week_no',wk);
end $$;

create or replace function public.get_my_root_pulse() returns jsonb
language sql stable security invoker set search_path='' as $$
 select private.read_my_root_pulse()
$$;

revoke all on function private.read_my_routine_preferences(),private.read_my_root_pulse(),
 private.save_my_routine_preferences(text[]),private.save_my_root_pulse(text,text) from public,anon,authenticated;
grant execute on function private.read_my_routine_preferences(),private.read_my_root_pulse(),
 private.save_my_routine_preferences(text[]),private.save_my_root_pulse(text,text) to authenticated;

revoke all on function public.get_my_routine_preferences(),public.get_my_root_pulse() from public,anon;
grant execute on function public.get_my_routine_preferences(),public.get_my_root_pulse() to authenticated;
notify pgrst, 'reload schema';
