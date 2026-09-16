# Phase 1A backend contract - prepared, not deployed

2026-09-16. Production remains on the three Phase 0 migration versions. No Expo application or prototype change is included.

## Prepared migration

`supabase/migrations/20260916192115_phase1a_backend_contract.sql`, created with Supabase CLI 2.117.0, is one incremental transactional change. It preserves all existing rows and historical migrations. It creates no fake partner assignments.

### Shared access

- A SECURITY DEFINER membership helper resides in the non-API `private` schema, with fixed empty search_path, qualified objects, and authenticated EXECUTE for RLS evaluation. The helper checks only the caller's membership.
- Policies for relationships, memberships, garden, insights and Roots insertion reference that helper. Policies explicitly target authenticated users.
- Broad table grants are replaced by necessary SELECT grants and profile display-name-only UPDATE. Private owner rows remain protected by owner RLS. Assignment mutations are RPC-only.
- Direct garden, invitation and shared-insight table access is revoked. Roots remains owner-readable; submissions/deletes/overlap refresh are disabled at the privilege boundary for this milestone. The old overlap RPC also raises a disabled error even if a privileged process calls it.
- Public RPC wrappers are SECURITY INVOKER and call narrowly granted, auth-checking private implementations. `private` must remain absent from the Data API exposed-schema list.
- Future postgres-owned public table/function defaults no longer auto-grant client access. Existing hosted platform roles/defaults are not broadly rewritten.

### Garden representation

`get_shared_garden()` returns ordered `{garden_date, flower_count}` rows for the caller's active relationship membership. There is no relation ID argument that permits choosing another couple's garden.

These are anonymous daily cohorts, not individual event records. They contain no event ID, actor, assignment reference, title, task key/category, chosen plant, exact timestamp or individual ordering. Clients may render interchangeable flowers within each date. Internal event rows and the existing one-event-per-assignment index remain intact for integrity.

`complete_assignment()` returns SQL NULL on success and retry, not a garden event identifier. Its old UUID return type and argument signature are retained; `chosen_plant` is ignored and the server stores a generic flower. Caller-owned assignments still expose their own private completion state.

**Inference limit:** a two-person shared total plus knowledge of one's own actions can reveal that the other person contributed, especially through polling. No truthful immediate shared-growth system can guarantee zero such inference. This contract prevents attributable flower records and explicit partner activity queries, but does not claim formal anonymity against timing/total subtraction. Day-level aggregation sacrifices exact within-day replay; garden history retains date order internally and in its safe output.

### Calendar and path

Relationships gain validated PostgreSQL timezone names. Existing relationships receive UTC, preserving the prior production UTC date convention; path dates, IDs and history do not change. New clients call `create_solo_relationship(timezone_name)`; the no-argument legacy RPC uses UTC. Repeated creation loads the existing active membership instead of creating another relationship or changing its timezone.

The relationship calendar date is computed server-side from statement time and relationship timezone. Program day is date minus path start plus one. Issuance is limited to The Routine, days 1-28. Joining enters that current day, with no pre-join backfill. Days beyond 28 stop issuance; garden reads remain available. Membership activity and relationship status are separate: inactive relationships cannot issue/complete; retained active memberships can still read history.

**Provisional late-completion rule:** unfinished moves expire at the relationship's midnight. Only today's issued move can newly complete. A previously completed move can be retried on a later date or after day 28 while membership/relationship remain active. This rule needs product acceptance before rollout.

### Private assignments

`get_or_create_today_assignment(requested_slot integer default 0)` returns only the caller's assignment. Slots are 0 primary, 1 bonus, 2 bonus. Each bonus requires the preceding slot to have completed. Unique `(user_id, assigned_for_date, slot)` protects new contract-version-1 assignments.

Twelve immutable development task templates live in an inaccessible private catalogue. A random backend-only seed per relationship produces a deterministic keyed daily permutation; A and B receive disjoint three-item portions. Knowing one's own task and the source catalogue does not reveal the secret permutation or the partner's task. There are no pretend B rows while solo. Do not edit/extend the version-1 catalogue in place during active assignments; a future content rollout needs explicit versioning.

New assignments snapshot title/body/minutes and record program day, slot and contract version. All legacy rows retain NULL contract metadata and remain owner-readable; unfinished legacy rows cannot newly complete. No guessing, destructive backfill or private-history reassignment occurs. The small catalogue proves mechanics, not final four-week editorial quality.

### Transactions and limits

Mutations acquire a caller-specific transaction advisory lock; relationship operations then lock the relationship row. Acceptance additionally locks its invite; completion locks the caller-owned assignment. Consistent ordering serializes retries, invite issuance and the small relationship's writes.

Completion requires active membership, ownership, current-date/version/status/path eligibility, creation after joining and bonus prerequisites. It counts all existing completed assignments for that user on the relationship-local completion date, including legacy history, before allowing a new completion. Three per day is a hard server limit. Status update and exactly one internal event insert share the transaction; failures roll both back.

Successful completion retries return NULL without consuming quota. A completed historical assignment lacking its required event produces an explicit inconsistency error rather than silently inventing a flower.

### Invitations

