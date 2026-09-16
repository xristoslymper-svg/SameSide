-- READ ONLY. Run before an approved production rollout; returns counts/catalogs, not user records.
select version,name from supabase_migrations.schema_migrations order by version;
select n.nspname,c.relname,c.reltuples::bigint as estimated_rows,pg_total_relation_size(c.oid) as bytes
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;
select count(*) as legacy_completed_without_timestamp from public.task_assignments
where status='completed' and completed_at is null;
select count(*) as completed_without_garden_event from public.task_assignments a
where a.status='completed' and not exists(select 1 from public.garden_events g where g.source_assignment_id=a.id);
select count(*) as premature_garden_events from public.garden_events g
join public.task_assignments a on a.id=g.source_assignment_id where a.status<>'completed';
select count(*) as reserved_catalogue_key_collisions from public.task_assignments
where task_key like 'routine-v1-%';
select count(*) as relationships_with_future_start from public.relationships where path_started_at>current_date;
select count(*) as nonroutine_active_relationships from public.relationships where status='active' and active_path<>'routine';
select count(*) as members_without_profiles from public.relationship_members m
where m.left_at is null and not exists(select 1 from public.profiles p where p.id=m.user_id);
select * from pg_publication_tables where schemaname in ('public','private');
-- Also compare baseline/catalog.json with the live catalog; confirm private is NOT API-exposed.
-- Investigate nonzero inconsistency/collision counts before approving migration, not by deleting history.
