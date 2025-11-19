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

#### Translation Updates
```bash
yarn translations:extract
yarn translations:generate
# Manual translation to ca.json, es.json needed
```

#### Database Migrations
```bash
yarn api drizzle-kit push
```

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

### API Deployment (Vercel)

**Tool**: Vercel Platform
**Configuration**: `/vercel.json`

**Current Setup**:
- **Framework**: Next.js (auto-detected)
- **Build directory**: `packages/api`
- **Triggers**: Automatic on git push to main branch
- **Environment**: Variables set in Vercel dashboard

**Workflow**:
1. Push to main branch
2. Vercel webhook triggers build
3. Next.js build runs (`yarn build`)
4. Deployment to production URL
5. Automatic HTTPS, edge functions

**Manual Deployments**:
```bash
vercel --prod  # Production deployment
vercel         # Preview deployment
```

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
- Vercel deploy webhooks (for notifications)

## Manual Processes (Candidates for Automation)

1. **Translation workflow**: Currently manual copy of keys to ca.json, es.json
   - Could use translation service API (Lokalise, Phrase)

2. **Database seeding**: `init-script.sql` run manually
   - Could automate in dev environment setup

3. **Environment variable sync**: Manual across Vercel, EAS
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
