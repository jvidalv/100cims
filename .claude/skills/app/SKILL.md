---
name: app
description: Use when working on the mobile app (packages/app). Covers Expo, React Native, expo-router navigation, NativeWind styling, React Query data fetching, translations, and mobile-specific patterns.
---

# Mobile App Development Guide

You are working on the **100cims mobile app** (`packages/app`), an Expo React Native application for mountaineering.

## Key Files

| File | Purpose |
| ---- | ------- |
| `app/_layout.tsx` | Root layout with providers |
| `app.config.ts` | Expo configuration, plugins, EAS project ID |
| `lib/api-client.ts` | openapi-fetch client with auth |
| `types/api.ts` | Generated OpenAPI types (DO NOT EDIT) |
| `domains/*/` | Feature-specific business logic |
| `components/ui/` | Reusable UI components |
| `translations/*.json` | i18n message files |

## Stack

- **Expo SDK 55** with React Native 0.81 (new architecture enabled)
- **expo-router 6** for file-based navigation
- **NativeWind 4** for styling (Tailwind CSS)
- **React Query 5** for server state
- **React Intl** for i18n (en, ca, es)
- **expo-notifications** for push (sends to Expo push service; see Push Notifications section)

## Directory Structure

- `/app/`: expo-router screens (file-based routing)
- `/domains/`: Feature-specific business logic
- `/hooks/`: Shared React hooks
- `/lib/`: Utility functions (api-client, auth, dates, images, location, validation)
- `/components/`: Reusable UI components
- `/translations/`: i18n message files
- `/types/`: Shared TypeScript types (api.ts auto-generated, mountain.ts, etc.)

## Domain Pattern

Each domain folder typically contains:
- `*.api.ts`: React Query hooks for API calls
- `*.utils.ts`: Domain-specific utilities
- `*.types.ts`: TypeScript types (optional)

Example: `/domains/user/user.api.ts` exports `useUser()`, `useUpdateUser()`, etc.

## Shared Hooks

| Hook | Location | Purpose |
| ---- | -------- | ------- |
| `useImagePicker` | `hooks/use-image-picker.ts` | Pick and optimize images with state management |
| `useMountainSelection` | `hooks/use-mountain-selection.ts` | Manage mountain selection in challenge screens |
| `useLocation` | `hooks/use-location.ts` | Get user's current location |
| `useIsKeyboardVisible` | `hooks/use-is-keyboard-visible.ts` | Detect keyboard visibility |
| `useDistanceToTarget` | `hooks/use-distance-to-target.ts` | Calculate distance to coordinates |

## Shared Utilities

| Utility | Location | Purpose |
| ------- | -------- | ------- |
| `validateMountainForm` | `lib/mountain-validation.ts` | Validate mountain form fields |
| `getImageOptimized` | `lib/images.ts` | Optimize images for upload |
| `cleanText` | `lib/strings.ts` | Normalize text for search |
| `getDistanceInKm` | `lib/location.ts` | Calculate distance between coordinates |
| `reportErrorToDiscord` | `lib/report-error.ts` | Fire-and-forget error report via `EXPO_PUBLIC_DISCORD_ERROR_WEBHOOK` — bypasses `apiClient` on purpose (works when our API is down) |

## Shared Types

| Type | Location | Purpose |
| ---- | -------- | ------- |
| `MountainData` | `types/mountain.ts` | Base mountain data from API |
| `MountainWithChallengeCount` | `types/mountain.ts` | Mountain with challenge count |
| `NewMountainData` | `types/mountain.ts` | New mountain for local state |
| `MountainInfo` | `types/mountain.ts` | Minimal mountain info for display |

When a domain needs to name a specific field from a response (a slug, an id union, a status enum), anchor the alias to the generated openapi path instead of re-declaring as `string` — that way the type stays in lockstep if the backend later tightens it to a literal union. Example from `domains/merch/cart.ts`:

```typescript
import type { paths } from "@/types/api";

type MerchEntry =
  paths["/api/public/merch/"]["get"]["responses"][200]["content"]["application/json"]["message"][number];
type MerchSlug = MerchEntry["slug"];
```

## Key Patterns

### Using Shared Hooks

```typescript
// Image picker with optimization
import { useImagePicker } from '@/hooks/use-image-picker';

const { imageUri, imageBase64, hasChanged, pickImage, reset } = useImagePicker({
  initialUri: existingImageUrl,
});

// Mountain selection state management
import { useMountainSelection } from '@/hooks/use-mountain-selection';

const {
  selectedMountainIds,
  newMountains,
  selectedMountainsForDisplay,
  totalMountainCount,
  handleSelectionChange,
  handleAddNewMountain,
  handleRemoveNewMountain,
} = useMountainSelection({ allMountains });
```

### Form Validation

```typescript
import { validateMountainForm } from '@/lib/mountain-validation';

const validation = validateMountainForm({ name, location, height, latitude, longitude }, intl);
if (!validation.valid) {
  return Alert.alert(validation.error);
}
// Use validation.data.name, validation.data.height (parsed numbers), etc.
```

### API Calls

