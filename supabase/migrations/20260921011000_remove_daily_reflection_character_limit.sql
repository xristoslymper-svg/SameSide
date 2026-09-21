-- Allow diary entries of arbitrary text length while keeping blank entries invalid.
set local lock_timeout = '5s';

alter table public.daily_reflections drop constraint if exists daily_reflections_body_check;

create or replace function private.save_my_daily_reflection(thought text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype; d date;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 if thought is null or char_length(btrim(thought)) < 1 then raise exception 'invalid_reflection'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active' for share of rel,m;
 if r.id is null then raise exception 'no_active_relationship'; end if;
 d:=(statement_timestamp() at time zone r.timezone)::date;
 insert into public.daily_reflections(user_id,relationship_id,reflection_date,body) values(u,r.id,d,btrim(thought))
 on conflict(user_id,relationship_id,reflection_date) do update set body=excluded.body,updated_at=now();
 return jsonb_build_object('date',d,'text',btrim(thought));
end $$;

notify pgrst,'reload schema';
