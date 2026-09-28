-- Couple onboarding + first-day end-to-end simulation.
-- Uses only fake users and public RPCs. Everything is rolled back.
begin;

insert into auth.users(id,email,is_anonymous,is_sso_user) values
('55555555-5555-5555-5555-555555555555','sim-a@example.invalid',false,false),
('66666666-6666-6666-6666-666666666666','sim-b@example.invalid',false,false),
('99999999-9999-9999-9999-999999999999','sim-c@example.invalid',false,false);

update public.profiles set display_name='Alex Test' where id='55555555-5555-5555-5555-555555555555';

do $test$
declare
 rid uuid;
 token text;
 state jsonb;
 invite_state text;
 invite_name text;
 a0 public.task_assignments%rowtype;
 a1 public.task_assignments%rowtype;
 b0 public.task_assignments%rowtype;
 n integer;
begin
 -- Person A: Path -> personalization -> Flower -> invite.
 perform set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
 rid:=public.create_relationship('Europe/Berlin');
 perform public.save_my_routine_preferences(array['affection','conversation']);
 perform public.choose_shared_flower('cosmos');
 state:=public.get_routine_activation_state();
 if (state->>'activated')::boolean then raise exception 'Routine activated before partner'; end if;

 begin
  perform public.get_or_create_today_assignment(0);
  raise exception 'Move issued before couple setup completed';
 exception when others then
  if sqlerrm<>'routine_not_ready' then raise; end if;
 end;

 token:=public.create_relationship_invite(168);
 select p.invite_state,p.display_name into invite_state,invite_name
 from public.preview_relationship_invite(token) p;
 if invite_state<>'ready' or invite_name<>'Alex Test' then raise exception 'Invite preview failed'; end if;

 -- Person B: invitation -> join -> personalization. No Path or Flower choice.
 perform set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
 if public.accept_relationship_invite(token)<>rid then raise exception 'Partner joined wrong relationship'; end if;
 if public.accept_relationship_invite(token)<>rid then raise exception 'Invite retry was not idempotent'; end if;

 begin
  perform public.choose_shared_flower('daisy');
  raise exception 'Person B replaced shared flower';
 exception when others then
  if sqlerrm<>'flower_already_chosen' then raise; end if;
 end;

 perform public.save_my_routine_preferences(array['fun','novelty']);
 state:=public.get_routine_activation_state();
 if not (state->>'activated')::boolean
    or not (state->>'my_ready')::boolean
    or not (state->>'partner_ready')::boolean
    or (state->>'member_count')::integer<>2
 then raise exception 'Routine did not activate after both profiles were ready'; end if;

 -- First day: private Moves, shared progress, ordered extras.
 perform set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
 a0:=public.get_or_create_today_assignment(0);
 if (public.get_or_create_today_assignment(0)).id<>a0.id then raise exception 'A refresh changed the Move'; end if;

 perform set_config('request.jwt.claim.sub','66666666-6666-6666-6666-666666666666',true);
 b0:=public.get_or_create_today_assignment(0);
 if a0.program_day<>1 or b0.program_day<>1 then raise exception 'Partners did not start on Day 1'; end if;

 begin
  perform public.get_or_create_today_assignment(1);
  raise exception 'B skipped slot 0';
 exception when others then
  if sqlerrm<>'previous_slot_not_completed' then raise; end if;
 end;

 begin
  perform public.complete_assignment(a0.id);
  raise exception 'B completed A assignment';
 exception when others then
  if sqlerrm<>'assignment_not_found' then raise; end if;
 end;

 perform public.complete_assignment(b0.id);
 perform public.complete_assignment(b0.id);
 select count(*) into n from public.garden_events where source_assignment_id=b0.id;
 if n<>1 then raise exception 'Completion was not idempotent'; end if;

 perform set_config('request.jwt.claim.sub','55555555-5555-5555-5555-555555555555',true);
 perform public.complete_assignment(a0.id);
 a1:=public.get_or_create_today_assignment(1);
 if a1.slot<>1 or a1.program_day<>1 then raise exception 'Another Move did not unlock correctly'; end if;

 -- A third user cannot reuse the accepted invitation.
 perform set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
 begin
  perform public.accept_relationship_invite(token);
  raise exception 'Third user joined relationship';
 exception when others then
  if sqlerrm not in ('invite_already_used','relationship_full') then raise; end if;
 end;
end
$test$;

rollback;
