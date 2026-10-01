# Pairing reliability verification

Run `pnpm --dir supabase/tests test:pairing` with PostgreSQL available on loopback port 55438 (override with SAMESIDE_TEST_PORT). The runner creates a fresh disposable database, replays every migration chronologically, and uses real anon/authenticated roles with synthetic identities. It cannot accept a remote database URL.

Coverage: reset permissions; both-partner setup gate; retry-safe acceptance; competing joins; distinct simultaneous Moves; private tasks/reflections; ordered extra Moves; completion idempotency; three-Move limit; restricted invitation preview; nameless partner status; lifecycle APIs; active-day/week consistency; history-preserving leave; same-day fresh relationship assignments; expired/revoked links; 28 active days; relationship timezone.

This suite does not simulate hosted email delivery, OAuth, browser storage, or native deep links. Verify those separately. The older contract.test.mjs is a historical staged migration suite and assumes superseded calendar-day/solo-start rules; it is not a current acceptance test.
