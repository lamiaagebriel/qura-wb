# Qura

Your city, one feed: local businesses you can find, follow and review.
Mobile-first Next.js app (installable, works offline) in English and
Arabic. Conventions for working in the code are in [AGENTS.md](AGENTS.md).

**Stack:** Next.js (App Router) · Postgres + Drizzle · Better Auth (Google
sign-in) · shadcn/ui (Base UI) · Playwright.

## Data model

17 tables, any standard Postgres. Names people type (businesses, places,
addresses…) are `{ en, ar }` — at least one, each shown in the other
language when missing.

- **Accounts** — `users` (role `member` / `super_admin`; status
  `active` / `suspended` / `deleted`), and Better Auth's `sessions`,
  `accounts`, `verifications`, `rate_limits`. People are never deleted:
  "Delete account" anonymizes them, and what they posted stays.
- **Places** — `places`, a tree with no depth limit (Aswan → Edfu → a
  neighborhood…), each with a kind (`place_types`); `place_admins` look
  after one place each. Posts and branches point at a place and show in it
  and every place above it.
- **Businesses** — `businesses` (the only public identity, at
  `/bs/<username>`; its links and weekly hours are on the row; owned by a
  user, `ownerId`, empty when added for someone else), `business_locations`
  (branches, each in a place), `business_follows`, `business_reviews` (one
  per person per business; never your own).
- **Posts** — `posts`: everything shared in a place (general, questions,
  offers, announcements, alerts…), told apart by `type`, optionally as one of
  your businesses; type-specific fields live in `data` (checked per type by
  `POST_DATA` in `src/lib/posts.ts`). Replies are posts with a `parentId`.
  `post_votes` (helpful / not) and `post_saves` (private bookmarks).
- **`tickets`** — every request and report in one table: asking for a new
  place, to add or remove a place admin, to close or reopen a business;
  reporting a post, review, business or person. Each type is defined once
  (`src/lib/tickets/types.ts`): who may send it, what it's about, its
  fields and who answers it.
- **`history`** — every action (who, what, why) and every change it made
  to any row (before → after), written by `runAction` and a database
  trigger. Votes, saves and sign-in internals are left out; emails and
  secrets are never stored.

Reads live in `src/lib/data/`; writes are server actions next to the
screens that use them, run through `runAction` (one transaction, recorded
in history). Every write re-checks the session and input (the form's zod
schema) and is rate limited.

## Local setup

```bash
pnpm install
docker compose up -d   # Postgres on :5433
cp .env.example .env   # fill in BETTER_AUTH_SECRET and Google OAuth
pnpm db:migrate        # create the tables
pnpm db:seed           # sample businesses, reviewers and the e2e test user
pnpm dev
```

The seed can be re-run safely and refuses to run in production.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on :3000. |
| `pnpm db:generate` | A migration from schema changes (`src/db/schema/`). |
| `pnpm db:migrate` | Apply migrations (uses `DIRECT_URL` when set). |
| `pnpm db:seed` | Sample data (dev / tests only). |
| `pnpm db:reset` | Wipe the database and migrate again (asks first). |
| `pnpm admin <command> <who>` | The same as the dashboard (`/admin`) from a terminal: verify, suspend or restore a business; suspend, restore or anonymize a user; make an admin. Each is recorded in history. Run it with no arguments for usage. |
| `pnpm e2e` | End-to-end tests (see below). |
| `pnpm build:deploy` | Migrate, then build: the production build command. |
| `node scripts/draw-avatars.mjs public/avatars` | Redraw the preset avatars. |

## Tests

`pnpm e2e` runs Playwright on a phone-sized screen (Edge on Windows). It
starts `pnpm dev` or reuses one that's running. Before every run,
`e2e/global-setup.ts` resets the sample businesses and the test user's
data, then re-seeds; other data in your database is left alone.

The reference run is against a production build:

```bash
pnpm build && pnpm start -p 3100
E2E_BASE_URL=http://localhost:3100 pnpm e2e
```

Don't run `pnpm build` while `pnpm dev` is running (they share `.next`).

## Production checklist

**Database**
- A managed Postgres with **daily backups and point-in-time recovery**
  turned on.
- `DATABASE_URL`: the provider's **connection pooler** URL (serverless
  opens many short connections). `DIRECT_URL`: the direct URL, for
  migrations.
- Build with `pnpm build:deploy`: migrations run before the new code goes
  live. Migrations only add things (columns, tables), so the running
  version keeps working while they apply.

**Environment** (validated at startup by `src/lib/env.ts`)
- `APP_URL`: the https:// production URL (http is refused in production).
- `BETTER_AUTH_SECRET`: a fresh value for production
  (`openssl rand -base64 32`), never the dev one.
- Google OAuth: add `${APP_URL}/api/auth/callback/google` as a redirect
  URI and `${APP_URL}` as a JavaScript origin, and **publish** the consent
  screen (out of "Testing", or only test users can sign in).
- `GOOGLE_MAPS_API_KEY` (optional): restrict it to your domain's HTTP
  referrers.

**Releases**
- Changed the service worker's caching, or what saved pages contain? Bump
  `VERSION` in `public/sw.js` so phones drop their old copies.
- Never run `pnpm db:seed` against production (it refuses anyway).

**Moderation**: the dashboard at `/admin` (super admins), or `pnpm admin` with `DATABASE_URL` pointing at production.
A suspended business is hidden from visitors, search, categories and the
sitemap, but its owner still sees it under My businesses. A suspended user
is signed out everywhere and can't sign in.

**Not built yet:** uploading logos and photos (needs object storage).
Business avatars show their category's icon, and people pick a drawn avatar
or keep their Google photo.
