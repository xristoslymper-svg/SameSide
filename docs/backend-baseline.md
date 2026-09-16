# Phase 0 - observed production backend

Captured 2026-09-16 from Supabase project Same-side, ref `itltgnzhyphkcycltdnl`, eu-west-1, PostgreSQL 17.6.1.166. The project ref matches the untouched prototype.

## Scope and evidence

Read-only catalog queries, stored migration definitions, project metadata, Edge Function inventory and security advisors were inspected. No application/auth user records, token values, passwords or API secrets were read or exported. SQL statements inside function bodies describe behavior; they were not executed.

The application catalog contains 8 tables, 53 columns, 33 constraints, 17 indexes (including constraint indexes), 11 policies, 7 application functions and 1 hosted RLS event-trigger function. RLS is enabled on all 8 application tables; FORCE RLS is not enabled. There are no public views, sequences, enums, additional custom schemas, column-specific ACLs, or public-table Realtime publication entries in the captured metadata. No Edge Functions are deployed.

One application trigger exists: `auth.users.on_auth_user_created` calls `public.handle_new_user()`. The hosted `ensure_rls` event trigger calls `public.rls_auto_enable()`. Six other event triggers belong to platform facilities; their inventory is captured, not their managed implementations.

Installed extensions: pgcrypto 1.3, uuid-ossp 1.1 and pg_stat_statements 1.11 in extensions; plpgsql 1.0 in pg_catalog; supabase_vault 0.3.1 in vault. No vault contents were queried. SQL connection timezone is UTC; relationships have no timezone field.

The complete current definitions and ACL strings are in `../supabase/baseline/catalog.json`. SQL history was recovered from `supabase_migrations.schema_migrations`:

| Version | Name |
| --- | --- |
| 20260916171924 | pairing_backend_v1 |
| 20260916171939 | pairing_backend_security_hardening |
| 20260916183619 | fix_pairing_crypto_search_path |

These are recovered existing versions, not new migrations. The files preserve the stored statement text.

## Table and access inventory

| Table | Observed purpose / policies |
| --- | --- |
| profiles | ID references auth.users; own-row SELECT/UPDATE; display_name and timestamps |
| relationships | Creator, active_path default routine, path_started_at, status; active-membership SELECT |
| relationship_members | member_a/member_b, joined_at/left_at; same-relationship SELECT |
| relationship_invites | Hash, creator, relationship, expiration, acceptance/revocation; creator-only SELECT |
| task_assignments | Owner, task_key, date, bonus flag/status; owner-only SELECT, no client write policy |
| root_preferences | One need per row, week 1-4; owner SELECT/DELETE, own membership-checked INSERT; no UPDATE policy |
| garden_events | Plant, chronology, creator/source assignment; membership SELECT, no client write policy |
| shared_insights | Type/week/value; membership SELECT, no client write policy |

All policies target PUBLIC rather than explicitly authenticated. All eight table ACLs grant broad table privileges to anon, authenticated and service_role. RLS still constrains ordinary row operations: broad grants alone do not mean those rows are publicly readable. RLS does not replace least-privilege grants, especially for non-row privileges such as TRUNCATE; no direct REST truncate route was tested or inferred.

Default ACLs and public/extensions schema privileges are captured. Public schema grants USAGE, not CREATE, to client roles in this snapshot.

## Functions: observed behavior

- `handle_new_user()`: inserts a profile on auth signup, using editable user metadata only as display text, not authorization. Existing users are not backfilled by this trigger.
- `is_relationship_member(uuid)`: SECURITY DEFINER boolean check for caller's active membership.
- `create_solo_relationship()`: authenticates, rejects existing active membership, inserts relationship and member_a within one transaction. Retry throws rather than returning existing relationship.
- `create_relationship_invite(integer)`: active membership required; rejects full relationship, revokes existing unused invites, generates 32 random bytes, returns hex token once, stores SHA-256 hash; expiry clamped to 1-720 hours.
- `accept_relationship_invite(text)`: authenticates, rejects any existing active membership, locks matching invite, checks validity/revocation/use/expiry/self/fullness, inserts member_b in the existing relationship, consumes invitation.
- `complete_assignment(uuid,text)`: locks caller-owned assignment, completes it if needed, looks up or creates its garden event and returns the event ID.
- `refresh_shared_root_insights(uuid,integer)`: caller membership required; derives overlap through a server-side self-join, inserts shared insight rows; never removes obsolete overlap.
- `rls_auto_enable()`: hosted event-trigger helper, not ordinary application functionality.