Invite creation serializes on the relationship, revokes unused predecessors and returns a 256-bit random token once; only its hash is stored. Existing two-role and one-active-relationship unique indexes are retained.

Acceptance recognizes a previously successful recipient and returns the same relationship ID even after the original token expires, provided it is not revoked and their membership/relationship remains active. It does not grant membership anew. Other used-token callers fail. Self, invalid, expired, revoked, full and existing-unrelated-relationship conditions fail explicitly. Concurrent joins to different relationships have one winner. Domain error messages are stable codes carried with SQLSTATE P0001.

`preview_relationship_invite(raw_token)` is the only anonymous RPC. A usable token reveals only `invite_state` and the inviter's chosen display name (up to 80 characters, fallback “Your partner”). Other states return no name. No IDs, email, relationship history or raw token hash are returned. Future UI must render the name as plain text and avoid logging tokens.

### Roots deferral

Owner-only SELECT remains available for privacy tests. Client writes, insight reads and derivation execution are disabled so changing guesses cannot drive a callable overlap oracle. No Roots product UI or recommender is built.

Before enabling Roots: allow at most two needs in one weekly submission; establish a final submission cutoff/publication schedule; publish at most a stable approved overlap for that period; edits must not cause repeated partner-dependent recomputation. Consider active membership, withdrawn submissions and stale insights. Enforcing a two-option limit alone does not prevent probing.

## Tests actually performed

30 passing test groups on a real isolated PostgreSQL 17.6 server, with pgcrypto 1.3, node-postgres 8.23.0 and Node 24.19.0. The test runner replays all three recovered migrations, inserts synthetic legacy history, applies the incremental migration transactionally, then exercises authenticated/anonymous roles through separate SQL connections with simulated Supabase JWT identity.

Coverage includes both directions of assignment isolation, raw Roots isolation, authorized/unauthorized garden access, exact safe output keys, raw table denial, mutation denial, anonymous name-only preview, duplicate/concurrent issuance and completion, three-slot limits, legacy completions consuming the daily cap, failed-completion rollback, concurrent recipient retries, token failures, third-member rejection, cross-relationship join races, timezone/day rules, pre-join/stale/skipped assignment rejection, departed membership, and preserved solo history.

This is real PostgreSQL RLS/transaction testing, not a service-role-only assertion or mocked SQL engine. The bootstrap simulates only Supabase auth.uid(), auth.users, API roles and baseline defaults. It is NOT a full local Supabase stack: hosted Auth email delivery, JWT verification, PostgREST overload/response behavior, hosted event triggers, grants under every managed role, mobile callbacks and staging rollout are unverified. Those checks remain release gates, not implied passing tests.

## Production migration plan and risk assessment

**Do not apply yet. Not fully API backward-compatible.** The prototype currently uses only auth/membership/invite RPCs, whose existing argument signatures remain. Nevertheless, unknown consumers of raw garden/invite/Roots/insights tables or completion event IDs will break intentionally. The new timezone overload needs PostgREST staging verification.

1. Review this contract, including anonymous daily garden cohorts, UTC legacy default and same-day-only completion.
2. Review schema drift versus Phase 0 and run `supabase/baseline/phase1a-preflight.sql` immediately before rollout. Investigate inconsistencies/collisions; do not delete rows to make migration pass. Confirm no existing private schema conflict and no private schema API exposure.
3. Rehearse on an isolated full Supabase staging/local stack, verify REST RPC shapes with real A/B/C accounts and the intended grant model, and confirm the original prototype's membership/invite calls still resolve.
4. Confirm a recoverable backup and a maintenance window. Apply only the new migration using a transactional migration runner after explicit production approval; never replay baseline migrations or reset production. Migration sets 5-second lock and 60-second statement timeouts.
5. Verify catalog/RLS/ACLs, safe garden payloads, owner privacy and invite retry semantics with synthetic staging users first, then approved production smoke checks. Ensure PostgREST schema reload completes.

Read-only production preflight on 2026-09-16 found the same three migration versions, no private schema, no public-table Realtime publication entries, and zero missing completion timestamps, missing/premature linked events, task-key collisions, future path starts or non-Routine active relationships. Application table sizes were 24-64 KiB including indexes, so expected index/check work is small; this is not a guarantee against concurrent lock contention. No raw user records were exported.

DDL adds columns/constraints/indexes and will take locks. Revocations deliberately change client behavior. Private runtime seeds remain server-only; seeds are not committed. Existing metadata/history is preserved. New rows are generated only when authorized RPCs are subsequently used.

Failure before transaction commit rolls back the migration. After commit, prefer a reviewed forward fix. A blanket rollback would restore the broken helper or attribution leaks, so it is not a safe default. New columns/private data must not be dropped to revert a client issue.

## Remaining approvals / scope

- Production application is explicitly unapproved and has not happened.
- Full Supabase/PostgREST staging verification and the product rules noted above remain rollout gates.
- Hosted `rls_auto_enable` advisor warnings and password-protection configuration are platform/auth follow-up, not modified by this migration; no new client EXECUTE access is granted to that helper.
- Relationship leaving/deletion, persistent program-completed status, late completions, additional paths, Roots product work, notifications, payments, Realtime and Expo remain deferred.
- No commits, pushes or deployments were made.
