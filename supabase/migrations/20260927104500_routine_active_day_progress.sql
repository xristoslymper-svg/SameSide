create or replace function private.read_routine_progress()
returns table(program_day integer, week_no integer, active_days integer, programme_complete boolean)
language plpgsql stable security definer set search_path='' as $$
declare rid uuid; r public.relationships%rowtype; n integer;
begin
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is null then return; end if;
 select * into r from public.relationships where id=rid;
 if r.id is null or r.status<>'active' or r.active_path<>'routine' then return; end if;
 select count(distinct event_date)::integer into n from public.garden_events
 where relationship_id=rid and event_date>=r.path_started_at;
 n:=coalesce(n,0);
 active_days:=n;
 programme_complete:=n>=28;
 program_day:=least(n+1,28);
 week_no:=least(4,(least(n,27)/7)+1);
 return next;
end $$;

create or replace function public.get_routine_progress()
returns table(program_day integer, week_no integer, active_days integer, programme_complete boolean)
language sql security invoker set search_path='' as $$select * from private.read_routine_progress()$$;
revoke all on function public.get_routine_progress() from public;
grant execute on function public.get_routine_progress() to authenticated;