All eight functions are SECURITY DEFINER with fixed search paths and postgres ownership. The five public application RPCs grant EXECUTE to authenticated/service_role, not anon or PUBLIC. The two application helpers retain postgres/service_role only. The event-trigger helper retains PUBLIC/anon/authenticated execution privileges.

The crypto fix is confirmed: both invite functions now explicitly call extensions.digest; generation also calls extensions.gen_random_bytes. Their search paths include public and extensions.

## Findings and recommended follow-up

### P1 - membership RLS helper is inaccessible to clients

The security-hardening migration revokes EXECUTE on is_relationship_member(uuid) from PUBLIC, anon and authenticated, while five policies still depend on it (relationship read, membership read, garden read, insight read, Roots insert).

A production metadata query confirmed:
- authenticated can_execute: false
- anon can_execute: false
- service_role can_execute: true

Policies run in the querying user's context, so evaluating this helper lacks the required permission. Expect permission-denied failures in legitimate shared reads/Roots inserts. This is catalog-confirmed authorization configuration; no signed-in user query was executed.

Recommendation: move the helper into a non-exposed application-internal schema and grant authenticated the required schema USAGE/function EXECUTE, then repoint policies. A private API schema boundary and SQL execution permission are different controls. Test policy evaluation with real authenticated roles. Do not merely drop the helper from RLS or broaden policies.

### P1 - shared garden schema exposes attribution

garden_events includes created_by and source_assignment_id. Table-level SELECT has no safe column projection or view/RPC boundary; once the helper permission issue is repaired, authorized members could retrieve both fields. No current successful cross-user extraction is claimed.

Recommendation: put source/creator linkage in backend-only storage, expose only safe event fields, and keep deduplication uniqueness on the internal source linkage. Do not rely on frontend select lists to hide columns. Preserve plant chronology and use plant appearance independent of private task content.

### P1 - Roots overlap can be probed

Raw preferences have owner-only reads, which is the intended starting boundary. However, there is no two-needs-per-week limit; a user can insert all six needs once insertion is functional. The callable refresh RPC derives intersection immediately, potentially revealing every partner choice through repeated input changes. It also retains insights after preferences are deleted and includes historical users' rows without checking those users remain active.

Recommendation: before enabling Roots product functionality, enforce selection limits and define a stable submission/publication cadence that prevents repeated overlap probes; derive only from intended active participants. Raw owner privacy tests belong in Milestone 1, full Roots functionality does not.

### P1 - completion eligibility and daily caps are absent

The row lock plus unique partial index garden_event_per_assignment provide a sound basis for same-assignment idempotency. No runtime concurrency test was performed.

Missing checks: active membership, relationship/path eligibility, applicable date, three-per-day cap, bonus prerequisites and allowed transition from skipped. chosen_plant accepts arbitrary text. Unlimited distinct seeded assignments could be completed; this is not currently an arbitrary client assignment-insertion vulnerability because there is no write policy/RPC for issuing assignments.

Recommendation: add server-issued daily slots, server date/timezone rules, safe plant selection and transactional per-user daily limits. Keep repeated completion returning the existing event rather than consuming another slot.

### P2 - invitation retries and races need explicit handling

A successful recipient retry hits 'already in an active relationship' before the token is checked. Self-invite typically also hits that generic state before the own-invite condition. Errors use exception text rather than stable domain codes.

Unique partial indexes plus the member-role CHECK already enforce at most one active relationship per user and two active role slots per relationship, including concurrent inserts. Do not claim a third-member hole. The count checks themselves are not serialized across all relationship operations, so races can still surface uniqueness errors. Concurrent invite generation can leave more than one unused token because it does not lock a shared relationship row.

