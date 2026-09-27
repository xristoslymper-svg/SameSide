# Routine Gold Set v1 — Coverage Audit

Source: `docs/content/routine_gold_set_v1.csv`

## Catalogue size
- 50 curated Routine moves.
- Week coverage: W1 10, W2 16, W3 14, W4 10 primary-week moves.
- Families represented: NOTICE, DO, TRY_DIFFERENTLY, KEEP.

## Design checks
- Outside-home contexts are deliberately represented across walking, outdoors, cafe/bar, restaurant, errands, car, commuting, social settings, date/night-out, travel and text/remote.
- Private cognitive-behavioral moves are included alongside partner-visible behavioral moves.
- Week 3 contains explicit pause/reappraisal/response-substitution moves rather than generic communication advice.
- Week 4 is Keeper-heavy and explicitly connects successful moves to cues, minimum versions, environmental prompts and repetition.
- Most moves are designed as low-friction actions that can be completed in ordinary life.
- Actions include exclusions where an otherwise reasonable move could be inappropriate.
- Physical affection is never required as a default behavior.

## Editorial principles applied
- No clinical CBT terminology in user-facing instructions.
- No generic "spend quality time" / "communicate better" actions.
- Every move has a binary-enough completion condition.
- "Why it matters" describes a plausible behavioral mechanism without promising outcomes.
- Novelty is not treated as synonymous with spending money or planning a date.
- Conflict-related moves explicitly avoid unsafe/high-intensity situations.

## Before production
This is a **gold-set candidate catalogue**, not yet production content. Before wiring it into Supabase:
1. Run a semantic near-duplicate audit.
2. Validate metadata distributions programmatically.
3. Review each exclusion/safety label.
4. Review the behavioral rationale/evidence family for each mechanism.
5. Simulate at least 10,000 28-day Routine assignments and inspect repetition, context diversity and mechanism diversity.
6. Only then freeze the v1 schema and migrate the approved catalogue into the backend.
