# Running the Phase 1A PostgreSQL contract suite

The suite is destructive ONLY to a newly created synthetic database that it names itself. It cannot accept a remote database URL: connection host is fixed to 127.0.0.1, database names are generated, and existing databases are not reset/dropped. Use a dedicated local PostgreSQL cluster, never a forwarded production port.

The checked-in tooling is pinned for Windows x64 (also tested through Windows x64 emulation). No Expo dependencies are installed. On another OS, provide a dedicated PostgreSQL 17 server and install the pg driver separately; this Windows dependency manifest is not a cross-platform app manifest.

From this directory, using Node and pnpm 11.19.0:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
& node_modules/@embedded-postgres/windows-x64/native/bin/initdb.exe -D pgdata -U postgres -A trust --encoding=UTF8 --locale=C
& node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe -D pgdata -l postgres.log -o '-h 127.0.0.1 -p 55437' -w start
pnpm test
& node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe -D pgdata -m fast -w stop
```

Initialize only once in a new directory. This Windows binary package has no symlinks to hydrate, so install scripts are unnecessary. Local trust auth is for an isolated test-only loopback cluster with synthetic data. Do not use this setup as a production service.

Optional environment variables: SAMESIDE_TEST_PORT (default 55437), SAMESIDE_TEST_PASSWORD (only if your dedicated local cluster needs one). Do not place credentials in files or pass a production connection string. Tests retain their uniquely named databases for inspection and never delete an existing database.

The bootstrap creates synthetic auth.users/auth.uid and API roles with the Phase 0 default grants. Auth identity is set with SET LOCAL ROLE plus a transaction-local JWT sub claim. This tests actual PostgreSQL permissions/RLS and concurrency but not Supabase Auth, PostgREST or network JWT validation.

Expected result: 30 test groups pass. Every run creates a fresh database, including migration replay and representative pre-migration history. No live project connection is used.

Supabase CLI 2.117.0 generated the migration name; it is included as development tooling for future migration generation. The historical migration files must remain unchanged. Tests do not call CLI push/link/reset or Supabase cloud APIs.
