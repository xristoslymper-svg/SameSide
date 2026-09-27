-- Unify onboarding and Roots signals into one weighted Routine personalization engine.
-- The partner's stated needs intentionally carry more weight when choosing a user's Move.

alter table private.task_catalogue
  add column if not exists personalization_weights jsonb not null default '{}'::jsonb;

with v(task_key,weights) as (values
('RTN001','{"appreciation":1,"quality_attention":0.9,"support":0.55,"verbal_affection":0.55}'::jsonb),
('RTN002','{"quality_attention":0.9}'::jsonb),
('RTN003','{"curiosity":1,"emotional_conversation":0.85,"quality_attention":0.75,"support":0.55}'::jsonb),
('RTN004','{"quality_attention":0.9,"support":0.55,"verbal_affection":0.3}'::jsonb),
('RTN005','{}'::jsonb),
('RTN006','{"curiosity":1,"emotional_conversation":0.35,"quality_attention":0.9}'::jsonb),
('RTN007','{"curiosity":1,"emotional_conversation":0.9}'::jsonb),
('RTN008','{"anticipation":0.25,"playfulness":0.75,"quality_attention":0.9,"support":0.55}'::jsonb),
('RTN009','{"anticipation":0.25,"playfulness":0.75,"quality_attention":0.9,"verbal_affection":0.45}'::jsonb),
('RTN010','{"shared_experience":1,"spontaneity":0.35}'::jsonb),
('RTN011','{"anticipation":0.35,"novelty":1,"shared_experience":0.2,"spontaneity":0.65}'::jsonb),
('RTN012','{"anticipation":0.35,"curiosity":1,"emotional_conversation":0.35,"novelty":1,"spontaneity":0.65}'::jsonb),
('RTN013','{"anticipation":0.25,"playfulness":0.75,"quality_attention":0.9,"shared_experience":0.5,"verbal_affection":0.3}'::jsonb),
('RTN014','{"anticipation":0.35,"emotional_conversation":0.25,"novelty":1,"spontaneity":0.65}'::jsonb),
('RTN015','{"anticipation":0.35,"appreciation":1,"novelty":1,"spontaneity":0.65,"support":1,"verbal_affection":0.35}'::jsonb),
('RTN016','{"anticipation":0.35,"novelty":1,"shared_experience":1,"spontaneity":0.65}'::jsonb),
('RTN017','{"anticipation":0.35,"novelty":1,"shared_experience":1,"spontaneity":0.65}'::jsonb),
('RTN018','{"anticipation":0.35,"novelty":1,"shared_experience":0.2,"spontaneity":0.65}'::jsonb),
('RTN019','{"anticipation":0.45,"playfulness":0.75,"verbal_affection":0.45}'::jsonb),
('RTN020','{"quality_attention":0.9,"shared_experience":0.2,"spontaneity":0.35}'::jsonb),
('RTN021','{"anticipation":0.25,"shared_experience":1}'::jsonb),
('RTN022','{"anticipation":0.35,"novelty":1,"shared_experience":1,"spontaneity":0.65}'::jsonb),
('RTN023','{"appreciation":0.2,"emotional_conversation":0.25,"spontaneity":0.35,"support":0.35}'::jsonb),
('RTN024','{"anticipation":0.7,"novelty":1,"shared_experience":1,"spontaneity":0.65}'::jsonb),
('RTN025','{"anticipation":0.2,"emotional_conversation":0.25,"spontaneity":0.35}'::jsonb),
('RTN026','{"anticipation":0.35,"novelty":1,"playfulness":1,"spontaneity":0.65}'::jsonb),
('RTN027','{"emotional_conversation":0.35,"support":0.25}'::jsonb),
('RTN028','{"emotional_conversation":0.35,"support":0.25}'::jsonb),
('RTN029','{"emotional_conversation":1,"quality_attention":0.9}'::jsonb),
('RTN030','{"emotional_conversation":0.45,"quality_attention":0.55,"support":1}'::jsonb),
('RTN031','{"emotional_conversation":0.5,"spontaneity":0.35,"support":0.75}'::jsonb),
('RTN032','{"emotional_conversation":0.5,"quality_attention":0.55,"support":0.9}'::jsonb),
('RTN033','{"emotional_conversation":0.25,"spontaneity":0.35}'::jsonb),
('RTN034','{"emotional_conversation":0.25,"spontaneity":0.35}'::jsonb),
('RTN035','{"spontaneity":0.35}'::jsonb),
('RTN036','{"emotional_conversation":0.25,"quality_attention":0.9,"support":0.55}'::jsonb),
('RTN037','{"emotional_conversation":0.85,"quality_attention":0.75,"spontaneity":0.35,"support":1}'::jsonb),
('RTN038','{"shared_experience":1,"spontaneity":0.35}'::jsonb),
('RTN039','{"anticipation":0.25,"playfulness":0.75,"quality_attention":0.9,"verbal_affection":0.55}'::jsonb),
('RTN040','{"emotional_conversation":0.35,"support":0.25}'::jsonb),
('RTN041','{}'::jsonb),
('RTN042','{"anticipation":0.2}'::jsonb),
('RTN043','{"shared_experience":0.2}'::jsonb),
('RTN044','{"anticipation":0.2,"quality_attention":0.9,"verbal_affection":0.35}'::jsonb),
('RTN045','{"quality_attention":0.9,"shared_experience":0.2}'::jsonb),
('RTN046','{"anticipation":0.2,"shared_experience":1}'::jsonb),
('RTN047','{"curiosity":1,"emotional_conversation":0.7}'::jsonb),
('RTN048','{"shared_experience":0.2}'::jsonb),
('RTN049','{"anticipation":0.2,"shared_experience":0.2}'::jsonb),
('RTN050','{}'::jsonb)
)
update private.task_catalogue c
set personalization_weights=v.weights
from v
where c.task_key=v.task_key and c.content_version=2;

