# 100cims Automation & Agent Workflows

## Overview

This document describes automated processes, AI agents, and integration workflows in the 100cims project.

## Claude Code Configuration

### Permissions Setup
Location: `/.claude/settings.local.json`

Configured permissions for Claude Code include:
- **WebSearch**: General web searching
- **WebFetch**: Specific domains (expo.dev, docs.expo.dev, nativewind.dev, github.com, etc.)
- **Bash commands**: Development tools (expo, yarn, npm, git, eas, etc.)
- **File access**: Full read access to monorepo

### Common Claude Code Workflows

#### Type Regeneration
```bash
# When API schema changes
yarn generate-api-types
```

#### Translation Updates (CRITICAL)

**Any time you add a `<FormattedMessage defaultMessage="...">` or `intl.formatMessage({ defaultMessage: "..." })` in `packages/app/`, you MUST extract and translate before declaring the task done.** Shipping English-only strings is a regression — most users run the app in Catalan or Spanish.

```bash
# 1. Extract new keys into raw-en.json and compile en.json
yarn workspace @100cims/app translations

# 2. Add the new keys (use the same hash keys from en.json) to:
#    - packages/app/translations/ca.json  (Catalan)
#    - packages/app/translations/es.json  (Spanish)
#    Insert each entry in alphabetical order by key hash.

# 3. Verify all three locales contain the new keys:
#    grep '"<hash>"' packages/app/translations/*.json
```

Commit the updated `raw-en.json`, `en.json`, `ca.json`, and `es.json` together with the component change.

#### Linting (CRITICAL)

**Always run lint + type-check on any package you touched before declaring a task done, and never commit with lint errors.** This applies even for trivial-looking edits — a typo fix in one file can still sit next to pre-existing lint errors that your diff will appear to own once committed.

```bash
# packages/app/
yarn app lint
./node_modules/.bin/tsc --noEmit -p packages/app/tsconfig.json

# packages/api/
yarn api lint
./packages/api/node_modules/.bin/tsc --noEmit -p packages/api/tsconfig.json
```

