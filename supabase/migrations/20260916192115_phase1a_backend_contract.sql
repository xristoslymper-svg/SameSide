-- PREPARED ONLY: reviewed production approval is required before deployment.
-- Existing history is preserved. UTC preserves the previous server date convention.
set local lock_timeout='5s';
set local statement_timeout='60s';
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema private revoke all on tables from anon, authenticated;

alter table public.relationships add column timezone text not null default 'UTC';
create function private.validate_timezone() returns trigger language plpgsql
set search_path = '' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then
   raise exception using errcode='P0001',message='invalid_timezone';
 end if;
 return new;
end $$;
create trigger relationship_timezone_valid before insert or update of timezone
on public.relationships for each row execute function private.validate_timezone();

create function private.is_relationship_member(rel uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.relationship_members m
 where m.relationship_id=rel and m.user_id=auth.uid() and m.left_at is null)
$$;
grant execute on function private.is_relationship_member(uuid) to authenticated;

-- Replace helper references without widening row ownership.
alter policy relationships_members_select on public.relationships to authenticated
 using(private.is_relationship_member(id));
alter policy relationship_members_same_relationship_select on public.relationship_members
 to authenticated using(private.is_relationship_member(relationship_id));
alter policy garden_relationship_select on public.garden_events to authenticated
 using(private.is_relationship_member(relationship_id));
alter policy insights_relationship_select on public.shared_insights to authenticated
 using(private.is_relationship_member(relationship_id));
alter policy roots_self_insert on public.root_preferences to authenticated
 with check(user_id=(select auth.uid()) and private.is_relationship_member(relationship_id));
alter policy roots_self_select on public.root_preferences to authenticated;
alter policy roots_self_delete on public.root_preferences to authenticated;
alter policy tasks_self_select on public.task_assignments to authenticated;
alter policy profiles_self_select on public.profiles to authenticated;
alter policy profiles_self_update on public.profiles to authenticated;
alter policy invites_creator_select on public.relationship_invites to authenticated;

revoke all on public.profiles, public.relationships, public.relationship_members,
 public.relationship_invites, public.task_assignments, public.root_preferences,
 public.garden_events, public.shared_insights from public, anon, authenticated;
grant select on public.profiles, public.relationships, public.relationship_members,
 public.task_assignments, public.root_preferences to authenticated;
grant update(display_name) on public.profiles to authenticated;
-- Roots submissions and insight reads/refresh remain disabled until the safe product flow exists.
revoke execute on function public.refresh_shared_root_insights(uuid,integer)
 from public,anon,authenticated,service_role;
create or replace function public.refresh_shared_root_insights(rel uuid,wk integer)
returns void language plpgsql security invoker set search_path='' as $$
begin raise exception using errcode='P0001',message='roots_derivation_not_enabled'; end $$;
revoke execute on function public.is_relationship_member(uuid) from public,anon,authenticated;

-- Historical raw rows remain internal; no public grants or Realtime publication are added.
create index garden_relationship_date_idx on public.garden_events(relationship_id,event_date);
create function private.read_shared_garden() returns table(garden_date date,flower_count bigint)
language sql stable security definer set search_path='' as $$
 select g.event_date,count(*) from public.garden_events g
 where auth.uid() is not null and private.is_relationship_member(g.relationship_id)
 group by g.event_date order by g.event_date
$$;
create function public.get_shared_garden() returns table(garden_date date,flower_count bigint)
language sql stable security invoker set search_path='' as $$
 select * from private.read_shared_garden()
$$;

create table private.task_catalogue(
 task_key text primary key, title text not null, body text not null,
 minutes integer not null check(minutes between 1 and 30)
);
insert into private.task_catalogue values
 ('routine-v1-01','Notice something specific','Tell your partner one specific thing you appreciated recently.',2),
 ('routine-v1-02','Ask beyond logistics','Ask your partner about something they have been thinking about lately.',5),
 ('routine-v1-03','Make a little room','Put your phone away and give a conversation your full attention.',5),
 ('routine-v1-04','Make one thing lighter','Quietly take care of one small everyday chore.',5),
 ('routine-v1-05','Share a memory','Mention a small shared memory that still makes you smile.',2),
 ('routine-v1-06','Change a tiny default','Suggest one small variation to an ordinary shared moment.',5),
 ('routine-v1-07','Offer a choice','Ask what kind of small break would feel good today.',2),
 ('routine-v1-08','Say a warm hello','When you next meet, pause to greet your partner with warmth.',1),
 ('routine-v1-09','Leave a kind note','Write one short message of appreciation for your partner.',2),
 ('routine-v1-10','Listen a little longer','Give your partner time to finish a thought before responding.',3),
 ('routine-v1-11','Bring a little fun','Share something light that you think your partner would enjoy.',2),
 ('routine-v1-12','Remember a favorite','Offer a small everyday thing you know your partner likes.',3);
