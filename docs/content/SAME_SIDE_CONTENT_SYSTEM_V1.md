# Same Side Content System v1

Status: **Working product specification**

This document is the source of truth for designing Same Side paths and daily moves before they are encoded into the backend.

## 1. Product thesis

Same Side helps couples change recurring relationship patterns through small actions in ordinary life.

**Notice the pattern. Try something small. See what changes. Keep what works.**

Same Side is **CBT-informed**, not a replacement for psychotherapy. The product borrows practical cognitive-behavioral ideas—self-observation, behavioral experiments, alternative interpretations, cue-based repetition, reinforcement, and habit formation—while keeping the user experience natural and non-clinical.

A user should experience a move as something clear enough to do today, not as a lesson, worksheet, or therapy exercise.

## 2. Core content architecture

### Path
A Path is a structured four-week focus, for example:
- The Routine
- The Spark
- Communication
- Same Fight
- Distance
- Imbalance
- Trust

Paths provide direction and progression. They do not own actions exclusively.

### Week
Every Path has four weekly objectives. Weeks explain *why this type of move is useful now*.

### Move
A Move is one small, observable action or private exercise that can be completed in real life.

The same Move may serve multiple Paths and themes.

### Keeper
A Keeper is a previously tried Move that the user deliberately chooses to repeat. Keepers are how Same Side turns isolated actions into habits.

### Active focuses
A user may eventually unlock several Paths. Multiple active Paths should not automatically create multiple mandatory daily tasks. The recommendation engine can blend their needs into one primary Move and optionally offer another Move.

## 3. Four-week behavioral loop

All Paths should broadly follow the same behavioral arc while expressing it differently for their topic.

### Week 1 — NOTICE
Goal: make automatic patterns visible.

Mechanisms:
- attention shifting
- self-monitoring
- noticing positive behavior
- identifying cues/triggers
- noticing interpretations before reacting

User-facing idea: **Notice what normally passes you by.**

### Week 2 — TRY
Goal: introduce small behavioral experiments.

Mechanisms:
- behavioral activation
- novelty
- approach behavior
- changing environmental cues
- testing assumptions through action

User-facing idea: **Try something slightly different.**

### Week 3 — SHIFT
Goal: interrupt an established response and practise an alternative.

Mechanisms:
- response substitution
- cognitive reappraisal
- pause before reaction
- active listening
- repair
- responsiveness

User-facing idea: **Change one part of the pattern.**

### Week 4 — KEEP
Goal: identify what helped and make useful behavior easier to repeat.

Mechanisms:
- reinforcement
- cue association
- repetition
- implementation intentions
- habit formation
- relapse planning

User-facing idea: **Keep what worked.**

## 4. Action families

Every Move has one primary family.

### NOTICE
Private observation before behavior change.

Example:
> The next time something small annoys you, notice the first explanation your mind gives you for why they did it. Don't fix it yet. Just notice it.

### DO
A concrete positive behavior.

Example:
> Notice one thing they handled today that you normally wouldn't mention. Tell them you noticed.

### TRY_DIFFERENTLY
A behavioral experiment or alternative response.

Example:
> If you catch yourself assuming what they meant today, come up with one other plausible explanation before you respond.

### KEEP
Repeat or anchor a behavior that has already proved useful.

Example:
> Pick one small thing from this week that felt good. Attach it to something that already happens every day.

## 5. Controlled theme taxonomy

Theme weights are continuous from 0.0 to 1.0. A Move can serve several themes.

Initial themes:
- routine
- communication
- closeness
- spark
- conflict
- trust
- fairness
- support

Do not add new themes casually. A new theme should represent a distinct user need, not a synonym for an existing label.

## 6. Behavioral mechanism taxonomy

Initial controlled mechanisms:
- attention
- appreciation
- curiosity
- perceived_responsiveness
- active_listening
- validation
- positive_affect
- novelty
- shared_activity
- self_disclosure
- affection
- support
- repair
- pause_before_response
- alternative_interpretation
- behavioral_experiment
- approach_behavior
- cue_association
- response_substitution
- implementation_intention
- reinforcement
- repetition
- environmental_design

Themes describe **what area** a Move may support. Mechanisms describe **how the Move is expected to work**.

## 7. Context taxonomy

Moves must represent life outside the home as well as inside it.

Location/context:
- home
- outdoors
- walking
- cafe_or_bar
- restaurant
- shopping_or_errands
- car
- commuting
- workday
- social_setting
- date_or_night_out
- travel
- text_or_remote
- anywhere

Time:
- morning
- daytime
- evening
- bedtime
- anytime

Coordination:
- solo_private
- partner_visible
- coordinated

The engine should not require location tracking. Context can be inferred from explicit user choices or offered as optional filters such as **Going out today?**

## 8. Habit metadata

A Move may be a one-off experiment, repeatable behavior, or strong Keeper candidate.

Fields:
- cue_type
- suggested_cue
- repeatability: low | medium | high
- keeper_potential: low | medium | high
- existing_routine_anchor
- immediate_reward
- repetition_target

Example:

```
cue_type: event
suggested_cue: partner_arrives_home
behavior: give_undivided_greeting
repeatability: high
keeper_potential: high
existing_routine_anchor: arriving_home
immediate_reward: warmth_and_connection
```

Habit language shown to users should remain simple. Prefer **Keep this one?** over terminology such as reinforcement schedule or implementation intention.

## 9. Friction metadata

Every Move receives:
- estimated_minutes
- effort: 1–5
- planning_required: boolean
- money_required: none | optional | required
- requires_leaving_home: boolean
- requires_partner_presence: boolean
- requires_partner_cooperation: boolean

Default daily Moves should skew toward effort 1–2.

High-friction Moves should be intentional and uncommon.

