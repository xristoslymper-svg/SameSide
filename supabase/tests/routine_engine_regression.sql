-- Routine engine regression harness.
-- Safe to run against a configured Supabase database: all fixtures are rolled back.
begin;

insert into auth.users(id,email,is_anonymous,is_sso_user) values
('11111111-1111-1111-1111-111111111111','routine-test-a@example.invalid',false,false),
('22222222-2222-2222-2222-222222222222','routine-test-b@example.invalid',false,false);

insert into public.relationships(id,created_by,active_path,path_started_at,status,timezone,selected_flower,routine_activated_at)
values(
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 '11111111-1111-1111-1111-111111111111',
 'routine',
 ((statement_timestamp() at time zone 'UTC')::date-120),
 'active','UTC','cosmos',statement_timestamp()
);

insert into public.relationship_members(relationship_id,user_id,member_role,joined_at) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','member_a',statement_timestamp()-interval '120 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','member_b',statement_timestamp()-interval '120 days');

do $$
declare
 a public.task_assignments%rowtype;
 b public.task_assignments%rowtype;
 n integer;
 i integer;
 today date := (statement_timestamp() at time zone 'UTC')::date;
 counts integer[] := array[0,6,7,13,14,20,21,27];
 expects integer[] := array[1,7,8,14,15,21,22,28];
begin
 perform set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);

 a:=public.get_or_create_today_assignment(0);
 b:=public.get_or_create_today_assignment(0);
 if a.id<>b.id then raise exception 'stable refresh failed'; end if;

 begin
  perform public.get_or_create_today_assignment(1);
  raise exception 'slot 1 issued before slot 0 completion';
 exception when others then
  if sqlerrm<>'previous_slot_not_completed' then raise; end if;
 end;

 perform public.complete_assignment(a.id);
 perform public.complete_assignment(a.id);
 select count(*) into n from public.garden_events where source_assignment_id=a.id;
 if n<>1 then raise exception 'completion is not idempotent'; end if;

 b:=public.get_or_create_today_assignment(1);
 if b.slot<>1 or b.program_day<>a.program_day then raise exception 'slot 1 progression failed'; end if;
 perform public.complete_assignment(b.id);
 b:=public.get_or_create_today_assignment(2);
 if b.slot<>2 or b.program_day<>a.program_day then raise exception 'slot 2 progression failed'; end if;
 perform public.complete_assignment(b.id);

 begin
  perform public.get_or_create_today_assignment(3);
  raise exception 'slot 3 accepted';
 exception when others then
  if sqlerrm<>'invalid_slot' then raise; end if;
 end;

 for i in 1..array_length(counts,1) loop
  delete from public.garden_events where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  delete from public.task_assignments where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  n:=counts[i];
  if n>0 then
   insert into public.garden_events(relationship_id,created_by,plant_type,event_date)
   select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','flower',today-(g*2)
   from generate_series(1,n) g;
  end if;
  a:=public.get_or_create_today_assignment(0);
  if a.program_day<>expects[i] then
   raise exception 'boundary failed: expected %, got %',expects[i],a.program_day;
  end if;
 end loop;

 delete from public.garden_events where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 delete from public.task_assignments where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 insert into public.garden_events(relationship_id,created_by,plant_type,event_date)
 select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','flower',today-g
 from generate_series(1,28) g;
 begin
  perform public.get_or_create_today_assignment(0);
  raise exception 'day 29 was issued';
 exception when others then
  if sqlerrm<>'path_complete' then raise; end if;
 end;

 delete from public.garden_events where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 delete from public.task_assignments where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 insert into public.garden_events(relationship_id,created_by,plant_type,event_date)
 select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','flower',today-g
 from generate_series(1,13) g;
 perform set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
 a:=public.get_or_create_today_assignment(0);
 perform public.complete_assignment(a.id);
 perform set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
 b:=public.get_or_create_today_assignment(0);
 if a.program_day<>b.program_day then raise exception 'partners diverged: % vs %',a.program_day,b.program_day; end if;

 update public.relationships
 set timezone='Pacific/Kiritimati',
     path_started_at=((statement_timestamp() at time zone 'Pacific/Kiritimati')::date-120)
 where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 delete from public.garden_events where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 delete from public.task_assignments where relationship_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 insert into public.garden_events(relationship_id,created_by,plant_type,event_date)
 select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','flower',
        (statement_timestamp() at time zone 'Pacific/Kiritimati')::date-g
 from generate_series(1,7) g;
 perform set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
 a:=public.get_or_create_today_assignment(0);
 if a.program_day<>8 or a.assigned_for_date<>(statement_timestamp() at time zone 'Pacific/Kiritimati')::date
 then raise exception 'relationship timezone failed'; end if;
end $$;


-- Activation gate: two members, both personalization rows, and a flower are required.
insert into auth.users(id,email,is_anonymous,is_sso_user) values
('33333333-3333-3333-3333-333333333333','activation-a@example.invalid',false,false),
('44444444-4444-4444-4444-444444444444','activation-b@example.invalid',false,false);
insert into public.relationships(id,created_by,active_path,path_started_at,status,timezone)
values('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','33333333-3333-3333-3333-333333333333','routine',
(statement_timestamp() at time zone 'UTC')::date,'active','UTC');
insert into public.relationship_members(relationship_id,user_id,member_role) values
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','33333333-3333-3333-3333-333333333333','member_a'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','44444444-4444-4444-4444-444444444444','member_b');

do $
declare active boolean; started date; today date:=(statement_timestamp() at time zone 'UTC')::date;
begin
 perform set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
 begin
  perform public.get_or_create_today_assignment(0);
  raise exception 'move issued before activation';
 exception when others then
  if sqlerrm<>'routine_not_ready' then raise; end if;
 end;
 perform public.save_my_routine_preferences(array['conversation','appreciation']);
 perform public.choose_shared_flower('cosmos');
 select routine_activated_at is not null into active from public.relationships where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
 if active then raise exception 'one personalization profile activated Routine'; end if;

 perform set_config('request.jwt.claim.sub','44444444-4444-4444-4444-444444444444',true);
 perform public.save_my_routine_preferences(array['fun','time']);
 select routine_activated_at is not null,path_started_at into active,started
 from public.relationships where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
 if not active then raise exception 'second personalization profile did not activate Routine'; end if;
 if started<>today then raise exception 'activation did not reset Day 1'; end if;
end $;

rollback;
