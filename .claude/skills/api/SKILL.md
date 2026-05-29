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
| `src/api/lib/discord.ts` | `sendDiscordEmbed(webhookUrl, embed)` — fire-and-forget POST to a Discord webhook. Fires only in production. Use `DISCORD_COLOR.{RED,YELLOW,BLURPLE}` for the `color` field. Embed supports `image: { url }` to render inline. Three webhook URL env vars: `DISCORD_NEW_USER_WEBHOOK_URL`, `DISCORD_ERRORS_WEBHOOK_URL`, `DISCORD_CONTACT_WEBHOOK_URL` — the contact one is the dumping ground for user-triggered reports/contacts. |
| `src/lib/format-date.ts` | `formatDate(value)` → `dd/mm/yyyy`, `formatDateTime(value)` → `dd/mm/yyyy HH:mm`. Use these for all admin-page date displays — never raw `toLocaleDateString()` (locale-dependent and inconsistent across the panel). |

## Key Patterns

### Route Organization

```
/api/routes/
├── @shared/          # Middleware, JWT, S3, types
├── public/           # No auth required
├── protected/        # JWT bearer auth (mobile app)
│   ├── user/
│   ├── mountains/
│   ├── summit/
│   ├── plans/
│   ├── community-challenge/
│   └── admin/        # JWT + user.admin guard (mobile admin actions)
├── admin/            # NextAuth session auth (web backoffice only)
└── index.ts          # Compose all routes
```

**Folder-based routes**: Group related endpoints in folders with an `index.ts` that composes them with a prefix. Each endpoint gets its own file.

**🚫 TWO different admin route trees — never confuse them:**

| Path prefix | Auth method | Consumed by |
|---|---|---|
| `/api/protected/admin/*` | JWT bearer token (same as all `/protected/*` routes) + `user.admin` check | **Mobile app** — the `apiClient` in `packages/app` sends the JWT bearer |
| `/api/admin/*` | NextAuth session cookie | **Web admin panel** (`packages/api/src/app/admin/`) — browser-only, uses `fetch` with cookies |

When creating an admin action that the **mobile app** needs to call (e.g. delete summit, reset image), it MUST go under `/api/protected/admin/`. The mobile app has no NextAuth session and cannot call `/api/admin/*` routes — those requests will silently fail with 401.

Never use `/api/admin/*` paths in `packages/app/domains/` hooks. If you see an `apiClient.POST("/api/admin/...")` in mobile code, it's a bug.

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

### Public routes with optional auth

Public routes that need the viewer's id (e.g. to filter out records the caller can't see) use the `optional-auth` helpers from `@/api/routes/@shared/optional-auth.ts` + `.use(JWT())`. Two variants:

- `getOptionalUser(jwt, token)` — returns `{ id, activeChallengeId }` or `null`. Issues a `SELECT` on the user table. Use only when you need `activeChallengeId` or confirmation the user still exists.
- `getOptionalUserId(jwt, token)` — returns `string | undefined`. Verifies the JWT only, no DB hit. **Prefer this when all you need is `viewer.id` for authz filters** — e.g. `plan.all.get.ts`, `plan.one.get.ts`. Avoids an extra round-trip on every hit.

Both return the "anonymous" value on missing / invalid tokens so the endpoint stays usable without auth.

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

**Transactional helpers take a `DbOrTx` executor.** When a helper may be called standalone *or* inside a caller's `db.transaction(async (tx) => ...)`, accept the executor as a parameter so the work joins the same transaction:

```typescript
import { db, type DbOrTx } from "@/db";

export const recalcSomething = async (id: string, executor: DbOrTx = db) => {
  // uses executor like db — queries auto-join the tx when one is passed
};
```

The alias is defined once in `src/db/index.ts` (`typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]`). Don't re-derive it inline.

**Denormalized aggregates on a parent row.** When a child table (e.g. `mountainRatingTable`) has cheap-to-query aggregates that many read paths need (`AVG`, `COUNT`), cache them as columns on the parent (`mountain.avgFamilyFriendly`, `familyRatingCount`, etc.) instead of joining on every read. The pattern:

- Columns on the parent — nullable `avg`, `integer notNull default 0` for `count`.
- One helper in `api/lib/<parent>-ratings.ts` (or similar) exporting `recalc<Thing>Aggregates(id, executor?)`.
- Every create / update / delete on the child table calls the helper inside its transaction. Missing one call = silent drift, so route all writes through wrapper helpers if you have more than a handful.
- The helper issues one `AVG/COUNT` SELECT then one `UPDATE` on the parent; safe to call synchronously.

