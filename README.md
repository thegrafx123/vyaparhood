# Vyaparhood — app + Supabase backend

Expo / React Native app with a Supabase backend (Postgres + PostGIS, Auth,
Storage, Realtime, Edge Functions) and Sentry error tracking.

What works end to end: email OTP sign-in, profile with photo, location
(device or typed address), Nearby radius search and Citywide list, member
profiles, connection requests with notes, realtime chat, notifications,
saved profiles, ratings, report and block, verification documents (private,
deleted after 30 days), account deletion, and admin tools for the root account.

Not built yet: payments (membership is switched on by an admin for now),
push notifications, SMS OTP.

---

## 1. One-time setup (about 45 minutes)

### 1.1 Create two Supabase projects

At https://supabase.com/dashboard create:

| Project | Plan | Region |
|---|---|---|
| `vyaparhood-dev` | Free | South Asia (Mumbai) |
| `vyaparhood-prod` | Pro (daily backups, no pausing) | South Asia (Mumbai) |

Free projects pause after a week without use; just un-pause from the dashboard.

For each project, note from **Project Settings → API**: the Project URL, the
`anon` key, and the project ref (the `abcd…` part of the URL).
The `service_role` key never goes into the app or into git.

### 1.2 Create the database (do this on dev, then on prod)

