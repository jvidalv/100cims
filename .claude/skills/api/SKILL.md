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
| `src/api/lib/dates.ts` | Date formatting utilities |

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

### Pagination Pattern

For paginated endpoints, use this pattern for backwards compatibility:

```typescript
// Schema
export const PaginatedItemsSchema = t.Object({
  items: t.Array(ItemSchema),
  pagination: t.Object({
    page: t.Number(),
    pageSize: t.Number(),
    totalItems: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
  }),
});

// Route handler - backwards compatible
const isPaginated = query.page !== undefined || query.limit !== undefined;

if (isPaginated) {
  // Return paginated results with count query
  return { items: results, pagination: { page, pageSize, totalItems, totalPages, hasMore } };
}

// No pagination params = return ALL results (backwards compatible)
return { items: results, pagination: { page: 1, pageSize: results.length, totalItems: results.length, totalPages: 1, hasMore: false } };
```

**Key**: Old clients without pagination params get all results. New clients can paginate.

## Common Tasks

### Add New Endpoint

1. Create schema in `/api/schemas/`
2. Create route file in `/routes/public/` or `/protected/`
3. Import and use in `/routes/index.ts`
4. Mobile app: Run `yarn generate-api-types`

### Database Migration

1. Update `/src/db/schema.ts`
2. Run `yarn drizzle-kit push` (pushes to DB)
3. Verify schema changes in database

### Image Upload to S3

```typescript
import { putImageOnS3, getPublicUrl, getS3Client } from '@/api/routes/@shared/s3';

const key = `${process.env.APP_NAME}/user/avatar/${userId}.jpeg`;
await putImageOnS3(key, buffer);
const imageUrl = getPublicUrl(key); // returns CloudFront URL when AWS_PUBLIC_CDN_URL is set, falls back to raw S3
```

Always use `getS3Client()` rather than constructing a fresh `new S3Client(...)` — keeps credentials in one place. `IMAGE_CACHE_CONTROL` exported from the same module is the canonical `Cache-Control` header for image objects.

For crons that walk the bucket (e.g. backfill / optimize), use `mapWithConcurrency` from `@/api/cron/lib/concurrent` instead of `Promise.all` over a full ListObjectsV2 page — a 1000-item page with sharp transforms and unbounded parallelism will saturate libuv's thread pool and OOM the Railway container. Cap at ~10.

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
