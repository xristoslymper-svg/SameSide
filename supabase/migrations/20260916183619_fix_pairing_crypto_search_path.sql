create or replace function public.create_relationship_invite(valid_hours integer default 168)
returns text
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare rid uuid; raw_token text;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is null then raise exception 'no active relationship'; end if;
 if (select count(*) from public.relationship_members where relationship_id=rid and left_at is null) >= 2 then raise exception 'relationship already has two members'; end if;
 update public.relationship_invites set revoked_at=now() where relationship_id=rid and accepted_at is null and revoked_at is null;
 raw_token := encode(extensions.gen_random_bytes(32),'hex');
 insert into public.relationship_invites(relationship_id,created_by,token_hash,expires_at)
 values(rid,auth.uid(),encode(extensions.digest(raw_token,'sha256'),'hex'),now()+make_interval(hours=>greatest(1,least(valid_hours,720))));
 return raw_token;
end; $function$;

create or replace function public.accept_relationship_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare inv public.relationship_invites%rowtype; rid uuid;
begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if exists(select 1 from public.relationship_members where user_id=auth.uid() and left_at is null) then raise exception 'already in an active relationship'; end if;
 select * into inv from public.relationship_invites
 where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex')
 for update;
 if inv.id is null then raise exception 'invalid invite'; end if;
 if inv.revoked_at is not null then raise exception 'invite revoked'; end if;
 if inv.accepted_at is not null then raise exception 'invite already used'; end if;
 if inv.expires_at <= now() then raise exception 'invite expired'; end if;
 if inv.created_by=auth.uid() then raise exception 'cannot accept your own invite'; end if;
 rid := inv.relationship_id;
 if (select count(*) from public.relationship_members where relationship_id=rid and left_at is null) >= 2 then raise exception 'relationship already has two members'; end if;
 insert into public.relationship_members(relationship_id,user_id,member_role) values(rid,auth.uid(),'member_b');
 update public.relationship_invites set accepted_at=now(), accepted_by=auth.uid() where id=inv.id;
 return rid;
end; $function$;