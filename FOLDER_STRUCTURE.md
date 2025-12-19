# Application Folder Structure

This document outlines the hierarchical organization of the codebase, showing how different components are organized by domain and responsibility.

## Root Structure

```
zoomi-app/
├── app/                          # Application screens and routes
│   ├── _layout.tsx               # Root layout with AuthProvider
│   ├── index.tsx                 # Initial routing logic
│   ├── user-type.tsx             # User type selection screen
│   ├── add-child.tsx             # Add child flow
│   ├── consent-policy.tsx        # Consent and policy screens
│   │
│   ├── auth/                     # Authentication flows by user type
│   │   ├── _layout.tsx           # Auth section layout
│   │   ├── parent-login.tsx      # Parent email/password login
│   │   ├── onboarding.tsx        # Parent registration
│   │   ├── child-login.tsx       # Child device pairing screen
│   │   ├── child-independent.tsx # Independent child login
│   │   └── child-onboarding.tsx  # Independent child registration
│   │
│   ├── (tabs)/                   # Main app tabs (authenticated users)
│   │   ├── _layout.tsx           # Tab navigation configuration
│   │   ├── index.tsx             # Home screen (parent dashboard / child home)
│   │   ├── progress.tsx          # Training progress and statistics
│   │   ├── gallery.tsx           # Exercise library browser
│   │   ├── settings.tsx          # User settings and preferences
│   │   └── info.tsx              # Information and help
│   │
│   ├── exercise/                 # Exercise screens
│   │   ├── _layout.tsx           # Exercise section layout
│   │   └── [id].tsx              # Exercise player (dynamic route)
│   │
│   ├── child-profile/            # Child profile (parent view)
│   │   └── [id].tsx              # View/edit child (dynamic route)
│   │
│   ├── child-profile-independent/ # Independent child self-management
│   │   ├── _layout.tsx           # Profile section layout
│   │   ├── index.tsx             # Profile overview
│   │   ├── personal-info.tsx     # Edit personal information
│   │   ├── settings.tsx          # Child-specific settings
│   │   ├── contact.tsx           # Contact information
│   │   └── qa.tsx                # Q&A / help
│   │
│   ├── api/                      # Backend API routes
│   │   ├── auth/
│   │   │   ├── signup+api.ts     # User registration endpoint
│   │   │   └── pairing+api.ts    # Device pairing endpoint
│   │   └── children/
│   │       └── manage+api.ts     # Child CRUD operations
│   │
│   └── context/                  # React Context providers
│       └── AuthContext.tsx       # Global authentication state
│
├── lib/                          # Business logic and utilities
│   ├── supabase.ts               # Supabase client configuration
│   │
│   ├── domains/                  # Domain services (organized by business domain)
│   │   ├── index.ts              # Central exports for all domains
│   │   │
│   │   ├── auth/                 # Authentication domain
│   │   │   ├── authDomain.ts     # User auth (sign up, sign in, sign out)
│   │   │   └── devicePairing.ts  # Device pairing with temporary codes
│   │   │
│   │   └── family/               # Family management domain
│   │       ├── familyDomain.ts   # Family operations
│   │       └── childrenDomain.ts # Children management
│   │
│   ├── exercisesService.ts       # Exercise operations (existing)
│   ├── pointsService.ts          # Points and rewards (existing)
│   ├── trackService.ts           # Training track operations (existing)
│   ├── sessionService.ts         # Session management (existing)
│   ├── notificationService.ts    # Notifications (existing)
│   ├── reactionService.ts        # Reactions/feedback (existing)
│   ├── childMetricsService.ts    # Child metrics (existing)
│   └── textService.ts            # Internationalization (existing)
│
├── components/                   # Reusable UI components
│   ├── ChildHomeScreen.tsx       # Child dashboard component
│   ├── DayDetailModal.tsx        # Progress day details
│   ├── ProgressExamples.tsx      # Progress visualization examples
│   └── [documentation files]
│
├── types/                        # TypeScript type definitions
│   ├── zoomi.ts                  # Core domain types
│   └── progress.ts               # Progress-related types
│
├── hooks/                        # Custom React hooks
│   ├── useFrameworkReady.ts      # Framework initialization hook
│   └── useTexts.ts               # Internationalization hook
│
├── assets/                       # Static assets
│   └── images/                   # Images and icons
│
├── supabase/                     # Database configuration
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
│
├── ARCHITECTURE.md               # Architecture documentation
├── FOLDER_STRUCTURE.md           # This file
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Organization Principles

### 1. Separation by User Type

Authentication screens are organized by user journey:
- **Parent Flow**: `parent-login.tsx` → `onboarding.tsx`
- **Linked Child Flow**: `child-login.tsx` (device pairing)
- **Independent Child Flow**: `child-independent.tsx` → `child-onboarding.tsx`

### 2. Domain-Driven Services

Business logic organized by domain in `/lib/domains/`:
- **auth/** - All authentication-related operations
- **family/** - Family and children management
- Each domain has focused, single-responsibility services

### 3. Hierarchical Screens

Main app screens organized in tabs with clear hierarchy:
```
(tabs)/
  ├── index         # Entry point (different view per user type)
  ├── progress      # Player progress (all user types)
  ├── gallery       # Exercise browser (all user types)
  ├── settings      # User settings (role-specific)
  └── info          # Help and information
