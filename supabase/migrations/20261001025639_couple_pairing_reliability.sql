-- Repair pairing without changing content or existing history.

-- Relationship Lifecycle v1: privacy-safe partner identity, disconnect/cancel-invite
-- controls, late-join context, and an explicit physical-garden fulfilment state.
-- No partner task, completion, Roots, reflection, or raw activity data is exposed.

alter table public.relationships
  add column if not exists physical_garden_status text not null default 'growing',
  add column if not exists physical_garden_batch text,
  add column if not exists physical_garden_planted_at timestamptz,
  add column if not exists physical_garden_photo_url text;

alter table public.relationships
  drop constraint if exists relationships_physical_garden_status_check;
alter table public.relationships
  add constraint relationships_physical_garden_status_check
  check (physical_garden_status in ('growing','ready_to_plant','planted','photo_ready'));



create or replace function private.get_relationship_overview()
returns table(
  relationship_id uuid,
  my_role text,
  active_member_count integer,
  partner_name text,
  partner_active boolean,
  has_departure boolean,
  my_joined_at timestamptz,
  my_joined_day integer,
  partner_joined_at timestamptz
)
language plpgsql stable security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  rid uuid;
  r public.relationships%rowtype;
  me public.relationship_members%rowtype;
  other public.relationship_members%rowtype;
begin
  if u is null then return; end if;
  select * into me from public.relationship_members
   where user_id=u and left_at is null
   order by joined_at desc limit 1;
  if me.user_id is null then return; end if;
  rid:=me.relationship_id;
  select * into r from public.relationships where id=rid;
  if r.id is null then return; end if;
  select * into other from public.relationship_members
   where relationship_members.relationship_id=rid and user_id<>u
   order by joined_at desc limit 1;

  relationship_id:=rid;
  my_role:=me.member_role::text;
  select count(*)::integer into active_member_count
   from public.relationship_members where relationship_members.relationship_id=rid and left_at is null;
  if other.user_id is not null then
    select p.display_name into partner_name from public.profiles p where p.id=other.user_id;
    partner_active:=other.left_at is null;
    partner_joined_at:=other.joined_at;
  else
    partner_name:=null;
    partner_active:=false;
    partner_joined_at:=null;
  end if;
  select exists(
    select 1 from public.relationship_members
    where relationship_members.relationship_id=rid and left_at is not null
  ) into has_departure;
  my_joined_at:=me.joined_at;
  my_joined_day:=greatest(1, ((me.joined_at at time zone r.timezone)::date - r.path_started_at + 1));
  return next;
end $$;

create or replace function public.get_relationship_overview()
returns table(
  relationship_id uuid,
  my_role text,
  active_member_count integer,
  partner_name text,
  partner_active boolean,
  has_departure boolean,
  my_joined_at timestamptz,
  my_joined_day integer,
  partner_joined_at timestamptz
)
language sql security invoker set search_path='' as $$ select * from private.get_relationship_overview() $$;

revoke all on function private.get_relationship_overview(),public.get_relationship_overview() from public,anon,authenticated;
grant execute on function private.get_relationship_overview(),public.get_relationship_overview() to authenticated;

create or replace function private.leave_relationship()
returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
  if u is null then raise exception using message='not_authenticated'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null;
  if rid is null then raise exception using message='no_active_relationship'; end if;
  perform 1 from public.relationships where id=rid for update;
  update public.relationship_invites
   set revoked_at=statement_timestamp()
   where relationship_id=rid and accepted_at is null and revoked_at is null;
  update public.relationship_members
   set left_at=statement_timestamp()
   where relationship_id=rid and user_id=u and left_at is null;
  return rid;
end $$;

create or replace function public.leave_relationship()
returns uuid
language sql security invoker set search_path='' as $$ select * from private.leave_relationship() $$;

revoke all on function private.leave_relationship(),public.leave_relationship() from public,anon,authenticated;
grant execute on function private.leave_relationship(),public.leave_relationship() to authenticated;

create or replace function private.get_physical_garden_state()
returns table(
  status text,
  batch text,
  planted_at timestamptz,
  photo_url text
)
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; bloomed boolean:=false;
begin
  if u is null then return; end if;
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null;
  if rid is null then return; end if;
  select * into r from public.relationships where id=rid;
  if r.id is null then return; end if;
  select s.bloom into bloomed from private.read_shared_garden_state() s limit 1;
  status:=case when r.physical_garden_status='growing' and coalesce(bloomed,false)
    then 'ready_to_plant' else r.physical_garden_status end;
  batch:=r.physical_garden_batch;
  planted_at:=r.physical_garden_planted_at;
  photo_url:=r.physical_garden_photo_url;
  return next;
