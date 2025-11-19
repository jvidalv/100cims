# 100cims Monorepo - AI Development Guide

## Project Overview

Cims is a mountaineering mobile app with a React Native frontend and Next.js/Elysia backend, deployed as a monorepo using Yarn workspaces.

## Architecture Decisions

### Monorepo Structure
- **packages/app**: Expo mobile app (iOS/Android)
- **packages/api**: Next.js 15 + Elysia 1.4 hybrid backend
- **Shared types**: Generated via OpenAPI TypeScript from Swagger spec

### Key Technology Choices

1. **Elysia over Next.js API Routes**: Chosen for better performance, automatic OpenAPI generation, and type inference from TypeBox schemas
2. **Drizzle ORM**: Type-safe SQL with snake_case convention
3. **React Query 5**: Server state management in mobile app
4. **NativeWind 4**: Tailwind CSS for React Native (new architecture enabled)
5. **expo-router 6**: File-based navigation similar to Next.js App Router

### Code Organization Patterns

#### API (packages/api)
- **Domain-driven routes**: `/api/routes/public/` and `/api/routes/protected/`
- **Shared utilities**: `/api/routes/@shared/` for JWT, S3, error codes
- **Schema-first**: TypeBox schemas in `/api/schemas/` drive validation and OpenAPI
- **Database**: PostgreSQL with Drizzle ORM (snake_case naming)

#### Mobile App (packages/app)
- **Domain-based**: `/domains/` folder contains feature-specific logic
- **Hooks**: Custom React hooks in `/hooks/` for cross-cutting concerns
- **Type-safe API**: Uses `openapi-fetch` with generated types from `/types/api.ts`
- **File-based routing**: `/app/` directory with expo-router conventions

## Development Workflows

### Type Generation Flow
1. Backend: Elysia generates OpenAPI spec at `/api/swagger/json`
2. Run: `yarn generate-api-types` (uses openapi-typescript)
3. Mobile: Imports types from `@/types/api` for type-safe API calls

### Database Migrations
- Use Drizzle Kit: `yarn api drizzle-kit push`
- Schema: `/packages/api/src/db/schema.ts`
- Init script: `/packages/api/src/db/init-script.sql` (mountains & challenges data)

### Translation Updates
- Extract: `yarn translations:extract` (FormatJS)
- Compile: `yarn translations:generate`
- Supported: en, ca, es

### Mobile Builds
- Development: `eas build --profile development`
- Preview: `eas build --profile preview --channel preview`
- Production: `eas build --profile production --channel production`

## Common Patterns

### Error Handling
- API errors logged to Google Sheets (ID: 1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs)
- Mobile: React Query error boundaries + toast notifications
- Backend: Elysia's onError hook catches ValidationError, ParseError, generic errors

### Authentication Flow
1. Mobile: Google/Apple OAuth via expo-auth-session
2. Backend validates OAuth token
3. Issues JWT (via @elysiajs/jwt)
4. Mobile stores JWT, sets Authorization header via api-client.ts

### Image Uploads
- S3 paths: `{APP_NAME}/user/avatar/{userId}.jpeg`, `{APP_NAME}/mountain/summit/{summitId}.jpeg`
- File validation: Uses `file-type` package on backend
- Mobile: expo-image-picker → base64 → API upload

## Important Files to Know

### Configuration
- `/packages/app/app.config.ts`: Expo configuration, plugins, EAS project ID
- `/packages/api/drizzle.config.ts`: Database connection and schema path
- `/package.json`: Root workspace scripts
- `/.claude/settings.local.json`: Claude Code permissions

### Type Definitions
- `/packages/app/types/api.ts`: Generated OpenAPI types (DO NOT EDIT MANUALLY)
- `/packages/api/src/db/schema.ts`: Drizzle schema (source of truth for DB)

### Entry Points
- Mobile: `/packages/app/app/_layout.tsx` (root layout with providers)
- API: `/packages/api/src/api/routes/index.ts` (Elysia app composition)
- API Server: `/packages/api/src/app/api/[[...slugs]]/route.ts` (Next.js catch-all)

## Gotchas & Common Issues

### Type Safety
- Always regenerate API types after backend schema changes
- Don't manually edit `/types/api.ts`
- Use TypeBox for runtime validation, not just TypeScript types

### Database
- Drizzle uses snake_case but TypeScript uses camelCase (automatic conversion)
- Push changes carefully - no rollback without manual intervention
- Init script must be run manually on fresh databases

### Mobile Development
- New architecture enabled - some libraries may not be compatible
- expo-router typed routes require `experiments.typedRoutes: true`
- NativeWind v4 requires proper babel config and global.css import

### Environment Variables
- Mobile: Must prefix with `EXPO_PUBLIC_` for runtime access
- API: Loaded via dotenv, no prefix needed
- Never commit `.env.local` files

## When Making Changes

### Adding API Endpoints
1. Create schema in `/api/schemas/`
2. Add route in `/api/routes/public/` or `/protected/`
3. Register in `/api/routes/index.ts`
4. Run `yarn generate-api-types`
5. Use in mobile app with full type safety

### Adding Mobile Screens
1. Create file in `/app/` directory (expo-router convention)
2. Add domain logic in `/domains/` if complex
3. Create React Query hooks for data fetching
4. Use NativeWind classes for styling

### Database Schema Changes
1. Update `/api/src/db/schema.ts`
2. Run `yarn api drizzle-kit push` (development)
3. Verify changes in database
4. Consider data migration needs for production

## Integration Points
- **Google Sheets API**: Error logging, email signups, suggestions (spreadsheet ID: 1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs)
- **AWS S3**: Image storage (avatars, summit photos)
- **Google Maps**: react-native-maps for mountain locations
- **OAuth**: Google Sign-In + Apple Authentication
- **Analytics**: reactanalytics.app
- **App Review**: expo-store-review for prompting reviews

## Deployment
- **Mobile**: EAS Build → App Store/Play Store
- **API**: Vercel (configured in root `vercel.json`)
- **Database**: PostgreSQL (hosted externally)
