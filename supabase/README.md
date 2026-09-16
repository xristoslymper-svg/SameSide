# Same Side backend baseline

Phase 1A preparation is now available in [the backend contract and migration plan](../docs/phase1a-backend-contract.md). One incremental migration and 30 passing isolated PostgreSQL test groups are prepared; production is unchanged. The remainder of this page records the historical Phase 0 capture.

Phase 0 capture: 2026-09-16. Production project: Same-side (`itltgnzhyphkcycltdnl`), PostgreSQL 17.

## What is version controlled

- `migrations/`: the three exact SQL statement payloads retrieved from production migration history, retaining their existing versions and names.
- `baseline/catalog.json`: the observed current application catalog, including definitions, RLS, ACLs, constraints, indexes, extension dependencies, event-trigger inventory and security-advisor findings.
- `baseline/capture.sql`: a read-only query for the primary catalog snapshot.
- `tests/README.md`: the required isolated verification plan.
- `../docs/backend-baseline.md`: findings, evidence, gaps and next-phase recommendations.
- `../docs/product-decisions.md`: approved product decisions.

These are a historical baseline, not a security-fixed release. Known defects are intentionally preserved.

## Production safety

The three versions already exist in production. Do not execute these files manually against production, recreate tables, or mark an invented baseline version applied. Do not run production reset, push, migration repair, or deployment as part of Phase 0.

No new migration version was created. No CLI packages, database runtime, or Expo app were installed. No production data or schema was changed.

## Migration strategy

1. Preserve the recovered historical migration files unchanged.
2. Provision an isolated local Supabase stack in a separately approved phase, using a pinned supported CLI and PostgreSQL 17. Generate local config with that CLI; do not guess production auth settings.
3. Verify platform prerequisites: `auth.users`, Supabase roles, `auth.uid()`, and pgcrypto in `extensions`. The original first migration uses an unqualified extension creation statement; replay behavior depends on the platform's preinstalled extensions.
4. Replay the three recovered migrations only into that empty application schema.
5. Compare tables, columns, constraints, indexes, functions, triggers, policies AND effective grants with `baseline/catalog.json`. The historical migrations rely on hosted default grants; they do not explicitly recreate all platform ACLs or the hosted `ensure_rls` event trigger.
6. Resolve environment drift explicitly. Do not copy Supabase-managed schemas or event triggers blindly into application migrations.
7. Create future incremental migrations with the CLI migration generator. Review and test changes locally, preserving original migration versions.
8. Before an approved deployment, compare remote migration history with Git and inspect the proposed diff. Any remote history repair requires a separate reviewed reason; none is currently indicated by the three recovered versions.

The catalog is evidence of observed state, not an executable pg_dump replacement. Local replay and authenticated integration tests have NOT been run: Supabase CLI, Docker, psql and pg_dump were not available on PATH.

## Configuration outside this baseline

Auth email templates, redirect allowlist, SMTP settings, API exposed-schema configuration, secrets, hosting/deep-link associations, and runtime credentials are not reconstructed here. Obtain only the relevant nonsecret configuration before the auth implementation. No seed data is included.

Official reference: https://supabase.com/docs/guides/deployment/managing-environments
