# 100cims Bug Detection & Debugging Guide

## Overview

This document describes bug detection systems, debugging workflows, and error tracking for the 100cims project.

## Current Bug Detection Systems

### 1. TypeScript Type Checking

**Command**: `yarn type-check`

**What it catches**:
- Type mismatches
- Missing properties
- Incorrect function arguments
- Undefined variables

**Common issues**:
- API types out of sync → Run `yarn generate-api-types`
- Missing type imports → Add `import type { ... }`

### 2. ESLint Static Analysis

**Mobile App**: `/packages/app/eslint.config.js`
**API**: `/packages/api/eslint.config.mjs`
**Command**: `yarn lint`

**What it catches**:
- Code style violations
- Unused variables
- Missing dependencies in hooks
- Accessibility issues
- React anti-patterns

**Auto-fix**:
```bash
yarn lint --fix
```

### 3. Runtime Error Logging

**Implementation**: Google Sheets Integration
**Location**: `/packages/api/src/api/routes/index.ts`
**Spreadsheet**: `1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs`

**Error types captured**:
- **ValidationError**: Invalid request data (schema mismatch)
- **ParseError**: Malformed JSON/request body
- **Generic errors**: Uncaught exceptions

**Sheet tabs**:
- `[Errors] 2025`: API errors
- `[Suggestions] 2025`: User-reported issues
- `[Emails] 2025`: Signup tracking

## Debugging Workflows

### Mobile App Debugging

#### Development Server
```bash
yarn dev:app
# Opens Expo dev server
# Press 'j' to open debugger
```

#### Common Debugging Commands
```bash
# Clear Metro cache
yarn start --clear

# Check for issues
npx expo-doctor

# View Android logs
~/Library/Android/sdk/platform-tools/adb logcat *:E

# iOS simulator logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Expo"'
```

### API Debugging

#### Local Development
```bash
yarn dev:api
# Starts Next.js dev server at localhost:3000
```

#### Swagger UI
Access at `http://localhost:3000/api/swagger`
- Test endpoints interactively
- View request/response schemas
- Test authentication

#### Database Debugging
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# View tables
\dt

# Check schema
\d user

