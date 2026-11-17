# Vyaparhood — Project Overview

A map of the whole project: what the app does, how it is built, where
every piece lives, and how the pieces talk to each other. For setup
steps (Supabase dashboard, SMTP, EAS), see `README.md`.

---

## 1. What the app is

Vyaparhood helps small-business owners in India find and connect with
other business owners **near them** or **in their city**.

A member:
1. signs in with their **email + a 6-digit code** (no password),
2. adds a **phone number** (collected, not verified), picks a **city**,
   and builds a **profile** with one photo and a business address,
3. picks a **plan** (₹99/week or ₹299/month — free during the beta, but
   the membership still runs for exactly 168 hours / 30 days),
4. **discovers** members (Nearby radar or Citywide list), sends
   **connection requests** with a short note, **chats** once accepted,
   **rates** meetings, **saves** profiles, and **reports/blocks** abuse.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| App | Expo SDK 58, React Native 0.88, React 19.3, TypeScript |
| Navigation | expo-router (file-based routes in `app/`) |
| Data fetching | TanStack React Query (caching, refresh) |
| Animation | Reanimated 4 + react-native-svg (radar, squiggles) |
| Backend | Supabase — Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions |
| Login | Supabase email OTP, sent through Hostinger SMTP (`no-reply@vyaparhood.com`) |
| Errors | Sentry (`@sentry/react-native`) — off until a DSN is set |
| Builds | EAS (`eas.json`: development / preview / production) |

---

## 3. Folder structure

```
vyaparhood/
├── app/                     Screens. Each file is a route (expo-router).
│   ├── _layout.tsx          Root: providers, fonts, Sentry, the screen stack
│   ├── index.tsx            Launch: reads saved login, decides where to go
│   ├── welcome*.tsx         Splash screens (generic / with detected city)
│   ├── location.tsx         Location permission dialog
│   ├── onboarding/          3 intro slides (nearby, context, why)
│   ├── auth/                Sign-up flow: email → phone → consent → city
│   │                        → profile → notifications
│   ├── paywall.tsx          Plan choice
│   ├── (tabs)/              Main app: discover, requests, chats, profile
│   ├── chat/[id].tsx        One conversation
│   ├── member/[id].tsx      Another member's profile
│   ├── send-request/[id]    Bottom sheet: request + note
│   ├── filters.tsx          Bottom sheet: Discover filters
│   ├── city-select.tsx      Bottom sheet: browse another city
│   ├── rate/, report/       Rate a meeting / report or block
│   ├── saved, notifications, settings, edit-profile, blocked
│   ├── restore-account.tsx  Shown when a deleted account signs back in
│   ├── banned.tsx           Shown to banned members
│   ├── admin/               Admin tools (admins only)
│   └── legal/               Terms, Privacy, Community Guidelines
│
├── src/
│   ├── api/                 EVERYTHING that talks to Supabase
│   │   ├── index.ts         All backend calls, grouped: auth, me, location,
│   │   │                    discover, requests, chat, safety, saved,
│   │   │                    notifications, admin
│   │   ├── hooks.ts         React Query hooks screens use (useRequests…)
│   │   ├── types.ts         Shared data types + isActiveMember()
│   │   ├── errors.ts        friendlyError(): backend errors → plain English
│   │   └── RealtimeBridge   Live updates for messages/requests/notifications
│   ├── state/
│   │   ├── AuthProvider     Session, current user, `me` (profile+membership)
│   │   └── AppStore         Local app state: filters, Discover mode/city,
│   │                        live location, one-time flags
│   ├── lib/
│   │   ├── supabase.ts      The Supabase client
│   │   ├── secureStorage.ts Encrypted session storage
│   │   ├── routing.ts       routeForMe(), needsPaywall(), resetTo()
│   │   ├── env.ts           Reads EXPO_PUBLIC_* values
│   │   ├── liveLocation.ts  Gets GPS fix and saves it
│   │   ├── photoPicker.ts   Pick + resize the profile photo
│   │   ├── sentry.ts        Error reporting
│   │   └── files.ts
│   ├── services/
│   │   ├── location.ts      Permission, GPS, geocoding, normaliseCity()
│   │   ├── notifications.ts Notification permission (no push yet)
│   │   └── payments/        Plan prices (PLANS) + payment provider stub
│   ├── features/            Bigger building blocks: ProfileForm, Radar,
│   │                        MemberCard, DistanceSlider, EmojiPanel…
│   ├── ui/                  Design-system pieces: Buttons, Form fields,
│   │                        Heading (cursive accent), Sheet, TabBar, icons…
│   ├── motion/              Animations from the design (FadeUp, Pop…)
│   ├── theme/               Colours, fonts, spacing (tokens.ts)
│   ├── utils/               validation (email, phone, pincode, DOB), time
│   └── config.ts            App-wide settings: cities, categories,
│                            OTP length, distances, photo size
│
├── supabase/
│   ├── migrations/          Database schema, in order (see §6)
│   ├── functions/           Edge Functions (see §7)
│   ├── cron_jobs.sql        Scheduled jobs (run once per project)
│   ├── dev/                 seed_dev.sql (demo data), reset_dev.sql
│   ├── prod/                bootstrap_prod.sql, admins_prod.sql
│   └── config.toml          Supabase CLI config
│
├── .env.development         Dev project URL + anon key (app)
├── .env.production          Prod project URL + anon key (app)
├── app.json                 Expo config: name, bundle IDs, permissions, plugins
├── eas.json                 Build profiles
└── package.json             Scripts: start:dev, start:prod, typecheck
```

