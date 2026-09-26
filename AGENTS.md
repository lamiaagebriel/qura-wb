<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

- **UI**: use shadcn/ui for everything it covers (`pnpm dlx shadcn@latest add <name>`). Preset `b1D3lmam` (`base-mira`), Base UI, RTL on.
- **shadcn files stay as generated.** Any edit to a generated file (even one class) gets a comment right above it starting with `// Updated:` describing the change.
- **Icons**: Hugeicons only, imported from `@/components/icons` — never from `@hugeicons/*` directly. Add new icons to that file. After `shadcn add`, repoint the component's icon imports there (with an `// Updated:` comment).
- **i18n**: `src/lib/i18n` — `getTranslations()` on the server, `useLocale()` on the client. Keys are the English text; add translations to `messages/ar.ts` and `messages/fr.ts`. Use logical classes (`ms-`, `pe-`, `start-`, `text-start`) so RTL works.
- **Font**: Cairo for all locales.
- **DB**: Drizzle + postgres-js. Import `db` from `@/db` (server only). One schema file per domain in `src/db/schema/`, re-exported from its `index.ts`; spread `...id, ...timestamps` from `@/db/helpers`; name columns by key only (snake_case is automatic). Change schema → `pnpm db:generate` → `pnpm db:migrate`. Validate outside ids with `isValidId` (`@/db/helpers`).
- **Env**: read variables only via `env` from `@/lib/env` (zod-validated at startup) — never `process.env` directly. New variable → add it to the schema there and to `.env.example`.
