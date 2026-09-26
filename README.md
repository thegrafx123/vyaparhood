# Vyaparhood — clickable prototype (Expo / React Native)

All 33 screens from the design, plus one new screen for manual address entry,
running on sample data. There is no backend and no payment gateway yet; both
are designed to plug in later without rewriting screens.

## Run it on your phone

You need Node.js 20 or newer and the **Expo Go** app on your phone.

```bash
cd vyaparhood
npm install
npx expo install expo@latest      # match the SDK your Expo Go app supports
npx expo install --fix            # align every Expo package to that SDK
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone).
If `npm install` complains about a version, run the two `npx expo install`
commands anyway; they correct versions for you.

To restart the flow from the beginning: Profile → Settings → Log out.

## Screen map

| # | Screen | File |
|---|---|---|
| 01 | Location permission (on launch) | `app/index.tsx` |
| — | Manual address (location denied) | `app/manual-address.tsx` |
| 02/03 | Welcome / "Surat · Live now" | `app/welcome.tsx` |
| 04–06 | Onboarding | `app/onboarding/*` |
| 07 | Phone | `app/auth/phone.tsx` |
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

## Where to change things

- **Colours, sizes, fonts:** `src/theme/tokens.ts`. Colours were sampled from
  the design files; sizes are in design points on the 390 pt frame and scale
  to each phone's width.
- **Switches:** `src/config.ts` — live cities, categories, OTP length (4, per
  the design), `REQUIRE_BUSINESS_PROOF` (false for now), document retention
  (30 days), default distance.
- **Prices:** `src/services/payments/offer.ts` (₹99 first week, ₹500/month).
- **Sample data:** `src/data/sample.ts`.
- **Icons:** all come from `src/components/icons.ts` (lucide). If an icon
  name ever breaks after an update, fix it in that one file.

## Location and privacy

- Foreground only. Background location is never requested and is blocked in
  `app.json`.
- On launch the app takes one location reading, detects the city with the
  phone's built-in geocoder (free, no Google API), and computes an **H3 cell**
  (resolution 8, ≈ 460 m hexagons) on the device — see `src/services/location.ts`.
- `buildLocationPayload()` is what will be sent to the backend: coordinates
  plus H3 cell. Coordinates are stored server-side but **never returned to
  other members**; they only ever receive a distance.
- Members who keep "Show my exact distance" off are shown in rounded 0.5 km
  bands (`~1.5 km`). The radar's direction is decorative, so it never reveals
  where someone is.
- If permission is denied, the manual address screen requires pincode, area
  and city before continuing.

## Adding payments later (Cashfree and/or store billing)

Screens only talk to `src/services/payments`. To go live:

1. Create a provider (e.g. `cashfreeProvider.ts`) that implements
   `PaymentProvider` from `types.ts`.
2. In `purchase()`: ask **your backend** to create the order/subscription,
   open the checkout SDK, then ask the backend to confirm. Return the
   entitlement the backend reports — never trust the app's own result.
3. Change the one line in `src/services/payments/index.ts`.
4. Return a `manageUrl()` so Settings → Membership can open cancellation.

Reminder from our earlier discussion: Apple requires in-app purchase for this
kind of membership on iPhone, and on Android Cashfree must be offered alongside
Google Play Billing (user choice billing). Confirm current store rules before
launch.

## Backend later (PostgreSQL)

Every action in `src/state/AppStore.tsx` maps to one API call. Suggested tables:

```sql
users(id, phone, name, email, dob, city, category, building, bio, verification_status, created_at)
user_locations(user_id PK, lat double precision, lng double precision,
               h3_cell text, source text, updated_at)          -- index on h3_cell
connection_requests(id, from_user, to_user, note varchar(300), status, created_at)
connections(user_a, user_b, created_at)
messages(id, connection_id, sender_id, body, created_at)
documents(id, user_id, kind, storage_path, status, delete_after timestamptz)
reports(id, reporter_id, reported_id, reason, details, created_at)
blocks(blocker_id, blocked_id, created_at)
ratings(rater_id, rated_id, stars, tags text[], note, created_at)
entitlements(user_id, source, plan_id, active, renews_at)
```

Nearby search: take the searcher's H3 cell, compute the ring of cells that
covers the radius (`gridDisk`), fetch users `WHERE h3_cell = ANY(...)`, then
compute exact distances on the server and return only rounded distances.
A daily job deletes documents past `delete_after`.

## Known limits of this prototype

- State is in memory: closing the app resets everything.
- The OTP screen accepts any 4 digits; "Start ₹99 Week" unlocks without charging.
- Fonts are best matches (Baloo 2, Caveat, DM Sans). Send the real font names
  and they're a one-line change in `app/_layout.tsx` and `tokens.ts`.
- Image slots marked "PHOTO GOES HERE" in the design are still placeholders.