Rules:
- **Zero lint errors in files you touched before commit.** Fix them (don't `--no-verify`, don't suppress with `eslint-disable` unless there's a real reason).
- **Pre-existing errors in files you did not touch**: leave them alone by default. Parallel agents editing unrelated files create merge conflicts. Only fix if the user explicitly asks, or if the error is in a file your change directly depends on.
- **Warnings count too** when they're in code you're modifying.
- If `tsc` passes but `eslint` fails (or vice versa), both still need to be green for your changes.

#### Database Migrations

**CRITICAL**: Always **ask the user before applying a migration**. Never run `drizzle-kit migrate` / `drizzle-kit push` / any schema-change command on your own — prepare the migration file and wait for explicit approval.

**Never hand-author files under `packages/api/src/db/drizzle/` and never hand-edit `drizzle/meta/_journal.json`.** Always use drizzle-kit to create migration files, which keeps the indexed filename + journal entry in sync. Two flows:

**Schema changed** (added/removed column, new table, constraint change):
1. Edit `packages/api/src/db/schema.ts`.
2. Run `yarn api db:generate` (optionally with `--name <slug>`).
3. Review / augment the generated SQL if you also need data backfills for the same migration.
4. **Ask the user** before running `yarn api db:migrate`.

**Pure data change** (backfill, rename, merge rows, delete obsolete data) with **no schema diff**:
1. Run `yarn api db:generate --custom --name <slug>` — produces an empty migration file tracked in the journal.
2. Write the SQL inside that file.
3. **Ask the user** before running `yarn api db:migrate`.

Do **not** use `drizzle-kit push` anywhere: it bypasses the versioned migration files, skips custom SQL (like data backfills), and leaves the DB in a state that later `db:migrate` can't reconcile.

**CRITICAL — hand-written SQL must use snake_case column identifiers, NOT the camelCase field names from `schema.ts`.** Drizzle's `text()` / `boolean()` / `uuid()` builders map TS field `imageUrl` to DB column `image_url` automatically — so the schema reads `imageUrl: text()`, but the actual column on disk is `image_url`. When you write `INSERT`/`UPDATE` SQL in a custom migration:

- Always reference real DB column names: `first_name`, `image_url`, `visible_on_hiscores`, `created_at`, `active_challenge_id`, etc.
- Do NOT quote camelCase identifiers like `"imageUrl"` — they don't exist as columns and the migration will fail at apply time with a swallowed error (drizzle-kit prints `error Command failed with exit code 1.` and hides the real PG message), breaking every Railway build until reverted.
- Sanity-check by reading an existing migration in the same folder (e.g. `0001_seed-data.sql`, `0012_grant_josep_admin.sql`) or by querying `information_schema.columns WHERE table_name = '<table>'` before authoring the SQL.

## Deployment Agents

### Mobile App Deployment (EAS Build)

**Tool**: Expo Application Services (EAS)
**Configuration**: `/packages/app/eas.json`

**Profiles**:
- `development`: Dev builds with expo-dev-client
- `preview`: Internal testing builds (channel: preview)
- `production`: Production releases (auto-increment version)

**Workflow**:
1. Code changes pushed to repository
2. Manual trigger: `eas build --profile <profile>`
3. EAS Build cloud service compiles native apps
4. Outputs downloadable builds or submits to stores

**Commands**:
```bash
# Development build (with dev client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### API Deployment (Railway)

**Tool**: Railway
**Configuration**: `packages/api/Dockerfile`

**Current Setup**:
- **Build**: Docker image built from `packages/api/Dockerfile`
- **Triggers**: Automatic on git push to main branch
- **Environment**: Variables set in the Railway service dashboard
- **Domains**: `cims-sempre-amunt.app` and `fescims.com` both point at the same service

**Workflow**:
1. Push to main branch
2. Railway detects the push and builds the Docker image
3. Image is deployed to the production service
4. Automatic HTTPS on all attached domains

**Manual operations**:
- Rollback: Railway dashboard → Deployments → redeploy a previous build
- Logs: `railway logs` (or the dashboard)
- Shell: `railway run -- sh`

## Background Processing

### Error Logging Agent

**Location**: `/packages/api/src/api/routes/index.ts` (onError hook)
**Integration**: Google Sheets API
**Spreadsheet**: `1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs`

**Process**:
1. API error occurs (ValidationError, ParseError, or generic)
2. Error details captured in Elysia onError hook
3. Row added to Google Sheets `[Errors] 2025` tab
4. Includes: error type, status, URL, message, stack trace

### User Signup Tracking Agent

**Location**: `/packages/api/src/api/routes/public/join.route.ts`
**Integration**: Google Sheets API
**Sheet**: `[Emails] 2025` tab

**Process**:
1. User submits email via `/api/join` endpoint
2. Email logged to Google Sheets
3. Used for waitlist/marketing campaigns

### Suggestion Collection Agent

**Integration**: Google Sheets API
**Sheet**: `[Suggestions] 2025` tab

**Process**:
1. Users submit suggestions via app
2. Logged to Google Sheets for review
3. Manual follow-up by product team

## Recommended Automation Opportunities

### 1. GitHub Actions for CI/CD

#### Type Safety CI
```yaml
name: Type Check
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install
      - run: yarn type-check
```

#### Lint & Format
```yaml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn lint
```

#### API Type Generation Check
```yaml
name: API Types Sync
on: pull_request
jobs:
  check-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn install
      - run: yarn api dev &
      - run: sleep 10
      - run: yarn generate-api-types
      - run: git diff --exit-code packages/app/types/api.ts
```

### 2. Dependency Update Agent

**Tool**: Dependabot or Renovate
**Benefit**: Auto-create PRs for dependency updates

**Configuration**: Add `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/packages/app"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/packages/api"
    schedule:
      interval: "weekly"
```

### 3. Performance Monitoring Agent

**Potential Tools**:
- Track API response times
- Alert on slow endpoints
- Monitor mobile app crash rates
- Weekly performance reports

### 4. Deployment Notification Agent

**Features**:
- Post to Slack/Discord on successful deploys
- Include changelog from commits
- Notify team of EAS build completion

## Integration Points

### External Services with API Integration
- **Google Sheets**: Error logging, signups, suggestions
- **AWS S3**: Image storage (avatars, summit photos)
- **Analytics**: reactanalytics.app (privacy-focused tracking)
- **OAuth Providers**: Google, Apple (token validation)

### Potential Webhooks
- Stripe webhooks (if adding payments)
- GitHub webhooks (for advanced CI/CD)
- Railway deploy webhooks (for notifications)

## Manual Processes (Candidates for Automation)

1. **Translation workflow**: Currently manual copy of keys to ca.json, es.json
   - Could use translation service API (Lokalise, Phrase)

2. **Database seeding**: `init-script.sql` run manually
   - Could automate in dev environment setup

3. **Environment variable sync**: Manual across Railway, EAS
   - Could use dotenv-vault or similar tool

4. **API documentation**: Swagger accessible only in dev
   - Could deploy to docs site (Redoc, Scalar)

## Agent Best Practices

### When Adding Automation
1. Document in this file
2. Test in staging first
3. Set up failure alerts
4. Include rollback procedure
5. Log all agent actions

### Security Considerations
- Never log sensitive data to Sheets
- Rotate service account keys regularly
- Use environment variables for all secrets
- Limit agent permissions to minimum required

## API Development Guidelines

### File Organization (CRITICAL)

**Always create separate files for separate endpoints.** Each API endpoint should be in its own file within a folder structure.

**Rules:**
- **One file = one endpoint** - Never add new endpoints to existing route files
- **Use folder structure** - Group related endpoints in folders (e.g., `mountains/create.route.ts`, `mountains/delete.route.ts`)
- **Index files for composition** - Each folder should have an `index.ts` that composes all routes with a prefix

**Example - Adding a new endpoint:**
```
# BAD: Adding to existing file
packages/api/src/api/routes/protected/mountain.route.ts  # Don't add more endpoints here!

# GOOD: Create new folder and files
packages/api/src/api/routes/protected/mountains/
├── index.ts           # Composes routes with prefix "/mountains"
├── create.route.ts    # POST /create
├── update.route.ts    # POST /update
└── delete.route.ts    # POST /delete
```

### Backwards Compatibility (CRITICAL)

**All API changes MUST be backwards compatible.** Mobile app versions in the wild cannot be updated reliably - users may be on old versions for months.

**Rules:**
- **Never remove fields** from API responses - old clients depend on them
- **Never rename fields** - add new fields alongside old ones if needed
- **Never change field types** - a string must stay a string
- **Never remove endpoints** - deprecate but keep working
- **New required fields** must have defaults or be optional initially
- **Accept both old and new field names** in request bodies (e.g., `image` and `imageUrl`)

**When adding new features:**
- Add new optional fields, don't modify existing ones
- New endpoints are safe, modifications are risky
- Test with oldest supported app version if possible

**Example - Adding a field:**
```typescript
// BAD: Renaming a field
{ userName: string }  // was: { name: string } - breaks old clients!

// GOOD: Adding alongside
{ name: string, userName: string }  // old clients still work
```