**Option A — Supabase CLI (recommended):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-DEV-REF
supabase db push            # runs supabase/migrations/*.sql
```

To target prod later: `supabase link --project-ref YOUR-PROD-REF` then `supabase db push`.

**Option B — no CLI:** open **SQL Editor → New query**, paste the whole of
`supabase/migrations/20260927000000_init.sql`, run it.

### 1.3 Root admin + demo data

* **Dev project only:** run `supabase/dev/seed_dev.sql` in the SQL Editor.
  It makes **shettyjay12345@gmail.com** an admin with an active membership and
  creates 10 demo members. When that account signs up, it automatically gets
  2 incoming requests (Karan, Neha), 2 chats (Riya, Arjun), 3 saved profiles,
  and the demo members are placed 0.8–12 km around wherever you are testing,
  in your city.
* **Prod project:** edit `supabase/prod/bootstrap_prod.sql` (replace
  `REPLACE_WITH_PROD_ADMIN_EMAIL`), then run it. No demo data.

Both files are safe to run again and also work if the account already exists.

### 1.4 Email OTP through Hostinger (both projects)

**a) Turn on email codes.** Authentication → Sign In / Providers → Email:
Email provider **on**, Confirm email **on**, Email OTP length **6**,
Email OTP expiration **600** seconds.

**b) Custom SMTP.** Authentication → Emails → SMTP Settings → enable:

| Field | Value |
|---|---|
| Sender email | `no-reply@vyaparhood.com` |
| Sender name | `Vyaparhood` |
| Host | `smtp.hostinger.com` |
| Port | `465` |
| Username | `no-reply@vyaparhood.com` |
| Password | that mailbox's password (from Hostinger → Emails) |

**c) Make the email contain the code, not a link.** Authentication → Emails →
Templates. Edit **both** "Magic Link" and "Confirm signup" (new users can get
the second one). Example body:

```html
<h2>Your Vyaparhood code</h2>
<p>Enter this code in the app to sign in:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
```

Subject: `Your Vyaparhood code: {{ .Token }}`

**d) Rate limit.** Authentication → Rate Limits → "Emails sent per hour":
raise it from the default to what your Hostinger plan allows. Check the
daily sending limit of your Hostinger email plan before launch.

**e) Stop codes going to spam.** In Hostinger's DNS for vyaparhood.com make
sure SPF, DKIM and DMARC records exist for Hostinger mail (Hostinger →
Emails → your domain → DNS / Deliverability shows the exact records).
Then send yourself a code on Gmail and check it lands in the inbox.

### 1.5 Edge Functions + 30-day document deletion (both projects)

```bash
supabase link --project-ref YOUR-REF
supabase functions deploy delete-account
supabase functions deploy purge-expired-documents --no-verify-jwt
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)   # note the value
```

Then open `supabase/cron_jobs.sql`, replace `<PROJECT_REF>` and `<CRON_SECRET>`,
and run it in the SQL Editor. It calls the purge function daily at 03:00 IST.

### 1.6 Sentry

1. Create a free account at https://sentry.io → new project → platform
   **React Native**, name `vyaparhood`.
2. Copy the **DSN** into `EXPO_PUBLIC_SENTRY_DSN` (step 1.7) and into `eas.json`.
3. In `app.json`, replace `REPLACE_WITH_SENTRY_ORG` with your Sentry
   organization slug.
4. For readable stack traces in production builds, create a Sentry auth
   token and add it as an EAS secret: `eas secret:create --name SENTRY_AUTH_TOKEN`.
   Dev builds skip the upload (`SENTRY_DISABLE_AUTO_UPLOAD` in `eas.json`).

Only a random user id is sent to Sentry — never email, phone or IP.

### 1.7 App environment files

```bash
cp .env.example .env.development   # dev project URL + anon key
cp .env.example .env.production    # prod project URL + anon key, APP_ENV=production
```

Expo loads `.env.development` for `npx expo start` automatically. Both files
are git-ignored. Also fill the placeholders in `eas.json` (used by EAS cloud
builds, which don't see your `.env` files).

---

## 2. Run the app

```bash
npm install
npx expo install --fix     # pins every native package to your Expo SDK
npx expo start --clear
```

Scan the QR code with Expo Go. Sign in with shettyjay12345@gmail.com; the
6-digit code arrives from no-reply@vyaparhood.com.

* `npm run start:prod` runs against the production project (macOS/Linux shell syntax).
* Settings shows "DEVELOPMENT" at the bottom when you're on the dev project.
* Expo Go is fine for everything here. Sentry's native crash reporting only
  works in a development build (`eas build --profile development`), but
  JavaScript errors are reported from Expo Go too.

### Testing with a second person

Sign up a second email. It will stop at the paywall (payments aren't live).
From the root account: Profile → Settings → **Admin tools → Members** →
search → **Grant**. The second account taps "Already activated? Check again".

---

## 3. How the security works

* **Nobody signed out can read anything.** The `anon` role has no table access.
* **Row-level security on every table.** You can read and change only your
  own rows. Anything about other people comes from database functions
  (`discover_members`, `get_member`, `my_chats`, …) that return only public
  fields: name, title, category, area, city, a distance, photo path.
* **Coordinates never leave the server.** `user_locations` is readable only
  by its owner. Others see a distance rounded to 0.5 km unless that member
  turns on "Show my exact distance".
* **Profile columns are locked.** The app can update name/bio/etc., but not
  `is_admin`, `is_banned`, `verification_status` or membership — those are
  column-level permissions in Postgres, not app code.
* **Membership can't be faked from a phone.** Only admins (and later a
  payment Edge Function using the service key) can switch it on.
* **Photos** are in a private bucket; members get 1-hour signed links.
* **Verification documents** are in a separate private bucket readable only
  by the owner and admins, deleted permanently after 30 days.
* **Chat** is only possible inside an accepted connection; blocking stops
  messages instantly (enforced by the database).
* **Login session** is stored AES-encrypted, with the key in the iOS
  Keychain / Android Keystore.

When you add a new table later: `alter table … enable row level security;`
and add policies — Supabase grants new tables to logged-in users by default.

---

## 4. Project map

```
supabase/
  migrations/20260927000000_init.sql  schema, RLS, storage, all RPCs (dev + prod)
  dev/seed_dev.sql                    root admin + demo data (DEV ONLY)
  prod/bootstrap_prod.sql             root admin for prod
  functions/delete-account            deletes user, files, everything
  functions/purge-expired-documents   30-day document deletion
  cron_jobs.sql                       daily schedule for the purge
