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

- **Expo SDK 56** with React Native 0.85 (new architecture enabled)
- **expo-router 56** for file-based navigation
- **NativeWind 5 (preview)** for styling (Tailwind CSS)
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

### NativeTabs (expo-router/unstable-native-tabs) — gotchas

The app uses `NativeTabs` (sibling subtrees: `app/(tabs)`, `app/challenges/(tabs)`, `app/plans/(tabs)`, `app/plan/[id]/(tabs)`, `app/mountain/[slug]/(tabs)`). The OS forbids nesting two NativeTabs in the same render tree, so each section's tab bar is a *sibling subtree* under the root Stack — only one bar is mounted at a time.

- **Dynamic params: use `useGlobalSearchParams`, not `useLocalSearchParams`.** Inside a NativeTabs eagerly-mounted child of a `[slug]`/`[id]` folder, `useLocalSearchParams` returns `undefined` for the parent dynamic until the tab is focused. `useGlobalSearchParams` reads the URL directly and works for both tab-bar taps and `Link` nav. The symptom is white-screen-on-tab-tap-only (Links work fine). Every plan/mountain detail tab screen does this.
- **`useSafeAreaInsets().bottom` ALREADY includes the tab bar height.** iOS bumps the safe-area inset for any child of a `UITabBarController`. Don't add `NATIVE_TAB_BAR_HEIGHT` on top — that double-counts and leaves a gap between your content and the bar. Use `bottomInset` alone (plus an optional small visual buffer).
- **Single-child route groups collapse.** A folder like `app/plans/` containing only `(tabs)/` flattens to the route name `plans/(tabs)`. A `<Stack.Screen name="plans" />` declaration on the root Stack won't match and you'll see `[Layout children]: No route named "plans" exists` warnings. Either drop the declaration (Expo Router infers) or add a sibling file to keep the wrapper registered separately.
- **Trigger `hidden` causes a one-time remount on first transition.** Use sparingly. For ownership-gated tabs (e.g. `hidden={!isCreator}`), gate on the *full* set of conditions the old in-content row had (status, dates, etc.) — moving navigation to a tab without copying the gates is a regression.
- **Hardcoded Tailwind heights don't survive NativeWind's static extraction when referenced from module-level string constants** (e.g. `const H = "h-32"; ... className={twMerge("h-24", H)}`). For dynamic sizing of header bars, use numeric `style={{ height: N }}` instead. See `BLURRED_SCREEN_HEADER_HEIGHT` in `components/ui/molecules/blurred-screen-header.tsx`.
- **Child screens inside a tab need an explicit `Stack` `_layout.tsx`.** Putting `summits.tsx` (or any pushable child) next to the tab's `index.tsx` and trying to `<Link href="/summits">` to it from the tab will silently no-op under NativeTabs — taps fire, nothing happens, no warning. The fix: declare the tab as a **route group** folder (e.g. `(tabs)/(home)/index.tsx` + `(tabs)/(home)/summits.tsx`) AND add `(tabs)/(home)/_layout.tsx` returning `<Stack screenOptions={{ headerShown: false }} />`. The trigger then names the group: `<NativeTabs.Trigger name="(home)">`. Group folders are invisible in URLs so `/` and `/summits` stay the same. The shop folder gets away without its own `_layout` because its tab is already a named folder (`shop/`), not a group — expo-router auto-stacks inside it; groups need the layout file to be pushable. Symptom: tapping a link to the child does nothing, no console error.

### BlurredScreenHeader

Translucent absolute-positioned top bar used by Summit, Comments, Plan detail tabs, Plans list, Challenges layout, and the comment composer. API mirrors `ScreenHeader` (children = title, optional `rightElement`). It also accepts a plain string child and auto-wraps it in the standard `<ThemedText className="max-w-56 text-lg font-medium">` — so `<BlurredScreenHeader>{title}</BlurredScreenHeader>` works without manual wrapping.