end $$;

create or replace function public.get_physical_garden_state()
returns table(
  status text,
  batch text,
  planted_at timestamptz,
  photo_url text
)
language sql security invoker set search_path='' as $$ select * from private.get_physical_garden_state() $$;

revoke all on function private.get_physical_garden_state(),public.get_physical_garden_state() from public,anon,authenticated;
grant execute on function private.get_physical_garden_state(),public.get_physical_garden_state() to authenticated;

do $$ begin
 if to_regprocedure('public.development_reset_my_sameside_data()') is not null then
  revoke all on function public.development_reset_my_sameside_data() from public,anon,authenticated;
 end if;
end $$;

drop index if exists public.assignment_daily_slot;
create unique index if not exists assignment_relationship_daily_slot
on public.task_assignments(relationship_id,user_id,assigned_for_date,slot) where contract_version=1;

create or replace function private.issue_assignment(requested_slot integer) returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; m public.relationship_members%rowtype;
 a public.task_assignments%rowtype; t private.task_catalogue%rowtype; today date;
 active_days_before integer; programme_day integer; programme_step integer; completed_count integer;
 my_focus text[]:='{}'; partner_focus text[]:='{}'; my_target text; partner_target text;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if requested_slot is null or requested_slot not between 0 and 2 then raise exception using message='invalid_slot'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 if r.routine_activated_at is null then raise exception using message='routine_not_ready'; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 if r.active_path<>'routine' or today<r.path_started_at then raise exception using message='path_not_available'; end if;
 if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;
 select count(distinct g.event_date)::integer into active_days_before from public.garden_events g
 where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<today;
 active_days_before:=coalesce(active_days_before,0);
 if active_days_before>=28 then raise exception using message='path_complete'; end if;
 programme_day:=active_days_before+1; programme_step:=least(4,(active_days_before/7)+1);
 select * into a from public.task_assignments where relationship_id=rid and user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;
 select count(*) into completed_count from public.task_assignments where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(select 1 from public.task_assignments where relationship_id=rid and user_id=u and assigned_for_date=today and slot=requested_slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;

 select p.onboarding_focus into my_focus from private.routine_member_preferences p where p.relationship_id=rid and p.user_id=u;
 select p.onboarding_focus into partner_focus from private.routine_member_preferences p where p.relationship_id=rid and p.user_id<>u
 and exists(select 1 from public.relationship_members rm where rm.relationship_id=rid and rm.user_id=p.user_id and rm.left_at is null)
 order by p.updated_at desc limit 1;
 my_focus:=coalesce(my_focus,'{}'::text[]); partner_focus:=coalesce(partner_focus,'{}'::text[]);
 select behavioral_target into my_target from public.root_pulses where relationship_id=rid and user_id=u and week_no=programme_step order by updated_at desc limit 1;
 select rp.behavioral_target into partner_target from public.root_pulses rp where rp.relationship_id=rid and rp.user_id<>u and rp.week_no=programme_step
 and exists(select 1 from public.relationship_members rm where rm.relationship_id=rid and rm.user_id=rp.user_id and rm.left_at is null)
 order by rp.updated_at desc limit 1;

 select c.* into t
 from private.task_catalogue c
 left join lateral (
   select max(a2.assigned_for_date) last_seen,count(*) seen_count
   from public.task_assignments a2 where a2.user_id=u and a2.task_key=c.task_key
 ) hist on true
 where c.content_version=2 and programme_step=any(c.eligible_weeks)
 and not exists(select 1 from public.task_assignments a3 where a3.relationship_id=rid and a3.assigned_for_date=today and a3.task_key=c.task_key)
 order by
   (
     3.0*private.personalization_fit(c.personalization_weights,partner_focus,partner_target)
     +1.0*private.personalization_fit(c.personalization_weights,my_focus,my_target)
     +case when hist.seen_count=0 then 1.25 else 0 end
     +case when hist.last_seen is not null and hist.last_seen<=today-14 then 0.5 else 0 end
     -case when hist.last_seen is not null and hist.last_seen>=today-7 then 4.0 else 0 end
   ) desc,
   hist.last_seen nulls first,
   extensions.hmac(today::text||':'||requested_slot::text||':'||c.task_key,
     encode((select selection_seed from private.relationship_secrets where relationship_id=rid),'hex'),'sha256'),
   c.task_key
 limit 1;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;
 insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,is_bonus,slot,program_day,task_title,task_body,task_minutes,task_why,contract_version)
 values(rid,u,t.task_key,today,requested_slot>0,requested_slot,programme_day,t.title,t.body,t.minutes,t.why_it_matters,1)
 returning * into a;
 return a;
