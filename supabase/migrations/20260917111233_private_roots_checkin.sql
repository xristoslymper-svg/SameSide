-- Private current-week check-in only. No partner-derived response or table grants.
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create function public.get_my_root_preferences() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare u uuid := auth.uid(); r public.relationships%rowtype; day_no integer; wk integer;
 choices jsonb;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select rel.* into r from public.relationships rel
 join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active';
 if r.id is null then raise exception using message='no_active_relationship'; end if;
 day_no := (statement_timestamp() at time zone r.timezone)::date-r.path_started_at+1;
 -- Existing storage models the four Routine weeks. After the program, retain
 -- the final week's saved state for reading; do not invent a new period.
 wk := least(4,greatest(1,((day_no-1)/7)+1));
 select coalesce(jsonb_agg(p.need order by p.need),'[]'::jsonb) into choices
 from public.root_preferences p where p.user_id=u and p.relationship_id=r.id and p.week_no=wk;
 return jsonb_build_object('choices',choices,'can_edit',r.active_path='routine' and day_no between 1 and 28);
end $$;

create function private.save_my_root_preferences(choices text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); rid uuid; r public.relationships%rowtype; day_no integer; wk integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if choices is null or cardinality(choices) not between 1 and 2
 or array_ndims(choices)<>1
 or exists(select 1 from unnest(choices) c where c is null or c not in
 ('affection','fun','conversation','spontaneity','attention','support'))
 or (select count(distinct c) from unnest(choices) c)<>cardinality(choices)
 then raise exception using message='invalid_root_choices'; end if;
 -- Same caller lock as Phase 1A; two requests from this user cannot interleave.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for share;
 perform 1 from public.relationship_members where relationship_id=rid and user_id=u and left_at is null for share;
 if not found or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 day_no := (statement_timestamp() at time zone r.timezone)::date-r.path_started_at+1;
 if r.active_path<>'routine' or day_no not between 1 and 28
 then raise exception using message='roots_period_not_available'; end if;
 wk := ((day_no-1)/7)+1;
 delete from public.root_preferences p where p.user_id=u and p.relationship_id=rid and p.week_no=wk
 and not (p.need=any(choices));
 insert into public.root_preferences(relationship_id,user_id,week_no,need)
 select rid,u,wk,c from unnest(choices) c
 on conflict(relationship_id,user_id,week_no,need) do nothing;
 -- Only caller-supplied, validated choices. No reads of partner answers/insights.
 return jsonb_build_object('choices',(select jsonb_agg(c order by c) from unnest(choices) c),'can_edit',true);
end $$;

create function public.save_my_root_preferences(choices text[]) returns jsonb
language sql security invoker set search_path = '' as $$
 select private.save_my_root_preferences(choices)
$$;

revoke all on function public.get_my_root_preferences(),public.save_my_root_preferences(text[]),
 private.save_my_root_preferences(text[]) from public,anon,authenticated;
grant execute on function public.get_my_root_preferences(),public.save_my_root_preferences(text[]),
 private.save_my_root_preferences(text[]) to authenticated;
-- Owner-only SELECT, disabled direct DML and disabled overlap derivation stay intact.
notify pgrst, 'reload schema';
