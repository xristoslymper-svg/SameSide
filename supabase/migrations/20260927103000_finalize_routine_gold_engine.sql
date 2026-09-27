-- Finalize The Routine content engine with the reviewed 50-move gold set.
-- Keeps historical catalogue rows for old assignments; selector uses content_version=2.

alter table private.task_catalogue add column if not exists week_no integer;
alter table private.task_catalogue add column if not exists why_it_matters text;
alter table private.task_catalogue add column if not exists family text;
alter table private.task_catalogue add column if not exists mechanisms text[] not null default '{}';
alter table private.task_catalogue add column if not exists contexts text[] not null default '{}';
alter table private.task_catalogue add column if not exists effort integer;
alter table private.task_catalogue add column if not exists requires_leaving_home boolean not null default false;
alter table private.task_catalogue add column if not exists requires_partner_cooperation boolean not null default false;
alter table private.task_catalogue add column if not exists repeatability text;
alter table private.task_catalogue add column if not exists keeper_potential text;
alter table private.task_catalogue add column if not exists theme_weights jsonb not null default '{}'::jsonb;
alter table private.task_catalogue add column if not exists eligible_weeks integer[] not null default '{}';
alter table private.task_catalogue add column if not exists exclusions text[] not null default '{}';
alter table private.task_catalogue add column if not exists content_version integer not null default 1;

alter table public.task_assignments add column if not exists task_why text;

