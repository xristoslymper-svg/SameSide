# Same Side - Expo foundation

Expo SDK 57, React Native, strict TypeScript, Expo Router and Supabase Auth. Phase A adds opening → how it works → starting intent → the existing Magic Link form → The Routine → one optional intention → Start the shift → authenticated placeholder. No relationship, invitation, task, Garden, Roots or database migration calls exist in this app.

## Run on web

Requires Node 24 and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile --ignore-scripts
```

Copy `.env.example` to `.env.local` and supply the Supabase URL and **publishable** key. These EXPO_PUBLIC values are public application configuration, never server secrets. The client intentionally rejects service-role/secret keys. The local working copy has the existing prototype's public project configuration in ignored `.env.local`; it is not a checked-in credential or a schema change.

```sh
pnpm web
```

Open http://localhost:8081. In the Supabase Auth redirect allowlist, this environment needs **http://localhost:8081/auth/callback**. Production web hosting needs its own exact callback URL and SPA fallback to index.html. This task does not change the project's allowlist, templates, SMTP or schema. Keep the configured email template delivering Magic Links, not six-digit OTP emails.

Use your email to request a link and open it in the **same browser profile** that requested it. The PKCE verifier persists across page refresh or browser restart, but another browser/device does not have that verifier; request a new link there if needed. Links and codes are never logged by app code. Callback query/hash parameters are cleared after handling.

## Native readiness

The app declares `sameside` as its scheme and uses `sameside://auth/callback` by default. Allowlist that URL before testing a native development build. A different native callback can be set using EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_URL. Expo Go is not the production custom-scheme callback environment; use a development build for end-to-end native auth. App store identifiers, universal links, signing and deployment are intentionally deferred.

Native sessions and PKCE verifiers use Expo SecureStore. The adapter splits larger session JSON into bounded chunks with an atomic manifest, instead of assuming every session fits in one keychain value. Browser sessions use localStorage. Auth state lives in one provider with restoration, auth-change subscription, native foreground refresh management and local-session sign-out. Expo Router protects the placeholder while signed out.

## Checks

```sh
pnpm typecheck
pnpm exec expo install --check
pnpm exec expo export --platform all
pnpm preview:web
# In a second terminal:
pnpm test:web
```

Preview serves only the local exported `dist/` app at port 8081. Do not run preview and Metro on that port together. Playwright defaults to installed Microsoft Edge; set PLAYWRIGHT_CHANNEL=chrome if using Chrome, or adjust the config for a separately installed test browser. Playwright is development-only.

Browser tests use the real Supabase SDK with **mocked Auth HTTP responses**, never live test emails or production account writes. They cover PKCE code exchange and verifier persistence, refresh/restart session restoration, sign-out, protected routes, expired links, invalid email and a narrow-screen runtime/layout check. Requests to the product REST API fail the suite.

Passing these tests does not prove email delivery, Supabase redirect allowlisting, or a native keychain/device round trip. A real user must complete a Magic Link on an allowed callback to verify live auth. No actual native simulator/device test has been performed.

## Structure

- `app/`: opening, callback, protected placeholder, root router.
- `src/providers/`: central auth/session lifecycle.
- `src/features/auth/`: callback parsing.
- `src/lib/`: environment-backed Supabase client and platform storage.
- `src/theme/` and `src/components/`: cream/sage/coral visual foundation.
- `tests/`: browser regression checks.

The root repository's original index.html remains untouched. Generated web output is under ignored `mobile/dist/`, not the prototype path. No Redux, product state engine or flower animation is added.

## Phase A onboarding

Routes: /, /how-it-works, /starting-mode, /sign-in, /auth/callback, /choose-path, /personalize, /welcome. The final CTA lives on /personalize.

OnboardingProvider persists each transition before navigation using the existing platform storage adapter (web localStorage; native SecureStore). A pre-auth draft preserves starting intent across the email round trip. After authentication it is adopted into an account-ID-scoped record and removed. Existing saved account progress takes precedence. Completed accounts resume the placeholder; incomplete accounts resume their saved step. Different accounts do not inherit each other’s choices. Sign-out hides account progress but retains it for that account’s next sign-in. Storage failures block advancement and offer retry.

This is device-local state, not backend persistence or authorization. Clearing app/browser data or changing devices loses onboarding progress. The optional intention is not sent to Supabase or used for task generation. Starting intent does not create a relationship. Together mode reaches the same placeholder; actual invitation UI belongs to Phase B. No product API calls or new dependencies were added.

Phase B requires separately approved deployment of the local Phase 1A migration: membership helper/RLS permissions, safe invitation preview and retry-safe acceptance (and the timezone-aware relationship creation contract). It is not deployed by Phase A.
