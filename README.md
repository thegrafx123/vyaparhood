# Vyaparhood — app + Supabase backend

Expo / React Native app (Expo SDK 57, Reanimated 4) with a Supabase backend
(Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions) and Sentry
error tracking.

What works end to end: phone-number OTP sign-in, onboarding with every
animation from the design, profile with one photo and a business address,
Nearby (radar) and Citywide discovery, member profiles, connection requests
with notes, realtime chat with emoji, notifications, saved profiles, ratings,
report and block, account deletion after 30 days, and admin tools.

Not built yet (on purpose): payments (the app runs as a free beta — see 4.2),
push notifications.

---

## 1. Supabase — step-by-step setup (dev and prod)

You will create **two** Supabase projects and do every step on **dev first**,
then repeat on **prod**. The table at the end of this section lists what is
different between them.

### 1.1 Create the two projects

1. Go to https://supabase.com/dashboard → **New project**.
2. Create:

   | Project | Plan | Region | Notes |
   |---|---|---|---|
   | `vyaparhood-dev` | Free | South Asia (Mumbai) | Pauses after 7 days idle — un-pause from the dashboard |
   | `vyaparhood-prod` | Pro | South Asia (Mumbai) | Daily backups, never pauses |

3. Save the **database password** you set for each (a password manager is ideal).
4. For each project open **Project Settings → API** and note:
   * **Project URL** — `https://<ref>.supabase.co` (the `<ref>` part is the *project ref*)
   * **anon / public key** — safe to put in the app
   * **service_role key** — NEVER put this in the app or in git

### 1.2 Create the database

The whole schema (tables, row-level security, storage bucket, realtime,
all functions) is in `supabase/migrations/20260928000000_init.sql`.

