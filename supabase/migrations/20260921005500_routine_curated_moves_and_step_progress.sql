-- Curate The Routine around four behaviour-change steps, explain why each move matters,
-- and advance the shared path by active days rather than calendar weeks.
-- One active day means at least one completed move in the relationship on that date.
-- Missing days therefore do not skip content or move the couple forward.

alter table private.task_catalogue
  add column if not exists why_it_matters text;

with curated(task_key,title,body,minutes,week_no,why_it_matters) as (values
  -- STEP 1 · NOTICE EACH OTHER AGAIN
  ('routine-v1-01','Notice one specific effort','Tell your partner one ordinary thing they did that you appreciated. Be specific.',2,1,'Routine makes familiar effort easy to stop seeing. Naming one concrete thing trains your attention back toward what your partner is already bringing into the relationship.'),
  ('routine-v1-02','Ask beyond logistics','Ask your partner about something they have been thinking about lately, then stay with the answer.',4,1,'When most conversations become practical, curiosity is one of the first things to disappear. This creates a small opening for seeing the person behind the daily logistics.'),
  ('routine-v1-03','Give them five full minutes','When your partner starts telling you something, put distractions down and give them five undivided minutes.',5,1,'Half-listening can quietly become the default. A short stretch of full attention makes being heard feel different without needing a big conversation.'),
  ('routine-v1-04','Warm up the hello','When you next see your partner, pause for a warmer hello than usual.',1,1,'Repeated everyday moments shape the tone of a relationship. Changing a routine greeting is a tiny way to interrupt autopilot and signal that seeing each other still matters.'),
  ('routine-v1-05','Name something you value','Tell your partner one quality you genuinely value in them and one small example of it.',2,1,'Specific appreciation is easier to believe than a general compliment. It helps bring positive qualities back into focus when familiarity has made them fade into the background.'),
  ('routine-v1-06','Ask about the good part','Ask what the best part of their day has been so far. Ask one follow-up question.',3,1,'Routine can shrink conversation to problems and tasks. Looking for what felt good adds a different kind of attention and makes room for more than problem-solving.'),
  ('routine-v1-07','Look up for a moment','During one ordinary moment, pause what you are doing and really look at your partner for a few seconds.',1,1,'Familiarity often means we are physically close while our attention is elsewhere. A brief moment of eye contact brings presence back into an otherwise automatic day.'),
  ('routine-v1-08','Notice what usually goes unseen','Thank your partner for one thing they do often that rarely gets mentioned.',2,1,'What happens regularly is easy to treat as background. Bringing one invisible contribution back into view can change the feeling of being taken for granted.'),
  ('routine-v1-09','Follow their thread','Ask your partner to tell you more about something they mentioned recently.',3,1,'Remembering and returning to something they said shows that their inner world stayed with you. That is a small but powerful opposite of drifting into parallel lives.'),
  ('routine-v1-10','Say what you missed','Tell your partner one small thing about them you noticed when they were not around.',2,1,'Routine can make closeness feel assumed. Naming what you notice in their absence makes the bond more visible without turning it into a grand declaration.'),
  ('routine-v1-11','Answer the small opening','When your partner shows you, tells you, or points out something small today, give it your attention instead of brushing past it.',2,1,'Connection often happens through tiny invitations rather than big talks. Responding to one of those moments helps stop the pattern of repeatedly missing each other.'),
  ('routine-v1-12','Make the goodbye warmer','Make your next goodbye a little more intentional than usual: a touch, a look, or one warm sentence.',1,1,'Beginnings and endings are easy to rush. Giving one of them a little more care changes an automatic moment into a small point of connection.'),

  -- STEP 2 · CHANGE THE DEFAULT
  ('routine-v1-13','Make a tiny invitation','Invite your partner into ten minutes together: tea, a short walk, music, a balcony break, or something equally simple.',5,2,'Routine stays powerful when nothing interrupts it. A small invitation creates a new shared moment without requiring plans, energy, or a special occasion.'),
  ('routine-v1-14','Change one tiny default','Do one familiar thing slightly differently together today.',3,2,'Newness does not need to be dramatic. Changing a small default makes the day less predictable and reminds you that the relationship can still contain choice.'),
  ('routine-v1-15','Bring a small comfort','Bring your partner water, coffee, tea, or another small comfort without being asked.',2,2,'Care becomes easy to assume when life is repetitive. A small unprompted act makes care visible again in a way that words alone sometimes do not.'),
  ('routine-v1-16','Leave a small surprise','Leave a short note, snack, message, or tiny unexpected thing your partner will find later.',3,2,'Predictability can flatten attention. A harmless surprise creates a positive break in the routine and gives your partner a moment that feels chosen rather than automatic.'),
  ('routine-v1-17','Bring back an inside joke','Use a phrase, joke, photo, or reference that belongs to the two of you.',2,2,'Shared history is part of what makes a couple feel like a team. Bringing one piece of it back into the present can restore a sense of “us” inside an ordinary day.'),
  ('routine-v1-18','Choose the slower option','In one moment today, choose the slightly slower option if it gives you a little more time together.',3,2,'Efficiency often wins by default. Choosing closeness once, even for a few minutes, breaks the idea that every shared moment has to be optimized or rushed.'),
  ('routine-v1-19','Let them choose','Hand your partner one small decision you would normally make together and happily go with their choice.',2,2,'Routine can make shared life feel overly scripted. Letting the other person shape one small part of the day adds flexibility and a little freshness.'),
  ('routine-v1-20','Upgrade one ordinary moment','Make one routine moment nicer than usual: dinner, coffee, the commute, bedtime, or another repeated part of the day.',4,2,'The goal is not to escape everyday life but to change how it feels. Improving one repeated moment shows that ordinary routines can carry warmth instead of only repetition.'),
  ('routine-v1-21','Share a song','Send or play one song that reminds you of your partner, of you two, or of a moment you shared.',3,2,'Music can bring emotion into a day without demanding a serious conversation. It is a simple way to create novelty and reconnect with shared meaning.'),
  ('routine-v1-22','Do one playful thing','Share or do one harmless thing whose only purpose is to make the two of you smile.',3,2,'Play often disappears when a relationship becomes mostly practical. One small moment of silliness interrupts that pattern and makes room for a different kind of energy.'),
  ('routine-v1-23','Give them first choice of ten minutes','Offer ten free minutes and ask your partner what would feel nice to do together with them.',4,2,'Couples can stop actively choosing each other when schedules take over. This puts a small piece of time back into the relationship on purpose.'),
  ('routine-v1-24','Make the familiar feel chosen','Pick one thing you already do together and say, “I want to do this with you today,” before you do it.',1,2,'The same action feels different when it is intentional. Turning a habit into a choice helps everyday closeness feel less automatic.'),

  -- STEP 3 · TURN TOWARD EACH OTHER
  ('routine-v1-25','Pause before correcting','The next time you want to correct a small detail, let it go unless it truly matters.',1,3,'Tiny corrections can create unnecessary friction when they become automatic. Letting one unimportant thing pass creates more room for warmth than for being right.'),
  ('routine-v1-26','Ask instead of assuming','If your partner seems off today, ask how they are rather than deciding what their mood means.',2,3,'Assumptions can turn uncertainty into distance very quickly. A simple question replaces guessing with real information and lowers the chance of reacting to a story that may be wrong.'),
  ('routine-v1-27','Show what you heard','When your partner tells you something important, briefly tell them what you understood before giving your own view.',3,3,'People often respond before they feel understood. Showing what you heard first makes disagreement less likely to become a fight about whether anyone was listening.'),
  ('routine-v1-28','Start gently','If you need something today, say what you want or miss without starting with what your partner did wrong.',3,3,'How a difficult moment begins often shapes where it goes. Starting with the need rather than the accusation makes it easier for the other person to stay open.'),
  ('routine-v1-29','Own one small miss','If you notice one small thing you could have handled better, say it plainly without adding a “but.”',2,3,'Defending every small mistake keeps the same cycle alive. Owning one part of a moment can remove the need for the other person to keep proving their point.'),
  ('routine-v1-30','Ask what would help','Ask, “Is there one small thing that would make today easier?” Then do only what they actually ask for.',3,3,'Trying to help can miss the mark when we guess. Asking directly turns care into something useful and avoids the frustration of unwanted fixing.'),
  ('routine-v1-31','Acknowledge before fixing','When your partner shares a frustration, first respond to how it felt before offering a solution.',2,3,'Solutions can sound like dismissal when someone mainly wants to feel understood. Acknowledging the experience first changes the sequence and often softens the whole exchange.'),
  ('routine-v1-32','Come back after distraction','If you catch yourself half-listening, put the distraction down and say, “Sorry, say that again.”',1,3,'Everyone gets distracted. Repairing the moment quickly matters more than pretending it did not happen, and it stops small disconnections from piling up.'),
  ('routine-v1-33','Make room for the feeling','If your partner is upset, resist trying to talk them out of it for one conversation. Be curious instead.',4,3,'Trying to remove an uncomfortable feeling can make the other person defend it harder. Curiosity gives the feeling space without turning it into an argument.'),
  ('routine-v1-34','Repair one small tension','If there is a minor awkward moment today, make the first small move back: a softer tone, a touch, a kind sentence, or a simple “we’re okay.”',2,3,'Distance often lasts longer because both people wait. A small repair interrupts the stand-off before it grows into the rest of the evening.'),
  ('routine-v1-35','Ask what they need more of','Ask what they would enjoy having a little more of between you lately. Just listen to the answer.',4,3,'Needs are easier to respond to when they are spoken rather than guessed. Listening without immediately defending or negotiating makes honesty safer.'),
  ('routine-v1-36','Share first','Tell your partner one small thought or feeling you would normally keep to yourself unless they asked.',3,3,'Parallel routines grow when both people wait to be invited in. Sharing something small first makes closeness easier without demanding a deep conversation.'),

  -- STEP 4 · KEEP WHAT WORKS
  ('routine-v1-37','Repeat something that worked','Think of one move from this journey that felt good between you and do a version of it again today.',3,4,'A good moment becomes useful when it can be repeated. Choosing something that already worked helps turn an isolated success into a pattern.'),
  ('routine-v1-38','Say thank you and why','Thank your partner for something familiar and add one sentence about why it matters to you.',2,4,'Explaining why something matters gives ordinary appreciation more meaning and makes it clearer which behaviours strengthen the relationship.'),
  ('routine-v1-39','Take one thing off their plate','Handle one small task your partner would otherwise have to remember or manage.',4,4,'Lasting closeness also lives in practical life. Reducing one piece of mental load shows care in a form that can be felt immediately.'),
  ('routine-v1-40','End the day warmly','Before the day ends, name one thing from today that you appreciated about your partner.',2,4,'What gets repeated at the end of the day becomes easier to notice the next day. A warm ending reinforces attention to what is working rather than only what went wrong.'),
  ('routine-v1-41','Make one tiny ritual','Choose one small thing worth repeating regularly: coffee together, a check-in, a walk, a hug before sleep, or something of your own.',4,4,'Habits last more easily when they have a clear place in the day. A tiny ritual gives connection a home instead of relying on remembering when life gets busy.'),
  ('routine-v1-42','Put one thing on the calendar','Choose one simple thing you would enjoy doing together in the next few days and pick a time for it.',3,4,'Good intentions disappear easily inside busy weeks. Giving one shared moment a place in the calendar protects it from being pushed aside by default.'),
  ('routine-v1-43','Celebrate a small win','Notice one thing your partner handled well today and say it out loud.',2,4,'What receives attention is easier to repeat. Recognising a small win builds a habit of seeing effort instead of only noticing what still needs fixing.'),
  ('routine-v1-44','Protect ten minutes','Choose ten minutes today that belong to the two of you with no chores, logistics, or screens.',5,4,'Connection is easier to maintain when it has a small protected space. Ten minutes is short enough to repeat and long enough to feel different from passing contact.'),
  ('routine-v1-45','Add affection to a routine','Attach one small affectionate gesture to something that already happens every day.',1,4,'New habits stick better when they are connected to an existing routine. This makes warmth easier to repeat without needing extra planning.'),
  ('routine-v1-46','Plan one future little thing','Suggest one small thing you would both enjoy doing together soon, and make the next step concrete.',3,4,'Looking forward to something together keeps the relationship from becoming only about today’s tasks. Small shared plans create a sense of moving in the same direction.'),
  ('routine-v1-47','Name a change you noticed','Tell your partner one small positive change you have noticed between you during this journey.',3,4,'Change is easier to keep when it is visible. Naming one real difference helps both of you recognise that small choices have been adding up.'),
  ('routine-v1-48','Choose one thing to keep','Pick one small thing from this path that you want to keep doing after it ends. Do it once today.',3,4,'The goal is not to finish a challenge and return to the old default. Choosing one behaviour to carry forward turns the end of the path into the start of a lasting habit.')
)
update private.task_catalogue t
set title=c.title,
    body=c.body,
    minutes=c.minutes,
    week_no=c.week_no,
    why_it_matters=c.why_it_matters
