---
name: api
description: Use when working on the backend API (packages/api). Covers Elysia routes, Drizzle ORM, TypeBox schemas, JWT authentication, S3 uploads, Google Sheets logging, and the Next.js hybrid setup.
---

# API Development Guide

You are working on the **100cims API** (`packages/api`), a Next.js + Elysia hybrid backend.

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/api/routes/index.ts` | Elysia app composition, error handling |
| `src/app/api/[[...slugs]]/route.ts` | Next.js catch-all for Elysia |
| `src/db/schema.ts` | Drizzle schema (source of truth) |
| `src/db/index.ts` | Database client |
| `src/api/routes/@shared/jwt.ts` | JWT middleware |
| `src/api/routes/@shared/s3.ts` | S3 upload utilities |
| `src/api/lib/sheets.ts` | Google Sheets logging |
| `drizzle.config.ts` | Database connection config |

## Architecture

### Hybrid Stack

- **Next.js 15** (App Router) for web pages and runtime
- **Elysia 1.4** for API routes (mounted at `/api/*`)
- **Drizzle ORM** with PostgreSQL
- **TypeBox** for schema validation

### Why This Hybrid?

Elysia provides excellent TypeScript inference, OpenAPI generation, and performance while Next.js handles the server runtime and potential web pages.

### Directory Structure

- `/src/api/`: All Elysia API code
  - `/routes/`: Route handlers (public, protected, @shared)
  - `/schemas/`: TypeBox validation schemas
  - `/lib/`: Utilities (sheets, dates, images, slug)
- `/src/db/`: Database schema and client
- `/src/app/`: Next.js pages and API catch-all route

### Shared Utilities

| File | Purpose |
| ---- | ------- |
| `src/api/lib/slug.ts` | `generateSlug()` - URL-friendly slug generation |
| `src/api/lib/images.ts` | `isBase64SizeValid()` - Image size validation |
| `src/api/lib/sheets.ts` | Google Sheets logging utilities |
| `src/lib/format-date.ts` | `formatDate(value)` → `dd/mm/yyyy`, `formatDateTime(value)` → `dd/mm/yyyy HH:mm`. Use these for all admin-page date displays — never raw `toLocaleDateString()` (locale-dependent and inconsistent across the panel). |

## Key Patterns

### Route Organization

```
/api/routes/
├── @shared/          # Middleware, JWT, S3, types
├── public/           # No auth required
│   ├── mountains.route.ts
│   ├── challenge.route.ts
│   └── hiscores.route.ts
├── protected/        # JWT required
│   ├── summit.route.ts
│   ├── user.route.ts
│   ├── plan.route.ts
│   ├── mountains/    # Folder-based organization
│   │   ├── index.ts
│   │   ├── my-list.route.ts
│   │   └── update.route.ts
│   └── community-challenge/
│       ├── index.ts
│       ├── create.route.ts
│       ├── update.route.ts
│       └── delete.route.ts
└── index.ts          # Compose all routes
```

**Folder-based routes**: Group related endpoints in folders with an `index.ts` that composes them with a prefix. Each endpoint gets its own file.

### Creating Routes

```typescript
import { Elysia } from 'elysia';
import { db } from '@/db';
import { userSchema } from '@/api/schemas';

export const userRoute = new Elysia({ prefix: '/user', tags: ['users'] })
  .get('/:id', async ({ params }) => {
    const user = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, params.id)
    });
    return user;
  }, {
    detail: { summary: 'Get user by ID' },
    params: userSchema.params,
    response: userSchema.response
  });
```

### Protected Routes

```typescript
import { jwt } from '@/api/routes/@shared/jwt';
import { store } from '@/api/routes/@shared/store';

export const summitRoute = new Elysia({ prefix: '/summit', tags: ['summits'] })
  .use(jwt)
  .use(store)
  .derive(async ({ bearer, store }) => {
    const payload = await bearer(bearer);
    store.userId = payload.userId;
  })
  .post('/', async ({ body, store }) => {
    // store.userId available from JWT
    const summit = await db.insert(summitTable).values({
      userId: store.userId,
      mountainId: body.mountainId
    });
    return summit;
  });
```

### Database Queries

```typescript
import { db } from '@/db';
import { user, summit, mountain } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// Simple query
const users = await db.select().from(user).where(eq(user.id, userId));

// Join query
const summits = await db
  .select({
    id: summit.id,
    mountainName: mountain.name,
    date: summit.createdAt
  })
  .from(summit)
  .leftJoin(mountain, eq(summit.mountainId, mountain.id))
  .where(eq(summit.userId, userId))
  .orderBy(desc(summit.createdAt));
```

**Postgres `date_trunc` GROUP BY gotcha:** the bucket arg (`'day'`/`'week'`/`'month'`) must be inlined as a SQL literal, not a parameter — otherwise Postgres reports the SELECT column "must appear in GROUP BY" because parameterized expressions don't match. Use `sql.raw` for the bucket only, never for user input:

```typescript
// bucket is a closed union from your own code, never user input
const bucketExpr = sql<string>`to_char(date_trunc(${sql.raw(`'${bucket}'`)}, ${dateCol}), 'YYYY-MM-DD')`;
await db.select({ date: bucketExpr, count: sql<number>`count(*)::int` })
  .from(table).groupBy(bucketExpr).orderBy(bucketExpr);
```

**Eden client deserializes ISO date strings into `Date` instances**, even when the backend schema declares `t.String()`. A field returned as `"2025-04-13"` from `to_char(...)` arrives in the browser as a `Date`, not a string. Don't trust the inferred response type when the value looks date-like — normalise at the boundary:

```typescript
const toIsoDate = (value: string | Date): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
```

This bites Recharts users in particular: `<XAxis dataKey="date">` works on Date objects (auto-stringified), but `<ReferenceLine x="2025-04-13">` won't match a Date-typed category. Pre-process the data into string-shaped points before handing it to the chart.

### Schema Validation

```typescript
import { t } from 'elysia';

export const summitSchema = {
  body: t.Object({
    mountainId: t.String(),
    date: t.Optional(t.String()),
    image: t.Optional(t.String())
  }),
  response: {
    200: t.Object({
      id: t.String(),
      mountainId: t.String(),
      userId: t.String()
    })
  }
};
```

**Derive client body types from TypeBox schemas — never hand-roll mirrors.** The admin React Query hooks need TS types for their mutation bodies; instead of duplicating them, use `Static<typeof X>`:

```typescript
import type { Static } from "elysia";
import type { AdminMerchUpdateBodySchema } from "@/api/schemas/admin.schema";
export type AdminMerchUpdateBody = Static<typeof AdminMerchUpdateBodySchema>;
```

The schema constant must be `import type { ... }` only — that erases at runtime, so TypeBox is not bundled into the Next.js client. Schema files must have no top-level side effects (the existing ones don't).

### Pagination Pattern

The `{items, pagination: {page, pageSize, totalItems, totalPages, hasMore}}` shape is centralized as a schema factory in `packages/api/src/api/schemas/common.schema.ts`:

```typescript
import { PaginatedSchema } from "@/api/schemas/common.schema";

export const PaginatedItemsSchema = PaginatedSchema(ItemSchema);
```

**Two backwards-compatible options when adding pagination to an existing route:**

1. **In-place with `t.Union`** (used by `/api/public/hiscores/all`): the route returns either the raw array (old shape) or the paginated wrapper depending on whether `page`/`limit` is present. Schema is `t.Union([ArraySchema, PaginatedSchema(...)])`. Keep this when you want one URL and don't mind the union response.

2. **New endpoint, legacy stays put** (used by `/api/public/plans/all-paginated`): create a new file `<name>-paginated.get.ts` with a clean paginated-only schema. Add `@deprecated` to the old file's header but DO NOT change its behavior. Cleaner contract per route, no union schemas, easier to grep "still on the old endpoint?". Prefer this for new work.

In both cases:
- `count()` query and the page select in the same `Promise.all` to halve wall time.
- For follow-up "hydration" queries (e.g. fetching child rows for the page), short-circuit when `planIds.length === 0` and group results into a `Map<parentId, child[]>` — avoids O(n²) `.filter()` over each parent.
- Cap `limit` server-side (`Math.min(query.limit ?? DEFAULT, MAX_PAGE_SIZE)`) so a malicious or buggy client can't request 100k rows.

## Common Tasks

### Add New Endpoint

1. Create schema in `/api/schemas/`
2. Create route file in `/routes/public/` or `/protected/`
3. Import and use in `/routes/index.ts`
4. Mobile app: Run `yarn generate-api-types`

### Database Migration

**CRITICAL — always ask the user before applying a migration.** Prepare the migration file locally and wait for explicit approval before running `db:migrate`. Never run schema-altering commands autonomously.

1. Update `packages/api/src/db/schema.ts`.
2. Run `yarn api db:generate` to produce a versioned SQL file under `packages/api/src/db/drizzle/NNNN_*.sql`.
3. Review and, if needed, append custom SQL (e.g. data backfills) to the generated file.
4. **Ask the user** before running `yarn api db:migrate`.
5. Verify in `psql` after the user applies it.

Do **not** use `drizzle-kit push`: the command has been removed from the repo because it bypasses the versioned migration files, silently drops any custom SQL (backfills, CHECK edits, data transforms), and leaves the DB out of sync with the migration history — which then blocks future `db:migrate` runs.

### Image Upload to S3

```typescript
import { putImageOnS3, getPublicUrl, getS3Client } from '@/api/routes/@shared/s3';

const key = `${process.env.APP_NAME}/user/avatar/${userId}.jpeg`;
await putImageOnS3(key, buffer);
const imageUrl = getPublicUrl(key); // returns CloudFront URL when AWS_PUBLIC_CDN_URL is set, falls back to raw S3
```

Always use `getS3Client()` rather than constructing a fresh `new S3Client(...)` — keeps credentials in one place. `IMAGE_CACHE_CONTROL` exported from the same module is the canonical `Cache-Control` header for image objects.

For crons that walk the bucket (e.g. backfill / optimize), use `mapWithConcurrency` from `@/api/cron/lib/concurrent` instead of `Promise.all` over a full ListObjectsV2 page — a 1000-item page with sharp transforms and unbounded parallelism will saturate libuv's thread pool and OOM the Railway container. Cap at ~10.

**For S3 + DB writes that share an id**, generate the id (`uuidv7()`) upfront and use it both as the DB primary key AND in the S3 key. Upload to S3 first, then INSERT once. Avoids the orphan-row failure mode where the row exists but its `imageUrl(s)` are empty because S3 failed mid-flow. See `admin.merch-create.post.ts` for the pattern.

### Log to Google Sheets

```typescript
import { addRowToSheets, ERRORS_SPREADSHEET } from '@/api/lib/sheets';

await addRowToSheets(ERRORS_SPREADSHEET, [
  'error_type',
  'status_code',
  'url',
  'message'
]);
```

### Send Push Notification

```typescript
import { sendPushLocalized } from '@/api/lib/push';
import { pushPlanJoined } from '@/api/lib/push-translations';
import { PUSH_TYPE, getUserDisplayName } from '@/api/lib/push-types';

void sendPushLocalized(
  [recipientUserId],
  (locale) => ({ title: planTitle, body: pushPlanJoined(locale, getUserDisplayName(user)) }),
  { type: PUSH_TYPE.PLAN_JOIN, planId },
);
```

- `sendPushLocalized` is fire-and-forget: it reads `userTable.locale` per recipient, batches up to 100 per Expo call, posts batches in parallel, and nulls out `expoPushToken` on `DeviceNotRegistered` tickets. Callers prefix with `void` — don't block the response.
- Add new copy in `api/lib/push-translations.ts` (en/ca/es). New event types go in `PUSH_TYPE` at `api/lib/push-types.ts`; the app's tap-routing whitelist must be kept in sync.
- Users with `pushNotificationsEnabled = false` or null `expoPushToken` are filtered automatically.
- Set `EXPO_ACCESS_TOKEN` env var to enable Expo's Enhanced Push Security.

### Send Email (Resend + react-email)

```typescript
import { sendWelcomeEmail } from '@/api/lib/email';

// Fire-and-forget — gated to NODE_ENV === "production".
// Mints a per-recipient unsubscribe JWT, attaches the RFC List-Unsubscribe
// headers automatically, and renders the template via @react-email.
void sendWelcomeEmail({ id: user.id, email: user.email, firstName, locale });
```

- **Dev safety gate**: every `send*Email` short-circuits unless `NODE_ENV === "production"`. Only the admin "Send test" button bypasses (via `sendRenderedEmail({...}, { force: true })`). Setting `RESEND_API_KEY` in dev does **not** unblock sends — the gate is positive-assertion on purpose.
- **Templates** live in `packages/api/emails/*.tsx`, all use `<Tailwind>` from `@react-email/components` (no separate config). Logo header references `https://cims-sempre-amunt.app/emails/logo-on-black.png` (committed under `public/emails/`; pre-flattened by `scripts/build-email-assets.ts`).
- **Footer** is the shared `<EmailFooter>` component (`emails/_components/footer.tsx`) — provides home link, Apple/Google store badges, and the unsubscribe link. New templates must use it.
- **Unsubscribe** is a stateless JWT signed with `AUTH_SECRET` via `jose` (`api/lib/email-tokens.ts`). The senders mint a token per recipient, embed it in the email, and ship `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers so Gmail / Apple Mail show a native unsubscribe button. Public routes `/api/public/{unsubscribe,resubscribe}` and the public Next.js `/unsubscribe?token=...` page handle the click.
- **Translations**: copy lives inline in each template (en/ca/es records). Don't plumb through `next-intl` — that's for the admin/marketing UI; emails render in Node.

## Admin UI conventions

- **Border radius**: the admin panel uses plain `rounded` (4px, `--radius = 0.25rem`) as the upper bound. Don't use `rounded-md` / `rounded-lg` / `rounded-xl` — a sweep was done to standardise. `rounded-full` is fine for circular elements (avatars, pills), and `rounded-sm` for smaller spots. The marketing/SEO pages (`app/100cims/`, `app/challenges/`, `app/page.tsx`, etc.) intentionally opt out of this rule.
- **Dark background**: `--background`, `--card`, `--popover` in `.dark` are pure black (`0 0% 0%`) — don't soften to `0 0% 3.9%`.
- **Date display**: always use `formatDate(value)` / `formatDateTime(value)` from `@/lib/format-date` (dd/mm/yyyy). Never raw `toLocaleDateString()`.

## Marketing / SEO Pages (Next.js)

Public-facing pages live under `src/app/`. Root layout is English. Canonical site URL: `SITE_URL` constant in `src/lib/app-links.ts`.

- **Subdirectory i18n routing** (`/[locale]/...`): wired with `next-intl/middleware`. Three locales (`en | ca | es`) live under `src/app/[locale]/` (currently: home, `/shop`, `/shop/[slug]`). `src/middleware.ts` redirects unprefixed URLs (`/`, `/shop`, …) to the visitor's best-match locale; the matcher excludes `/api`, `/admin`, legacy single-locale pages, `/deeplink`, and static assets. Routing config in `src/i18n/routing.ts` exports `routing` + `SUPPORTED_LOCALES` — single source of truth, don't hardcode locale arrays.
- **Per-page setup** (inside `[locale]/`): `params: Promise<{ locale: string }>`, call `setRequestLocale(asAppLocale(localeRaw))`, return `routing.locales.map(l => ({ locale: l }))` from `generateStaticParams`. Pages then render statically per locale at build time.
- **hreflang + canonical**: `src/lib/hreflang.ts` exports `getLocalizedAlternates(locale, path)` returning `{ canonical, languages }` for `metadata.alternates`. Plug into every locale-prefixed page's `generateMetadata`.
- **Language switcher**: `src/components/language-switcher.tsx` is a client component using Radix dropdown + CSS-gradient flag circles. The switcher sits inside `<SiteFooter>` when its optional `locale` prop is set.
- **Fixed-locale legacy pages** (`/100cims`, `/challenges/[slug]`): hand-crafted SEO assets in one language each. They live OUTSIDE the `[locale]/` tree, use `createTranslator({ locale, messages, namespace })` directly, and call `<SiteFooter>` without the `locale` prop (footer falls back to unprefixed `/`, `/shop` hrefs which the middleware then redirects).
- **Locale type**: `AppLocale` in `src/api/lib/locale.ts` is the single source of truth. `ChallengeLocale` re-exports it. `routing.locales` is the single runtime list. Don't redefine `"ca" | "es" | "en"` inline anywhere.
- **Shared footer**: `src/components/site-footer.tsx` — accepts pre-resolved `SiteFooterStrings` (not a translator, because next-intl's translator type narrows to the consumer's namespace and rejects a generic prop type).
- **SEO primitives in place**: `src/app/sitemap.ts` (MetadataRoute.Sitemap) and `src/app/robots.ts` (MetadataRoute.Robots). Add new pages to `sitemap.ts` manually.
- **Server-side caching**: we default to **fully static** pages for marketing content (no `export const revalidate`). Stats and featured-peaks selection snapshot at build time; redeploy to refresh. Only opt into ISR if a page must change between deploys.
- **JSON-LD**: inject via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />`. Safe with `JSON.stringify` + trusted data.
- **Public stats helper**: `src/api/lib/public-stats.ts` returns `{ totalUsers, totalSummits, totalMountains, essentialMountainCount }` via 4 parallel COUNT(*) queries.

### Templated per-challenge pages (`/challenges/[challengeSlug]`)

Pattern for SEO landing pages that scale across N items with per-item hand-written copy:
- **Content registry** at `src/app/challenges/content/` — one JSON per item + `index.ts` registry with runtime `narrow()` validation against the `ChallengeContent` type. `isOfficialSlug()` guard narrows `string` to the registry keys.
- **Fully static**: `generateStaticParams()` returns one entry per registry key, `dynamicParams = false` so unknown slugs 404 at build time. Adding a new item requires a redeploy.
- **Template components** live at `src/app/challenges/_components/` — pure props, no hardcoded locale. Accept a `ChallengeLocale` prop and fetch their own translator via `getChallengeTemplateTranslator(locale)` from `src/lib/locale-dictionaries.ts`.
- **DB helpers** in `src/lib/challenge-helpers.ts`: `getOfficialChallengeBySlug` (Promise.all of 3 queries), `getFeaturedPeaksForChallenge` (by id) and `…ForChallengeSlug` (by slug, for convenience).
- **Shared footer strings**: `src/app/challenges/_components/build-footer-strings.ts` exports `buildFooterStrings(locale)` returning a `SiteFooterStrings`. The home page and `/100cims` use it too — single source of truth for the 14-key footer mapping.
- **Hero image LCP**: above-the-fold `<img>` takes `fetchPriority="high"`.

### Templated per-product pages (`/shop/[slug]`)

- **Content in DB**: merch is fully DB-driven (no per-product JSON). `src/lib/merch-helpers.ts` exports `getActiveMerch()` and `getMerchBySlug()` — both wrapped in `React.cache()` so `generateStaticParams` + `generateMetadata` + the page body share a single round-trip per slug.
- **Per-locale fields**: `src/lib/merch-format.ts` exposes `localizeMerch(row, locale)` (picks `nameCa | nameEs | nameEn` etc.) and `formatPrice(euros, locale)` (note: the DB stores whole euros, not cents).
- **Buy flow**: unauthenticated visitors aren't on the JWT track. The client `MerchRequestForm` POSTs to `/api/public/contact` with a formatted `[MERCH REQUEST] …` message — reuses the existing Discord webhook pipeline.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: JWT signing secret
- `AWS_*`: S3 credentials (region, bucket, access keys)
- `SHEETS_*`: Google service account credentials
- `APP_NAME`: Application name (used in S3 paths)
- `EXPO_ACCESS_TOKEN`: Optional; forwarded as Bearer to Expo push API when Enhanced Security is on

See `.env.example` for complete list.

## Swagger Documentation

Available at `/api/swagger` during development. Auto-generated from:
- Route tags
- TypeBox schemas
- OpenAPI metadata in route definitions

## Database Schema

See `/src/db/schema.ts` for full schema. Key tables:
- `user`: OAuth accounts
- `mountain`: Peak data (name, lat/lng, elevation, difficulty)
- `summit`: User summit logs
- `plan`: Group hiking plans
- `plan_attendee`: Plan participants
- `plan_chat`: Chat messages
- `challenge`: Curated challenges
- `hiscores`: Leaderboard

## Error Handling

Global error handler in `/routes/index.ts`:
- Logs all errors to Google Sheets
- Returns appropriate HTTP status codes
- Distinguishes ValidationError, ParseError, generic errors

## Deployment

Vercel (configured in root `vercel.json`):
- Builds from `packages/api`
- Environment variables set in Vercel dashboard
- Automatic deployments on main branch