## 10. Suitability and safety

Required fields:
- suitable_relationship_states
- excluded_relationship_states
- emotional_intensity: low | medium | high
- vulnerability_level: low | medium | high
- conflict_risk: low | medium | high
- notes_for_review

The catalogue must avoid assigning an action where the context makes it inappropriate.

Examples:
- playful surprise actions may be unsuitable during acute conflict
- physical affection must never be assumed appropriate
- disclosure exercises should not pressure a partner into revealing private information
- conflict Moves should not encourage confrontation when someone feels unsafe

Same Side should not frame itself as a solution for abuse, coercion, or immediate safety situations.

## 11. Path eligibility metadata

A Move does not contain a single `path_id`.

Instead it can have weighted relevance and eligibility:

```
theme_weights:
  routine: 0.85
  closeness: 0.70
  spark: 0.45
  communication: 0.30

eligible_path_weeks:
  routine: [1, 2]
  spark: [1]
  communication: [1, 2]
```

This allows a curated action catalogue to support both focused and blended programs.

## 12. Editorial quality standard

A Move is publishable only if it passes all of these tests.

1. **Specific** — the user knows exactly what to do.
2. **Small** — realistically achievable today.
3. **Behavioral** — observable action or clearly defined private exercise.
4. **Natural** — sounds like something an adult might actually do.
5. **Mechanistic** — has a defensible reason for inclusion.
6. **Distinct** — materially different from nearby catalogue items.
7. **Low pressure** — does not force intimacy or a conversation.
8. **Safe** — exclusions and context have been considered.
9. **Completable** — the user can clearly decide whether they did it.
10. **Tone-fit** — no therapy jargon, lecturing, or AI-style filler.

Reject:
> Spend quality time together today.

Prefer:
> On your next walk or drive together, leave logistics alone for five minutes. Ask about something they've been thinking about lately.

Avoid phrases such as:
- create a safe space
- take a moment to
- communication is key
- practice gratitude
- validate your partner's feelings

The mechanism may be clinical internally; the user-facing copy should not be.

## 13. Routine Path v1

### Week 1 — Notice again
Objective: redirect attention toward the partner and make unnoticed automatic patterns visible.

Target mechanisms:
- attention
- appreciation
- curiosity
- self-monitoring
- perceived responsiveness

Desired Move mix:
- 35% NOTICE
- 45% DO
- 20% TRY_DIFFERENTLY

### Week 2 — Break autopilot
Objective: introduce manageable novelty and change predictable micro-routines.

Target mechanisms:
- novelty
- behavioral experiment
- shared activity
- approach behavior
- environmental design

Desired Move mix:
- 15% NOTICE
- 40% DO
- 45% TRY_DIFFERENTLY

### Week 3 — Respond differently
Objective: interrupt automatic responses and practise more useful alternatives.

Target mechanisms:
- pause before response
- alternative interpretation
- active listening
- responsiveness
- response substitution
- repair

Desired Move mix:
- 25% NOTICE
- 20% DO
- 55% TRY_DIFFERENTLY

### Week 4 — Keep what works
Objective: identify effective Moves and turn a small number into repeatable relationship habits.

Target mechanisms:
- cue association
- implementation intention
- repetition
- reinforcement
- environmental design

Desired Move mix:
- 10% NOTICE
- 20% DO
- 20% TRY_DIFFERENTLY
- 50% KEEP

## 14. Initial Routine gold-set targets

Before backend implementation, curate **50 Routine Moves**.

Coverage targets:
- at least 10 Moves per week, with additional cross-week candidates
- at least 30% usable outside the home
- at least 20% completely private/solo
- at least 20% strong Keeper candidates
- at least 70% effort 1–2
- no single behavioral mechanism should dominate the catalogue
- no near-duplicate wording or behavioral intent
- meaningful representation of walking, errands, commuting, social settings, dates, and remote/text contexts

Each Move must include:
- stable content ID
- title
- instruction
- why_it_matters
- primary family
- theme weights
- mechanisms
- context tags
- friction metadata
- habit metadata
- path/week eligibility
- suitability/exclusions
- editorial review status

## 15. Recommendation logic v1

Do not use an LLM to choose the daily Move.

Start with deterministic scoring over eligible curated content.

Conceptually:

```
score =
    active_path_fit
  + current_week_fit
  + user_need_fit
  + context_fit
  + under_served_theme_bonus
  + variety_bonus
  + keeper_bonus_when_relevant
  - recent_repetition_penalty
  - mechanism_repetition_penalty
  - inappropriate_friction_penalty
```

Selection can use controlled randomness among the highest-scoring candidates so two users do not necessarily receive identical sequences.

When several Paths are active, Same Side should normally still provide **one primary daily Move**. An optional **Give me another move** can target an under-served active theme.

## 16. Feedback signals

Capture behavioral signals without turning Same Side into a survey:
- shown
- completed
- skipped
- requested_another
- saved_as_keeper
- repeated_keeper
- optional: more_like_this

These signals can later improve recommendation weights while the curated catalogue remains the safety and quality boundary.

## 17. Content production workflow

1. Define Path and four weekly objectives.
2. Identify mechanisms appropriate to each week.
3. Generate candidate Moves from mechanisms and real-life contexts.
4. Editorial rewrite into Same Side voice.
5. Label metadata independently from generation.
6. Run duplicate/coverage checks.
7. Human review against the ten quality tests.
8. Mark approved Moves as gold.
9. Simulate four-week assignments before release.
10. Publish to the backend only after coverage and quality thresholds pass.

## 18. Next deliverable

Create **Routine Gold Set v1** with 50 fully labelled Moves.

The set should be reviewed as content before database schema work begins. Once the ontology survives that exercise, encode it into Supabase tables and build the deterministic selector.
