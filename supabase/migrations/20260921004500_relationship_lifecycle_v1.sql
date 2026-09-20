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
   where relationship_id=rid and user_id<>u
   order by joined_at desc limit 1;

  relationship_id:=rid;
  my_role:=me.member_role;
  select count(*)::integer into active_member_count
   from public.relationship_members where relationship_id=rid and left_at is null;
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
    where relationship_id=rid and left_at is not null
  ) into has_departure;
  my_joined_at:=me.joined_at;
  my_joined_day:=greatest(1, ((me.joined_at at time zone r.timezone)::date - r.path_started_at + 1));
  return next;
end $$;
revoke execute on function public.get_relationship_overview() from public,anon;
grant execute on function public.get_relationship_overview() to authenticated;

create or replace function public.revoke_relationship_invites()
returns void
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
  if u is null then raise exception using message='not_authenticated'; end if;
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null;
  if rid is null then raise exception using message='no_active_relationship'; end if;
  update public.relationship_invites
   set revoked_at=statement_timestamp()
   where relationship_id=rid and accepted_at is null and revoked_at is null;
end $$;
revoke execute on function public.revoke_relationship_invites() from public,anon;
grant execute on function public.revoke_relationship_invites() to authenticated;

create or replace function public.leave_relationship()
returns uuid
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
  if u is null then raise exception using message='not_authenticated'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null for update;
  if rid is null then raise exception using message='no_active_relationship'; end if;
  update public.relationship_invites
   set revoked_at=statement_timestamp()
   where relationship_id=rid and accepted_at is null and revoked_at is null;
  update public.relationship_members
   set left_at=statement_timestamp()
   where relationship_id=rid and user_id=u and left_at is null;
  return rid;
end $$;
revoke execute on function public.leave_relationship() from public,anon;
grant execute on function public.leave_relationship() to authenticated;

-- A relationship that has had a member depart is kept as a memory for the
-- remaining member, but cannot silently become a different couple.
create or replace function public.create_relationship_invite(valid_hours integer default 168)
returns text
language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
  if u is null then raise exception using message='not_authenticated'; end if;
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null;
  if rid is null then raise exception using message='no_active_relationship'; end if;
  if exists(
    select 1 from public.relationship_members
    where relationship_id=rid and left_at is not null
  ) then raise exception using message='relationship_closed'; end if;
  return private.create_invite(valid_hours);
end $$;
revoke execute on function public.create_relationship_invite(integer) from public,anon;
grant execute on function public.create_relationship_invite(integer) to authenticated;

create or replace function public.get_physical_garden_state()
returns table(
  status text,
  batch text,
  planted_at timestamptz,
  photo_url text
)
language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
begin
  if u is null then return; end if;
  select relationship_id into rid from public.relationship_members
   where user_id=u and left_at is null;
  if rid is null then return; end if;
  select * into r from public.relationships where id=rid;
  if r.id is null then return; end if;
  status:=r.physical_garden_status;
  batch:=r.physical_garden_batch;
  planted_at:=r.physical_garden_planted_at;
  photo_url:=r.physical_garden_photo_url;
  return next;
end $$;
revoke execute on function public.get_physical_garden_state() from public,anon;
grant execute on function public.get_physical_garden_state() to authenticated;
