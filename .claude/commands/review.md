Review the files that you changed in this session for:

1. **Bad patterns**: "as any", "as Type", non-null assertions, ts-ignore, ts-expect-error
2. **Type safety**: Missing error handling, untyped responses, manually edited `types/api.ts` (should be generated)
3. **Code quality**: Hardcoded values that should be constants, missing async/await, console.log left in code
4. **Mobile app (packages/app)**:
   - Missing `useIntl` for user-facing strings
   - Direct API calls without React Query
   - Missing loading/error states
   - Inline styles instead of NativeWind classes
   - Missing `EXPO_PUBLIC_` prefix on env vars
5. **API (packages/api)**:
   - Missing TypeBox schema validation
   - Unprotected routes that should require auth
   - Missing error logging to Google Sheets
   - Database queries without proper joins/indexes
   - S3 uploads without file type validation
6. **CRITICAL - API Backwards Compatibility** (mobile versions cannot be reliably updated):
   - Removed or renamed fields in API responses (breaks old clients)
   - Changed field types (string to number, etc.)
   - Removed endpoints
   - New required fields without defaults
   - Request body fields renamed without accepting both old and new names

Then review relevant skills in `.claude/skills/` and update them if the work introduced new patterns, utilities, or important context that should be documented.

Report findings and suggest fixes.

## IMPORTANT: Verification Steps

After reviewing the code, you MUST run lint and TypeScript checks:

```bash
# For app package
yarn app lint
npx tsc --noEmit -p packages/app/tsconfig.json

# For api package
yarn api lint
npx tsc --noEmit -p packages/api/tsconfig.json
```

If there are errors in files you modified, fix them before completing the review. If errors exist in files you did NOT modify, note them but do not fix them (they are pre-existing issues).

## Regenerate Types (if API changed)

If you modified API routes or schemas, regenerate types:

```bash
yarn app generate-api-types
```