See `packages/api/src/api/lib/mountain-ratings.ts` for the canonical example.

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

### Shared enums: two modules

String-enum columns (plan status, coupon discount type, etc.) are declared once, in two layered modules, and reused everywhere:

- `packages/api/src/db/enums.ts` — the const tuple (`PLAN_STATUSES`) and derived type (`PlanStatus = (typeof PLAN_STATUSES)[number]`). **Zero framework imports** so the DB layer stays pure and drizzle-kit's schema parsing never touches Elysia.
- `packages/api/src/api/schemas/enums.ts` — the TypeBox validator (`PlanStatusSchema = t.Union([t.Literal(...)])`). Imports `t` from Elysia.

Consumers pick the module that matches their layer: `db/schema.ts` uses `$type<PlanStatus>()` from `db/enums`; route bodies/queries/responses compose `PlanStatusSchema` from `api/schemas/enums`; handlers narrow with `PlanStatus`. **Never declare these inline in a route or schema file** — duplicate declarations drift. If you're tightening a previously-loose `t.String()` on a request, also delete any `as unknown as ...` casts downstream; they only existed to paper over the missing validation.

**Spell the union as a literal-tuple, not `t.Union(arr.map(t.Literal))`.** `t.Union([t.Literal("a"), t.Literal("b")])` infers as `TUnion<[TLiteral<"a">, TLiteral<"b">]>` and the column type stays `"a" | "b"`. `t.Union(ENUM.map((v) => t.Literal(v)))` collapses to `TUnion<TLiteral<string>[]>` and the static type widens to `string`, which then mismatches handler return types and triggers Elysia's `Response`-fallback type error (the cryptic "Type '{...}' is missing properties from type 'Response'"). Yes, this means duplicating the values — that's the cost of keeping inference narrow.

### User privacy: schema split + explicit SELECT

Two response schemas in `src/api/schemas/user.schema.ts` bound by purpose:

- **`UserSchema`** — public shape. What one user can see about another. No private fields.
- **`MeSchema = t.Intersect([UserSchema, t.Object({ phoneNumber, ... })])`** — owner-only shape. Used by `GET /api/protected/user/me` and `GET /api/admin/me`. **Never** plug this into a route anyone-can-read.

Private fields (phone, future SMS/address) go on `MeSchema`. Adding one to `UserSchema` leaks it via the public `/api/public/user/one` endpoint.

The **SQL side has to cooperate** — routes that touch the `user` table **must not** use bare `db.select().from(userTable)`. TypeBox strips fields outside the response schema, but that's a defense layer, not a primary one. Enumerate columns at the query site so a future `...user` spread into some response can't leak anything that schema hasn't sanctioned:

```ts
// ✅ Explicit columns — intent visible, shape can't drift
const [user] = await db
  .select({
    id: userTable.id,
    email: userTable.email,
    firstName: userTable.firstName,
    // ... only what UserSchema / MeSchema declares
  })
  .from(userTable)
  .where(eq(userTable.id, id));

// ❌ Never on user queries — returns phoneNumber, expoPushToken, etc.
const [user] = await db.select().from(userTable);
```

This rule applies to the auth middleware too (`src/api/routes/protected/index.ts`) — the request-context `user` is spread into `/me`'s response, so the query feeding the context must declare each column explicitly.

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

The headline rules — never `drizzle-kit push`, never hand-author files in
`drizzle/`, always ask the user before applying, snake_case identifiers in
custom SQL — are in `AGENTS.md`. Operational details specific to this codebase:

- **drizzle.config.ts sets `casing: "snake_case"`**, so columns use the bare
  form `foo: integer()` / `bar: text()` and the DB column is auto-derived
  (`foo`, `bar`). Don't pass an explicit snake_case name argument like
  `integer("foo")` — it duplicates the default and drifts from convention.
- **Schema change flow**: edit `src/db/schema.ts` → `yarn api db:generate
  --name <slug>` → review/augment the generated SQL → ask user → `yarn api
  db:migrate`.
- **Pure data migrations** (backfills, renames, deletes with no schema diff):
  `yarn api db:generate --custom --name <slug>` produces an empty file
  pre-registered in the journal.
- **Cross-check custom SQL** against an existing migration (`0001_seed-data.sql`,
  `0012_grant_josep_admin.sql`) or `information_schema.columns WHERE table_name
  = '<table>'` before writing — drizzle-kit hides PG errors and exits with just
  `error Command failed with exit code 1.`, which silently breaks Railway
  builds until reverted.

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

