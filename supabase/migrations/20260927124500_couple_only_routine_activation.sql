-- Couple-only Routine activation.
-- A relationship may be configured by member A, but Day 1 starts only after both members
-- have joined, both have saved personalization, and the shared flower is chosen.

alter table public.relationships
  add column if not exists routine_activated_at timestamptz;

-- Preserve journeys that already had real activity before this rule existed.
update public.relationships r
set routine_activated_at = (r.path_started_at::timestamp at time zone r.timezone)
where r.routine_activated_at is null
  and (
    exists (select 1 from public.task_assignments a where a.relationship_id=r.id)
    or exists (select 1 from public.garden_events g where g.relationship_id=r.id)
  );

create or replace function private.maybe_activate_routine(rid uuid)
returns timestamptz
language plpgsql security definer set search_path='' as $$
declare r public.relationships%rowtype; activated timestamptz;
begin
 select * into r from public.relationships where id=rid for update;
 if r.id is null then raise exception using message='relationship_not_found'; end if;
 if r.routine_activated_at is not null then return r.routine_activated_at; end if;
 if r.status<>'active' or r.active_path<>'routine' or r.selected_flower is null then return null; end if;

 if (select count(*) from public.relationship_members m where m.relationship_id=rid and m.left_at is null)<>2
 then return null; end if;

 if (select count(*) from private.routine_member_preferences p
     join public.relationship_members m on m.relationship_id=p.relationship_id and m.user_id=p.user_id and m.left_at is null
     where p.relationship_id=rid)<>2
 then return null; end if;

 activated:=statement_timestamp();
 update public.relationships
 set routine_activated_at=activated,
     path_started_at=(activated at time zone r.timezone)::date,
     updated_at=activated
 where id=rid;
 return activated;
end $$;

revoke all on function private.maybe_activate_routine(uuid) from public,anon,authenticated;

create or replace function private.save_my_routine_preferences(focuses text[])
returns text[]
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; clean text[];
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select coalesce(array_agg(x order by x),'{}'::text[]) into clean
 from (select distinct btrim(v) x from unnest(coalesce(focuses,'{}'::text[])) v where btrim(v)<>'') q;
 if cardinality(clean)<1 or cardinality(clean)>3
    or not clean <@ array['fun','affection','conversation','appreciation','time','novelty']::text[]
 then raise exception using message='invalid_routine_preferences'; end if;

 insert into private.routine_member_preferences(relationship_id,user_id,onboarding_focus)
 values(rid,u,clean)
 on conflict(relationship_id,user_id) do update
 set onboarding_focus=excluded.onboarding_focus,updated_at=statement_timestamp();

 perform private.maybe_activate_routine(rid);
 return clean;
end $$;

create or replace function private.read_routine_activation_state()
returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 my_ready boolean:=false; partner_ready boolean:=false; members integer:=0;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid;
 select count(*)::integer into members from public.relationship_members where relationship_id=rid and left_at is null;
 select exists(select 1 from private.routine_member_preferences where relationship_id=rid and user_id=u) into my_ready;
 select exists(
   select 1 from private.routine_member_preferences p
   join public.relationship_members m on m.relationship_id=p.relationship_id and m.user_id=p.user_id and m.left_at is null
   where p.relationship_id=rid and p.user_id<>u
 ) into partner_ready;
 return jsonb_build_object(
   'relationship_id',rid,
   'activated',r.routine_activated_at is not null,
   'activated_at',r.routine_activated_at,
   'my_ready',my_ready,
   'partner_ready',partner_ready,
   'member_count',members
 );
end $$;

create or replace function public.get_routine_activation_state()
returns jsonb
language sql stable security invoker set search_path='' as $$
 select private.read_routine_activation_state()
$$;

revoke all on function private.read_routine_activation_state() from public,anon,authenticated;
grant execute on function private.read_routine_activation_state() to authenticated;
revoke all on function public.get_routine_activation_state() from public,anon;
grant execute on function public.get_routine_activation_state() to authenticated;

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
 select * into a from public.task_assignments where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;
 select count(*) into completed_count from public.task_assignments where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(select 1 from public.task_assignments where user_id=u and assigned_for_date=today and slot=requested_slot-1 and contract_version=1 and status='completed')
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
 and not exists(select 1 from public.task_assignments a3 where a3.user_id=u and a3.assigned_for_date=today and a3.task_key=c.task_key)
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

revoke all on function private.issue_assignment(integer) from public,anon,authenticated;
grant execute on function private.issue_assignment(integer) to authenticated;

-- Existing fully configured pairs with no activity can activate immediately.
update public.relationships r
set routine_activated_at=statement_timestamp(),
    path_started_at=(statement_timestamp() at time zone r.timezone)::date,
    updated_at=statement_timestamp()
where r.routine_activated_at is null
  and r.status='active'
  and r.active_path='routine'
  and r.selected_flower is not null
  and (select count(*) from public.relationship_members m where m.relationship_id=r.id and m.left_at is null)=2
  and (select count(*) from private.routine_member_preferences p
       join public.relationship_members m on m.relationship_id=p.relationship_id and m.user_id=p.user_id and m.left_at is null
       where p.relationship_id=r.id)=2;

notify pgrst, 'reload schema';