```typescript
// Use openapi-fetch client from lib/api-client.ts
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/user/{id}', {
        params: { path: { id: userId } }
      });
      if (error) throw error;
      return data;
    }
  });
};
```

### Debounced field updates

When wiring `debounce` from `lib/debounce.ts` into an input's `onChangeText`, wrap the debounced function in `useMemo` — otherwise each render creates a fresh debounce with a new internal timer, so the previous pending update is orphaned and nothing actually fires. This bites hardest when the input lives inside a conditionally-rendered block (e.g. a tab) that unmounts before the debounce delay elapses.

```typescript
const onChangeFirstName = useMemo(
  () => debounce(async (firstName: string) => {
    await updateUserMe({ firstName });
  }, 500),
  [updateUserMe],
);
```

### Infinite Scroll with Pagination

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export const useItemsList = () => {
  return useInfiniteQuery({
    queryKey: ['items', 'list'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET('/api/items', {
        params: { query: { page: pageParam, limit: 50 } },
      });
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};

// In component:
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useItemsList();
const items = data?.pages?.flatMap((p) => p?.items ?? []) ?? [];

<FlatList
  data={items}
  onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
/>
```

### Authentication

- JWT stored in AsyncStorage
- `setAuthToken(token)` in lib/api-client.ts sets Authorization header
- Protected routes check auth state in _layout.tsx
- **Only log out on HTTP 401**, never on generic query errors. React Query fires errors for network failures, 5xx, and `ECONNREFUSED` (e.g. when the API server restarts in dev) — logging out on any of those wipes the AsyncStorage JWT and boots the user to the login screen on every API restart. See `domains/user/user.api.ts` `useUserMe`: queryFn throws `new Error(UNAUTHORIZED)` specifically on `response.status === 401`, and the logout effect gates on `error.message === UNAUTHORIZED`. Mirror this pattern in any new hook that reacts to auth errors.

### Styling with NativeWind

```typescript
<View className="flex-1 bg-white dark:bg-gray-900">
  <Text className="text-lg font-bold text-gray-900">Title</Text>
</View>
```

### Navigation

```typescript
import { router } from 'expo-router';

// Navigate
router.push('/user/123');

// With params
router.push({ pathname: '/mountain/[id]', params: { id: '456' } });
```

### Icons

All icons use **lucide-react-native**. Import the component by name, pass it to `<LucideIcon icon={Mountain} />` — the wrapper handles theme-aware color (`useColorScheme`) and the `muted` gray treatment. There is no `<Icon name="...">` string-based component any more; don't recreate one. Plumbing components (`Button`, `ActionRow`, `SettingsOption.icon`, `Filter.icon`) take `icon: LucideIcon` (the component by reference) — never a name string. See `packages/app/components/ui/atoms/lucide-icon.tsx` and `app/index.tsx` for the canonical call shape. Don't use `@expo/vector-icons` or `expo-symbols` — both are removed from the app bundle.

### Action sections

When building an "Actions" section on a detail screen (mountain, plan, user profile, etc.), use the `ActionRow` molecule from `@/components/ui/molecules` instead of hand-rolling icon+text rows. Intents map to design tokens (`primary`, `muted`, `blue`, `emerald`, `danger`). Wrap in `<Link asChild>` for navigation rows. Supports `badge` (red dot) and `iconOverride` (e.g. spinner). `icon` is a lucide component: `<ActionRow icon={Trash2} intent="danger">...`. See `app/plan/[id]/index.tsx` and `app/mountain/[slug]/index.tsx` for examples.

### Full-page edit screens

Edits live in dedicated push routes like `/user/summits/[summit]/edit.tsx` rather than bottom drawers. Detail pages trigger them via `<Link asChild>` wrapping an `ActionRow` (e.g. `app/user/summits/[summit].tsx`). The edit form mirrors the create flow's inputs but uses partial-payload mutations: the API body fields are all optional (`t.Optional(...)`) so the client sends only changed values — keeps everything backwards-compatible. See `app/user/summits/[summit]/edit.tsx` + `api/routes/protected/summit/summit.update.post.ts` for the template (photo replace, user add/remove, date edit).

### Fatal error screens

When a screen's "load-bearing" React Query hooks fail (not 401 — that's handled in `useUserMe` via `logout()`), render `<ErrorState context="..." error={...} onReload={...} />` from `@/components/ui/molecules` instead of letting the screen render with `data: undefined`. The molecule ships with Reload + Report buttons; Report POSTs to a Discord webhook via `reportErrorToDiscord` in `lib/report-error.ts` — bypassing `apiClient` on purpose so reporting works when our API is the thing that's down. Requires `EXPO_PUBLIC_DISCORD_ERROR_WEBHOOK` in env. For the 401 guard, compare `error.message === UNAUTHORIZED` (exported from `domains/user/user.api.ts`). Canonical setup: `app/index.tsx` derives `hasFatalError` from three hooks' `isError` + skips the `Unauthorized` message, then early-returns the `<ErrorState>` before the real render.

### Share helpers

Text-only share messages go through `shareDeeplink` from `@/lib/share` — passes locale-keyed messages + a path, appends the `getUrlDeeplink(path)` URL, opens the native share sheet. Used by every detail page's Share action (mountain, plan, user, summit, challenge).

For rich story-ready image shares (summit + plan detail), render an off-screen `<View>` at fixed dimensions (e.g. 360×640 for a 9:16 story) and call `captureAndShare` from `@/lib/share` — it handles `Image.prefetch` (Promise.allSettled, skips `data:` URIs), `captureRef` at 1080×1920, `expo-sharing.shareAsync`, and falls back to the text-only share. Two gotchas: (1) view-shot doesn't reliably serialize NativeWind `className` into the captured image, so use inline `style` props inside the share card; (2) the off-screen wrapper needs `collapsable={false}` + `position: absolute; left: -10000` + `pointerEvents="none"`. See `app/user/summits/[summit].tsx` + `components/summit/summit-share-card.tsx` for the canonical setup and `app/plan/[id]/index.tsx` + `components/plan/plan-share-card.tsx` for a multi-image-grid variant.

### Translations (CRITICAL)

**All user-facing strings MUST use `intl.formatMessage`** - never hardcode text.

```typescript
import { useIntl } from 'react-intl';

const { formatMessage } = useIntl();

// Simple string
const title = formatMessage({ defaultMessage: 'Settings' });

// In JSX
<ThemedText>{intl.formatMessage({ defaultMessage: "Save changes" })}</ThemedText>

// With FormattedMessage component
import { FormattedMessage } from 'react-intl';
<FormattedMessage defaultMessage="Welcome back" />
```

**Translation Workflow:**

1. Add strings in code using `defaultMessage` (English text)
2. Run extraction: `yarn translations:extract`
3. Run compilation: `yarn translations:generate`
4. English (`translations/en.json`) is auto-generated
5. **Manually copy new keys** to `translations/ca.json` (Catalan) and `translations/es.json` (Spanish)
6. Translate the values in ca.json and es.json

**Translation Files:**
- `translations/raw-en.json` - Extracted messages (intermediate)
- `translations/en.json` - Compiled English (used by app)
- `translations/ca.json` - Catalan translations (manual)
- `translations/es.json` - Spanish translations (manual)

## Common Tasks

### Add New Screen

1. Create file in `/app/` (e.g., `/app/settings.tsx`)
2. Export default React component
3. File name becomes route path

### Add API Integration

1. Ensure backend types are current: `yarn generate-api-types`
2. Create domain API file or add to existing
3. Use React Query for data fetching
4. Handle loading/error states

### Add/Update Translations

1. Use `intl.formatMessage({ defaultMessage: "English text" })` in code
2. Run `yarn translations:extract` to extract all messages
3. Run `yarn translations:generate` to compile English
4. Copy new keys from `en.json` to `ca.json` and `es.json`
5. Translate the values in ca.json and es.json

### Add Native Module

```bash
npx expo install <package-name>
```

Requires a new EAS dev build (`eas build --profile development`); Expo Go won't load unlinked native modules.

If TS reports `Cannot find module 'expo-modules-core'` or empty types after adding an Expo module, add `expo-modules-core` as an **explicit** dep in `packages/app/package.json` (`npx expo install expo-modules-core`). Yarn workspaces nest it under `node_modules/expo/node_modules/` where sibling packages can't resolve it.

## Push Notifications

- Token flow: `lib/push.ts` (`registerForPushNotificationsAsync`) → `domains/user/push.api.ts` (`usePushTokenRegistration`) → `POST /api/protected/user/push-token`.
- Hook is wired once in `app/_layout.tsx` inside `Content()`; re-runs when `isAuthenticated` flips (handles logout→login).
- Notification **body copy is server-side** (API reads `userTable.locale`) — do not translate push strings in the app.
- Tap routing uses both `useLastNotificationResponse` (cold-start) and `addNotificationResponseReceivedListener` (warm); dedupe via `notification.request.identifier`.
- Physical device required — simulators/emulators don't receive tokens.
- Credentials live in EAS: APNs `.p8` (iOS push), FCM V1 service account JSON (Android push, project `cims-bcc70`), and `GOOGLE_SERVICES_JSON` file secret (used by `app.config.ts` `android.googleServicesFile`). Manage via `eas credentials` / `eas env:list`.

## Environment Variables

Must prefix with `EXPO_PUBLIC_` to access in app:
- `EXPO_PUBLIC_API_URL`: Backend URL
- OAuth client IDs for Google/Apple

## Debugging

### Common Issues

- **Type errors**: Regenerate API types with `yarn generate-api-types`
- **Navigation issues**: Check expo-router file structure
- **Styling not applying**: Verify NativeWind babel config, global.css import
- **OAuth not working**: Check google-services.json, Apple config in app.config.ts

### Helpful Commands

```bash
npx expo start --clear          # Clear cache
npx expo-doctor                 # Diagnose issues
npx uri-scheme list             # Check deep linking
```

## Build & Deploy

```bash
eas build --profile development  # Dev build with expo-dev-client
eas build --profile preview      # Internal preview
eas build --profile production   # Production release
```

See `eas.json` for build profiles.
