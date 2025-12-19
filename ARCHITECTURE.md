# Family Management Application - Architecture Documentation

## Overview

This application is a family-oriented eye exercise training system supporting three distinct user types with different authentication and access patterns.

## User Types

### 1. Parent (Family Manager)
- **Authentication**: Email/password via Supabase Auth
- **Profile**: Stored in `profiles` table with role='parent'
- **Capabilities**:
  - Create and manage family
  - Add linked children to family
  - Generate device pairing codes for children
  - View children's progress
  - Manage family settings

### 2. Linked Child (Player)
- **Authentication**: Device pairing with temporary code
- **Profile**: Stored in `children` table with `user_id=null`
- **Capabilities**:
  - Complete eye exercises
  - View own progress
  - Earn points and rewards
  - Access training journey
- **Device Binding**: Once paired, child data stored in AsyncStorage

### 3. Independent Child (Player + Admin)
- **Authentication**: Email/password via Supabase Auth
- **Profile**: Stored in both `profiles` (role='child_independent') and `children` tables
- **Capabilities**:
  - All Linked Child capabilities
  - Manage own account
  - Update personal information
  - No parental oversight required

## Architecture Layers

### 1. Data Layer (Database)

#### Tables

**profiles**
- Primary table for authenticated users
- Fields: id, email, full_name, role, avatar_url
- Linked to auth.users via foreign key
- RLS: Users can read/update their own profile

**families**
- Represents family units
- Fields: id, parent_user_id, name
- One-to-one with parent profile
- RLS: Parents can manage their own family

**children**
- Player profiles (both linked and independent)
- Fields: id, family_id, user_id, name, age, is_independent, linking_code, current_streak, total_minutes_practiced
- RLS: Parents can manage their children, children can read/update own data

**eye_exercises**
- Exercise library
- Fields: id, exercise_name, description, category, media_type, video_link, audio_link

**practice_logs**
- Exercise completion tracking
- Fields: id, child_id, exercise_id, duration_seconds, completed_at

**points_wallet**
- Points and rewards tracking
- Fields: child_id, current_balance, total_earned

### 2. Domain Layer (Business Logic)

Located in `/lib/domains/`, organized by business domain:

#### Authentication Domain (`/lib/domains/auth/`)

**authDomain.ts**
- `signUp(data)` - Register new user (parent or independent child)
- `signIn(data)` - Authenticate user
- `signOut()` - Sign out user
- `getProfile(userId)` - Fetch user profile
- `getChildForIndependentUser(userId)` - Fetch child record for independent child

**devicePairing.ts**
- `pairDevice(code)` - Pair device with child using code
- `getLinkedChild()` - Retrieve linked child from AsyncStorage
- `unlinkDevice()` - Remove device pairing
- `generateLinkingCode(childId)` - Create temporary pairing code

#### Family Domain (`/lib/domains/family/`)

**familyDomain.ts**
- `createFamily(data)` - Create new family
- `getFamilyByParent(parentUserId)` - Get parent's family
- `updateFamily(familyId, name)` - Update family details

**childrenDomain.ts**
- `createLinkedChild(data)` - Add child to family
- `createIndependentChild(data)` - Create independent child profile
- `getFamilyChildren(familyId)` - List all children in family
- `getChild(childId)` - Get child details
- `updateChild(childId, updates)` - Update child data
- `deleteChild(childId)` - Remove child

### 3. State Management Layer

**AuthContext** (`/app/context/AuthContext.tsx`)
- Single source of truth for authentication state
- Manages:
  - `session` - Supabase session (null for linked children)
  - `userProfile` - Profile data (null for linked children)
  - `activeChild` - Current child player data
  - `isLoading` - Loading state
  - `isInitialized` - Initialization complete flag
- Methods:
  - `signOut()` - Logout user/unlink device
  - `pairChildDevice(code)` - Pair device
  - `refreshActiveChild()` - Reload child data
  - `setActiveChild(child)` - Switch active child (for parents)

### 4. API Layer

RESTful API routes in `/app/api/`:

**Authentication**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/pairing` - Device pairing operations

**Children Management**
- `GET /api/children/manage` - List or get child
- `POST /api/children/manage` - Create child
- `PUT /api/children/manage` - Update child
- `DELETE /api/children/manage` - Delete child

### 5. Presentation Layer (UI)

#### Screen Organization

**Unauthenticated Flows** (`/app/auth/`)
- `parent-login.tsx` - Parent login
- `onboarding.tsx` - Parent registration
- `child-login.tsx` - Child device pairing
- `child-independent.tsx` - Independent child login
- `child-onboarding.tsx` - Independent child registration

**Authenticated Flows** (`/app/(tabs)/`)
- `index.tsx` - Parent dashboard / child home
- `progress.tsx` - Training progress view
- `gallery.tsx` - Exercise library
- `settings.tsx` - User settings
- `info.tsx` - Information and help

**Child Profiles**
- `/app/child-profile/[id].tsx` - View child (parent view)
- `/app/child-profile-independent/` - Independent child self-management

**Exercises**
- `/app/exercise/[id].tsx` - Exercise player

## Authentication Workflows

### Parent Registration & Login

1. User enters email/password and name
2. `authDomain.signUp()` creates auth user and profile
3. `familyDomain.createFamily()` creates family record
4. Session established, redirects to parent dashboard
5. Parent can add children via `childrenDomain.createLinkedChild()`

### Linked Child Device Pairing

1. Parent generates code via `devicePairing.generateLinkingCode()`
2. Child enters code on new device
3. `devicePairing.pairDevice()` validates code
4. Child ID stored in AsyncStorage
5. No Supabase session created
6. Child redirects to training screen

### Independent Child Registration & Login

1. Child enters email/password, name, and age
2. `authDomain.signUp()` creates auth user and profile (role='child_independent')
3. `childrenDomain.createIndependentChild()` creates child record
4. Session established, redirects to training screen
5. Child has full account management access

## Data Flow Examples

### Parent Views Child Progress

```
Parent Dashboard
  → setActiveChild(child)
  → AuthContext updates activeChild
  → Progress Screen reads activeChild from useAuth()
  → Displays child's exercise history from practice_logs
