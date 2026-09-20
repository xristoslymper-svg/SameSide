-- Expand The Routine's private move catalogue so two partners can receive
-- distinct daily moves with substantially less repetition across four weeks.
-- This changes content only: assignment privacy, deterministic selection and
-- the three-moves-per-day contract remain unchanged.

insert into private.task_catalogue(task_key,title,body,minutes) values
 ('routine-v1-13','Notice the effort','Thank your partner for one ordinary thing they do that is easy to overlook.',2),
 ('routine-v1-14','Send a small signal','Send one warm message that asks for nothing in return.',1),
 ('routine-v1-15','Make the next five minutes theirs','When your partner starts talking, stop what you are doing and give them five undivided minutes.',5),
 ('routine-v1-16','Bring back an inside joke','Share a joke, phrase or tiny reference that belongs to the two of you.',2),
 ('routine-v1-17','Choose their comfort','Do one small thing that makes the space around your partner more comfortable.',3),
 ('routine-v1-18','Ask about the good part','Ask what the best part of their day has been so far and stay with the answer.',3),
 ('routine-v1-19','Name something you admire','Tell your partner one quality you genuinely admire in them.',2),
 ('routine-v1-20','Make a tiny invitation','Invite your partner into a ten-minute shared moment: tea, a walk, a balcony break or music together.',5),
 ('routine-v1-21','Let them choose','Hand your partner one small decision you would normally make together and happily go with their choice.',2),
 ('routine-v1-22','Touch with intention','Offer a small affectionate touch when it feels natural: a hand, a hug or a kiss that lasts a moment longer.',1),
 ('routine-v1-23','Say what you missed','Mention one small thing about your partner you noticed when they were not around.',2),
 ('routine-v1-24','Make the ordinary nicer','Improve one routine moment you usually rush through together.',5),
 ('routine-v1-25','Ask one curious question','Ask your partner something you do not already know the answer to.',3),
 ('routine-v1-26','Give a specific compliment','Compliment something your partner did, chose or handled today rather than how they look.',2),
 ('routine-v1-27','Create a tiny surprise','Leave, bring or arrange one very small unexpected thing your partner will enjoy.',5),
 ('routine-v1-28','Remember the beginning','Tell your partner one detail you still remember from early in your relationship.',3),
 ('routine-v1-29','Take one thing off their plate','Pick one small task they would otherwise have to think about and handle it without making a point of it.',5),
 ('routine-v1-30','Share something first','Tell your partner one small thought, feeling or observation before they have to ask.',3),
 ('routine-v1-31','Slow down the goodbye','Make your next goodbye a little warmer than usual.',1),
 ('routine-v1-32','Make eye contact','During one ordinary moment today, pause and really look at your partner for a few seconds.',1),
 ('routine-v1-33','Ask what would help','Ask: “Is there one small thing that would make today easier?” Then listen without fixing more than they ask.',3),
 ('routine-v1-34','Bring them something','Bring your partner water, coffee, tea or another tiny comfort without being asked.',2),
 ('routine-v1-35','Share a future little thing','Suggest one simple thing you would enjoy doing together in the next few days.',3),
 ('routine-v1-36','Notice their mood gently','If your partner seems different today, ask how they are without assuming why.',2),
 ('routine-v1-37','Celebrate a small win','Notice and acknowledge one small thing that went well for your partner.',2),
 ('routine-v1-38','Put warmth into a routine','Add one affectionate sentence to a practical conversation you would have had anyway.',1),
 ('routine-v1-39','Ask for their story','Ask your partner to tell you more about something they mentioned recently.',4),
 ('routine-v1-40','Make room for laughter','Do or share one harmless thing whose only purpose is to make the two of you smile.',3),
 ('routine-v1-41','Say thank you differently','Thank your partner for something familiar, but explain why it matters to you.',2),
 ('routine-v1-42','Choose closeness over efficiency','In one moment today, take the slightly slower option if it gives you more time together.',3),
 ('routine-v1-43','Reconnect after distraction','If you catch yourself half-listening, put the distraction down and return to your partner without making a big deal of it.',2),
 ('routine-v1-44','Offer encouragement','Tell your partner one thing you believe they can handle or do well.',2),
 ('routine-v1-45','Share a song','Send or play one song that reminds you of them, of you two or of a moment you shared.',3),
 ('routine-v1-46','Make a small ritual','Repeat one tiny shared thing on purpose today: a coffee together, a check-in, a walk or a goodnight moment.',5),
 ('routine-v1-47','Ask what they need more of','Ask what would feel good to have a little more of this week, and just hear the answer.',4),
 ('routine-v1-48','End the day warmly','Before the day ends, name one thing from today that you appreciated about your partner.',2)
on conflict (task_key) do update set
 title=excluded.title,
 body=excluded.body,
 minutes=excluded.minutes;
