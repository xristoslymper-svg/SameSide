-- Invitation lifecycle hardening for production.
create or replace function public.revoke_relationship_invites()
returns void
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 update public.relationship_invites set revoked_at=statement_timestamp()
 where relationship_id=rid and accepted_at is null and revoked_at is null;
end $$;
revoke execute on function public.revoke_relationship_invites() from public,anon;
grant execute on function public.revoke_relationship_invites() to authenticated;

create or replace function public.create_relationship_invite(valid_hours integer default 168)
returns text
language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 if exists(select 1 from public.relationship_members where relationship_id=rid and left_at is not null)
 then raise exception using message='relationship_closed'; end if;
 return private.create_invite(valid_hours);
end $$;
revoke execute on function public.create_relationship_invite(integer) from public,anon;
grant execute on function public.create_relationship_invite(integer) to authenticated;
notify pgrst, 'reload schema';
