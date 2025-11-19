# Mobile App - AI Development Guide

> **Part of the 100cims monorepo.** See the [root CLAUDE.md](../../CLAUDE.md) for overall architecture.

## Architecture

### Stack
- **Expo SDK 54** with React Native 0.81 (new architecture enabled)
- **expo-router 6** for file-based navigation
- **NativeWind 4** for styling (Tailwind CSS)
- **React Query 5** for server state
- **React Intl** for i18n (en, ca, es)

### Directory Structure
- `/app/`: expo-router screens (file-based routing)
- `/domains/`: Feature-specific business logic
- `/hooks/`: Shared React hooks
- `/lib/`: Utility functions (api-client, auth, dates, images, location)
- `/components/`: Reusable UI components
- `/translations/`: i18n message files

### Domain Pattern
Each domain folder typically contains:
- `*.api.ts`: React Query hooks for API calls
- `*.utils.ts`: Domain-specific utilities
- `*.types.ts`: TypeScript types (optional)

Example: `/domains/user/user.api.ts` exports `useUser()`, `useUpdateUser()`, etc.

## Key Patterns

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

### Authentication
- JWT stored in AsyncStorage
- `setAuthToken(token)` in lib/api-client.ts sets Authorization header
- Protected routes check auth state in _layout.tsx

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

### Translations
```typescript
import { useIntl } from 'react-intl';

const { formatMessage } = useIntl();
const title = formatMessage({
  id: 'screen.title',
  defaultMessage: 'Default Title'
});
```

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

### Update Translations
```bash
yarn translations:extract  # Extract from code
yarn translations:generate # Compile English
# Manually copy new keys to ca.json, es.json
```

### Add Native Module
```bash
npx expo install <package-name>
```
May need to rebuild: `npx expo prebuild --clean`

## Environment Variables
Must prefix with `EXPO_PUBLIC_` to access in app:
- `EXPO_PUBLIC_API_URL`: Backend URL
- `EXPO_PUBLIC_REACT_ANALYTICS_KEY`: Analytics key
- OAuth client IDs for Google/Apple

## Debugging

### Common Issues
- **Type errors**: Regenerate API types
- **Navigation issues**: Check expo-router file structure
- **Styling not applying**: Verify NativeWind babel config, global.css import
- **OAuth not working**: Check google-services.json, Apple config in app.config.ts

### Helpful Commands
```bash
npx expo start --clear          # Clear cache
npx expo-doctor                 # Diagnose issues
npx uri-scheme list             # Check deep linking
~/Library/Android/sdk/platform-tools/adb logcat *:E  # Android errors
```

## Build & Deploy
```bash
eas build --profile development  # Dev build with expo-dev-client
eas build --profile preview      # Internal preview
eas build --profile production   # Production release
```

See `eas.json` for build profiles.