**Rule of thumb:** screens never call Supabase directly. They use hooks
from `src/api/hooks.ts`, which call `src/api/index.ts`.

---

## 4. Environments

| | Dev | Prod |
|---|---|---|
| Supabase project | `uxhbekxbpittlpymvfam` | `vpsrdoqyuxabadnkizbk` |
| Env file | `.env.development` | `.env.production` |
| Start the app | `npm run start:dev` | `npm run start:prod` |

`expo start` always loads `.env.development`; `start:prod` loads the prod
values first (via dotenv-cli), and Expo never overrides them.

The Supabase CLI links to one project at a time
(`npx supabase link --project-ref <ref>`) — check which before `db push`.

---

## 5. User journey (screens in order)

```
Launch (index)
 ├─ not signed in ─► Welcome ─► Location ─► Onboarding ×3 ─► Email + OTP
 └─ signed in ─────► routeForMe() decides ▼

routeForMe(me):
  banned?                  → Banned
  asked to delete?         → Restore account
  new & no phone?          → Phone number
  not consented?           → Consent
  no city?                 → City
  profile not finished?    → Create profile
  notifications not asked? → Enable notifications
  no live membership?      → Paywall        (admins skip)
  otherwise                → Discover (tabs)
```

- `routeForMe()` and `needsPaywall()` live in `src/lib/routing.ts` and run
  on every launch and after login.
- `resetTo()` clears the back history at sign-in, end of signup and
  log-out, so Back can't return to onboarding while signed in.
- The tabs layout re-checks access and redirects if the membership has
  lapsed.

### Main tabs
| Tab | What it shows |
|---|---|
| Discover | **Nearby** (radar, by distance) or **Citywide** (list, by city). Category chips, Filters sheet, city switcher. |
| Requests | Incoming (accept/decline) and outgoing (withdraw). |
| Chats | One chat per accepted connection; unread dot. |
| Profile | Your profile, verified tick, links to Edit / Saved / Settings. |

---

## 6. Database (Supabase Postgres)

All tables have **row-level security**. The app reads only its own rows;
anything involving other members goes through `security definer`
functions that apply the rules.

### Tables
| Table | Purpose |
|---|---|
| `profiles` | One per member: name, email, phone, DOB, headline, category, bio, offers/looking for, city/area, photo, verification status, settings, `is_admin`, `is_banned`, `deletion_requested_at` |
| `memberships` | Plan per member: `active`, `plan_id` (weekly_99 / monthly_299 / root / granted), `source`, `renews_at` (end date) |
| `business_locations` | The business address + map point. How others find you in Nearby. Private to the owner. |
| `live_locations` | Where your phone was last seen. Only the starting point of **your own** Nearby search; never shown to others. |
| `connection_requests` | Requests with a note; status pending / accepted / declined / withdrawn |
| `connections` | Accepted pairs; each has one chat |
| `messages` | Chat messages |
| `chat_reads` | When each member last read each chat → unread dot |
| `ratings` | Star ratings between connected members |
| `saved_profiles` | Bookmarked members |
| `blocks` | Who blocked whom (hides both ways) |
| `reports` | Reports for admins: fake / inappropriate / spam / harassment / other |
| `notifications` | In-app notifications: request / approved / badge / message |
| `app_settings` | One row: `billing_enabled` switch |
| `bootstrap_accounts` | Emails that become admin/root (and get demo data on dev) when they sign up |
| `pincodes` | Optional pincode → coordinates fallback for addresses |

### Key rules (functions)
| Function | Rule |
|---|---|
| `is_active_member` | Can use the app: not banned, not deleting, profile done, and admin **or** active membership not past `renews_at` |
| `is_listed` | Visible to others: profile done, not banned, not deleting |
| `discover_members` | Nearby = business points within your distance of `search_origin`; Citywide = same city name |
| `search_origin` | Your live GPS if updated in last 12 h, else your business address |
| `choose_plan` | Beta plan pick → active, ends now + 168 h / 30 days |
| `expire_memberships` | Switches off memberships past `renews_at` (scheduled job) |
| `set_my_phone` | Saves a validated 10-digit Indian mobile |
| `canonical_city` + triggers | Stores one spelling per city ("Bangalore" → "Bengaluru") |
| `send/respond/withdraw_connection_request`, `rate_member`, `block_member` | Social actions, each checked |
| `request_account_deletion` / `cancel_account_deletion` | Hide now, delete after 30 days |
| `admin_*` | Admin tools; all call `assert_admin()` |

