# API - AI Development Guide

> **Part of the 100cims monorepo.** See the [root CLAUDE.md](../../CLAUDE.md) for overall architecture.

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
  - `/lib/`: Utilities (sheets, dates, images)
- `/src/db/`: Database schema and client
- `/src/app/`: Next.js pages and API catch-all route

## Key Patterns

### Route Organization
```
/api/routes/
├── @shared/          # Middleware, JWT, S3, types
├── public/           # No auth required
│   ├── mountain.route.ts
│   ├── challenge.route.ts
│   └── hiscores.route.ts
├── protected/        # JWT required
│   ├── summit.route.ts
│   ├── user.route.ts
│   └── plan.route.ts
└── index.ts          # Compose all routes
```

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
import { putImageOnS3 } from '@/api/routes/@shared/s3';

const key = `${process.env.APP_NAME}/user/avatar/${userId}.jpeg`;
await putImageOnS3(key, buffer);
```

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

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: JWT signing secret
- `AWS_*`: S3 credentials (region, bucket, access keys)
- `SHEETS_*`: Google service account credentials
- `APP_NAME`: Application name (used in S3 paths)

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
