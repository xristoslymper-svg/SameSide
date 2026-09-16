create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  active_path text not null default 'routine',
  path_started_at date not null default current_date,
  status text not null default 'active' check (status in ('active','disconnected','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationship_members (
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (member_role in ('member_a','member_b')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (relationship_id,user_id)
);
create unique index one_active_relationship_per_user on public.relationship_members(user_id) where left_at is null;
create unique index one_active_role_per_relationship on public.relationship_members(relationship_id,member_role) where left_at is null;

create table public.relationship_invites (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index relationship_invites_relationship_idx on public.relationship_invites(relationship_id);

create table public.root_preferences (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_no int not null check (week_no between 1 and 4),
  need text not null check (need in ('affection','fun','conversation','spontaneity','attention','support')),
  created_at timestamptz not null default now(),
  unique (relationship_id,user_id,week_no,need)
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  assigned_for_date date not null,
  is_bonus boolean not null default false,
  status text not null default 'assigned' check (status in ('assigned','completed','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (relationship_id,user_id,assigned_for_date,task_key)
);
create index task_assignments_user_date_idx on public.task_assignments(user_id,assigned_for_date);

create table public.garden_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  source_assignment_id uuid references public.task_assignments(id) on delete set null,
  plant_type text not null default 'flower',
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);
create unique index garden_event_per_assignment on public.garden_events(source_assignment_id) where source_assignment_id is not null;

create table public.shared_insights (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  insight_type text not null,
  week_no int check (week_no between 1 and 4),
  value text not null,
  created_at timestamptz not null default now(),
  unique (relationship_id,insight_type,week_no,value)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')) on conflict(id) do nothing;
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_relationship_member(rel uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.relationship_members rm where rm.relationship_id=rel and rm.user_id=auth.uid() and rm.left_at is null);
$$;

create or replace function public.create_solo_relationship() returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if exists(select 1 from public.relationship_members where user_id=auth.uid() and left_at is null) then raise exception 'user already has an active relationship'; end if;
 insert into public.relationships(created_by) values(auth.uid()) returning id into rid;
 insert into public.relationship_members(relationship_id,user_id,member_role) values(rid,auth.uid(),'member_a');
 return rid;
end; $$;

create or replace function public.create_relationship_invite(valid_hours int default 168) returns text language plpgsql security definer set search_path=public as $$
declare rid uuid; raw_token text;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is null then raise exception 'no active relationship'; end if;
 if (select count(*) from public.relationship_members where relationship_id=rid and left_at is null) >= 2 then raise exception 'relationship already has two members'; end if;
 update public.relationship_invites set revoked_at=now() where relationship_id=rid and accepted_at is null and revoked_at is null;
 raw_token := encode(gen_random_bytes(32),'hex');
 insert into public.relationship_invites(relationship_id,created_by,token_hash,expires_at) values(rid,auth.uid(),encode(digest(raw_token,'sha256'),'hex'),now()+make_interval(hours=>greatest(1,least(valid_hours,720))));
 return raw_token;
end; $$;

create or replace function public.accept_relationship_invite(raw_token text) returns uuid language plpgsql security definer set search_path=public as $$
declare inv public.relationship_invites%rowtype; members_count int;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if exists(select 1 from public.relationship_members where user_id=auth.uid() and left_at is null) then raise exception 'user already has an active relationship'; end if;
 select * into inv from public.relationship_invites where token_hash=encode(digest(raw_token,'sha256'),'hex') for update;
 if inv.id is null then raise exception 'invalid invite'; end if;
 if inv.revoked_at is not null then raise exception 'invite revoked'; end if;
 if inv.accepted_at is not null then raise exception 'invite already used'; end if;
 if inv.expires_at <= now() then raise exception 'invite expired'; end if;
 if inv.created_by=auth.uid() then raise exception 'cannot accept your own invite'; end if;
 select count(*) into members_count from public.relationship_members where relationship_id=inv.relationship_id and left_at is null;
 if members_count >= 2 then raise exception 'relationship already full'; end if;
 insert into public.relationship_members(relationship_id,user_id,member_role) values(inv.relationship_id,auth.uid(),'member_b');
 update public.relationship_invites set accepted_at=now(),accepted_by=auth.uid() where id=inv.id;
 return inv.relationship_id;
end; $$;

create or replace function public.complete_assignment(assignment_id uuid, chosen_plant text default 'flower') returns uuid language plpgsql security definer set search_path=public as $$
declare a public.task_assignments%rowtype; gid uuid;
begin
 select * into a from public.task_assignments where id=assignment_id and user_id=auth.uid() for update;
 if a.id is null then raise exception 'assignment not found'; end if;
 if a.status <> 'completed' then update public.task_assignments set status='completed',completed_at=now() where id=a.id; end if;
 select id into gid from public.garden_events where source_assignment_id=a.id;
 if gid is null then insert into public.garden_events(relationship_id,created_by,source_assignment_id,plant_type,event_date) values(a.relationship_id,auth.uid(),a.id,coalesce(nullif(chosen_plant,''),'flower'),a.assigned_for_date) returning id into gid; end if;
 return gid;
end; $$;

create or replace function public.refresh_shared_root_insights(rel uuid, wk int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_relationship_member(rel) then raise exception 'not authorized'; end if;
 insert into public.shared_insights(relationship_id,insight_type,week_no,value)
 select rel,'shared_root_need',wk,r1.need from public.root_preferences r1 join public.root_preferences r2 on r2.relationship_id=r1.relationship_id and r2.week_no=r1.week_no and r2.need=r1.need and r2.user_id<>r1.user_id where r1.relationship_id=rel and r1.week_no=wk group by r1.need having count(distinct r1.user_id)>=2
 on conflict do nothing;
end; $$;

alter table public.profiles enable row level security;
alter table public.relationships enable row level security;
alter table public.relationship_members enable row level security;
alter table public.relationship_invites enable row level security;
alter table public.root_preferences enable row level security;
alter table public.task_assignments enable row level security;
alter table public.garden_events enable row level security;
alter table public.shared_insights enable row level security;

create policy profiles_self_select on public.profiles for select using(id=auth.uid());
create policy profiles_self_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy relationships_members_select on public.relationships for select using(public.is_relationship_member(id));
create policy relationship_members_same_relationship_select on public.relationship_members for select using(public.is_relationship_member(relationship_id));
create policy invites_creator_select on public.relationship_invites for select using(created_by=auth.uid());
create policy roots_self_select on public.root_preferences for select using(user_id=auth.uid());
create policy roots_self_insert on public.root_preferences for insert with check(user_id=auth.uid() and public.is_relationship_member(relationship_id));
create policy roots_self_delete on public.root_preferences for delete using(user_id=auth.uid());
create policy tasks_self_select on public.task_assignments for select using(user_id=auth.uid());
create policy garden_relationship_select on public.garden_events for select using(public.is_relationship_member(relationship_id));
create policy insights_relationship_select on public.shared_insights for select using(public.is_relationship_member(relationship_id));

grant execute on function public.create_solo_relationship() to authenticated;
grant execute on function public.create_relationship_invite(int) to authenticated;
grant execute on function public.accept_relationship_invite(text) to authenticated;
grant execute on function public.complete_assignment(uuid,text) to authenticated;
grant execute on function public.refresh_shared_root_insights(uuid,int) to authenticated;