Because the header is `position: absolute`, consumers must pad the first content element below it. Use the exported `BLURRED_SCREEN_HEADER_HEIGHT` numeric constant as `paddingTop` via the `style` prop (NOT a className), and pair it with `contentContainerStyle` on scrollers — not `contentContainerClassName` — to avoid the NativeWind/className/style merge conflict that drops the padding. Example: `<ScrollView contentContainerStyle={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT, paddingHorizontal: 24, gap: 16 }}>`.

### Icons

All icons use **lucide-react-native**. Import the component by name, pass it to `<LucideIcon icon={Mountain} />` — the wrapper handles theme-aware color (`useColorScheme`) and the `muted` gray treatment. There is no `<Icon name="...">` string-based component any more; don't recreate one. Plumbing components (`Button`, `ActionRow`, `SettingsOption.icon`, `Filter.icon`) take `icon: LucideIcon` (the component by reference) — never a name string. See `packages/app/components/ui/atoms/lucide-icon.tsx` and `app/index.tsx` for the canonical call shape. Don't use `@expo/vector-icons` or `expo-symbols` — both are removed from the app bundle.

For the brand "essential" marker, use `<LucideIcon icon={CircleDot} primary />` rather than hand-rolling a `<View className="size-N rounded-full bg-primary" />`. Raw rounded-full bg dots are still fine for notification/unread badges (absolute-positioned small dots) — the icon convention applies specifically to the essential/marker-with-label pattern next to a "Essential" string.

### Action sections

When building an "Actions" section on a detail screen (mountain, plan, user profile, etc.), use the `ActionRow` molecule from `@/components/ui/molecules` instead of hand-rolling icon+text rows. Intents map to design tokens (`primary`, `muted`, `blue`, `emerald`, `danger`). Wrap in `<Link asChild>` for navigation rows. Supports `badge` (red dot) and `iconOverride` (e.g. spinner). `icon` is a lucide component: `<ActionRow icon={Trash2} intent="danger">...`. See `app/plan/[id]/index.tsx` and `app/mountain/[slug]/index.tsx` for examples.

### Form inputs

The atoms barrel (`@/components/ui/atoms`) exports the canonical controls: `ThemedTextInput`, `ThemedDateInput`, `ThemedCheckbox`, `ThemedToggleInput` (yes/no with animated thumb), and `ThemedTierPicker` (1..N labeled pills — nullable, tap selected pill to clear). `ThemedTierPicker` takes an optional `labels: readonly string[]` so the same component works for numbered scales (`count: 5`) and named scales (`labels={["Dangerous", "Risky", "Okay", "Safe", "Very safe"]}`). Build label tuples at component-body level via `intl.formatMessage` — matches the existing "options list" pattern used by plan/challenge pickers.

Selected-state styling for selectable chips / pills across the app is `border-primary bg-primary/10 text-primary` (see `app/user/summits/index.tsx`, `app/hiscores.tsx`). The fully-filled `bg-primary text-white` treatment is reserved for primary CTAs (`<Button>`, pulse badges), not selectable list items — don't mix them.

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
   - **Sort order is strict ASCII** (uppercase `A-Z` before lowercase `a-z`, symbols `+ /` before digits). Don't use `sort -f` / case-insensitive `localeCompare` — that reorders the existing file and produces a huge spurious diff. The safe approach is to insert each new hash at its strict-ASCII alphabetical position (or, when bulk-inserting, run `JSON.stringify(Object.fromEntries(Object.entries(obj).sort()))` — default JS `sort()` is codepoint-ascending, which matches the file's existing order).
6. Translate the values in ca.json and es.json

**Translation Files:**
- `translations/raw-en.json` - Extracted messages (intermediate)
- `translations/en.json` - Compiled English (used by app)
- `translations/ca.json` - Catalan translations (manual)
- `translations/es.json` - Spanish translations (manual)

## Common Tasks

### Add Native Module

```bash
npx expo install <package-name>
```

Requires a new EAS dev build (`eas build --profile development`); Expo Go won't load unlinked native modules.