### Automatic triggers
- **New auth user** → creates `profiles` + `memberships` rows; applies bootstrap.
- **Email confirmed** → profile marked `verified`, "badge" notification.
- **New request / message** → notification for the other member.
- **City saved** → converted to its standard spelling.

### Migrations (run in order by `db push`)
| File | Adds |
|---|---|
| `20260928000000_init.sql` | Whole original schema |
| `20261026000000_email_login.sql` | Email login, bootstrap by email, admin search by email |
| `20261029000000_expire_memberships.sql` | `expire_memberships()` |
| `20261029000001_beta_memberships_and_phone.sql` | Timed beta plans, stricter access check, `set_my_phone` |
| `20261102000000_canonical_cities.sql` | One spelling per city |

### Storage & Realtime
- Bucket `avatars`: one photo per member at `<user id>/avatar.jpg`,
  visible to members, writable only by the owner.
- Realtime is on for `messages`, `connection_requests`, `notifications`;
  `RealtimeBridge` listens and refreshes the right screens.

---

## 7. Edge Functions & scheduled jobs

| Function | Runs | Does |
|---|---|---|
| `purge-deleted-accounts` | Daily 03:00 IST | Permanently deletes accounts 30 days after deletion was requested (photo + auth user) |
| `expire-memberships` | Daily 00:05 IST | Sets `active = false` on memberships past `renews_at` |

Both are called by `pg_cron` (see `supabase/cron_jobs.sql`) and protected
by the `CRON_SECRET` header, not a user login.

---

## 8. Authentication & session

- **Login:** `signInWithOtp({ email })` → 6-digit code by email →
  `verifyOtp({ type: 'email' })`. New emails create the account.
- **Email delivery:** Supabase → Hostinger SMTP. Templates "Confirm sign
  up" and "Magic link or OTP" must contain `{{ .Token }}`.
- **Session:** saved encrypted on the phone (AES key in the secure
  keychain, data in AsyncStorage); refreshed automatically while the app
  is open. Members stay signed in across restarts.
- **Phone login/WhatsApp OTP:** planned for later; database phone
  triggers are kept for it.

---

## 9. Memberships & access

- Plans: `weekly_99` (168 hours) and `monthly_299` (30 days). Prices live
  in `src/services/payments/index.ts`.
- Beta (`app_settings.billing_enabled = false`): picking a plan is free
  but still starts a timed membership.
- Access needs an active membership whose `renews_at` is in the future
  (checked by the app **and** the database). Admins and root never expire.
- Expired → paywall → pick a plan again.

---

## 10. Roles

| Role | How | Can |
|---|---|---|
| Member | Default | Use the app while membership is live |
| Admin | `profiles.is_admin = true` | Admin screen: search members, ban/unban, handle reports, grant memberships, switch billing; never hits the paywall |
| Root | Admin + `plan_id = 'root'` membership with no end date | Same as admin; permanent (Vyaparhood account) |
| Banned | `profiles.is_banned = true` | Sees only the Banned screen; hidden from everyone |

Set up via `supabase/prod/admins_prod.sql`.

---

## 11. Privacy by design

- Other members never see your email, phone, DOB, address or live GPS.
- Distances are shown in ~0.5 km bands unless you turn on exact distance.
- Social handle is shared only with connections.
- Sentry gets only a random user ID — no emails, phones, IPs or locations.

---

## 12. Common tasks

| Task | Command / place |
|---|---|
| Run against dev | `npm run start:dev` |
| Run against prod | `npm run start:prod` |
| Typecheck | `npm run typecheck` |
| Align packages to the Expo SDK | `npm run fix-deps` |
| Push DB changes | `npx supabase@latest db push --linked` |
| Deploy an Edge Function | `npx supabase@latest functions deploy <name> --no-verify-jwt` |
| Add a city | `ALL_CITIES` in `src/config.ts` (+ alias in `normaliseCity` and `canonical_city` if it has other spellings) |
| Change prices | `PLANS` in `src/services/payments/index.ts` |
| Change plan lengths | `plan_period()` in the beta-memberships migration (new migration) |
| Make someone admin | `update public.profiles set is_admin = true where email = '…';` |

---

## 13. Not done yet / known gaps

- Real payments (provider stub only; `billing_enabled` is off).
- Push notifications (permission is asked; no push tokens yet).
- Phone/WhatsApp OTP login.
- Editing your phone number from Settings.
- Sentry DSN and org slug not filled in.
- `cron_jobs.sql` contains a real dev `CRON_SECRET` committed to git —
  rotate it and replace with a placeholder.
