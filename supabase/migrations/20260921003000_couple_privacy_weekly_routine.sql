-- Align The Routine with its four weekly chapters, remove the exact shared-
-- completion oracle from the public contract, and allow pressure-free care to
-- continue after the 28-day programme until the shared flower blooms.

alter table private.task_catalogue
  add column if not exists week_no integer;

update private.task_catalogue set week_no = case
  when task_key in ('routine-v1-01','routine-v1-02','routine-v1-03','routine-v1-05','routine-v1-08','routine-v1-09','routine-v1-10','routine-v1-13','routine-v1-14','routine-v1-15','routine-v1-18','routine-v1-19') then 1
  when task_key in ('routine-v1-06','routine-v1-11','routine-v1-16','routine-v1-17','routine-v1-20','routine-v1-21','routine-v1-23','routine-v1-24','routine-v1-27','routine-v1-34','routine-v1-35','routine-v1-40') then 2
  when task_key in ('routine-v1-07','routine-v1-12','routine-v1-22','routine-v1-25','routine-v1-26','routine-v1-30','routine-v1-31','routine-v1-32','routine-v1-33','routine-v1-36','routine-v1-39','routine-v1-43') then 3
  when task_key in ('routine-v1-04','routine-v1-28','routine-v1-29','routine-v1-37','routine-v1-38','routine-v1-41','routine-v1-42','routine-v1-44','routine-v1-45','routine-v1-46','routine-v1-47','routine-v1-48') then 4
  else week_no end;

alter table private.task_catalogue
  alter column week_no set not null;

alter table private.task_catalogue
  drop constraint if exists task_catalogue_week_no_check;
alter table private.task_catalogue
  add constraint task_catalogue_week_no_check check (week_no between 1 and 4);

create or replace function private.issue_assignment(requested_slot integer)
returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 m public.relationship_members%rowtype; a public.task_assignments%rowtype;
 today date; day_no integer; programme_day integer; programme_week integer;
 day_position integer; role_offset integer; pick_index integer;
 chosen text; seed bytea; keys text[]; t private.task_catalogue%rowtype;
 completed_count integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if requested_slot is null or requested_slot not between 0 and 2 then raise exception using message='invalid_slot'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 day_no:=today-r.path_started_at+1;
 if r.active_path<>'routine' or day_no<1 then raise exception using message='path_not_available'; end if;
 if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;

 programme_day:=least(day_no,28);
 programme_week:=least(4,((programme_day-1)/7)+1);

 select * into a from public.task_assignments
 where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;

 select count(*) into completed_count from public.task_assignments
 where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(
   select 1 from public.task_assignments
   where user_id=u and assigned_for_date=today and slot=requested_slot-1
     and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;

 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;
 select selection_seed into seed from private.relationship_secrets where relationship_id=rid;
 select array_agg(task_key order by extensions.hmac(task_key,encode(seed,'hex'),'sha256'),task_key)
 into keys from private.task_catalogue where week_no=programme_week;
 if coalesce(cardinality(keys),0)<12 then raise exception using message='catalogue_unavailable'; end if;

 -- During the four-week programme, each member's seven primary moves are
 -- non-repeating within that week. Partner B is offset by half the pool, so
 -- both members receive distinct private moves on the same day. After day 28
 -- the Week 4 pool keeps rotating without turning the programme into a streak.
 day_position:=case when day_no<=28 then mod(programme_day-1,7) else mod(day_no-29,12) end;
 role_offset:=case when m.member_role='member_b' then 6 else 0 end;
 pick_index:=mod(day_position + role_offset + requested_slot*2,cardinality(keys))+1;
 chosen:=keys[pick_index];
 select * into t from private.task_catalogue where task_key=chosen;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;

 insert into public.task_assignments(
   relationship_id,user_id,task_key,assigned_for_date,is_bonus,
   slot,program_day,task_title,task_body,task_minutes,contract_version)
 values(
   rid,u,t.task_key,today,requested_slot>0,
   requested_slot,programme_day,t.title,t.body,t.minutes,1)
 returning * into a;
 return a;
end $$;

create or replace function private.finish_assignment(assignment_id uuid)
returns uuid
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 a public.task_assignments%rowtype; m public.relationship_members%rowtype;
 today date; day_no integer; programme_day integer; n integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.task_assignments where id=assignment_id and user_id=u;
 if rid is null then raise exception using message='assignment_not_found'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 select * into a from public.task_assignments where id=assignment_id and user_id=u for update;
 if a.status='completed' then
   if not exists(select 1 from public.garden_events where source_assignment_id=a.id)
   then raise exception using message='completion_history_inconsistent'; end if;
   return null;
 end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 day_no:=today-r.path_started_at+1;
 programme_day:=least(day_no,28);
 if a.contract_version is distinct from 1 then raise exception using message='legacy_assignment_read_only'; end if;
 if a.status<>'assigned' or a.assigned_for_date<>today or a.created_at<m.joined_at
 or a.assigned_for_date<(m.joined_at at time zone r.timezone)::date
 or r.active_path<>'routine' or day_no<1 or a.program_day<>programme_day
 then raise exception using message='assignment_not_eligible'; end if;
 if a.slot>0 and not exists(
   select 1 from public.task_assignments where user_id=u
   and assigned_for_date=today and slot=a.slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 select count(*) into n from public.task_assignments where user_id=u and status='completed'
 and (completed_at at time zone r.timezone)::date=today;
 if n>=3 then raise exception using message='daily_limit_reached'; end if;
 update public.task_assignments set status='completed',completed_at=statement_timestamp() where id=a.id;
 insert into public.garden_events(relationship_id,created_by,source_assignment_id,plant_type,event_date)
 values(rid,u,a.id,'flower',today);
 return null;
end $$;

-- Public clients no longer receive exact per-day shared completion totals. The
-- only shared consequence exposed is a coarse botanical stage. This prevents
-- the Garden from acting as a partner-completion oracle while preserving one
-- genuinely shared object for the relationship.
revoke execute on function public.get_shared_garden() from public,anon,authenticated;

create or replace function private.read_shared_garden_state()
returns table(stage_key text,bloom boolean,programme_complete boolean)
language plpgsql stable security definer set search_path='' as $$
declare
 rid uuid; r public.relationships%rowtype; today date; elapsed integer; active_days integer;
begin
 select relationship_id into rid from public.relationship_members
 where user_id=auth.uid() and left_at is null;
 if rid is null then return; end if;
 select * into r from public.relationships where id=rid;
 if r.id is null or r.status<>'active' then return; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 elapsed:=greatest(1,today-r.path_started_at+1);
 select count(distinct g.event_date)::integer into active_days
 from public.garden_events g
 where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<=today;

 stage_key:=case
   when elapsed>=28 and active_days>=20 then 'bloom'
   when elapsed>=25 and active_days>=16 then 'opening'
   when elapsed>=22 and active_days>=12 then 'bud'
   when elapsed>=15 and active_days>=8 then 'established'
   when elapsed>=8 and active_days>=4 then 'leaves'
   when elapsed>=4 and active_days>=2 then 'shoot'
   when active_days>=1 then 'roots'
   else 'seed' end;
 bloom:=stage_key='bloom';
 programme_complete:=elapsed>=28;
 return next;
end $$;

create or replace function public.get_shared_garden_state()
returns table(stage_key text,bloom boolean,programme_complete boolean)
language sql stable security invoker set search_path='' as $$
 select * from private.read_shared_garden_state()
$$;
revoke execute on function public.get_shared_garden_state() from public,anon;
grant execute on function public.get_shared_garden_state() to authenticated;