- `sendPushLocalized` is fire-and-forget: it reads `userTable.locale` per recipient, batches up to 100 per Expo call, posts batches in parallel, and nulls out `expoPushToken` on `DeviceNotRegistered` tickets. **In HTTP handlers, prefix with `void`** so the response isn't blocked. **In a cron**, `await Promise.allSettled([...])` instead — otherwise rejections become unhandled, the cron log fires before pushes actually send, and in-flight batches are dropped if Railway restarts the process.
- Add new copy in `api/lib/push-translations.ts` (en/ca/es). New event types go in `PUSH_TYPE` at `api/lib/push-types.ts`; the app's tap-routing whitelist (`isPlanPushType` / the other type checks in `packages/app/domains/user/push.api.ts`) must be kept in sync.
- Users with `pushNotificationsEnabled = false` or null `expoPushToken` are filtered automatically.
- Set `EXPO_ACCESS_TOKEN` env var to enable Expo's Enhanced Push Security.
- **Fan-out (many-recipient) sends**: extract the logic into `api/lib/<feature>-notify.ts` (see `plan-saved-mountain-notify.ts` for the canonical shape) and wrap the body in `try/catch` with `console.error("[<feature>] failed:", err)`. `sendPushLocalized`'s internal try/catch only protects its own body — the DB query and dedupe/group logic that runs *before* the send are not covered, so a `void`'d helper that throws pre-send becomes an unhandled rejection.

### Add New Cron

Crons use Elysia's `@elysiajs/cron` plugin, assembled in `packages/api/src/api/cron/index.ts` and listed in `packages/api/src/api/cron/cron.registry.ts`. To add one:

1. Create `packages/api/src/api/cron/<name>.ts` exporting an `async function`. Log a one-line summary at the end so `/admin/crons` output is legible.
2. Import it in `cron.registry.ts` and append an entry to `CRON_REGISTRY` with a 6-field cron pattern (`"second minute hour day month weekday"`, UTC) and a one-sentence description.
3. Restart the API — the admin crons page auto-discovers it and exposes a Trigger button backed by `POST /api/admin/crons/:name/trigger`, which is the fastest way to smoke-test without waiting for the schedule.

Patterns in existing crons worth mirroring: UTC-only schedules (no TZ env var is set), `status` filters against `planTable`/similar to avoid re-acting on rows a sibling cron already processed, and `Promise.allSettled` for fan-out work so one failure doesn't abort the rest.

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
- **Date display**: always use `formatDate(value)` / `formatDateTime(value)` from `@/lib/format-date` (dd/mm/yyyy). Never raw `toLocaleDateString()`. For populating `<input type="date">` (which silently rejects full ISO timestamps), use `toDateInputValue(value)` from the same module — it normalises both `Date` instances and ISO strings to the `YYYY-MM-DD` prefix the input expects.
- **Admin-local helpers** live under `src/app/admin/_lib/`. Reusable pieces today: `fileToBase64` (image picker pre-upload encoding, used by merch form + new-plan form), `SearchPicker<T>` (debounced typeahead — search input + dropdown of results, designed for shadcn-styled admin forms; takes a `useResults(q)` hook prop pointing at a paginated `useAdminX` query), and `useMountainSearch` (the canonical `SearchPicker` adapter for the mountain table — gates on non-empty query, returns `{ items, isLoading }`). When you need a typeahead, use `SearchPicker` rather than rolling debounce + dropdown again. For mountain pickers, import `useMountainSearch` directly. For other tables, write a similar one-liner adapter calling `useAdminX(..., { enabled: q.trim().length > 0 })` so the picker doesn't fire empty-query fetches on mount.

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
- **Error pages**: with `localePrefix: "always"` we need THREE error files. `src/app/[locale]/not-found.tsx` + `src/app/[locale]/error.tsx` handle anything thrown inside the locale tree (use `next-intl` translations, `error-page` namespace in `messages/*.json`). `src/app/not-found.tsx` is the root fallback for paths that never match the locale prefix — hardcoded EN, no i18n context available. `src/app/global-error.tsx` catches root-layout failures and must render its own `<html><body>` + import `./globals.css`. All three compose `src/components/error-layout.tsx` (CSS gradient only — don't pull remote CDN images, they can be the very thing that's broken).

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

Railway (built from `packages/api/Dockerfile`):
- Docker image built and deployed on every push to `main`
- Environment variables set in the Railway service dashboard
- Both `cims-sempre-amunt.app` and `fescims.com` are attached to the same service
- Rollback via Railway Deployments tab