end $$;

create or replace function private.read_routine_progress()
returns table(program_day integer, week_no integer, active_days integer, programme_complete boolean)
language plpgsql stable security definer set search_path='' as $$
declare rid uuid; r public.relationships%rowtype; n integer; prior_days integer;
begin
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is null then return; end if;
 select * into r from public.relationships where id=rid;
 if r.id is null or r.status<>'active' or r.active_path<>'routine' then return; end if;
 select count(distinct event_date)::integer into n from public.garden_events
 where relationship_id=rid and event_date>=r.path_started_at;
 n:=coalesce(n,0);
 select count(distinct event_date)::integer into prior_days from public.garden_events
 where relationship_id=rid and event_date>=r.path_started_at
 and event_date<(statement_timestamp() at time zone r.timezone)::date;
 active_days:=n;
 programme_complete:=n>=28;
 program_day:=least(prior_days+1,28);
 week_no:=least(4,(least(prior_days,27)/7)+1);
 return next;
end $$;

revoke all on function private.read_routine_progress() from public,anon;
grant execute on function private.read_routine_progress() to authenticated;

create or replace function private.read_my_root_pulse() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; active_days integer; prior_days integer; wk integer; p public.root_pulses%rowtype;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active';
 if r.id is null then raise exception using message='no_active_relationship'; end if;
 select count(distinct g.event_date)::integer into active_days from public.garden_events g
 where g.relationship_id=r.id and g.event_date>=r.path_started_at;
 active_days:=coalesce(active_days,0);
 select count(distinct g.event_date)::integer into prior_days from public.garden_events g
 where g.relationship_id=r.id and g.event_date>=r.path_started_at
 and g.event_date<(statement_timestamp() at time zone r.timezone)::date;
  wk:=least(4,(least(prior_days,27)/7)+1);
 select * into p from public.root_pulses where relationship_id=r.id and user_id=u and week_no=wk;
 return jsonb_build_object('pattern',p.routine_pattern,'target',p.behavioral_target,
   'can_edit',r.active_path='routine' and active_days<28,'week_no',wk);
end $$;

create or replace function private.save_my_root_pulse(pattern text,target text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; active_days integer; prior_days integer; wk integer;
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
 select count(distinct g.event_date)::integer into prior_days from public.garden_events g
 where g.relationship_id=r.id and g.event_date>=r.path_started_at
 and g.event_date<(statement_timestamp() at time zone r.timezone)::date;

 if active_days>=28 then raise exception using message='roots_period_not_available'; end if;
 wk:=least(4,(prior_days/7)+1);
 insert into public.root_pulses(relationship_id,user_id,week_no,routine_pattern,behavioral_target)
 values(rid,u,wk,pattern,target)
 on conflict(relationship_id,user_id,week_no) do update
 set routine_pattern=excluded.routine_pattern,behavioral_target=excluded.behavioral_target,updated_at=now();
 return jsonb_build_object('pattern',pattern,'target',target,'can_edit',true,'week_no',wk);
end $$;

create or replace function private.create_invite(valid_hours integer) returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; token text;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update;
 if exists(select 1 from public.relationship_members where relationship_id=rid and left_at is not null) then raise exception using message='relationship_closed'; end if;
 if r.status<>'active' or not private.is_relationship_member(rid) then raise exception using message='relationship_not_active'; end if;
 if (select count(*) from public.relationship_members where relationship_id=rid and left_at is null)>=2
 then raise exception using message='relationship_full'; end if;
 update public.relationship_invites set revoked_at=statement_timestamp()
 where relationship_id=rid and accepted_at is null and revoked_at is null;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.relationship_invites(relationship_id,created_by,token_hash,expires_at)
 values(rid,u,encode(extensions.digest(token,'sha256'),'hex'),statement_timestamp()+make_interval(hours=>greatest(1,least(coalesce(valid_hours,168),720))));
 return token;
end $$;

notify pgrst, 'reload schema';

-- Invitation cancellation shares the relationship lock with acceptance and leaving.
create or replace function private.revoke_relationship_invites()
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 perform 1 from public.relationships where id=rid for update;
 update public.relationship_invites set revoked_at=statement_timestamp()
 where relationship_id=rid and accepted_at is null and revoked_at is null;
end $$;
create or replace function public.revoke_relationship_invites()
returns void language sql security invoker set search_path='' as $$select private.revoke_relationship_invites()$$;
revoke all on function private.revoke_relationship_invites(),public.revoke_relationship_invites() from public,anon,authenticated;
grant execute on function private.revoke_relationship_invites(),public.revoke_relationship_invites() to authenticated;
notify pgrst, 'reload schema';