create table private.relationship_secrets(
 relationship_id uuid primary key references public.relationships(id) on delete cascade,
 selection_seed bytea not null default extensions.gen_random_bytes(32)
);
alter table private.task_catalogue enable row level security;
alter table private.relationship_secrets enable row level security;
revoke all on private.task_catalogue,private.relationship_secrets from public,anon,authenticated;

alter table public.task_assignments add column slot integer,
 add column program_day integer, add column task_title text, add column task_body text,
 add column task_minutes integer, add column contract_version integer;
alter table public.task_assignments add constraint issued_assignment_contract check(
 (contract_version is null and slot is null and program_day is null
  and task_title is null and task_body is null and task_minutes is null)
 or (contract_version is not null and contract_version=1 and slot is not null and slot between 0 and 2
  and program_day is not null and program_day between 1 and 28
  and is_bonus=(slot>0) and task_title is not null and task_body is not null
  and task_minutes is not null and task_minutes between 1 and 30)
);
create unique index assignment_daily_slot on public.task_assignments(user_id,assigned_for_date,slot)
 where contract_version=1;

create function private.create_relationship(timezone_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if timezone_name is null or not exists(select 1 from pg_catalog.pg_timezone_names where name=timezone_name)
 then raise exception using message='invalid_timezone'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is not null then return rid; end if;
 insert into public.relationships(created_by,timezone,path_started_at)
 values(u,timezone_name,(statement_timestamp() at time zone timezone_name)::date) returning id into rid;
 insert into public.relationship_members(relationship_id,user_id,member_role) values(rid,u,'member_a');
 return rid;
end $$;
create or replace function public.create_solo_relationship() returns uuid
language sql security invoker set search_path='' as $$select private.create_relationship('UTC')$$;
create function public.create_solo_relationship(timezone_name text) returns uuid
language sql security invoker set search_path='' as $$select private.create_relationship(timezone_name)$$;

create function private.issue_assignment(requested_slot integer) returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 m public.relationship_members%rowtype; a public.task_assignments%rowtype;
 today date; day_no integer; chosen text; seed bytea; keys text[];
 t private.task_catalogue%rowtype; completed_count integer;
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
 if r.active_path<>'routine' or day_no not between 1 and 28 then raise exception using message='path_not_available'; end if;
 if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;
 select * into a from public.task_assignments where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;
 select count(*) into completed_count from public.task_assignments
 where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(select 1 from public.task_assignments
 where user_id=u and assigned_for_date=today and slot=requested_slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;
 select selection_seed into seed from private.relationship_secrets where relationship_id=rid;
 select array_agg(task_key order by extensions.hmac(today::text||':'||task_key,encode(seed,'hex'),'sha256'),task_key)
 into keys from private.task_catalogue;
 -- Disjoint private halves; same immutable catalogue/seed/date yields the same choice.
 chosen:=keys[requested_slot+1+case when m.member_role='member_b' then 3 else 0 end];
 select * into t from private.task_catalogue where task_key=chosen;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;
 insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,is_bonus,
 slot,program_day,task_title,task_body,task_minutes,contract_version)
 values(rid,u,t.task_key,today,requested_slot>0,requested_slot,day_no,t.title,t.body,t.minutes,1)
 returning * into a;
 return a;
end $$;
create function public.get_or_create_today_assignment(requested_slot integer default 0)
returns public.task_assignments language sql security invoker set search_path='' as $$
 select private.issue_assignment(requested_slot)
$$;

create function private.finish_assignment(assignment_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 a public.task_assignments%rowtype; m public.relationship_members%rowtype; today date; n integer;
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
   return null; -- Never return the shared event ID, including on retries.
 end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 if a.contract_version is distinct from 1 then raise exception using message='legacy_assignment_read_only'; end if;
 if a.status<>'assigned' or a.assigned_for_date<>today or a.created_at<m.joined_at
 or a.assigned_for_date<(m.joined_at at time zone r.timezone)::date
 or r.active_path<>'routine' or today-r.path_started_at+1 not between 1 and 28
 or a.program_day<>today-r.path_started_at+1 then raise exception using message='assignment_not_eligible'; end if;
 if a.slot>0 and not exists(select 1 from public.task_assignments where user_id=u
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
-- Keep the legacy SQL signature, but ignore client-selected plants and withhold event identifiers.
create or replace function public.complete_assignment(assignment_id uuid,chosen_plant text default 'flower')
returns uuid language sql security invoker set search_path='' as $$select private.finish_assignment(assignment_id)$$;

create function private.create_invite(valid_hours integer) returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; token text;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update;
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
create or replace function public.create_relationship_invite(valid_hours integer default 168)
returns text language sql security invoker set search_path='' as $$select private.create_invite(valid_hours)$$;

create function private.accept_invite(raw_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); inv public.relationship_invites%rowtype; r public.relationships%rowtype;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if raw_token is null or length(raw_token)<>64 then raise exception using message='invalid_invite'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select * into inv from public.relationship_invites where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex');
 if inv.id is null then raise exception using message='invalid_invite'; end if;
 select * into r from public.relationships where id=inv.relationship_id for update;
 select * into inv from public.relationship_invites where id=inv.id for update;
 if inv.created_by=u then raise exception using message='own_invite'; end if;
 if inv.accepted_by=u and inv.accepted_at is not null and inv.revoked_at is null
 and r.status='active' and private.is_relationship_member(r.id) then return r.id; end if;
 if inv.revoked_at is not null then raise exception using message='invite_revoked'; end if;
 if inv.accepted_at is not null then raise exception using message='invite_already_used'; end if;
 if inv.expires_at<=statement_timestamp() then raise exception using message='invite_expired'; end if;
 if exists(select 1 from public.relationship_members where user_id=u and left_at is null)
 then raise exception using message='already_in_relationship'; end if;
 if r.status<>'active' or not exists(select 1 from public.relationship_members
 where relationship_id=r.id and user_id=inv.created_by and left_at is null)
 then raise exception using message='invite_unavailable'; end if;
 if (select count(*) from public.relationship_members where relationship_id=r.id and left_at is null)>=2
 then raise exception using message='relationship_full'; end if;
 insert into public.relationship_members(relationship_id,user_id,member_role) values(r.id,u,'member_b');
 update public.relationship_invites set accepted_at=statement_timestamp(),accepted_by=u where id=inv.id;
 return r.id;
end $$;
create or replace function public.accept_relationship_invite(raw_token text) returns uuid
language sql security invoker set search_path='' as $$select private.accept_invite(raw_token)$$;

-- The sole pre-auth disclosure is a chosen display name for a usable bearer invitation.
create function private.preview_invite(raw_token text) returns table(invite_state text,display_name text)
language plpgsql stable security definer set search_path='' as $$
declare inv public.relationship_invites%rowtype;
begin
 if raw_token is null or length(raw_token)<>64 then return query select 'invalid'::text,null::text; return; end if;
 select * into inv from public.relationship_invites where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex');
 if inv.id is null then return query select 'invalid'::text,null::text; return; end if;
 if inv.revoked_at is not null then return query select 'revoked'::text,null::text; return; end if;
 if inv.accepted_at is not null then return query select 'accepted'::text,null::text; return; end if;
 if inv.expires_at<=statement_timestamp() then return query select 'expired'::text,null::text; return; end if;
 if not exists(select 1 from public.relationships r join public.relationship_members m on m.relationship_id=r.id
 where r.id=inv.relationship_id and r.status='active' and m.user_id=inv.created_by and m.left_at is null)
 then return query select 'unavailable'::text,null::text; return; end if;
 if (select count(*) from public.relationship_members where relationship_id=inv.relationship_id and left_at is null)>=2
 then return query select 'full'::text,null::text; return; end if;
 return query select 'ready'::text,left(coalesce(
 (select nullif(btrim(p.display_name),'') from public.profiles p where p.id=inv.created_by),'Your partner'),80);
end $$;
create function public.preview_relationship_invite(raw_token text) returns table(invite_state text,display_name text)
language sql stable security invoker set search_path='' as $$select * from private.preview_invite(raw_token)$$;

-- Explicit executable surface. Private implementations still authorize auth.uid themselves.
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_relationship_member(uuid),private.read_shared_garden(),
 private.create_relationship(text),private.issue_assignment(integer),private.finish_assignment(uuid),
 private.create_invite(integer),private.accept_invite(text) to authenticated;
grant usage on schema private to anon;
grant execute on function private.preview_invite(text) to anon,authenticated;
revoke execute on function public.preview_relationship_invite(text) from public;
grant execute on function public.preview_relationship_invite(text) to anon,authenticated;
revoke execute on function public.get_shared_garden(),public.create_solo_relationship(),
 public.create_solo_relationship(text),public.get_or_create_today_assignment(integer),
 public.complete_assignment(uuid,text),public.create_relationship_invite(integer),
 public.accept_relationship_invite(text) from public,anon,authenticated;
grant execute on function public.get_shared_garden(),public.create_solo_relationship(),
 public.create_solo_relationship(text),public.get_or_create_today_assignment(integer),
 public.complete_assignment(uuid,text),public.create_relationship_invite(integer),
 public.accept_relationship_invite(text) to authenticated;
-- Prevent accidental future default client access in the application schemas.
alter default privileges for role postgres in schema public revoke all on tables from anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public,anon,authenticated;
notify pgrst, 'reload schema';