# Query data
SELECT * FROM summit WHERE user_id = '...';
```

### Error Code Reference

**Location**:
- Mobile: `/packages/app/lib/error-codes.ts`
- API: `/packages/api/src/api/routes/@shared/error-codes.ts`

**Common error codes**:
- `UNAUTHORIZED`: Invalid or missing JWT
- `FORBIDDEN`: Valid auth but insufficient permissions
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Request body validation failed
- `INTERNAL_ERROR`: Uncaught server exception

## Common Issues & Solutions

### Mobile App Issues

#### Issue: Type errors in API calls
**Solution**:
```bash
yarn generate-api-types
```

#### Issue: OAuth not working
**Debugging**:
1. Check `google-services.json` is present (Android)
2. Verify client IDs in `.env.local`
3. Check URL scheme in `app.config.ts`
4. Test redirect URI: `npx uri-scheme list`

#### Issue: Maps not showing
**Debugging**:
1. Verify Google Maps API keys in `.env.local`
2. Check API key has Maps SDK enabled
3. Android: Verify `google-services.json`
4. iOS: Check bundle ID matches console

#### Issue: Translations not updating
**Solution**:
```bash
yarn translations:extract
yarn translations:generate
# Manually add to ca.json, es.json
```

#### Issue: NativeWind styles not applying
**Debugging**:
1. Check `global.css` imported in `_layout.tsx`
2. Verify `babel.config.js` has NativeWind plugin
3. Clear cache: `yarn start --clear`
4. Check `tailwind.config.js` content paths

### API Issues

#### Issue: Database connection fails
**Solution**:
1. Verify `DATABASE_URL` in `.env.local`
2. Check PostgreSQL is running
3. Test connection: `psql $DATABASE_URL`

#### Issue: JWT authentication fails
**Debugging**:
1. Check `AUTH_SECRET` environment variable
2. Verify Authorization header format: `Bearer <token>`
3. Test token payload at JWT.io
4. Check expiration time

#### Issue: S3 upload fails
**Debugging**:
1. Verify AWS credentials in `.env.local`
2. Check S3 bucket permissions
3. Test file type validation (only JPEG supported)
4. Check file size limits

#### Issue: Swagger not generating correctly
**Solution**:
1. Check route tags are set
2. Verify schema definitions use TypeBox
3. Ensure routes imported in `/routes/index.ts`
4. Restart dev server

#### Issue: Drizzle migration fails
**Debugging**:
1. Check `drizzle.config.ts` points to correct schema
2. Verify `DATABASE_URL` is set
3. Check for syntax errors in schema
4. Review Drizzle output for SQL errors

### Cross-Cutting Issues

#### Issue: CORS errors
**Solution**:
1. API has `cors()` plugin - should allow all origins in dev
2. Check `EXPO_PUBLIC_API_URL` matches actual API URL
3. Verify API is running and accessible

#### Issue: Environment variables not working
**Mobile**:
- Must use `EXPO_PUBLIC_` prefix
- Restart dev server after changes
- Check `expo-env.d.ts` for autocomplete

**API**:
- No prefix needed
- Ensure `.env.local` is in package root
- Restart Next.js server

## Testing Strategy (Recommended)

### Current State
No automated tests exist in the project.

### Recommended Test Setup

#### Mobile App Testing
```bash
yarn app add -D jest @testing-library/react-native
```

**What to test**:
- Domain API hooks (mock API client)
- Utility functions (dates, strings, images)
- Custom hooks (location, auth)
- Component behavior

#### API Testing
```bash
yarn api add -D vitest
```

**What to test**:
- Route handlers (use Elysia testing utilities)
- Database queries (use test database)
- Validation schemas (TypeBox)
- Utility functions (sheets, images, dates)

#### E2E Testing
```bash
# Maestro (recommended for mobile)
curl -Ls https://get.maestro.mobile.dev | bash
```

**Critical flows to test**:
- OAuth sign-in
- Log a summit
- Create a plan
- Join a challenge
- Upload avatar

## Bug Reporting Workflow

### User-Reported Bugs

**Current Process**:
1. User reports issue via app (suggestion feature)
2. Logged to Google Sheets `[Suggestions] 2025`
3. Manual review by team
4. Triage and prioritize

### Developer Bug Workflow

**Recommended**:
1. Create GitHub Issue with template
2. Add labels: `bug`, `mobile`, `api`, `urgent`
3. Reproduce locally
4. Write failing test
5. Fix and verify test passes
6. Update BUGBOT.md if new pattern emerges

### Bug Triage Process

**Priority levels**:
- **P0 Critical**: App crashes, data loss, security vulnerabilities
- **P1 High**: Core features broken, auth issues
- **P2 Medium**: Degraded UX, minor bugs, visual issues
- **P3 Low**: Nice-to-haves, edge cases, polish

## Automated Bug Detection Opportunities

### 1. Sentry Integration

**Setup**:
```bash
yarn app add @sentry/react-native
yarn api add @sentry/nextjs
```

**Benefits**:
- Real-time error tracking
- Stack traces with source maps
- User context (device, OS, app version)
- Performance monitoring
- Release tracking

### 2. GitHub Actions CI/CD

**Add workflow for**:
- Type checking
- Linting
- Build verification
- Test execution (once tests exist)

### 3. Dependency Vulnerability Scanning

**npm audit**:
```bash
yarn audit
yarn audit fix
```

**GitHub Dependabot**: Auto-scan for CVEs

### 4. Performance Monitoring

**Recommendations**:
- Add logging middleware for slow endpoints (>1s)
- Track database query performance
- Monitor bundle size growth

## Debug Logging Best Practices

### Development Logging
```typescript
// Use environment-aware logging
const log = __DEV__ ? console.log : () => {};
log('User loaded:', user);
```

### Production Logging
```typescript
// Structured logging with context
logger.info('Summit created', {
  userId,
  mountainId,
  timestamp: new Date().toISOString()
});
```

### Never Log
- Passwords or tokens
- PII without user consent
- Full request/response bodies with sensitive data

## Incident Response

### Production Bug Process
1. **Detect**: Error log / user report
2. **Triage**: Assess severity (P0-P3)
3. **Investigate**: Reproduce, check logs, review stack trace
4. **Fix**: Hotfix branch if P0/P1, regular PR if P2/P3
5. **Deploy**: Emergency deploy if critical, else next release
6. **Monitor**: Verify fix deployed, check error rates
7. **Postmortem**: Document in BUGBOT.md, update tests

### Rollback Procedure
- **Mobile**: Cannot rollback app stores, push hotfix update
- **API**: Vercel allows instant rollback in dashboard

## Future Enhancements

### Automated Bug Detection
- [ ] Set up Sentry or similar error tracker
- [ ] Add automated testing (Jest, Vitest)
- [ ] Implement CI/CD test pipeline
- [ ] Add E2E tests for critical flows
- [ ] Performance regression detection

### Debugging Improvements
- [ ] Add debug logging library (Pino, Winston)
- [ ] Set up log aggregation (Datadog, Logtail)
- [ ] Implement feature flags for safe rollouts
- [ ] Create debug dashboard for team

### Bug Prevention
- [ ] Add pre-commit hooks (Husky)
- [ ] Create PR templates
- [ ] Document common pitfalls
- [ ] Add automated dependency updates
- [ ] Implement security scanning
