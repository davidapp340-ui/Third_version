# Migration Checklist

## Overview

This checklist tracks the migration of existing screens from the old architecture to the new domain-based architecture.

## Migration Pattern

For each file that imports `authService` or `familyService`:

### Old Pattern
```typescript
import { checkAuthState } from '@/lib/authService';
import { getFamilyChildren } from '@/lib/familyService';

const authState = await checkAuthState();
const children = await getFamilyChildren(familyId);
```

### New Pattern
```typescript
import { useAuth } from '@/app/context/AuthContext';
import { childrenDomain } from '@/lib/domains';

const { session, userProfile, activeChild } = useAuth();
const children = await childrenDomain.getFamilyChildren(familyId);
```

## Files to Migrate

### High Priority (Authentication & Core Flows)

- [ ] `app/(tabs)/_layout.tsx`
- [ ] `app/(tabs)/index.tsx`
- [ ] `app/(tabs)/gallery.tsx`
- [ ] `app/(tabs)/progress.tsx`
- [ ] `app/(tabs)/settings.tsx`
- [ ] `app/auth/parent-login.tsx`
- [ ] `app/auth/child-login.tsx`
- [ ] `app/auth/child-independent.tsx`
- [ ] `app/auth/child-onboarding.tsx`
- [ ] `app/auth/callback.tsx`

### Medium Priority (Child Management)

- [ ] `app/add-child.tsx`
- [ ] `app/child-profile/[id].tsx`
- [ ] `app/exercise/[id].tsx`
- [ ] `components/ChildHomeScreen.tsx`

### Low Priority (Other)

- [ ] `app/sync-exercises+api.ts` (needs different migration)
- [ ] `components/ProgressExamples.tsx` (mock data file missing)
- [ ] `app/child-profile-independent/settings.tsx` (type error, not import)

## Migration Steps per File

1. **Read the file** to understand current usage
2. **Identify imports** from `authService` or `familyService`
3. **Replace with domain imports** or `useAuth` hook
4. **Update function calls** to match new API
5. **Handle error cases** with new result format
6. **Test the functionality** to ensure it works
7. **Check mark** the file in this checklist

## Common Replacements

### Authentication State

| Old | New |
|-----|-----|
| `const authState = await checkAuthState()` | `const { session, userProfile, activeChild } = useAuth()` |
| `authState.isAuthenticated` | `session !== null` or `activeChild !== null` |
| `authState.userType` | `userProfile?.role` |
| `authState.parentProfile` | `userProfile` |
| `authState.activeChild` | `activeChild` |

### Authentication Operations

| Old | New |
|-----|-----|
| `pairDeviceWithCode(code)` | `await pairChildDevice(code)` (from useAuth) |
| `logout()` | `await signOut()` (from useAuth) |
| `generateCodeForChild(childId)` | `await devicePairing.generateLinkingCode(childId)` |

### Family & Children

| Old | New |
|-----|-----|
| `getFamilyChildren(familyId)` | `await childrenDomain.getFamilyChildren(familyId)` |
| `createLinkedChild(familyId, name)` | `await childrenDomain.createLinkedChild({ familyId, name, age })` |
| `deleteChild(childId)` | `await childrenDomain.deleteChild(childId)` |

## Special Cases

### Components Using Auth State

Components that need auth state should use the `useAuth` hook:

```typescript
import { useAuth } from '@/app/context/AuthContext';

function MyComponent() {
  const { session, userProfile, activeChild, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!activeChild) return <NoChildSelected />;

  return <View>...</View>;
}
```

### API Routes

API routes cannot use React hooks, so they should use domain services directly:

```typescript
import { authDomain, childrenDomain } from '@/lib/domains';

export async function POST(request: Request) {
  const result = await authDomain.signUp(data);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  // ...
}
```

### Non-React Files

Files that aren't React components (utilities, helpers) should use domain services:

```typescript
import { authDomain } from '@/lib/domains';

export async function someUtility() {
  const profile = await authDomain.getProfile(userId);
  // ...
}
```

## Known Issues

1. **AsyncStorage Import Error** in `devicePairing.ts`
   - Package might not be installed
   - Solution: Verify `@react-native-async-storage/async-storage` is in dependencies

2. **Missing exercisesDataSource**
   - File `lib/exercisesDataSource` doesn't exist
   - Needs investigation or creation

3. **Missing mockProgressData**
   - File `lib/mockProgressData` doesn't exist
   - Needs investigation or creation

4. **Edge Function Errors**
   - Edge functions use Deno APIs
   - These are expected and don't affect app functionality

## Progress

**Total Files**: 17
**Migrated**: 0
**In Progress**: 0
**Remaining**: 17

## Notes

- The AuthContext is now the source of truth for all auth state
- Domain services return `{ success, data?, error? }` format
- All async operations should handle errors gracefully
- Use TypeScript for type safety throughout

## Testing After Migration

For each migrated file, verify:
- [ ] TypeScript compiles without errors
- [ ] Auth state is accessed correctly
- [ ] User can perform expected actions
- [ ] Error handling works properly
- [ ] No console errors at runtime
