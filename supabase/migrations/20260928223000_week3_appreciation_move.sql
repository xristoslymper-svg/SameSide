update private.task_catalogue
set title='Interrupt the scoreboard',
    body='The first time you catch yourself counting who did more, name one thing your partner carried today. Then decide what you actually need to ask for.',
    why_it_matters='Scorekeeping makes it easy to see only what is missing. Noticing one contribution first can change the tone of the request that follows.',
    mechanisms=array['self_monitoring','appreciation','response_substitution']::text[],
    personalization_weights='{"appreciation":1,"emotional_conversation":0.3,"support":0.3}'::jsonb
where task_key='RTN034' and content_version=2;