```

### 4. API Routes by Domain

Backend endpoints grouped by functional area:
- `/api/auth/` - Authentication operations
- `/api/children/` - Child management operations

### 5. Shared Utilities

Common utilities accessible from `/lib/`:
- Database client (`supabase.ts`)
- Service layer (domain services)
- Existing specialized services (exercises, points, etc.)

## Key Files

### Entry Points

- `app/_layout.tsx` - Root of the application, wraps with AuthProvider
- `app/index.tsx` - Initial routing based on auth state
- `app/user-type.tsx` - User type selection for unauthenticated users

### Authentication

- `app/context/AuthContext.tsx` - Single source of truth for auth state
- `lib/domains/auth/authDomain.ts` - Core auth operations
- `lib/domains/auth/devicePairing.ts` - Device pairing logic

### Business Logic

- `lib/domains/family/familyDomain.ts` - Family operations
- `lib/domains/family/childrenDomain.ts` - Child CRUD
- Existing services in `/lib/` for specialized features

### Type Definitions

- `types/zoomi.ts` - Core domain types (Profile, Child, Family, etc.)
- All types match database schema exactly

## Navigation Flow

### Unauthenticated
```
index.tsx
  ↓
user-type.tsx
  ↓
auth/parent-login.tsx OR auth/child-login.tsx OR auth/child-independent.tsx
  ↓
Authenticated tabs
```

### Parent Flow
```
auth/parent-login.tsx
  ↓
(tabs)/index.tsx (Parent Dashboard)
  ├→ View child progress
  ├→ Add new child (add-child.tsx)
  ├→ Generate pairing code
  └→ Manage settings
```

### Linked Child Flow
```
auth/child-login.tsx (Enter pairing code)
  ↓
(tabs)/progress.tsx (Training screen)
  ├→ View progress
  ├→ Access exercises
  └→ Earn points
```

### Independent Child Flow
```
auth/child-independent.tsx
  ↓
(tabs)/progress.tsx (Training screen)
  ├→ All linked child features
  └→ child-profile-independent/ (Self-management)
```

## Modification Guidelines

### Adding a New Screen

1. Determine the user type and domain
2. Place in appropriate folder:
   - Auth flow → `app/auth/`
   - Main feature → `app/(tabs)/`
   - Child-specific → `app/child-profile/` or `app/child-profile-independent/`
3. Register in `app/_layout.tsx`

### Adding a New Service

1. Identify the business domain
2. Create in `lib/domains/[domain]/`
3. Export from `lib/domains/index.ts`
4. Follow pattern: return `{ success, data?, error? }`

### Adding a New API Route

1. Place in `app/api/[domain]/`
2. Use `+api.ts` suffix
3. Export HTTP method functions (GET, POST, PUT, DELETE)
4. Use domain services for business logic

### Adding a New Type

1. Add to appropriate file in `/types/`
2. Ensure it matches database schema
3. Export from the type file
4. Import where needed via `@/types/[filename]`

## Code Examples

### Using Domain Services

```typescript
import { authDomain, childrenDomain } from '@/lib/domains';

const result = await childrenDomain.createLinkedChild({
  familyId: family.id,
  name: 'Alice',
  age: 8
});

if (result.success) {
  console.log('Child created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Using Auth Context

```typescript
import { useAuth } from '@/app/context/AuthContext';

function MyComponent() {
  const { session, userProfile, activeChild, signOut } = useAuth();

  if (userProfile?.role === 'parent') {
    return <ParentView />;
  }

  return <ChildView />;
}
```

### Creating an API Route

```typescript
// app/api/children/list+api.ts
import { childrenDomain } from '@/lib/domains';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const familyId = url.searchParams.get('familyId');

  if (!familyId) {
    return Response.json({ error: 'Missing familyId' }, { status: 400 });
  }

  const children = await childrenDomain.getFamilyChildren(familyId);
  return Response.json({ children });
}
```

## Naming Conventions

### Files
- Screens: PascalCase (e.g., `ParentLogin.tsx`)
- Services: camelCase with domain suffix (e.g., `authDomain.ts`)
- API routes: kebab-case with `+api` suffix (e.g., `signup+api.ts`)
- Types: camelCase (e.g., `zoomi.ts`)

### Functions
- Services: camelCase, verb-first (e.g., `createFamily`, `getChildren`)
- Components: PascalCase (e.g., `ParentDashboard`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth`)

### Variables
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_CODE_LENGTH`)
- Props: camelCase (e.g., `childId`, `onSuccess`)
- State: camelCase (e.g., `isLoading`, `errorMessage`)

## Development Workflow

1. **Feature Planning** - Identify user type and domain
2. **Database Schema** - Create/update migrations if needed
3. **Types** - Define TypeScript interfaces
4. **Domain Service** - Implement business logic
5. **API Route** - Create endpoint if needed
6. **UI Screen** - Build user interface
7. **Navigation** - Wire up routing
8. **Testing** - Verify end-to-end flow

This structure ensures clear separation of concerns, making the codebase maintainable and scalable as features are added.