create table if not exists private.routine_member_preferences (
 relationship_id uuid not null references public.relationships(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 onboarding_focus text[] not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (relationship_id,user_id),
 constraint routine_focus_count check (cardinality(onboarding_focus) between 0 and 3),
 constraint routine_focus_values check (onboarding_focus <@ array['fun','affection','conversation','appreciation','time','novelty']::text[])
);
alter table private.routine_member_preferences enable row level security;
revoke all on private.routine_member_preferences from public,anon,authenticated;

create or replace function private.personalization_fit(weights jsonb, focuses text[], root_target text)
returns numeric
language sql immutable set search_path='' as $$
 with signals(target,w) as (
   select 'playfulness',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='fun'
   union all select 'spontaneity',0.55 from unnest(coalesce(focuses,'{}'::text[])) f where f='fun'
   union all select 'physical_affection',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='affection'
   union all select 'verbal_affection',0.9 from unnest(coalesce(focuses,'{}'::text[])) f where f='affection'
   union all select 'appreciation',0.3 from unnest(coalesce(focuses,'{}'::text[])) f where f='affection'
   union all select 'emotional_conversation',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='conversation'
   union all select 'curiosity',0.65 from unnest(coalesce(focuses,'{}'::text[])) f where f='conversation'
   union all select 'quality_attention',0.4 from unnest(coalesce(focuses,'{}'::text[])) f where f='conversation'
   union all select 'appreciation',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='appreciation'
   union all select 'verbal_affection',0.25 from unnest(coalesce(focuses,'{}'::text[])) f where f='appreciation'
   union all select 'shared_experience',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='time'
   union all select 'quality_attention',0.65 from unnest(coalesce(focuses,'{}'::text[])) f where f='time'
   union all select 'anticipation',0.25 from unnest(coalesce(focuses,'{}'::text[])) f where f='time'
   union all select 'novelty',1.0 from unnest(coalesce(focuses,'{}'::text[])) f where f='novelty'
   union all select 'spontaneity',0.75 from unnest(coalesce(focuses,'{}'::text[])) f where f='novelty'
   union all select 'anticipation',0.45 from unnest(coalesce(focuses,'{}'::text[])) f where f='novelty'
   union all select 'shared_experience',0.25 from unnest(coalesce(focuses,'{}'::text[])) f where f='novelty'
   union all select root_target,1.5 where root_target is not null
   -- Affectionate-touch preference can still find warm moves until the catalogue has more touch-specific actions.
   union all select 'verbal_affection',0.5 where root_target='physical_affection'
   union all select 'quality_attention',0.25 where root_target='physical_affection'
 ),
 combined as (
   select target,least(2.0,sum(w)) w from signals where target is not null group by target
 )
 select coalesce(sum(coalesce((weights->>target)::numeric,0)*w),0)::numeric from combined
$$;
revoke all on function private.personalization_fit(jsonb,text[],text) from public,anon,authenticated;

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
 if cardinality(clean)>3 or not clean <@ array['fun','affection','conversation','appreciation','time','novelty']::text[]
 then raise exception using message='invalid_routine_preferences'; end if;
 insert into private.routine_member_preferences(relationship_id,user_id,onboarding_focus)
 values(rid,u,clean)
 on conflict(relationship_id,user_id) do update
 set onboarding_focus=excluded.onboarding_focus,updated_at=statement_timestamp();
 return clean;
end $$;

create or replace function public.save_my_routine_preferences(focuses text[])
returns text[]
language sql security invoker set search_path='' as $$
 select private.save_my_routine_preferences(focuses)
$$;
revoke all on function public.save_my_routine_preferences(text[]) from public,anon;
grant execute on function public.save_my_routine_preferences(text[]) to authenticated;

create or replace function public.get_my_routine_preferences()
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
revoke all on function public.get_my_routine_preferences() from public,anon;
grant execute on function public.get_my_routine_preferences() to authenticated;

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
 if r.status<>'active' or r.active_path<>'routine' then raise exception using message='roots_period_not_available'; end if;
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

create or replace function public.get_my_root_pulse() returns jsonb
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

revoke all on function private.save_my_routine_preferences(text[]),private.personalization_fit(jsonb,text[],text),private.issue_assignment(integer) from public,anon,authenticated;
grant execute on function private.issue_assignment(integer) to authenticated;
notify pgrst, 'reload schema';
