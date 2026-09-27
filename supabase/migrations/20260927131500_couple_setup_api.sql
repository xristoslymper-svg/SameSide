-- Finish the couple-only setup contract at the API boundary.

create or replace function public.create_relationship(timezone_name text)
returns uuid
language sql security invoker set search_path='' as $$
 select private.create_relationship(timezone_name)
$$;
revoke all on function public.create_relationship(text) from public,anon;
grant execute on function public.create_relationship(text) to authenticated;

create or replace function private.choose_shared_flower(flower text)
returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 if flower is null or flower not in ('cosmos','forget-me-not','zinnia','daisy','calendula','cornflower') then raise exception 'invalid_flower'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active' for update of rel,m;
 if r.id is null then raise exception 'no_active_relationship'; end if;
 if r.selected_flower is not null then
  if r.selected_flower=flower then return flower; end if;
  raise exception 'flower_already_chosen';
 end if;
 if r.created_by<>u and not r.legacy_flower_choice then raise exception 'only_creator_can_choose'; end if;
 update public.relationships set selected_flower=flower,legacy_flower_choice=false where id=r.id;
 perform private.maybe_activate_routine(r.id);
 return flower;
end $$;

create or replace function private.save_my_root_pulse(pattern text,target text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; active_days integer; wk integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if pattern is null or pattern not in ('low_connection','logistics_only','low_novelty','low_affection','fragmented_attention','low_anticipation','doing_well') then raise exception using message='invalid_root_pattern'; end if;
 if target is null or target not in ('curiosity','emotional_conversation','playfulness','novelty','spontaneity','quality_attention','physical_affection','verbal_affection','shared_experience','anticipation','appreciation','support') then raise exception using message='invalid_root_target'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for share;
 if r.status<>'active' or r.active_path<>'routine' or r.routine_activated_at is null then raise exception using message='roots_period_not_available'; end if;
 select count(distinct g.event_date)::integer into active_days from public.garden_events g
 where g.relationship_id=rid and g.event_date>=r.path_started_at;
 active_days:=coalesce(active_days,0);
 if active_days>=28 then raise exception using message='roots_period_not_available'; end if;
 wk:=least(4,(active_days/7)+1);
 insert into public.root_pulses(relationship_id,user_id,week_no,routine_pattern,behavioral_target)
 values(rid,u,wk,pattern,target)
 on conflict(relationship_id,user_id,week_no) do update
 set routine_pattern=excluded.routine_pattern,behavioral_target=excluded.behavioral_target,updated_at=now();
 return jsonb_build_object('pattern',pattern,'target',target,'can_edit',true,'week_no',wk);
end $$;

revoke all on function private.choose_shared_flower(text),private.save_my_root_pulse(text,text) from public,anon,authenticated;
grant execute on function private.choose_shared_flower(text),private.save_my_root_pulse(text,text) to authenticated;
notify pgrst, 'reload schema';
