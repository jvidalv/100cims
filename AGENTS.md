# 100cims — project notes for Claude

100cims is a Yarn-workspaces monorepo with two packages: a React-Native mobile
app (`packages/app`) and a Next.js + Elysia backend (`packages/api`). Both ship
to production — the mobile app via EAS Build (App Store / Play Store), the API
via Railway (Docker image; migrations apply on each deploy via the `build`
script `next build && yarn db:migrate`).

## Where the working rules live

Per-package conventions are in skills. **Read the matching skill before editing
a package** — they document patterns, pitfalls, and the codebase-specific
"things that bit us once."

- `.claude/skills/app/SKILL.md` — mobile app (Expo, expo-router, NativeWind,
  React Query, translations, NativeTabs gotchas, BlurredScreenHeader, push,
  location, action sections, share helpers, removing deps safely).
- `.claude/skills/api/SKILL.md` — backend (Elysia routes, JWT, S3, Drizzle
  schema + migrations, the `drizzle-kit push` ban, snake-case identifier rule,
  protected-vs-admin trees, pagination, email, crons, admin UI).
- `.claude/skills/review/SKILL.md` — what to flag in a session-end review.

## Always-required guardrails

These bite every PR if missed, so they live here too rather than only in skills:

### Lint + type-check before commit

Run both for any package touched. Zero lint errors / warnings in files you
modified. Pre-existing errors in files you didn't touch: leave alone.

```bash
yarn app lint && ./node_modules/.bin/tsc --noEmit -p packages/app/tsconfig.json
yarn api lint && ./packages/api/node_modules/.bin/tsc --noEmit -p packages/api/tsconfig.json
```

### Translations (mobile app)

Adding `intl.formatMessage(...)` or `<FormattedMessage>` is step 1. Then:

1. `yarn workspace @100cims/app translations` — extract + compile `en.json`.
2. Copy each new hash into `translations/ca.json` and `translations/es.json`
   in alphabetical order.
3. `grep '"<hash>"' packages/app/translations/*.json` — confirm all four files
   have it.

Shipping English-only strings is a regression: most users run the app in
Catalan or Spanish.

### Database migrations

**Never run `drizzle-kit push`.** It bypasses versioned files and breaks
`db:migrate` on the next deploy. Always use `db:generate` + `db:migrate`.

**Never hand-author files under `packages/api/src/db/drizzle/`.** Use
`yarn api db:generate` (schema change) or `yarn api db:generate --custom --name
<slug>` (pure data change) so the journal stays consistent.

**Hand-written SQL must use snake_case column identifiers.** Drizzle maps TS
`imageUrl` → DB `image_url`; quoting `"imageUrl"` in raw SQL references a
column that doesn't exist and silently breaks every Railway build. Cross-check
new SQL against `information_schema.columns` or an existing migration.

**Always ask the user before applying a migration.** Prepare the file, wait
for approval, then run `yarn api db:migrate` locally. (Production migrations
run automatically on Railway deploy — never tell the user to apply manually
after a push.)

### API backwards compatibility

Mobile clients in the wild can't be force-updated. Every API change must keep
old clients working:

- Don't remove or rename response fields.
- Don't change field types.
- Don't remove endpoints — add a new one and deprecate.
- New required body fields need a default or must be optional.
- Field renames in request bodies must accept both old and new names.

### One file = one API endpoint

Every Elysia handler lives in its own file under
`packages/api/src/api/routes/{public,protected,admin}/<entity>/<verb>.route.ts`.
Each folder has an `index.ts` that composes its routes with a prefix. Don't
add a new endpoint to an existing route file.

## Existing integrations (good to know)

- **Google Sheets logging** (`packages/api/src/api/lib/sheets.ts`) — error
  logs, email signups, user suggestions all append rows to spreadsheet
  `1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs`.
- **AWS S3** for images (avatars, summit photos); CDN URL set via
  `AWS_PUBLIC_CDN_URL`.
- **Discord webhooks** for ad-hoc reporting (errors, contacts, new users) —
  `lib/discord.ts` in the API and `lib/report-error.ts` in the app (the app's
  variant bypasses `apiClient` on purpose so it works when our API is down).
- **OAuth**: Google + Apple validated server-side, JWT issued in response.

## Production URLs

- App API base — `https://fescims.com` (legacy `cims-sempre-amunt.app` 301s here).
- Mobile builds — managed via EAS (`eas build --profile {development,preview,production}`).
