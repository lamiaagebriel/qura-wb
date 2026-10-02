# Qura

Your city, one feed: local businesses you can find, follow and review.
Mobile-first Next.js app (installable, works offline) in English, Arabic and
French. Conventions for working in the code are in [AGENTS.md](AGENTS.md).

**Stack:** Next.js (App Router) · Postgres + Drizzle · Better Auth (Google
sign-in) · shadcn/ui (Base UI) · Playwright.

## Data model

- **`users`**: people who sign in. Private: never shown publicly, except
  as the author of a review.
- **`businesses`**: the only public identity, at `/bs/<username>`. Owned
  by a user (`ownerId`, empty when added for someone else) and added by one
  (`createdById`); both can edit it. Locations, links and hours have their
  own tables.
- **`follows`**, **`reviews`**: a user → a business. One review per user per
  business; you can't review your own.

Reads live in `src/lib/data/`, writes are server actions next to the
screens that use them, and every write re-checks the session and input
(the form's zod schema) and is rate limited.

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
| `pnpm admin <command> <who>` | Verify, suspend or restore a business; suspend or restore a user; make an admin. Run it with no arguments for usage. |
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

**Moderation**: `pnpm admin`, with `DATABASE_URL` pointing at production.
A suspended business is hidden from visitors, search, categories and the
sitemap, but its owner still sees it under My businesses. A suspended user
is signed out everywhere and can't sign in.

**Not built yet:** uploading logos and photos (needs object storage).
Business avatars show their category's icon, and people pick a drawn avatar
or keep their Google photo.