Recommendation: lock the relationship consistently around create/revoke/accept, translate constraint conflicts to stable states, and return success for a retry by the original recipient. Revalidate relationship status and current inviter membership. No safe name-only invitation-preview RPC currently exists.

### P2 - task issuance and path rules are not implemented

No catalogue, daily issuance RPC, template version/snapshot, or complementary selection mechanism exists. Unique (relationship,user,date,task_key) does not cap the number of different daily tasks or enforce one primary/two bonus slots.

Relationships have active_path/path_started_at but no timezone or program-completion representation. No joined-at restriction prevents hypothetical pre-join seeded assignments. Day-28 and late-completion rules are not enforced.

Recommendation: add a relationship timezone, explicit server calendar rules and deterministic private task issuance in a future migration, without resetting existing relationship/history state. A late joiner enters the current relationship day; do not backfill earlier assignments.

### P2 - narrow table/default grants and privileged surfaces

Replace broad table/default grants with explicit operations, use TO authenticated where applicable, and restrict internal function exposure. Privileged RPCs are not automatically vulnerabilities: cross-table writes legitimately require authorization checks and careful privilege handling. Keep auth.uid checks and fixed paths.

The advisor flags PUBLIC/anon EXECUTE on rls_auto_enable(). It returns event_trigger, so the flag alone does not establish a callable exploit; ordinary invocation is constrained by PostgreSQL's event-trigger context. Review it as a platform permission-hardening item, not a demonstrated arbitrary DDL endpoint.

### P3 - future maintenance and retention

- No updated_at trigger exists for profiles/relationships; timestamps can become stale.
- Garden lacks a relationship/chronology index; add one when implementing ordered retrieval.
- Root/task user IDs and relationship IDs are independently referenced, not constrained to a membership pairing. Controlled RPC writers must enforce the association.
- relationships/status is not considered by is_relationship_member; left_at is the only membership criterion.
- Garden relationship deletion cascades away history; creator references may block auth-user deletion. Inactivity does not delete anything. Define retention/disconnection/deletion behavior before implementing those actions.
- No private feedback storage exists yet.

## Advisor results and interpretation

The security advisor reports:
1. Anonymous SECURITY DEFINER execution for rls_auto_enable: review platform helper privileges, with the event-trigger caveat above.
2. Authenticated SECURITY DEFINER execution for five intended RPCs and rls_auto_enable: audit authorization rather than blindly converting cross-boundary RPCs to invoker.
3. Leaked-password protection disabled: relevant if password login is enabled; current product uses Magic Links, so not a Milestone 1 Magic Link blocker.

Remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Baseline verification and limitations

Recovered migrations cover all 8 application tables, 7 application function definitions, 11 policies, indexes/constraints and the auth profile trigger. The last migration matches the observed explicit crypto qualification. Hosted rls_auto_enable/ensure_rls and inherited/default ACLs are outside that application migration history and are preserved in the catalog instead.

No local replay, user-level privacy tests, mutation tests, concurrent RPC tests, or client integration tests have run. CLI, Docker, psql and pg_dump were unavailable on PATH. The baseline is not represented as deployment-ready or proven reproducible until isolated replay checks platform defaults and catalog parity.

Read-only inspection did not validate email templates, redirect allowlist, SMTP, API schema exposure, or mobile deep links. Existing application rows were intentionally not inspected for drift or consistency.

## Proposed next phase, subject to approval

1. Set up isolated local Supabase tooling and replay the recovered history.
2. Repair membership-helper permissions and garden API privacy together; test A/B/C allow/deny access.
3. Add invitation preview, retry handling and serialized membership/invite mutation.
4. Add timezone, private assignment issuance/slots and completion eligibility/idempotency tests.
5. Keep Roots product work, Realtime and Expo outside Phase 0. A later explicitly approved phase can start the app.

No production changes, migration-history repair, commits, pushes, or deployments were performed. Approval is needed to start Phase 1 and, separately, before any production rollout.