```

### Linked Child Completes Exercise

```
Exercise Screen
  → Child completes exercise
  → exercisesService.logPractice(childId, exerciseId, duration)
  → Database: INSERT into practice_logs
  → Trigger updates child streak/minutes
  → Trigger awards points to points_wallet
  → refreshActiveChild() updates local state
```

### Device Pairing Flow

```
Parent Flow:
  Parent Dashboard
    → Select child
    → Click "Generate Code"
    → devicePairing.generateLinkingCode(childId)
    → RPC function generates 6-char code, stores in DB with expiry
    → Display code to parent

Child Flow:
  Child Device
    → Enter code screen
    → Input code
    → devicePairing.pairDevice(code)
    → RPC function validates code and expiry
    → Returns child data
    → Store child.id in AsyncStorage
    → Navigate to training screen
```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

- **profiles**: Users can only access their own profile
- **families**: Parents can only access their own family
- **children**:
  - Parents can manage children in their family
  - Children can read/update their own record
  - Independent children have additional permissions
- **practice_logs**: Users can only access logs for their own children
- **points_wallet**: Users can only access their own points

### Device Pairing Security

- Codes are 6-character alphanumeric, uppercase
- Codes expire after configurable time period
- Codes are single-use and deleted after successful pairing
- RPC functions handle validation server-side
- No child data exposed without valid code

### Session Management

- Parent/independent child sessions managed by Supabase Auth
- Linked children have no Supabase session
- Linked children authenticated via AsyncStorage child ID
- All API calls validate permissions server-side

## File Structure

```
/app
  /_layout.tsx                    # Root layout with AuthProvider
  /index.tsx                      # Initial routing logic
  /user-type.tsx                  # User type selection
  /auth/                          # Authentication flows
    /_layout.tsx
    /parent-login.tsx
    /onboarding.tsx
    /child-login.tsx
    /child-independent.tsx
    /child-onboarding.tsx
  /(tabs)/                        # Main app screens
    /_layout.tsx
    /index.tsx                    # Home/dashboard
    /progress.tsx                 # Training progress
    /gallery.tsx                  # Exercise library
    /settings.tsx
    /info.tsx
  /exercise/
    /[id].tsx                     # Exercise player
  /child-profile/
    /[id].tsx                     # Child profile (parent view)
  /child-profile-independent/     # Independent child self-management
  /api/                           # API routes
    /auth/
      /signup+api.ts
      /pairing+api.ts
    /children/
      /manage+api.ts
  /context/
    /AuthContext.tsx              # Global auth state

/lib
  /supabase.ts                    # Supabase client
  /domains/                       # Domain services
    /index.ts                     # Exports
    /auth/
      /authDomain.ts
      /devicePairing.ts
    /family/
      /familyDomain.ts
      /childrenDomain.ts

/types
  /zoomi.ts                       # TypeScript types

/supabase
  /migrations/                    # Database migrations
```

## Best Practices

### 1. Service Usage
- Always use domain services, never direct Supabase queries in UI
- Services handle all error cases and return consistent result types
- Services are the single source of truth for business logic

### 2. State Management
- Use `useAuth()` hook in all components needing auth state
- Never duplicate auth state in component local state
- Call `refreshActiveChild()` after operations that modify child data

### 3. Navigation
- Initial routing in `/app/index.tsx` based on auth state
- Protect routes by checking auth state in screen components
- Use `router.replace()` for auth-related navigation (not `push()`)

### 4. Type Safety
- All types defined in `/types/zoomi.ts`
- Types match database schema exactly
- Use TypeScript for all service functions

### 5. Error Handling
- Services return `{ success, data?, error? }` format
- Display user-friendly error messages in UI
- Log technical errors to console for debugging

## Migration Guide

### From Old Structure to New Structure

1. **Replace direct Supabase calls** with domain services:
   ```typescript
   // Old
   const { data } = await supabase.from('children').select('*')

   // New
   const children = await childrenDomain.getFamilyChildren(familyId)
   ```

2. **Replace authService** with AuthContext:
   ```typescript
   // Old
   import { checkAuthState } from '@/lib/authService'

   // New
   import { useAuth } from '@/app/context/AuthContext'
   const { session, userProfile, activeChild } = useAuth()
   ```

3. **Update type imports**:
   ```typescript
   // Update field names to match database
   // first_name → full_name
   // parent_id → parent_user_id
   ```

4. **Use API routes** for complex operations:
   ```typescript
   // Use fetch to call API routes instead of direct service calls
   // Especially useful for multi-step operations like signup
   ```

## Testing Strategy

### Unit Tests
- Test domain services with mocked Supabase client
- Test business logic in isolation
- Verify error handling

### Integration Tests
- Test auth flows end-to-end
- Verify RLS policies work correctly
- Test device pairing workflow

### E2E Tests
- Test complete user journeys
- Verify navigation flows
- Test with different user types

## Performance Considerations

- Lazy load exercise media (videos/audio)
- Cache child data in AsyncStorage for linked children
- Optimize database queries with proper indexes
- Use React.memo for expensive component renders
- Implement pagination for large lists
