# 100cims API

> **Part of the 100cims monorepo.** See the [root README](../../README.md) for an overview of the full project structure.

The backend API for Cims, built with Next.js 15 and Elysia.

## 🏗️ Architecture

This is a **hybrid Next.js + Elysia application**:

- **Next.js 15** (App Router) serves web pages and provides the runtime
- **Elysia 1.4** handles all API routes via a catch-all Next.js route handler
- API is mounted at `/api/*` and handled by Elysia
- OpenAPI/Swagger documentation auto-generated at `/api/swagger`

### Why Elysia?

Elysia is a fast, type-safe TypeScript API framework with excellent OpenAPI support. It provides:
- Automatic type inference from schemas
- Built-in validation with TypeBox
- OpenAPI spec generation
- JWT authentication plugin
- Better performance than traditional Next.js API routes

## 🛠️ Tech Stack

- **Next.js 15** - React framework (App Router)
- **Elysia 1.4** - TypeScript API framework
- **Drizzle ORM 0.44** - Type-safe SQL toolkit
- **PostgreSQL** - Primary database
- **TypeBox** - Runtime type validation
- **JWT** - Authentication tokens
- **AWS S3** - Image storage (avatars, summit photos)
- **Google Sheets API** - Logging (errors, suggestions, signups)
- **Next Intl** - Internationalization (en, ca, es)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- AWS S3 bucket (for images)
- Google Cloud service account (for Sheets logging)

### Installation

From the **monorepo root**:

```bash
# Install dependencies
yarn install

# Set up environment variables
cp packages/api/.env.example packages/api/.env.local
# Edit .env.local with your values

# Start development server
yarn dev:api
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger docs**: http://localhost:3000/api/swagger

## 🌐 Environment Variables

See [`.env.example`](./.env.example) for a complete list of required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - JWT signing secret
- `AWS_*` - S3 credentials for image uploads
- `SHEETS_*` - Google service account for logging

## 🗄️ Database Setup

This project uses **Drizzle ORM** with PostgreSQL.

### Schema Overview

The database includes these main tables:
- `user` - User accounts (Google/Apple OAuth)
- `mountain` - Mountain data (peaks, locations, difficulty)
- `summit` - User summit logs (photos, dates)
- `plan` - Group hiking plans
- `plan_attendee` - Plan participants
- `plan_chat` - Plan chat messages
- `challenge` - Curated hiking challenges
- `hiscores` - Leaderboard rankings
- `donor` - App supporters

### Running Migrations

```bash
# From monorepo root
yarn api drizzle-kit push

# Or from this directory
yarn drizzle-kit push
```

### Database Init Script

An initial data script is available at `src/db/init-script.sql` for populating mountains and challenges.

## 📡 API Structure

The API is organized into **public** and **protected** routes:

### Public Routes (`src/api/routes/public/`)

No authentication required:
- `GET /api/mountains` - List all mountains
- `GET /api/user/:id` - Get user profile
- `GET /api/challenge` - List challenges
- `GET /api/hiscores` - Get leaderboard
- `POST /api/join` - Join waitlist (logs to Google Sheets)

### Protected Routes (`src/api/routes/protected/`)

Require JWT authentication (`Authorization: Bearer <token>`):
- `POST /api/summit` - Log a summit
- `GET /api/summit` - Get user's summits
- `POST /api/plan` - Create a hiking plan
- `POST /api/plan/:id/chat` - Send chat message
- `POST /api/mountain/:id/image` - Upload summit photo
- `POST /api/user/avatar` - Upload avatar
- `POST /api/donor` - Record donation

### Authentication Flow

1. User signs in with Google/Apple OAuth (handled by mobile app)
2. App sends OAuth token to backend
3. Backend validates token and issues JWT
4. JWT is used for subsequent authenticated requests

See `src/api/routes/@shared/jwt.ts` for JWT configuration.

## 📸 Image Uploads

Images are stored in AWS S3:

- **Avatar images**: `{APP_NAME}/user/avatar/{userId}.jpeg`
- **Summit photos**: `{APP_NAME}/mountain/summit/{summitId}.jpeg`

See `src/api/routes/@shared/s3.ts` for S3 client configuration.

## 📊 Google Sheets Integration

The API logs certain events to Google Sheets for analytics:

- **Email signups** → `[Emails] 2025` sheet
- **Error reports** → `[Errors] 2025` sheet
- **User suggestions** → `[Suggestions] 2025` sheet

**Spreadsheet ID** (hardcoded): `1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs`

Ensure your service account has editor access to this spreadsheet.

See `src/api/lib/sheets.ts` for implementation.

## 🔍 API Documentation

Interactive API documentation is available via Swagger UI:

**Development**: http://localhost:3000/api/swagger

The OpenAPI specification is auto-generated from Elysia route definitions.

## 🏗️ Project Structure

```
src/
├── api/
│   ├── lib/              # Shared utilities
│   │   ├── dates.ts      # Date formatting
│   │   ├── images.ts     # Image processing
│   │   └── sheets.ts     # Google Sheets client
│   ├── routes/
│   │   ├── @shared/      # Shared middleware & utilities
│   │   │   ├── jwt.ts    # JWT authentication
│   │   │   ├── s3.ts     # S3 client
│   │   │   ├── store.ts  # Request context
│   │   │   └── types.ts  # Shared types
│   │   ├── public/       # Public API routes
│   │   └── protected/    # Protected API routes (JWT required)
│   ├── schemas/          # TypeBox validation schemas
│   └── routes/index.ts   # Elysia app configuration
├── app/                  # Next.js App Router pages
│   ├── api/[[...slugs]]/ # Elysia catch-all handler
│   └── ...               # Web pages (landing, privacy, etc.)
├── db/
│   ├── schema.ts         # Drizzle schema definitions
│   ├── index.ts          # Database client
│   └── init-script.sql   # Initial data script
└── middleware.ts         # Next.js i18n middleware
```

## 🧪 Development

```bash
# Start dev server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Lint code
yarn lint

# Generate API types (from Swagger)
yarn generate-api-types
```

## 🚢 Deployment

The API is configured for deployment on **Vercel**.

The monorepo root contains `vercel.json` configured to:
- Build from `packages/api`
- Use Next.js framework detection
- Output to `.next` directory

Environment variables must be configured in Vercel dashboard.

## 📝 Type Safety

This project is fully type-safe:

1. **Database types** - Generated from Drizzle schema
2. **API types** - Inferred from Elysia routes and TypeBox schemas
3. **OpenAPI types** - Auto-generated for client consumption

The mobile app consumes OpenAPI types via `openapi-typescript`.

## 🤝 Contributing

When adding new API routes:

1. Define schema in `src/api/schemas/`
2. Create route in `src/api/routes/public/` or `protected/`
3. Import and register in `src/api/routes/index.ts`
4. Types and Swagger docs are auto-generated

---

Made with ❤️ by [@jvidalv](https://www.linkedin.com/in/josepvidalvidal/)