from curated c
where t.task_key=c.task_key;

alter table private.task_catalogue
  alter column why_it_matters set not null;

alter table public.task_assignments
  add column if not exists task_why text;

update public.task_assignments a
set task_title=t.title,
    task_body=t.body,
    task_minutes=t.minutes,
    task_why=t.why_it_matters
from private.task_catalogue t
where a.task_key=t.task_key and a.contract_version=1;

-- The path now advances after seven active relationship days per step.
-- We intentionally count only dates before today while issuing moves, so both
-- partners stay in the same step even if one completes today's move first.
create or replace function private.issue_assignment(requested_slot integer)
returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 m public.relationship_members%rowtype; a public.task_assignments%rowtype;
 today date; active_days_before integer; programme_day integer; programme_step integer;
 day_position integer; role_offset integer; pick_index integer;
 chosen text; seed bytea; keys text[]; t private.task_catalogue%rowtype;
 completed_count integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 if requested_slot is null or requested_slot not between 0 and 2 then raise exception using message='invalid_slot'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.relationship_members where user_id=u and left_at is null;
 if rid is null then raise exception using message='no_active_relationship'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 if r.active_path<>'routine' or today<r.path_started_at then raise exception using message='path_not_available'; end if;
 if today<(m.joined_at at time zone r.timezone)::date then raise exception using message='before_membership'; end if;

 select count(distinct g.event_date)::integer into active_days_before
 from public.garden_events g
 where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<today;
 active_days_before:=coalesce(active_days_before,0);
 if active_days_before>=28 then raise exception using message='path_complete'; end if;
 programme_day:=least(active_days_before+1,28);
 programme_step:=least(4,(active_days_before/7)+1);

 select * into a from public.task_assignments
 where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;

 select count(*) into completed_count from public.task_assignments
 where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(
   select 1 from public.task_assignments
   where user_id=u and assigned_for_date=today and slot=requested_slot-1
     and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;

 insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;
 select selection_seed into seed from private.relationship_secrets where relationship_id=rid;
 select array_agg(task_key order by extensions.hmac(task_key,encode(seed,'hex'),'sha256'),task_key)
 into keys from private.task_catalogue where week_no=programme_step;
 if coalesce(cardinality(keys),0)<12 then raise exception using message='catalogue_unavailable'; end if;

 day_position:=mod(active_days_before,7);
 role_offset:=case when m.member_role='member_b' then 6 else 0 end;
 pick_index:=mod(day_position + role_offset + requested_slot*2,cardinality(keys))+1;
 chosen:=keys[pick_index];
 select * into t from private.task_catalogue where task_key=chosen;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;

 insert into public.task_assignments(
   relationship_id,user_id,task_key,assigned_for_date,is_bonus,
   slot,program_day,task_title,task_body,task_minutes,task_why,contract_version)
 values(
   rid,u,t.task_key,today,requested_slot>0,
   requested_slot,programme_day,t.title,t.body,t.minutes,t.why_it_matters,1)
 returning * into a;
 return a;
end $$;

create or replace function private.finish_assignment(assignment_id uuid)
returns uuid
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 a public.task_assignments%rowtype; m public.relationship_members%rowtype;
 today date; n integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.task_assignments where id=assignment_id and user_id=u;
 if rid is null then raise exception using message='assignment_not_found'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 select * into a from public.task_assignments where id=assignment_id and user_id=u for update;
 if a.status='completed' then
   if not exists(select 1 from public.garden_events where source_assignment_id=a.id)
   then raise exception using message='completion_history_inconsistent'; end if;
   return null;
 end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 if a.contract_version is distinct from 1 then raise exception using message='legacy_assignment_read_only'; end if;
 if a.status<>'assigned' or a.assigned_for_date<>today or a.created_at<m.joined_at
 or a.assigned_for_date<(m.joined_at at time zone r.timezone)::date
 or r.active_path<>'routine' or today<r.path_started_at
 then raise exception using message='assignment_not_eligible'; end if;
 if a.slot>0 and not exists(
   select 1 from public.task_assignments where user_id=u
   and assigned_for_date=today and slot=a.slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 select count(*) into n from public.task_assignments where user_id=u and status='completed'
 and (completed_at at time zone r.timezone)::date=today;
 if n>=3 then raise exception using message='daily_limit_reached'; end if;
 update public.task_assignments set status='completed',completed_at=statement_timestamp() where id=a.id;
 insert into public.garden_events(relationship_id,created_by,source_assignment_id,plant_type,event_date)
 values(rid,u,a.id,'flower',today);
 return null;
end $$;

create or replace function private.read_shared_garden_state()
returns table(stage_key text,bloom boolean,programme_complete boolean)
language plpgsql stable security definer set search_path='' as $$
declare
 rid uuid; r public.relationships%rowtype; today date; active_days integer;
begin
 select relationship_id into rid from public.relationship_members
 where user_id=auth.uid() and left_at is null;
 if rid is null then return; end if;
 select * into r from public.relationships where id=rid;
 if r.id is null or r.status<>'active' then return; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 select count(distinct g.event_date)::integer into active_days
 from public.garden_events g
 where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<=today;
 active_days:=coalesce(active_days,0);

 stage_key:=case
   when active_days>=28 then 'bloom'
   when active_days>=24 then 'opening'
   when active_days>=18 then 'bud'
   when active_days>=12 then 'established'
   when active_days>=7 then 'leaves'
   when active_days>=3 then 'shoot'
   when active_days>=1 then 'roots'
   else 'seed' end;
 bloom:=stage_key='bloom';
 programme_complete:=active_days>=28;
 return next;
end $$;