insert into private.task_catalogue(task_key,title,body,minutes,week_no,why_it_matters,family,mechanisms,contexts,effort,requires_leaving_home,requires_partner_cooperation,repeatability,keeper_potential,theme_weights,eligible_weeks,exclusions,content_version)
values
('RTN001','Say the good thing','Notice one thing they handled today that you would normally leave unspoken. Tell them you noticed.',1,1,'Small acknowledgements interrupt the tendency to filter familiar effort into the background.','DO',array['attention','appreciation','perceived_responsiveness']::text[],array['home','workday','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0|closeness:0.7|support:0.6'::jsonb,array[1]::int[],array['none']::text[],2),
('RTN002','Catch the autopilot','At one ordinary moment together today, notice what each of you does without thinking. Don''t change it yet; just name the pattern privately to yourself.',1,1,'Noticing a cue-response pattern is the first step toward choosing a different response.','NOTICE',array['attention','self_monitoring']::text[],array['home','anywhere']::text[],1,false::boolean,false::boolean,'high','medium','routine:1.0|communication:0.3'::jsonb,array[1]::int[],array['none']::text[],2),
('RTN003','One real follow-up','When they tell you something about their day, ask one genuine follow-up question before talking about your own day.',2,1,'A small change in attention can make an ordinary exchange feel less automatic and more responsive.','DO',array['curiosity','active_listening','perceived_responsiveness']::text[],array['home','walking','car','text_or_remote','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.9|communication:0.8|closeness:0.6'::jsonb,array[1]::int[],array['none']::text[],2),
('RTN004','Look up','The next time they enter the room or meet you somewhere today, pause what you''re doing for a few seconds and properly look at them.',1,1,'Deliberately shifting attention can interrupt familiar moments that have become almost invisible.','DO',array['attention','perceived_responsiveness']::text[],array['home','cafe_or_bar','restaurant','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:1.0|closeness:0.7'::jsonb,array[1,4]::int[],array['physical_affection_not_required']::text[],2),
('RTN005','Notice the assumption','The next time something small annoys you, catch the first explanation your mind gives you for why they did it. Don''t argue with it; just notice it.',1,1,'Automatic interpretations can shape a reaction before we realize an interpretation has happened.','NOTICE',array['self_monitoring','alternative_interpretation']::text[],array['home','car','shopping_or_errands','anywhere']::text[],1,false::boolean,false::boolean,'high','medium','routine:0.8|conflict:0.8|communication:0.5'::jsonb,array[1,3]::int[],array['acute_conflict']::text[],2),
('RTN006','Find the detail','Notice one small detail about your partner today that you haven''t paid attention to lately: what they''re wearing, doing, reading, humming, or choosing.',1,1,'Familiarity can narrow attention. Deliberately noticing detail makes the familiar visible again.','NOTICE',array['attention','curiosity']::text[],array['home','outdoors','social_setting','anywhere']::text[],1,false::boolean,false::boolean,'medium','low','routine:1.0|closeness:0.5'::jsonb,array[1]::int[],array['none']::text[],2),
('RTN007','Ask beyond logistics','At some point today, ask one question that isn''t about schedules, chores, money, food, or plans.',2,1,'Moving one conversation beyond coordination creates a small opening for curiosity.','DO',array['curiosity','self_disclosure']::text[],array['home','walking','cafe_or_bar','car','text_or_remote']::text[],1,false::boolean,true::boolean,'medium','medium','routine:0.9|communication:0.7|closeness:0.7'::jsonb,array[1]::int[],array['high_conflict']::text[],2),
('RTN008','Spot their bid','Notice one small attempt they make to get your attention today—a comment, joke, photo, question, or look. Respond instead of letting it pass.',2,1,'Responding to small bids for attention can change the feel of everyday interaction without requiring a big conversation.','DO',array['attention','perceived_responsiveness','positive_affect']::text[],array['home','text_or_remote','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.9|closeness:0.8|communication:0.5'::jsonb,array[1,4]::int[],array['none']::text[],2),
('RTN009','Remember the version','When you see your partner today, briefly remember one thing about them that first drew you in. Keep it to yourself or tell them if it feels natural.',1,1,'Bringing an older positive representation to mind can interrupt seeing a familiar person only through today''s logistics.','NOTICE',array['attention','positive_affect']::text[],array['home','commuting','workday','anywhere']::text[],1,false::boolean,false::boolean,'medium','low','routine:0.8|spark:0.7|closeness:0.6'::jsonb,array[1]::int[],array['acute_conflict']::text[],2),
('RTN010','Five minutes, no admin','During five minutes together today, leave chores, schedules, work admin, and tomorrow''s planning alone.',5,1,'Briefly removing logistical talk creates room for a different kind of interaction.','TRY_DIFFERENTLY',array['behavioral_experiment','environmental_design','shared_activity']::text[],array['home','walking','car','cafe_or_bar']::text[],1,false::boolean,true::boolean,'medium','medium','routine:1.0|closeness:0.6|communication:0.4'::jsonb,array[1,2]::int[],array['urgent_logistics']::text[],2),
('RTN011','Change the route','If you walk or drive somewhere together today, take a slightly different route.',5,2,'Tiny environmental changes can interrupt autopilot and create fresh shared attention.','TRY_DIFFERENTLY',array['novelty','behavioral_experiment','environmental_design']::text[],array['walking','car','outdoors','shopping_or_errands']::text[],1,false::boolean,true::boolean,'medium','medium','routine:1.0|spark:0.5'::jsonb,array[2]::int[],array['mobility_constraints']::text[],2),
('RTN012','Choose for each other','If you get a coffee, snack, or small treat together today, let each person choose for the other within something you both already like.',5,2,'A low-stakes change to a familiar choice introduces novelty and attention without requiring a special date.','TRY_DIFFERENTLY',array['novelty','curiosity','behavioral_experiment']::text[],array['cafe_or_bar','restaurant','shopping_or_errands']::text[],2,false::boolean,true::boolean,'low','low','routine:0.9|spark:0.7'::jsonb,array[2]::int[],array['dietary_or_financial_constraints']::text[],2),
('RTN013','Send the unexpected thing','Send them something during the day that isn''t practical: a photo, thought, joke, or tiny thing that made you think of them.',2,2,'Changing a communication channel from coordination to connection adds novelty to an ordinary day.','DO',array['positive_affect','approach_behavior','attention']::text[],array['workday','commuting','text_or_remote']::text[],1,false::boolean,false::boolean,'high','medium','routine:0.8|spark:0.5|closeness:0.6'::jsonb,array[2]::int[],array['acute_conflict']::text[],2),
('RTN014','Swap one default','Pick one tiny default you normally control—music, route, show, side of the sofa, dinner choice—and let them choose today.',2,2,'Changing a predictable micro-routine creates a safe behavioral experiment in flexibility.','TRY_DIFFERENTLY',array['behavioral_experiment','novelty','response_substitution']::text[],array['home','car','restaurant','anywhere']::text[],1,false::boolean,true::boolean,'medium','medium','routine:1.0|fairness:0.4'::jsonb,array[2]::int[],array['none']::text[],2),
('RTN015','Tiny surprise','Do one small useful or enjoyable thing they aren''t expecting today. Keep it small enough that it doesn''t create an obligation to react.',5,2,'A low-pressure positive surprise can interrupt predictability while reinforcing attention to the other person.','DO',array['novelty','appreciation','support']::text[],array['home','workday','shopping_or_errands','anywhere']::text[],2,false::boolean,false::boolean,'medium','medium','routine:0.9|spark:0.6|support:0.7'::jsonb,array[2]::int[],array['resentment_or_scorekeeping']::text[],2),
('RTN016','Try their pick','Choose one low-stakes thing your partner likes that you usually wouldn''t pick—song, snack, short video, route, or activity—and join them in it once.',10,2,'Trying the other person''s preference is a small approach behavior that breaks personal defaults.','TRY_DIFFERENTLY',array['approach_behavior','novelty','shared_activity']::text[],array['home','outdoors','cafe_or_bar','text_or_remote']::text[],2,false::boolean,true::boolean,'medium','low','routine:0.9|spark:0.6|closeness:0.5'::jsonb,array[2]::int[],array['none']::text[],2),
('RTN017','Turn an errand into ten minutes','If you''re doing an errand together, add ten unplanned minutes: walk one extra block, sit somewhere, or look around without rushing home.',10,2,'Adding a small rewarding element to an existing routine is easier than creating a separate event from scratch.','TRY_DIFFERENTLY',array['behavioral_activation','shared_activity','cue_association','novelty']::text[],array['shopping_or_errands','walking','outdoors']::text[],2,false::boolean,true::boolean,'high','high','routine:1.0|spark:0.5|closeness:0.5'::jsonb,array[2,4]::int[],array['time_pressure']::text[],2),
('RTN018','No usual seats','If you''re somewhere you visit regularly, sit somewhere different today.',1,2,'A tiny environmental change can make a familiar setting more noticeable again.','TRY_DIFFERENTLY',array['environmental_design','novelty']::text[],array['home','cafe_or_bar','restaurant','outdoors']::text[],1,false::boolean,true::boolean,'medium','medium','routine:1.0|spark:0.4'::jsonb,array[2]::int[],array['accessibility_needs']::text[],2),
('RTN019','Bring back a song','Play one song connected to a good shared memory while you''re together or send it to them without a long explanation.',4,2,'A familiar positive cue can reactivate shared memory while changing the emotional texture of an ordinary moment.','DO',array['positive_affect','cue_association']::text[],array['home','car','walking','text_or_remote']::text[],1,false::boolean,false::boolean,'high','high','routine:0.7|spark:0.8|closeness:0.6'::jsonb,array[2,4]::int[],array['painful_memory_association']::text[],2),
('RTN020','Let the phone wait','Choose one ordinary five-minute moment together today and leave your phone out of reach until the moment is over.',5,2,'Changing the environment removes a competing cue and makes attention easier rather than relying on willpower.','TRY_DIFFERENTLY',array['environmental_design','attention','behavioral_experiment']::text[],array['home','cafe_or_bar','restaurant','car']::text[],1,false::boolean,false::boolean,'high','high','routine:0.9|closeness:0.6|communication:0.4'::jsonb,array[2,4]::int[],array['on_call_or_urgent_contact']::text[],2),
('RTN021','Make the ordinary invitation','Instead of automatically doing one normal thing separately today, invite them to join you: a walk, shop run, coffee, cooking, or quick errand.',10,2,'An invitation turns an existing routine into an opportunity for shared activity without adding much effort.','DO',array['approach_behavior','shared_activity']::text[],array['home','walking','shopping_or_errands','cafe_or_bar']::text[],2,false::boolean,true::boolean,'high','high','routine:1.0|closeness:0.6'::jsonb,array[2,4]::int[],array['need_for_space']::text[],2),
('RTN022','One new corner','If you''re already out together, spend five minutes somewhere you''ve never stopped before—a side street, bench, shop, or view.',5,2,'Small doses of novelty can make shared time feel less interchangeable.','TRY_DIFFERENTLY',array['novelty','shared_activity','behavioral_experiment']::text[],array['walking','outdoors','shopping_or_errands','date_or_night_out']::text[],1,false::boolean,true::boolean,'medium','medium','routine:0.9|spark:0.7'::jsonb,array[2]::int[],array['mobility_or_time_constraints']::text[],2),
('RTN023','Reverse one role','For one small routine today, swap who normally does it or who takes the lead.',10,2,'Changing a familiar role can expose hidden assumptions and make an automatic division of labor visible.','TRY_DIFFERENTLY',array['behavioral_experiment','response_substitution','fairness']::text[],array['home','shopping_or_errands','anywhere']::text[],2,false::boolean,true::boolean,'medium','medium','routine:0.8|fairness:0.8'::jsonb,array[2]::int[],array['high_conflict_about_chore']::text[],2),
('RTN024','Ask for a micro-adventure','Offer two tiny options that are different from the usual—walk after dinner or dessert outside, new café or old favorite—and let them pick.',15,2,'Constrained choices make novelty easier to act on than vague plans to ''do more together.''','DO',array['novelty','shared_activity','environmental_design']::text[],array['home','outdoors','cafe_or_bar','date_or_night_out']::text[],2,true::boolean,true::boolean,'medium','medium','routine:0.9|spark:0.7'::jsonb,array[2]::int[],array['time_or_money_pressure']::text[],2),
('RTN025','Change the first minute','Pick one recurring moment today—waking up, coming home, dinner, getting into the car—and deliberately change only its first minute.',1,2,'Changing the start of a familiar sequence can disrupt the rest of an automatic pattern with very little effort.','TRY_DIFFERENTLY',array['cue_association','response_substitution','behavioral_experiment']::text[],array['home','car','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0|communication:0.4'::jsonb,array[2,3,4]::int[],array['none']::text[],2),
('RTN026','Add one playful choice','Turn one boring decision today into a playful one: coin flip the takeaway, each pick a mystery snack, or choose the next song for each other.',3,2,'Play introduces positive affect into routines that normally run on efficiency alone.','TRY_DIFFERENTLY',array['positive_affect','novelty','behavioral_experiment']::text[],array['home','shopping_or_errands','car','cafe_or_bar']::text[],1,false::boolean,true::boolean,'medium','medium','routine:0.8|spark:0.7'::jsonb,array[2]::int[],array['none']::text[],2),
('RTN027','Pause one beat','The next time you feel yourself giving an automatic sharp, dismissive, or impatient reply, wait one breath before answering.',1,3,'A short pause creates room between cue and response, making an alternative behavior possible.','TRY_DIFFERENTLY',array['pause_before_response','response_substitution']::text[],array['home','car','text_or_remote','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:0.8|conflict:0.9|communication:0.7'::jsonb,array[3,4]::int[],array['unsafe_or_escalating_conflict']::text[],2),
('RTN028','What else could it mean?','If you catch yourself deciding what your partner meant by something today, ask yourself once: ''What else could this mean?'' before responding.',1,3,'Generating an alternative interpretation can loosen the link between an assumption and an automatic reaction.','NOTICE',array['alternative_interpretation','pause_before_response']::text[],array['home','workday','text_or_remote','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:0.7|conflict:0.9|communication:0.7'::jsonb,array[3,4]::int[],array['clear_boundary_violation']::text[],2),
('RTN029','Finish hearing it','In one conversation today, wait until they fully finish their point before preparing your answer.',3,3,'Shifting attention from reply-planning to listening changes a common automatic conversational pattern.','TRY_DIFFERENTLY',array['active_listening','attention','response_substitution']::text[],array['home','walking','car','text_or_remote']::text[],1,false::boolean,true::boolean,'high','high','routine:0.7|communication:1.0|closeness:0.5'::jsonb,array[3,4]::int[],array['none']::text[],2),
('RTN030','Answer the feeling first','If they tell you about a frustrating moment today, respond to how it sounds before offering a fix or solution.',2,3,'Changing from automatic problem-solving to responsiveness can make the other person feel heard without requiring a long discussion.','TRY_DIFFERENTLY',array['perceived_responsiveness','validation','response_substitution']::text[],array['home','walking','text_or_remote','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.7|communication:0.9|support:0.8'::jsonb,array[3,4]::int[],array['explicit_request_for_solution']::text[],2),
('RTN031','Lower the volume, not the point','If a small disagreement appears today, try saying the same point once with a calmer first sentence rather than abandoning the point.',2,3,'Changing delivery while keeping the underlying need intact tests whether the interaction pattern can shift without avoidance.','TRY_DIFFERENTLY',array['response_substitution','behavioral_experiment','repair']::text[],array['home','car','anywhere']::text[],2,false::boolean,true::boolean,'medium','medium','routine:0.6|conflict:1.0|communication:0.8'::jsonb,array[3]::int[],array['unsafe_or_high_intensity_conflict']::text[],2),
('RTN032','Repair the small miss','If you are unnecessarily short, distracted, or dismissive today, correct it while the moment is still small: ''That came out wrong'' or ''Sorry, I wasn''t listening.''',1,3,'Quick repair prevents a minor automatic response from becoming the tone of the interaction.','DO',array['repair','perceived_responsiveness']::text[],array['home','workday','text_or_remote','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.7|conflict:0.8|communication:0.8'::jsonb,array[3,4]::int[],array['unsafe_conflict']::text[],2),
('RTN033','Change the question','When you''re tempted to ask a loaded question such as ''Why do you always...?'', turn it into a concrete request about this moment.',2,3,'A specific request reduces mind-reading and global judgments while preserving the underlying need.','TRY_DIFFERENTLY',array['response_substitution','behavioral_experiment']::text[],array['home','text_or_remote','anywhere']::text[],2,false::boolean,true::boolean,'medium','medium','routine:0.6|communication:0.9|conflict:0.9'::jsonb,array[3]::int[],array['unsafe_or_coercive_context']::text[],2),
('RTN034','Don''t keep the score once','Catch one moment today when you''re mentally counting who did more. Instead, decide what you actually need and either ask plainly or let this one go.',2,3,'Moving from internal scorekeeping to a specific choice interrupts resentment-building without denying genuine imbalance.','TRY_DIFFERENTLY',array['self_monitoring','response_substitution','behavioral_experiment']::text[],array['home','shopping_or_errands','anywhere']::text[],2,false::boolean,false::boolean,'medium','medium','routine:0.6|fairness:0.9|communication:0.6'::jsonb,array[3]::int[],array['persistent_or_serious_inequity']::text[],2),
('RTN035','One generous reading','For one ambiguous thing your partner does today, deliberately choose the most reasonable non-hostile explanation that still fits the facts.',1,3,'Testing a less threatening interpretation can reduce automatic escalation when intent is genuinely unclear.','TRY_DIFFERENTLY',array['alternative_interpretation','behavioral_experiment']::text[],array['home','workday','text_or_remote','anywhere']::text[],1,false::boolean,false::boolean,'medium','medium','routine:0.6|conflict:0.8|trust:0.5'::jsonb,array[3]::int[],array['clear_harm_or_boundary_violation']::text[],2),
('RTN036','Turn toward once','If they make a small comment or show you something while you''re occupied, give them your full attention for ten seconds before returning to what you were doing.',1,3,'A brief deliberate response replaces automatic partial attention with a clear moment of responsiveness.','DO',array['perceived_responsiveness','attention','response_substitution']::text[],array['home','workday','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.9|closeness:0.8|communication:0.5'::jsonb,array[3,4]::int[],array['urgent_task']::text[],2),
('RTN037','Ask before fixing','If they bring you a problem today, ask ''Do you want ideas or do you want me to listen?'' before choosing your response.',1,3,'A simple choice interrupts habitual fixing and makes support more responsive to what is actually wanted.','TRY_DIFFERENTLY',array['active_listening','support','behavioral_experiment']::text[],array['home','walking','text_or_remote','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:0.6|communication:0.9|support:1.0'::jsonb,array[3,4]::int[],array['none']::text[],2),
('RTN038','Reset outside','If the two of you feel stuck in the same mood at home, suggest a ten-minute walk rather than trying to solve the mood in the same room.',10,3,'Changing context can interrupt environmental cues that help maintain an unproductive interaction pattern.','TRY_DIFFERENTLY',array['environmental_design','behavioral_experiment','shared_activity']::text[],array['home','walking','outdoors']::text[],2,true::boolean,true::boolean,'medium','medium','routine:0.8|conflict:0.5|closeness:0.5'::jsonb,array[3]::int[],array['unsafe_conflict_or_mobility_constraints']::text[],2),
('RTN039','One different goodbye','Before one separation today—work, errands, sleep, travel—make the goodbye slightly more intentional than usual: eye contact, a kind sentence, or a proper ''see you later.''',1,3,'Recurring transition moments are strong cues for small repeatable changes.','DO',array['cue_association','attention','positive_affect']::text[],array['home','workday','commuting','travel']::text[],1,false::boolean,true::boolean,'high','high','routine:0.9|closeness:0.7'::jsonb,array[3,4]::int[],array['physical_affection_not_required']::text[],2),
('RTN040','Break the text reflex','If a message from them irritates you today, don''t send the first reply you compose. Re-read it once and remove the part you wouldn''t say calmly in person.',2,3,'A small delay can interrupt rapid interpretation-response loops that are amplified in text.','TRY_DIFFERENTLY',array['pause_before_response','response_substitution','alternative_interpretation']::text[],array['text_or_remote','workday','commuting']::text[],1,false::boolean,false::boolean,'high','high','routine:0.6|conflict:0.9|communication:0.8'::jsonb,array[3]::int[],array['urgent_safety_or_boundary_issue']::text[],2),
('RTN041','Pick one keeper','Choose one Move from the last three weeks that genuinely improved a moment between you. Mark that one as worth repeating.',2,4,'Selecting a behavior that produced a useful result makes repetition intentional rather than relying on memory.','KEEP',array['reinforcement','self_monitoring']::text[],array['anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0'::jsonb,array[4]::int[],array['requires_prior_completed_move']::text[],2),
('RTN042','Attach it to a cue','Take one Keeper and decide exactly when it will happen again: after coffee, when you get home, on the walk to the shop, or before sleep.',2,4,'Linking a behavior to an existing recurring cue makes remembering it easier.','KEEP',array['cue_association','implementation_intention']::text[],array['home','walking','commuting','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0'::jsonb,array[4]::int[],array['requires_keeper']::text[],2),
('RTN043','Make it smaller','Take a Move you liked but found hard to repeat. Reduce it until it feels almost too easy to skip: twenty minutes becomes five; a big plan becomes one question.',3,4,'Reducing friction makes repetition more likely and helps separate the useful behavior from unnecessary effort.','KEEP',array['environmental_design','repetition','implementation_intention']::text[],array['home','outdoors','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0'::jsonb,array[4]::int[],array['requires_prior_move']::text[],2),
('RTN044','Repeat the greeting','Choose one arrival or reunion today and repeat the intentional greeting you tried earlier: stop, look up, and properly acknowledge each other.',1,4,'Repeating a behavior at the same cue strengthens the cue-behavior link.','KEEP',array['cue_association','repetition','attention']::text[],array['home','cafe_or_bar','travel','anywhere']::text[],1,false::boolean,true::boolean,'high','high','routine:1.0|closeness:0.7'::jsonb,array[4]::int[],array['none']::text[],2),
('RTN045','Protect five minutes','Choose one five-minute window that worked well for you—coffee, after dinner, a walk, before bed—and make it deliberately phone-free again today.',5,4,'Repeating a useful environmental setup can turn attention into a routine rather than a daily decision.','KEEP',array['environmental_design','repetition','attention']::text[],array['home','walking','cafe_or_bar']::text[],1,false::boolean,true::boolean,'high','high','routine:1.0|closeness:0.6'::jsonb,array[4]::int[],array['on_call_or_urgent_contact']::text[],2),
('RTN046','Keep the outside ritual','Pick one tiny thing outside the house you could realistically repeat weekly: a walk, coffee stop, market lap, bench, or errand detour. Do it or choose when you''ll do it next.',10,4,'Attaching connection to an existing place or routine lowers the effort needed to repeat it.','KEEP',array['cue_association','shared_activity','implementation_intention']::text[],array['walking','outdoors','cafe_or_bar','shopping_or_errands']::text[],2,true::boolean,true::boolean,'high','high','routine:1.0|spark:0.4|closeness:0.5'::jsonb,array[4]::int[],array['mobility_or_financial_constraints']::text[],2),
('RTN047','Keep the question','Choose one question that opened a better conversation this month. Ask it again in a new context rather than searching for a brand-new technique.',3,4,'Repeating a successful conversational behavior helps turn it into a natural response.','KEEP',array['repetition','curiosity','reinforcement']::text[],array['home','walking','car','text_or_remote']::text[],1,false::boolean,true::boolean,'high','high','routine:0.9|communication:0.8|closeness:0.6'::jsonb,array[4]::int[],array['none']::text[],2),
('RTN048','Plan for the bad day','Choose one Keeper and finish this sentence privately: ''Even on a busy or bad day, I can still do the two-minute version by…''',2,4,'Planning a minimum version protects a new behavior when motivation and time are low.','KEEP',array['implementation_intention','environmental_design']::text[],array['home','workday','commuting','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0'::jsonb,array[4]::int[],array['requires_keeper']::text[],2),
('RTN049','Make the cue visible','For one Keeper, change something small in the environment so it reminds you: put the phones away at dinner, leave walking shoes by the door, or add a private calendar cue.',3,4,'Environmental prompts reduce the need to remember a new behavior at exactly the right moment.','KEEP',array['environmental_design','cue_association']::text[],array['home','workday','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0'::jsonb,array[4]::int[],array['privacy_or_shared_device_constraints']::text[],2),
('RTN050','Name what changed','At the end of today, privately identify one small interaction that feels different from four weeks ago and the behavior that helped create it.',3,4,'Connecting a useful outcome to a specific behavior reinforces what is worth carrying forward.','NOTICE',array['reinforcement','self_monitoring']::text[],array['home','commuting','anywhere']::text[],1,false::boolean,false::boolean,'high','high','routine:1.0|closeness:0.4'::jsonb,array[4]::int[],array['none']::text[],2)
on conflict(task_key) do update set
 title=excluded.title,body=excluded.body,minutes=excluded.minutes,week_no=excluded.week_no,
 why_it_matters=excluded.why_it_matters,family=excluded.family,mechanisms=excluded.mechanisms,
 contexts=excluded.contexts,effort=excluded.effort,requires_leaving_home=excluded.requires_leaving_home,
 requires_partner_cooperation=excluded.requires_partner_cooperation,repeatability=excluded.repeatability,
 keeper_potential=excluded.keeper_potential,theme_weights=excluded.theme_weights,
 eligible_weeks=excluded.eligible_weeks,exclusions=excluded.exclusions,content_version=excluded.content_version;

create or replace function private.issue_assignment(requested_slot integer)
returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype; m public.relationship_members%rowtype;
 a public.task_assignments%rowtype; t private.task_catalogue%rowtype; today date;
 active_days_before integer; programme_day integer; programme_step integer; completed_count integer;
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
 from public.garden_events g where g.relationship_id=rid and g.event_date>=r.path_started_at and g.event_date<today;
 active_days_before:=coalesce(active_days_before,0);
 if active_days_before>=28 then raise exception using message='path_complete'; end if;
 programme_day:=active_days_before+1;
 programme_step:=least(4,(active_days_before/7)+1);

 select * into a from public.task_assignments
 where user_id=u and assigned_for_date=today and slot=requested_slot and contract_version=1;
 if a.id is not null then return a; end if;

 select count(*) into completed_count from public.task_assignments
 where user_id=u and status='completed' and (completed_at at time zone r.timezone)::date=today;
 if completed_count>=3 then raise exception using message='daily_limit_reached'; end if;
 if requested_slot>0 and not exists(
   select 1 from public.task_assignments where user_id=u and assigned_for_date=today
   and slot=requested_slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;

 select c.* into t
 from private.task_catalogue c
 left join lateral (
   select max(a2.assigned_for_date) last_seen, count(*) seen_count
   from public.task_assignments a2 where a2.user_id=u and a2.task_key=c.task_key
 ) hist on true
 where c.content_version=2
   and programme_step=any(c.eligible_weeks)
   and not exists(select 1 from public.task_assignments a3 where a3.user_id=u
     and a3.assigned_for_date=today and a3.task_key=c.task_key)
 order by
   case when hist.seen_count=0 then 0 else 1 end,
   hist.last_seen nulls first,
   extensions.hmac(today::text||':'||requested_slot::text||':'||c.task_key,
     encode((select selection_seed from private.relationship_secrets where relationship_id=rid),'hex'),'sha256'),
   c.task_key
 limit 1;

 if t.task_key is null then
   insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing;
   select c.* into t from private.task_catalogue c
   where c.content_version=2 and programme_step=any(c.eligible_weeks)
   and not exists(select 1 from public.task_assignments a3 where a3.user_id=u
     and a3.assigned_for_date=today and a3.task_key=c.task_key)
   order by c.task_key limit 1;
 end if;
 if t.task_key is null then raise exception using message='catalogue_unavailable'; end if;

 insert into public.task_assignments(relationship_id,user_id,task_key,assigned_for_date,is_bonus,
 slot,program_day,task_title,task_body,task_minutes,task_why,contract_version)
 values(rid,u,t.task_key,today,requested_slot>0,requested_slot,programme_day,
 t.title,t.body,t.minutes,t.why_it_matters,1)
 returning * into a;
 return a;
end $$;

-- Ensure the relationship seed exists before assignment scoring.
create or replace function public.get_or_create_today_assignment(requested_slot integer default 0)
returns public.task_assignments
language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is not null then insert into private.relationship_secrets(relationship_id) values(rid) on conflict do nothing; end if;
 return private.issue_assignment(requested_slot);
end $$;

create or replace function private.finish_assignment(assignment_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); rid uuid; r public.relationships%rowtype;
 a public.task_assignments%rowtype; m public.relationship_members%rowtype; today date; n integer;
begin
 if u is null then raise exception using message='not_authenticated'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select relationship_id into rid from public.task_assignments where id=assignment_id and user_id=u;
 if rid is null then raise exception using message='assignment_not_found'; end if;
 select * into r from public.relationships where id=rid for update;
 select * into m from public.relationship_members where relationship_id=rid and user_id=u and left_at is null;
 select * into a from public.task_assignments where id=assignment_id and user_id=u for update;
 if m.user_id is null or r.status<>'active' then raise exception using message='relationship_not_active'; end if;
 if a.status='completed' then return null; end if;
 today:=(statement_timestamp() at time zone r.timezone)::date;
 if a.contract_version is distinct from 1 or a.status<>'assigned' or a.assigned_for_date<>today
 or r.active_path<>'routine' then raise exception using message='assignment_not_eligible'; end if;
 if a.slot>0 and not exists(select 1 from public.task_assignments where user_id=u
 and assigned_for_date=today and slot=a.slot-1 and contract_version=1 and status='completed')
 then raise exception using message='previous_slot_not_completed'; end if;
 select count(*) into n from public.task_assignments where user_id=u and status='completed'
 and (completed_at at time zone r.timezone)::date=today;
 if n>=3 then raise exception using message='daily_limit_reached'; end if;
 update public.task_assignments set status='completed',completed_at=statement_timestamp() where id=a.id;
 insert into public.garden_events(relationship_id,created_by,source_assignment_id,plant_type,event_date)
 values(rid,u,a.id,'flower',today) on conflict(source_assignment_id) do nothing;
 return null;
end $$;

create or replace function public.complete_assignment(assignment_id uuid,chosen_plant text default 'flower')
returns uuid language sql security invoker set search_path='' as $$select private.finish_assignment(assignment_id)$$;

create or replace function private.read_shared_garden_state()
returns table(stage_key text,bloom boolean,programme_complete boolean)
language plpgsql stable security definer set search_path='' as $$
declare rid uuid; r public.relationships%rowtype; active_days integer;
begin
 select relationship_id into rid from public.relationship_members where user_id=auth.uid() and left_at is null;
 if rid is null then return; end if;
 select * into r from public.relationships where id=rid;
 if r.id is null or r.status<>'active' then return; end if;
 select count(distinct event_date)::integer into active_days from public.garden_events
 where relationship_id=rid and event_date>=r.path_started_at;
 active_days:=coalesce(active_days,0);
 stage_key:=case when active_days>=28 then 'bloom' when active_days>=24 then 'opening'
 when active_days>=18 then 'bud' when active_days>=12 then 'established' when active_days>=7 then 'leaves'
 when active_days>=3 then 'shoot' when active_days>=1 then 'roots' else 'seed' end;
 bloom:=stage_key='bloom'; programme_complete:=active_days>=28; return next;
end $$;

create or replace function public.get_shared_garden_state()
returns table(stage_key text,bloom boolean,programme_complete boolean)
language sql security invoker set search_path='' as $$select * from private.read_shared_garden_state()$$;

revoke all on function public.get_or_create_today_assignment(integer) from public;
grant execute on function public.get_or_create_today_assignment(integer) to authenticated;
revoke all on function public.get_shared_garden_state() from public;
grant execute on function public.get_shared_garden_state() to authenticated;
