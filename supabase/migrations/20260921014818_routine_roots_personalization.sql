-- CBT-informed Routine Roots pulse and task personalization metadata.
alter table private.task_catalogue add column if not exists routine_patterns text[] not null default '{}'::text[];
alter table private.task_catalogue add column if not exists behavioral_targets text[] not null default '{}'::text[];
alter table private.task_catalogue add column if not exists interaction_type text;

create table if not exists public.root_pulses (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.relationships(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, week_no integer not null check (week_no between 1 and 4),
 routine_pattern text not null check (routine_pattern in ('low_connection','logistics_only','low_novelty','low_affection','fragmented_attention','low_anticipation','doing_well')),
 behavioral_target text not null check (behavioral_target in ('curiosity','emotional_conversation','playfulness','novelty','spontaneity','quality_attention','physical_affection','verbal_affection','shared_experience','anticipation','appreciation','support')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (relationship_id,user_id,week_no)
);
alter table public.root_pulses enable row level security;
revoke all on public.root_pulses from anon, authenticated;

update private.task_catalogue set routine_patterns='{}',behavioral_targets='{}',interaction_type='gesture';
update private.task_catalogue set routine_patterns=array['low_affection'],behavioral_targets=array['appreciation','verbal_affection'] where task_key in ('routine-v1-01','routine-v1-09','routine-v1-13','routine-v1-19','routine-v1-26','routine-v1-37','routine-v1-41','routine-v1-44','routine-v1-48');
update private.task_catalogue set routine_patterns=array['logistics_only','low_connection'],behavioral_targets=array['curiosity','emotional_conversation'] where task_key in ('routine-v1-02','routine-v1-18','routine-v1-25','routine-v1-30','routine-v1-36','routine-v1-39','routine-v1-47');
update private.task_catalogue set routine_patterns=array['fragmented_attention','low_connection'],behavioral_targets=array['quality_attention'] where task_key in ('routine-v1-03','routine-v1-10','routine-v1-15','routine-v1-32','routine-v1-43');
update private.task_catalogue set routine_patterns=array['low_connection'],behavioral_targets=array['support'] where task_key in ('routine-v1-04','routine-v1-07','routine-v1-17','routine-v1-21','routine-v1-29','routine-v1-33','routine-v1-34');
update private.task_catalogue set routine_patterns=array['low_novelty','low_anticipation'],behavioral_targets=array['shared_experience','anticipation'] where task_key in ('routine-v1-05','routine-v1-20','routine-v1-28','routine-v1-35','routine-v1-42','routine-v1-45','routine-v1-46');
update private.task_catalogue set routine_patterns=array['low_novelty'],behavioral_targets=array['novelty','spontaneity'] where task_key in ('routine-v1-06','routine-v1-12','routine-v1-24','routine-v1-27');
update private.task_catalogue set routine_patterns=array['low_novelty','logistics_only'],behavioral_targets=array['playfulness'] where task_key in ('routine-v1-11','routine-v1-16','routine-v1-40');
update private.task_catalogue set routine_patterns=array['low_affection','low_connection'],behavioral_targets=array['physical_affection','verbal_affection'] where task_key in ('routine-v1-08','routine-v1-14','routine-v1-22','routine-v1-23','routine-v1-31','routine-v1-38');
update private.task_catalogue set interaction_type='conversation' where task_key in ('routine-v1-01','routine-v1-02','routine-v1-07','routine-v1-10','routine-v1-13','routine-v1-18','routine-v1-19','routine-v1-21','routine-v1-23','routine-v1-25','routine-v1-26','routine-v1-28','routine-v1-30','routine-v1-33','routine-v1-35','routine-v1-36','routine-v1-37','routine-v1-38','routine-v1-39','routine-v1-41','routine-v1-44','routine-v1-47','routine-v1-48');
update private.task_catalogue set interaction_type='shared_moment' where task_key in ('routine-v1-05','routine-v1-06','routine-v1-11','routine-v1-16','routine-v1-20','routine-v1-24','routine-v1-32','routine-v1-40','routine-v1-42','routine-v1-45','routine-v1-46');

create or replace function private.save_my_root_pulse(pattern text,target text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; day_no integer; wk integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if pattern is null or pattern not in ('low_connection','logistics_only','low_novelty','low_affection','fragmented_attention','low_anticipation','doing_well') then raise exception using message='invalid_root_pattern'; end if;
 if target is null or target not in ('curiosity','emotional_conversation','playfulness','novelty','spontaneity','quality_attention','physical_affection','verbal_affection','shared_experience','anticipation','appreciation','support') then raise exception using message='invalid_root_target'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for share;
 if r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 day_no:=(statement_timestamp() at time zone r.timezone)::date-r.path_started_at+1;
 if r.active_path<>'routine' or day_no not between 1 and 28 then raise exception using message='roots_period_not_available'; end if;
 wk:=((day_no-1)/7)+1;
 insert into public.root_pulses(relationship_id,user_id,week_no,routine_pattern,behavioral_target) values(rid,u,wk,pattern,target)
 on conflict(relationship_id,user_id,week_no) do update set routine_pattern=excluded.routine_pattern,behavioral_target=excluded.behavioral_target,updated_at=now();
 return jsonb_build_object('pattern',pattern,'target',target,'can_edit',true,'week_no',wk);
end $$;
revoke all on function private.save_my_root_pulse(text,text) from public,anon,authenticated;
create or replace function public.save_my_root_pulse(pattern text,target text) returns jsonb language sql set search_path='' as $$ select private.save_my_root_pulse(pattern,target) $$;
revoke all on function public.save_my_root_pulse(text,text) from public,anon; grant execute on function public.save_my_root_pulse(text,text) to authenticated;

create or replace function public.get_my_root_pulse() returns jsonb language plpgsql stable set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; day_no integer; wk integer; p public.root_pulses%rowtype;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id where m.user_id=u and m.left_at is null and rel.status='active';
 if r.id is null then raise exception using message='no_active_relationship'; end if;
 day_no:=(statement_timestamp() at time zone r.timezone)::date-r.path_started_at+1; wk:=least(4,greatest(1,((day_no-1)/7)+1));
 select * into p from public.root_pulses where relationship_id=r.id and user_id=u and week_no=wk;
 return jsonb_build_object('pattern',p.routine_pattern,'target',p.behavioral_target,'can_edit',r.active_path='routine' and day_no between 1 and 28,'week_no',wk);
end $$;
revoke all on function public.get_my_root_pulse() from public,anon; grant execute on function public.get_my_root_pulse() to authenticated;

create or replace function private.issue_assignment(requested_slot integer) returns public.task_assignments language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; m public.relationship_members%rowtype; a public.task_assignments%rowtype; today date; day_no integer; chosen text; seed bytea; t private.task_catalogue%rowtype; completed_count integer; my_pattern text; my_target text; partner_pattern text; partner_target text;
begin
 if u is null then raise exception using message='not_authenticated'; end if; if requested_slot is null or requested_slot not between 0 and 2 then raise exception using message='invalid_slot'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0)); select relationship_id into rid from public.relationship_members where user_id=u and left_at is null; if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update; select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null; if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date; day_no:=today-r.path_started_at+1; if r.active_path<>'routine' or day_no not between 1 and 28 then raise exception using message='path_not_available'; end if; if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;
 select * into a from public.task_assignments where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1; if a.id is not null then return a; end if;
 select count(*) into completed_count from public.task_assignments where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today; if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(select 1 from public.task_assignments where user_id=u and assigned_for_date=today and slot=requested_slot-1 and contract_version=1 and status='completed') then raise exception using message='previous_slot_not_completed'; end if;
 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing; select selection_seed into seed from private.relationship_secrets where relationship_id=rid;
 select routine_pattern,behavioral_target into my_pattern,my_target from public.root_pulses where relationship_id=rid and user_id=u and week_no=((day_no-1)/7)+1;
 select routine_pattern,behavioral_target into partner_pattern,partner_target from public.root_pulses where relationship_id=rid and user_id<>u and week_no=((day_no-1)/7)+1 order by updated_at desc limit 1;
 select q.task_key into chosen from (select tc.task_key,(case when my_pattern=any(tc.routine_patterns) then 3 else 0 end+case when my_target=any(tc.behavioral_targets) then 4 else 0 end+case when partner_pattern=any(tc.routine_patterns) then 1 else 0 end+case when partner_target=any(tc.behavioral_targets) then 2 else 0 end+case when exists(select 1 from public.task_assignments pa where pa.user_id=u and pa.task_key=tc.task_key and pa.assigned_for_date>=today-7) then -5 else 0 end) score,extensions.hmac(today::text||':'||u::text||':'||tc.task_key,encode(seed,'hex'),'sha256') tie from private.task_catalogue tc where not exists(select 1 from public.task_assignments same_day where same_day.relationship_id=rid and same_day.assigned_for_date=today and same_day.task_key=tc.task_key)) q order by q.score desc,q.tie,q.task_key offset requested_slot limit 1;
 if chosen is null then select task_key into chosen from private.task_catalogue order by extensions.hmac(today::text||':'||task_key,encode(seed,'hex'),'sha256'),task_key limit 1; end if;
 select * into t from private.task_catalogue where task_key=chosen; if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;
 insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,is_bonus,slot,program_day,task_title,task_body,task_minutes,contract_version) values(rid,u,t.task_key,today,requested_slot>0,requested_slot,day_no,t.title,t.body,t.minutes,1) returning * into a; return a;
end $$;
revoke all on function private.issue_assignment(integer) from public,anon,authenticated;
