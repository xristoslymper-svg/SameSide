-- Give every Roots target useful adjacent signals without pretending unrelated Moves are exact matches.
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
   union all select 'emotional_conversation',0.35 where root_target='curiosity'
   union all select 'curiosity',0.3 where root_target='emotional_conversation'
   union all select 'spontaneity',0.4 where root_target='playfulness'
   union all select 'spontaneity',0.55 where root_target='novelty'
   union all select 'novelty',0.55 where root_target='spontaneity'
   union all select 'playfulness',0.3 where root_target='spontaneity'
   union all select 'shared_experience',0.3 where root_target='quality_attention'
   union all select 'verbal_affection',0.5 where root_target='physical_affection'
   union all select 'quality_attention',0.25 where root_target='physical_affection'
   union all select 'appreciation',0.35 where root_target='verbal_affection'
   union all select 'quality_attention',0.3 where root_target='shared_experience'
   union all select 'shared_experience',0.35 where root_target='anticipation'
   union all select 'verbal_affection',0.55 where root_target='appreciation'
   union all select 'quality_attention',0.3 where root_target='support'
 ),
 combined as (
   select target,least(2.0,sum(w)) w from signals where target is not null group by target
 )
 select coalesce(sum(coalesce((weights->>target)::numeric,0)*w),0)::numeric from combined
$$;
revoke all on function private.personalization_fit(jsonb,text[],text) from public,anon,authenticated;