If TS reports `Cannot find module 'expo-modules-core'` or empty types after adding an Expo module, add `expo-modules-core` as an **explicit** dep in `packages/app/package.json` (`npx expo install expo-modules-core`). Yarn workspaces nest it under `node_modules/expo/node_modules/` where sibling packages can't resolve it.

## Push Notifications

- Token flow: `lib/push.ts` (`getPushTokenIfGranted` / `requestPushPermission`) → `domains/user/push.api.ts` (`usePushTokenRegistration` / `usePushTokenMutation`) → `POST /api/protected/user/push-token`.
- **Never call `requestPushPermission()` directly from a screen.** The native OS dialog is one-shot per install on iOS — a cold denial is permanent. Go through `hooks/use-ask-push-permission.ts` which shows our in-app CTA (`PushPermissionDialog`) first, honors a 7-day dismiss cooldown, and only triggers the OS dialog on user confirm.
- Triggers are bound to context moments, not app launch: Plans first-visit, first summit created, and join-plan success (the last bypasses the cooldown with `ask({ bypassCooldown: true })`).
- `usePushTokenRegistration` in `_layout.tsx` re-registers the token on auth change but never prompts — it calls `getPushTokenIfGranted` (no-ops unless permission already granted).
- Notification **body copy is server-side** (API reads `userTable.locale`) — do not translate push strings in the app.
- Tap routing uses both `useLastNotificationResponse` (cold-start) and `addNotificationResponseReceivedListener` (warm); dedupe via `notification.request.identifier`.
- Physical device required — simulators/emulators don't receive tokens.
- Credentials live in EAS: APNs `.p8` (iOS push), FCM V1 service account JSON (Android push, project `cims-bcc70`), and `GOOGLE_SERVICES_JSON` file secret (used by `app.config.ts` `android.googleServicesFile`). Manage via `eas credentials` / `eas env:list`.

## Location permissions

Same "one-shot-per-install" concern as push. `hooks/use-location.ts` takes a `prompt` option:

- `prompt: false` (default) — reads current permission state with `getForegroundPermissionsAsync`, never opens the OS dialog. Use this in screens that show distance as an enhancement (home recommendations, mountain detail, `_layout.tsx`'s `LocationSync`). Falls back gracefully when permission is absent.
- `prompt: true` — only set on `app/mountains.tsx`, the single context-bound trigger. The user just opened a list of peaks sorted by distance, so the OS prompt has clear context.

If you add a new screen that needs location, default to `prompt: false` + graceful fallback. Only add `prompt: true` to a screen where distance is the primary purpose and the user's intent is unambiguous.

## Environment Variables

Must prefix with `EXPO_PUBLIC_` to access in app:
- `EXPO_PUBLIC_API_URL`: Backend URL
- OAuth client IDs for Google/Apple

## Removing Dependencies

Before removing a package from `packages/app/package.json` because "nothing imports it," verify it isn't a **peer dependency** of something that IS used. Many native / framework packages have no explicit imports in our source but are required transitively.

Check with:

```bash
node -e "console.log(JSON.stringify(require('./node_modules/PACKAGE/package.json').peerDependencies, null, 2))"
```

Known peer-dep requirements in this app (do not remove blindly):

| Package | Required by |
| ---- | ---- |
| `react-native-css` | `nativewind@5.x` |
| `react-dom`, `react-native-safe-area-context`, `react-native-screens`, `react-native-web` | `expo-router` |
| `react-native-worklets` | `react-native-reanimated@4.x` (it's the runtime, not redundant) |
| `react-native-svg` | `lucide-react-native` (icon rendering) |
| `react-native-web` | also required by `react-native-maps` |

After editing `package.json`, run `yarn install` and **read the warnings** — unmet peer-dep warnings tell you what you just broke.

## Build & Deploy

```bash
eas build --profile development  # Dev build with expo-dev-client
eas build --profile preview      # Internal preview
eas build --profile production   # Production release
```

See `eas.json` for build profiles.
