# Sentry setup — work log, 4 Nov 2026

Everything done in today's session to set up Sentry error logging end to end,
plus issues found along the way. No secret values are written in this file.

- Sentry: org `overviewfashion`, project `react-native` (EU region, `ingest.de.sentry.io`)
- Supabase: dev `uxhbekxbpittlpymvfam`, prod `vpsrdoqyuxabadnkizbk`
- Expo/EAS: account `overviewfashion`, project `vyaparhood`

---

## 1. Code changes

### App
| File | Change |
|---|---|
| `src/lib/sentry.ts` | Screen-navigation tracing; native crash handling off in Expo Go; `EXPO_PUBLIC_SENTRY_DEBUG=1` switch; `beforeSend` keeps only the user id; `reportError` turns plain Supabase `{message, code}` errors into real errors. |
| `app/_layout.tsx` | Router registered with Sentry tracing; failed **queries** reported (before: only mutations); startup log `[env] <env> · supabase <ref> · sentry on/off` + `supabase_project` tag on every event; whole app wrapped in `Sentry.ErrorBoundary` with a "Something went wrong / Try again" screen (render crashes no longer kill the app). |
| `app/settings.tsx` | Developer section (dev mode, or `EXPO_PUBLIC_SENTRY_TEST_MENU=1`) with 5 test buttons: handled error, Supabase error, unhandled JS error, render crash, native crash. Reached via Profile tab → gear icon → scroll to bottom. Never shown in production builds. |
| `src/services/notifications.ts` | Fixed `ExpoTopicSubscriptionModule` crash in Expo Go on Android (now uses `isRunningInExpoGo()`). |
| `app.json` | Sentry plugin: `organization: overviewfashion`, `project: react-native`. |
| `eas.json` | Real Supabase URL, anon key and Sentry DSN in every profile (dev values for development/preview, prod values for production). Preview: builds an installable `.apk`, shows the Sentry test buttons, uploads source maps. |
| `.env.example` | Documented the optional Sentry variables. |

### Supabase Edge Functions
| File | Change |
|---|---|
| `supabase/functions/_shared/sentry.ts` | New `withSentry(name, handler)` wrapper: reports thrown errors and 5xx responses, tagged `function`, `region`, `execution_id`; logs `[sentry] event <id> sent` / `NOT sent` / `SENTRY_DSN not set`. |
| `expire-memberships`, `purge-deleted-accounts`, `send-push` | Wrapped with `withSentry`. |
| `expire-memberships` | Header `x-sentry-test: 1` (with a valid cron secret) throws a test error before touching the database. |

---

## 2. Configuration done

**Supabase prod — Edge Function secrets:** `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`, `CRON_SECRET` (new value). All 3 functions redeployed.

**EAS:** project linked (`eas init`); `SENTRY_AUTH_TOKEN` saved as a secret for the **production** environment.

**Sentry:** auth token rotated after it was exposed (the first one failed the build with `Invalid org token (401)`).

---

## 3. Test results
| Test | Result |
|---|---|
| Handled error | ✅ in Sentry |
| Supabase-style error | ✅ in Sentry |
| Unhandled JS error | ✅ in Sentry |
| Render crash | ✅ in Sentry + "Something went wrong" screen |
| Edge function error | ✅ event `278e560584234c728658169041d9cc5f` in Sentry |
| EAS production build | ✅ build succeeded (`.aab`) |
| Source maps uploaded | ✅ release `in.vyaparhood.app@0.1.0+3`, 2 artifacts |
| Native crash | ⏳ needs the preview APK |

Notes:
- Tests so far ran with `npm run start:prod` (prod config, dev mode), so their events are tagged `production`.
- The Sentry Issues feed filters by environment — pick **All Envs** to see everything. Search `function:<name>` for Edge Function errors, or paste an event ID to jump to it.
- The red error screen while running from Metro is React Native's dev overlay; users of real builds never see it.

---

## 4. Still to do (Sentry)
1. **Dev email templates** (dev project → Authentication → Emails → Templates → Magic Link + Confirm signup): copy prod's — subject `Your Vyaparhood code: {{ .Token }}`, body showing `{{ .Token }}`. Needed to sign in on the preview build / `start:dev`. (The local Supabase access token has no rights on the dev project, so this must be done in the dashboard.)
2. **Token for preview builds:**
   `npx eas-cli@latest env:create --name SENTRY_AUTH_TOKEN --value '<token>' --visibility secret --environment preview`
3. **Preview build + native crash test:**
   `npx eas-cli@latest build --profile preview --platform android` → install APK → Developer → native crash → reopen app → check Sentry (environment `development`).
4. **Alert:** Sentry → Alerts → Issues → "A new issue is created" → environment production → email.
5. **Clean up:** resolve the "Sentry test: …" issues; delete the misnamed Supabase secret `CRON SECRET` (with a space).

---

## 5. Found along the way (not Sentry)
- **Dev Supabase sends a `localhost` link instead of a code** — default templates never changed on dev (see 4.1). Prod was fine. Not caused by today's changes.
- **`supabase/cron_jobs.sql` line 20 contains a real cron secret** (dev project) and is in git. Rotate it and put the `<CRON_SECRET>` placeholder back.
- **Prod has no cron jobs and no push setup** (`pg_cron` not enabled; no `push_function_url` / `push_function_secret` vault secrets):
  - Membership expiry is already enforced live (app + database check `renews_at`), so the expire job is optional.
  - **Deleted accounts are hidden but never permanently erased** — only the purge cron does that. Needed to keep the 30-day deletion promise. Before enabling, count what the first run erases:
    `select count(*) from profiles where deletion_requested_at < now() - interval '30 days';`
  - Phones get no push notifications from prod until the vault secrets exist (use the same `CRON_SECRET`).
- **Secrets shown in chat today** (cron secrets, first Sentry token) — rotate any still in use before launch.
- `npm run start:prod` is still dev mode with prod settings; only `eas build --profile production` makes a real production app. `.env` files are not used by EAS builds — `eas.json` / EAS env vars are.