src/lib/        env, supabase client, encrypted session storage, sentry, uploads
src/api/        index.ts (every server call), hooks.ts (caching), types, realtime
src/state/      AuthProvider (session + your profile), AppStore (device-only state)
app/            screens (admin tools in app/admin)
```

## 5. Before launching on the production project

* Prod on the Pro plan; consider Point-in-Time Recovery once you have paying members.
* Run the migration, `bootstrap_prod.sql`, Edge Functions and cron on prod
  — never `seed_dev.sql`.
* Authentication → URL/Rate limits and SMTP set up on prod as in 1.4.
* Name a Grievance Officer and publish the privacy policy URL (DPDP Act);
  the app records consent time in `profiles.consented_at`.
* Optional: import India Post pincode coordinates into `public.pincodes`
  (`pincode, lat, lng`; data.gov.in "All India Pincode Directory") so members
  who type an address instead of sharing location appear in Nearby.
  Without it they only appear in Citywide.
* When payments are chosen: add an Edge Function that verifies the purchase
  with Apple / Google / Cashfree and sets `memberships.active`, then swap the
  provider in `src/services/payments/index.ts`.

## 6. If something goes wrong

| Symptom | Likely cause |
|---|---|
| "Supabase keys missing" screen | `.env.development` missing or Expo not restarted with `--clear` |
| Email arrives with a link, not a code | Template in 1.4c not edited (edit both templates) |
| No email at all | SMTP password/port wrong, or Hostinger rate limit; check Authentication → Logs |
| Code rejected | Codes expire after 10 min and only the newest one works |
| Stuck on paywall | Account has no membership; grant it in Admin → Members |
| Nearby is empty | Location off and no pincode data, or demo seed not run (dev) |
| "permission denied for table …" | Migration not fully applied; re-run it on a fresh project |

## 7. Screen map

| # | Screen | File |
|---|---|---|
| 01 | Location permission (on launch) | `app/index.tsx` |
| — | Manual address (location denied) | `app/manual-address.tsx` |
| 02/03 | Welcome / "Surat · Live now" | `app/welcome.tsx` |
| 04–06 | Onboarding | `app/onboarding/*` |
| 07 | Email sign-in (replaces phone) | `app/auth/email.tsx` |
| 08 | OTP | `app/auth/otp.tsx` |
| 09 | Consent | `app/auth/consent.tsx` |
| 10 | City | `app/auth/city.tsx` |
| 11 | Profile setup | `app/auth/profile-setup.tsx` |
| 12 | Verification documents | `app/auth/verify-docs.tsx` |
| 13 | Under review | `app/auth/under-review.tsx` |
| 14 | Notification permission | `app/auth/notifications.tsx` |
| 15 | Paywall | `app/paywall.tsx` |
| 16/17 | Discover (Citywide / Nearby radar) | `app/(tabs)/discover.tsx` |
| 18 | Filters | `app/filters.tsx` |
| 19 | Member profile | `app/member/[id].tsx` |
| 20 | Send request | `app/send-request/[id].tsx` |
| 21 | Requests | `app/(tabs)/requests.tsx` |
| 22 | Chats | `app/(tabs)/chats.tsx` |
| 23 | Chat thread | `app/chat/[id].tsx` |
| 24 | Rate meetup | `app/rate/[id].tsx` |
| 25 | Report or block | `app/report/[id].tsx` |
| 26 | Notifications | `app/notifications.tsx` |
| 27 | My profile | `app/(tabs)/profile.tsx` |
| 28 | Edit profile | `app/edit-profile.tsx` |
| 29 | Saved profiles | `app/saved.tsx` |
| 30 | Settings | `app/settings.tsx` |
| 31–33 | Guidelines / Terms / Privacy | `app/legal/*` |
| — | Admin tools (admins only) | `app/admin/index.tsx` |
| — | Suspended account | `app/banned.tsx` |