**Option A — Supabase CLI (recommended).** On Windows, run the CLI through
`npx` (a global npm install isn't supported):

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR-DEV-REF
npx supabase@latest db push
```

`link` asks for that project's database password.

**Option B — no CLI.** Dashboard → **SQL Editor → New query**, paste the whole
migration file, press **Run**.

Check it worked: **Table Editor** should list `profiles`, `business_locations`,
`live_locations`, `messages` … and **Storage** should show a private bucket
called `avatars`.

> Already ran the *previous* version of this project's migration on a
> Supabase project? The schema changed completely (phone login, two
> locations, no document uploads). With no real users yet, the cleanest fix is
> a fresh project, or on dev only: `npx supabase@latest db reset --linked`
> (this **erases everything** in that database), then `db push`.

### 1.3 Phone login (SMS OTP)

Dashboard → **Authentication → Sign In / Providers → Phone**:

1. Turn **Enable Phone provider** on.
2. **SMS OTP length:** `6` (the app expects 6 digits — `OTP_LENGTH` in `src/config.ts`).
3. **SMS OTP expiry:** `600` seconds.
4. Choose an SMS provider (next two sections).

Also turn **off** the Email provider if you don't want email sign-ups at all
(the app only uses phone).

#### Dev: test numbers (no SMS needed)

In the same Phone settings, fill **Test Phone Numbers and OTPs**, one per line,
country code + number, digits only:

```
919999999999=123456
919888888888=654321
```

and set **Test OTPs valid until** to a date a few months ahead. Those numbers
log in with the fixed code and no SMS is ever sent. If the dashboard won't
save the Phone provider without SMS-provider credentials, enter the Twilio
details from the next step (or placeholders on dev) — test numbers never use them.

#### Prod: a real SMS provider

Indian SMS needs a TRAI DLT-registered sender. The simplest route with
Supabase's built-in providers is **Twilio Verify**:

1. Create a Twilio account → **Verify → Services → Create** (name: Vyaparhood,
   code length 6). Read Twilio's current notes on sending OTPs to India.
2. In Supabase's Phone provider choose **Twilio Verify** and paste the
   **Account SID**, **Auth Token** and **Verify Service SID**.
3. **Authentication → Rate Limits → SMS sent per hour**: raise from the
   default to what you expect at launch.
4. Log in once with your own real number to confirm SMS delivery.

Cheaper Indian gateways (MSG91, Gupshup, Fast2SMS) can be plugged in later
through Supabase's **Send SMS Hook** (Authentication → Hooks) with a small
Edge Function — no app change needed.

### 1.4 Root admin and demo data

**Dev only:** open `supabase/dev/seed_dev.sql`, replace `919999999999` (two
places) with the number you test with (use one of your test numbers from 1.3),
then run the file in the SQL Editor. It:

* makes that number the root admin,
* creates 10 demo businesses around Bandra, Mumbai,
* when that number signs up: 2 incoming requests (Karan, Neha), 2 chats
  (Riya, Arjun), 3 saved profiles, and the demo businesses move to within a
  few km of wherever you are testing, in your city.

**Prod:** edit `supabase/prod/bootstrap_prod.sql` (replace `91XXXXXXXXXX` in
two places with the admin's number), then run it. No demo data.

Both files are safe to run again and also work if the account already exists.

### 1.5 30-day account deletion job

When a member deletes their account it is hidden at once; a daily job
deletes it for good after 30 days (unless they log back in and restore it).

```bash
npx supabase@latest link --project-ref YOUR-REF
npx supabase@latest functions deploy purge-deleted-accounts --no-verify-jwt
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx supabase@latest secrets set CRON_SECRET=<the value printed above>
```

Then open `supabase/cron_jobs.sql`, replace `<PROJECT_REF>` and
`<CRON_SECRET>`, and run it in the SQL Editor. It runs daily at 03:00 IST.
Use a **different** secret for dev and prod.

Test it on dev: SQL Editor →
`select net.http_post(url := 'https://<ref>.supabase.co/functions/v1/purge-deleted-accounts', headers := jsonb_build_object('x-cron-secret', '<secret>'));`
then **Edge Functions → purge-deleted-accounts → Logs** should show a run.

### 1.6 Connect the app

```bash
cp .env.example .env.development   # dev project URL + anon key
cp .env.example .env.production    # prod URL + anon key, EXPO_PUBLIC_APP_ENV=production
```

Expo loads `.env.development` for `npx expo start`. Both files are git-ignored.
EAS cloud builds don't see `.env` files, so also replace the placeholders in
`eas.json` (`development` / `preview` profiles → dev keys, `production` → prod keys).

### 1.7 Sentry (optional)

1. https://sentry.io → new project → **React Native**, name `vyaparhood`.
2. Put the **DSN** in `EXPO_PUBLIC_SENTRY_DSN` (both env files and `eas.json`).
3. In `app.json`, replace `REPLACE_WITH_SENTRY_ORG` with your organisation slug.
4. For readable stack traces in production builds: `eas secret:create --name SENTRY_AUTH_TOKEN`.

Only a random user id is sent to Sentry — never phone numbers or locations.

### 1.8 Dev vs prod at a glance

| Step | Dev | Prod |
|---|---|---|
| Plan | Free | Pro |
| Migration (1.2) | ✓ | ✓ |
| Phone login (1.3) | Test numbers (+ Twilio when ready) | Twilio Verify (real SMS), higher rate limit |
| Seed / bootstrap (1.4) | `dev/seed_dev.sql` | `prod/bootstrap_prod.sql` — **never** the dev seed |
| Deletion job (1.5) | ✓ (own secret) | ✓ (own secret) |
| App keys (1.6) | `.env.development`, eas dev/preview | `.env.production`, eas production |

---

## 2. Run the app

```bash
npm install
npx expo install --fix
npx expo start --clear
```

Scan the QR code with Expo Go and log in with your test number and its fixed
code. Settings shows "DEVELOPMENT" at the bottom when you're on the dev project.
`npm run start:prod` runs against prod (macOS/Linux shell syntax).

---

## 3. The first-launch flow

1. **Splash (2)** → *Get Started*
2. **Location dialog (1)** — Allow → the phone's own permission popup →
   **City splash (2b, "Your Surat business, sorted")**, shown once.
   Don't allow → an explanation that Nearby needs location → still no →
   straight to onboarding.
3. **Onboarding (3 → 4 → 5)** — *Skip* on any of them jumps to the phone page.
4. **Phone + OTP (6+7 on one page)** → **Consent (8)** → **City (9)** →
   **Profile + business address (10)** → **Notifications (13)** →
   **Plans (14)** → **Discover (15)**.

On iPhone, the location and notification dialogs keep the design's look but
say *Continue / Not now* (Apple rejects custom screens that imitate its
"Allow" popup); Android keeps the design's exact wording.

---

## 4. How things work

### 4.1 Two locations per member

* **Business address** (`business_locations`) — typed on page 10 / 26
  (address, area, pincode, city). The phone's free geocoder turns it into a
  map point; if it can't, the server tries the pincode (see 6); if that
  fails too, the business still appears in Citywide but not Nearby.
  **Other members find you by this.**
* **Live location** (`live_locations`) — where the phone was when the app
  last opened (only if location is allowed). Used **only** as the start of
  your own Nearby search. If it's older than 12 hours or missing, your
  search starts from your business address instead.
* Nobody ever sees anyone's address or coordinates — only area, city and a
  distance (rounded to 0.5 km unless the member turns on "Show my exact
  distance").

### 4.2 Plans and billing (free beta)

The paywall shows **₹299/month (Early bird, highlighted)** and **₹99 for a
week**. Billing is **off**: picking a plan records the choice and lets the
member in free. When payments are ready:

1. Add a payment provider in `src/services/payments/` whose purchases are
   confirmed by a Supabase Edge Function that sets `memberships.active`.
2. Turn billing on: **Profile → Admin tools → App → Billing enabled**, or
   `update public.app_settings set billing_enabled = true;`

Prices live in `src/services/payments/index.ts`.

### 4.3 Deleting an account

Settings → *Delete account* hides the profile immediately, cancels pending
requests and signs out. Logging back in within 30 days shows a *Restore my
account* screen. After 30 days the daily job (1.5) deletes the photo and the
auth user, which cascades to every table.

### 4.4 One photo per member

The database only lets a member write `avatars/<their id>/avatar.jpg`, so
there can never be more than one photo each. The app crops it square and
shrinks it to 720 px JPEG (~60–120 KB) before upload.

### 4.5 Chat

Only possible inside an accepted connection (enforced by the database), and
stops the moment either person blocks the other, is banned or deletes their
account. The smiley button opens a built-in emoji picker; the phone's emoji
keyboard works too.

### 4.6 Animations

Every animation from the design lives in `src/motion/index.tsx` as a small
component with the design's timing and easing: `FadeUp`, `Breathe` (CTA),
`KenBurns`, `Squiggle` (self-drawing underline), `Wiggle`, `Float`, `Pop`,
`PinPop`, `Pulse`, `PulseDot`, `Ping`, `RingPulse`, `Halo`, `SheetIn`,
`SheetUp`, `BubbleIn`, `StarPop`, `Settle`, plus the CTA press effect.

* The design's entrance only slides (no fade). Set `ENTRANCE_FADE = true` in
  that file to add a fade to every entrance at once.
* If the phone's **Reduce motion** setting is on, everything appears in place
  without moving.

---

## 5. Security

* **Nobody signed out can read anything.** The `anon` role has no table access.
* **Row-level security on every table.** You can read and change only your own
  rows; anything about other people comes from database functions
  (`discover_members`, `get_member`, `my_chats` …) that return only public fields.
* **Locations never leave the server** except as a rounded distance.
* **Profile columns are locked:** the app can't change `is_admin`, `is_banned`,
  `verification_status`, `phone` or membership.
* **Membership can't be faked from a phone** — only admins and (later) a
  payment Edge Function can switch it on.
* **Instagram / LinkedIn handles** are shown only to connected members.
* **Login session** is stored AES-encrypted, with the key in the iOS
  Keychain / Android Keystore.

When you add a table later: `alter table … enable row level security;` and add
policies — Supabase grants new tables to logged-in users by default.

---

## 6. Before launching on prod

* Prod on the Pro plan; consider Point-in-Time Recovery once members pay.
* Migration, `bootstrap_prod.sql`, Edge Function and cron on prod — never `seed_dev.sql`.
* Real SMS provider tested with a real number; SMS rate limit raised.
* Name a Grievance Officer and publish the privacy policy URL (DPDP Act);
  consent time is stored in `profiles.consented_at`.
* Recommended: import India Post pincode centroids into `public.pincodes`
  (`pincode, lat, lng`; data.gov.in "All India Pincode Directory") so
  addresses the phone can't geocode still appear in Nearby.
* Have a lawyer review the Terms, Privacy Policy and Community Guidelines.

---

## 7. Project map

```
supabase/
  migrations/20260928000000_init.sql  schema, RLS, storage, RPCs (dev + prod)
  dev/seed_dev.sql                    root admin + demo data (DEV ONLY)
  prod/bootstrap_prod.sql             root admin for prod
  functions/purge-deleted-accounts    deletes accounts 30 days after request
  cron_jobs.sql                       daily schedule for the purge
src/motion/     every animation from the design
src/ui/         design components (buttons, headings, fields, dialogs, sheets, tab bar …)
src/features/   bigger pieces (profile form, radar, member card, emoji panel, legal page)
src/api/        index.ts (every server call), hooks.ts (caching), types, realtime
src/state/      AuthProvider (session + your profile), AppStore (device-only state)
src/services/   location, notifications, payments
app/            screens (file name = route)
```

| # | Screen | File |
|---|---|---|
| 1 | Location permission | `app/location.tsx` |
| 2 / 2b | Splash / City splash | `app/welcome.tsx`, `app/welcome-city.tsx` |
| 3–5 | Onboarding | `app/onboarding/nearby.tsx`, `context.tsx`, `why.tsx` |
| 6+7 | Phone + OTP | `app/auth/phone.tsx` |
| 8 | Age & consent | `app/auth/consent.tsx` |
| 9 | City | `app/auth/city.tsx` |
| 10 | Create profile + business address | `app/auth/profile.tsx` |
| 13 | Notifications | `app/auth/notifications.tsx` |
| 14 | Plans | `app/paywall.tsx` |
| 15 / 15b | Discover (Citywide / Nearby) | `app/(tabs)/discover.tsx` |
| 16 | Filters | `app/filters.tsx` |
| 17 | Member profile | `app/member/[id].tsx` |
| 18 | Send request | `app/send-request/[id].tsx` |
| 19 | Requests | `app/(tabs)/requests.tsx` |
| 20 / 21 | Chats / Chat thread | `app/(tabs)/chats.tsx`, `app/chat/[id].tsx` |
| 22 | Rate a meeting | `app/rate/[id].tsx` |
| 23 | Report or block | `app/report/[id].tsx` |
| 24 | Notifications list | `app/notifications.tsx` |
| 25 / 26 | My profile / Edit profile | `app/(tabs)/profile.tsx`, `app/edit-profile.tsx` |
| 27 | Saved profiles | `app/saved.tsx` |
| 28 | Settings (incl. delete account) | `app/settings.tsx` |
| 29–31 | Guidelines / Terms / Privacy | `app/legal/*` |
| — | City switcher, Blocked members, Restore account, Suspended, Admin | `app/city-select.tsx`, `app/blocked.tsx`, `app/restore-account.tsx`, `app/banned.tsx`, `app/admin/index.tsx` |

---

## 8. If something goes wrong

| Symptom | Likely cause |
|---|---|
| "Supabase keys missing" screen | `.env.development` missing, or Expo not restarted with `--clear` |
| "We couldn't send the SMS" | Phone provider off, provider credentials wrong, or number not in the test list (dev) |
| Code rejected | Codes expire after 10 min; only the newest code works; test numbers use their fixed code |
| Nearby is empty | Location off and no business point, or demo seed not run (dev), or distance filter too small |
| "We couldn't place your address on the map" | Phone geocoder didn't recognise it — add building/street, or import pincodes (6) |
| "permission denied for table …" | Migration not fully applied; re-run it on a fresh project |
| Deleted accounts never disappear | Edge Function not deployed, `CRON_SECRET` mismatch, or cron SQL not run (1.5) |
