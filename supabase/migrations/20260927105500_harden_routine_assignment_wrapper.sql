create or replace function private.issue_assignment(requested_slot integer)
returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; m public.relationship_members%rowtype;
 a public.task_assignments%rowtype; t private.task_catalogue%rowtype; today date;
 active_days_before integer; programme_day integer; programme_step integer; completed_count integer;
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
 if r.active_path<>'routine' or today<r.path_started_at then raise exception using message='path_not_available'; end if;
 if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;
 select count(distinct g.event_date)::integer into active_days_before
 from public.garden_events g where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<today;
 active_days_before:=coalesce(active_days_before,0);
 if active_days_before>=28 then raise exception using message='path_complete'; end if;
 programme_day:=active_days_before+1;
 programme_step:=least(4,(active_days_before/7)+1);
 select * into a from public.task_assignments
 where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;
 select count(*) into completed_count from public.task_assignments
 where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(select 1 from public.task_assignments where user_id=u
 and assigned_for_date=today and slot=requested_slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;
 select c.* into t from private.task_catalogue c
 left join lateral (
   select max(a2.assigned_for_date) last_seen,count(*) seen_count
   from public.task_assignments a2 where a2.user_id=u and a2.task_key=c.task_key
 ) hist on true
 where c.content_version=2 and programme_step=any(c.eligible_weeks)
 and not exists(select 1 from public.task_assignments a3 where a3.user_id=u
   and a3.assigned_for_date=today and a3.task_key=c.task_key)
 order by case when hist.seen_count=0 then 0 else 1 end,hist.last_seen nulls first,
 extensions.hmac(today::text||':'||requested_slot::text||':'||c.task_key,
 encode((select selection_seed from private.relationship_secrets where relationship_id=rid),'hex'),'sha256'),c.task_key
 limit 1;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;
 insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,is_bonus,
 slot,program_day,task_title,task_body,task_minutes,task_why,contract_version)
 values(rid,u,t.task_key,today,requested_slot>0,requested_slot,programme_day,
 t.title,t.body,t.minutes,t.why_it_matters,1) returning * into a;
 return a;
end $$;

create or replace function public.get_or_create_today_assignment(requested_slot integer default 0)
returns public.task_assignments language sql security invoker set search_path='' as $$
 select private.issue_assignment(requested_slot)
$$;
revoke all on function public.get_or_create_today_assignment(integer) from public;
grant execute on function public.get_or_create_today_assignment(integer) to authenticated;