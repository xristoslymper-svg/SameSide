# Required verification after Phase 0

Phase 1A update: `contract.test.mjs` now implements and passes 30 local PostgreSQL test groups. See [RUNNING.md](RUNNING.md) for reproduction and [the backend contract](../../docs/phase1a-backend-contract.md) for limits. The checklist below is retained as the original broader acceptance plan; client tests remain deferred.

Phase 0 performed catalog inspection only. This is an acceptance checklist, not a passing automated test suite.

Use an isolated local Supabase database and synthetic accounts A, B and unrelated C. Do not seed production or export existing users. Test using authenticated client requests so policy permissions are exercised; service_role requests do not prove RLS.

## Baseline replay

- Replay exactly the three recovered versions into an empty local application schema.
- Compare the application catalog and effective ACLs to baseline/catalog.json.
- Account explicitly for managed event triggers and extension placement.
- Confirm the existing is_relationship_member permission defect before fixing it.
- Verify a fresh auth user receives a profile.

## Privacy and transactions

- A cannot select B assignments, by listing, direct ID, filter or join.
- B cannot select A raw Roots preferences; both can read only intended own data.
- A and B read their safe garden; C and signed-out clients cannot.
- Safe garden responses contain neither creator nor private source assignment fields.
- No direct client assignment completion, membership insertion or garden insertion is allowed.
- Acceptance puts B in A's existing relationship as member_b.
- Third member and second active relationship attempts fail, including concurrent requests.
- Expired/revoked/self invites have stable outcomes; repeated successful acceptance is safe.
- Before acceptance, a valid invite exposes only the explicitly permitted inviter display name, not membership/path/garden/profile data.
- Repeated/concurrent completion creates exactly one event.
- Multiple distinct assignments cannot bypass the three-completion daily limit.
- No pre-join assignments are issued; bonuses do not advance the path day.
- Solo-to-couple transition preserves all existing relationship/history state.

## Client tests in later phases

- Pending invite survives auth email round trip, process death and restart.
- Invitation entry bypasses normal solo/together onboarding.
- Existing unrelated relationship is explained without switching.
- Account changes clear private cached state.
- Focus/foreground refresh loads shared growth without private partner queries.

These tests should accompany future security fixes. Do not call the current backend production-ready merely because all tables have RLS enabled.
