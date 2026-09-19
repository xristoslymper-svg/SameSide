-- Snapshot only pre-existing active paths missing a flower. New relationships
-- keep starter-only selection. No history, path dates or memberships change.
set local lock_timeout = '5s';
alter table public.relationships add column legacy_flower_choice boolean not null default false;
update public.relationships set legacy_flower_choice=true
 where status='active' and active_path is not null and selected_flower is null;

create or replace function private.choose_shared_flower(flower text) returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.relationships%rowtype;
begin
 if u is null then raise exception 'not_authenticated'; end if;
 if flower is null or flower not in ('cosmos','forget-me-not','zinnia','daisy','calendula','cornflower') then raise exception 'invalid_flower'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select rel.* into r from public.relationships rel join public.relationship_members m on m.relationship_id=rel.id
 where m.user_id=u and m.left_at is null and rel.status='active' for update of rel,m;
 if r.id is null then raise exception 'no_active_relationship'; end if;
 -- Lock serializes competing partners. Same-choice retries remain safe even
 -- after the one-time legacy allowance has been consumed.
 if r.selected_flower is not null then
  if r.selected_flower=flower then return flower; end if;
  raise exception 'flower_already_chosen';
 end if;
 if r.created_by<>u and not r.legacy_flower_choice then raise exception 'only_creator_can_choose'; end if;
 update public.relationships set selected_flower=flower,legacy_flower_choice=false where id=r.id;
 return flower;
end $$;
-- Existing authenticated-only RPC grants and row policies remain unchanged.
notify pgrst,'reload schema';
