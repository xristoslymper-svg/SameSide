-- Additive MVP changes; no existing growth, assignments or Roots are rewritten.
set local lock_timeout = '5s';
alter table public.relationships add column selected_flower text
 check(selected_flower in ('cosmos','forget-me-not','zinnia','daisy','calendula','cornflower'));

create function private.choose_shared_flower(flower text) returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 if flower is null or flower not in ('cosmos','forget-me-not','zinnia','daisy','calendula','cornflower') then raise exception 'invalid_flower'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active' for update of rel,m;
 if r.id is null then raise exception 'no_active_relationship'; end if;
 if r.created_by<>u then raise exception 'only_creator_can_choose'; end if;
 if r.selected_flower is not null then
  if r.selected_flower=flower then return flower; end if;
  raise exception 'flower_already_chosen';
 end if;
 update public.relationships set selected_flower=flower where id=r.id;
 return flower;
end $$;
create function public.choose_shared_flower(flower text) returns text
language sql security invoker set search_path='' as $$ select private.choose_shared_flower(flower) $$;

create table public.daily_reflections (
 user_id uuid not null references auth.users(id) on delete cascade,
 relationship_id uuid not null references public.relationships(id) on delete cascade,
 reflection_date date not null,
 body text not null check(char_length(btrim(body)) between 1 and 280),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,relationship_id,reflection_date)
);
alter table public.daily_reflections enable row level security;
revoke all on public.daily_reflections from public,anon,authenticated;
grant select on public.daily_reflections to authenticated;
create policy reflections_owner_read on public.daily_reflections for select to authenticated using(user_id=(select auth.uid()));

create function public.get_my_daily_reflection() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; d date; t text;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active';
 if r.id is null then raise exception 'no_active_relationship'; end if;
 d:=(statement_timestamp() at time zone r.timezone)::date;
 select body into t from public.daily_reflections where user_id=u and relationship_id=r.id and reflection_date=d;
 return jsonb_build_object('date',d,'text',t);
end $$;
create function private.save_my_daily_reflection(thought text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; d date;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 if thought is null or char_length(btrim(thought)) not between 1 and 280 then raise exception 'invalid_reflection'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active' for share of rel,m;
 if r.id is null then raise exception 'no_active_relationship'; end if;
 d:=(statement_timestamp() at time zone r.timezone)::date;
 insert into public.daily_reflections(user_id,relationship_id,reflection_date,body) values(u,r.id,d,btrim(thought))
 on conflict(user_id,relationship_id,reflection_date) do update set body=excluded.body,updated_at=now();
 return jsonb_build_object('date',d,'text',btrim(thought));
end $$;
create function public.save_my_daily_reflection(thought text) returns jsonb
language sql security invoker set search_path='' as $$ select private.save_my_daily_reflection(thought) $$;
revoke all on function public.choose_shared_flower(text),private.choose_shared_flower(text),
 public.get_my_daily_reflection(),public.save_my_daily_reflection(text),private.save_my_daily_reflection(text) from public,anon,authenticated;
grant execute on function public.choose_shared_flower(text),private.choose_shared_flower(text),
 public.get_my_daily_reflection(),public.save_my_daily_reflection(text),private.save_my_daily_reflection(text) to authenticated;
notify pgrst,'reload schema';
