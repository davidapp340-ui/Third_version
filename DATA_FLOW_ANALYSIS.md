# Application Data Flow Analysis & Optimization

## Executive Summary

**Critical Issue**: Multiple screens are attempting to access **deleted service files**, causing complete application failure. These screens need immediate migration to the new architecture.

**Impact**: 5 key screens + 1 component are broken and non-functional.

## 1. Complete Screen Inventory

### Authentication Flows

| Screen | Path | Purpose | Data Dependencies | Status |
|--------|------|---------|------------------|--------|
| **User Type Selection** | `app/user-type.tsx` | Select user type (parent/child) | None | ✅ Working |
| **Parent Login** | `app/auth/parent-login.tsx` | Parent email/password auth | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Parent Onboarding** | `app/auth/onboarding.tsx` | Parent registration | ⚠️ Unknown imports | ⚠️ NEEDS CHECK |
| **Child Login (Pairing)** | `app/auth/child-login.tsx` | Device pairing with code | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Child Independent** | `app/auth/child-independent.tsx` | Independent child login | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Child Onboarding** | `app/auth/child-onboarding.tsx` | Independent child registration | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Auth Callback** | `app/auth/callback.tsx` | OAuth callback handler | ❌ `authService` (deleted) | 🔴 BROKEN |

### Main Application Screens

| Screen | Path | Purpose | Data Dependencies | Status |
|--------|------|---------|------------------|--------|
| **Home (Router)** | `app/(tabs)/index.tsx` | Route to parent or child home | ❌ `authService`, `familyService` | 🔴 BROKEN |
| **Progress** | `app/(tabs)/progress.tsx` | Training progress view | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Gallery** | `app/(tabs)/gallery.tsx` | Exercise library | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Settings** | `app/(tabs)/settings.tsx` | User settings | ❌ `authService` (deleted) | 🔴 BROKEN |
| **Info** | `app/(tabs)/info.tsx` | Information/help | ⚠️ Unknown imports | ⚠️ NEEDS CHECK |

### Child Management

| Screen | Path | Purpose | Data Dependencies | Status |
|--------|------|---------|------------------|--------|
| **Add Child** | `app/add-child.tsx` | Create linked child | ❌ `authService`, `familyService` | 🔴 BROKEN |
| **Child Profile** | `app/child-profile/[id].tsx` | View/manage child (parent) | ❌ `authService`, `familyService` | 🔴 BROKEN |
| **Independent Profile** | `app/child-profile-independent/*` | Self-management screens | ⚠️ Unknown imports | ⚠️ NEEDS CHECK |

### Exercise Screens

| Screen | Path | Purpose | Data Dependencies | Status |
|--------|------|---------|------------------|--------|
| **Exercise Detail** | `app/exercise/[id].tsx` | Exercise player | ❌ `authService`, `familyService` | 🔴 BROKEN |

### Components

| Component | Path | Purpose | Data Dependencies | Status |
|-----------|------|---------|------------------|--------|
| **ChildHomeScreen** | `components/ChildHomeScreen.tsx` | Child dashboard | ❌ `authService`, `familyService` | 🔴 BROKEN |
| **DayDetailModal** | `components/DayDetailModal.tsx` | Progress day details | ⚠️ Unknown imports | ⚠️ NEEDS CHECK |
| **ProgressExamples** | `components/ProgressExamples.tsx` | Progress visualization | ❌ `mockProgressData` (missing) | 🔴 BROKEN |

## 2. Broken Data Dependencies (Critical Issues)

### 🔴 CRITICAL: Deleted Service Files

The following files were deleted during restructuring but are still being imported:

#### `lib/authService.ts` ❌ DELETED
**Imported by 12 files:**
1. `app/(tabs)/_layout.tsx` (line 6)
2. `app/(tabs)/gallery.tsx` (line 14)
3. `app/(tabs)/index.tsx` (line 15)
4. `app/(tabs)/progress.tsx` (line 18)
5. `app/(tabs)/settings.tsx` (line 6)
6. `app/add-child.tsx` (line 16)
7. `app/auth/callback.tsx` (line 4)
8. `app/auth/child-independent.tsx` (line 5)
9. `app/auth/child-login.tsx` (line 5)
10. `app/auth/child-onboarding.tsx` (line 4)
11. `app/auth/parent-login.tsx` (line 16)
12. `app/exercise/[id].tsx` (line 16)
13. `components/ChildHomeScreen.tsx` (line 15)

**Functions being called:**
- `getCurrentUser()` - Get current authenticated user
- `checkAuthState()` - Check authentication status
- `pairDeviceWithCode(code)` - Device pairing
- `generateCodeForChild(childId)` - Generate pairing code
- `signInWithEmail(data)` - Email/password sign in
- `signUpWithEmail(data)` - User registration
- `signInWithGoogle(role)` - Google OAuth
- `signInWithFacebook(role)` - Facebook OAuth

#### `lib/familyService.ts` ❌ DELETED
**Imported by 5 files:**
1. `app/(tabs)/index.tsx` (lines 17-22)
2. `app/add-child.tsx` (line 17)
3. `app/child-profile/[id].tsx` (line 31)
4. `app/exercise/[id].tsx` (line 17)
5. `components/ChildHomeScreen.tsx` (lines 16-17)

**Functions being called:**
- `getParentProfile(userId)` - Get parent profile
- `getFamily(userId)` - Get family
- `getChildren(familyId)` - Get all children in family
- `getResearchMessages()` - Get research messages
- `createLinkedChild(familyId, name)` - Create new child
- `getChildByUserId(userId)` - Get child by user ID

### 🔴 CRITICAL: Missing Data Source Files

#### `lib/exercisesDataSource` ❌ MISSING
**Imported by:**
- `app/sync-exercises+api.ts` (line 12)

**Purpose:** Unknown - appears to be exercise data synchronization

#### `lib/mockProgressData` ❌ MISSING
**Imported by:**
- `components/ProgressExamples.tsx` (line 4)

**Purpose:** Mock data for progress visualization examples

## 3. Current vs. Required Data Flow

### ❌ BROKEN: Current Data Flow (Non-Functional)

```
Screen Component
      ↓
Imports authService/familyService (DELETED FILES)
      ↓
💥 APPLICATION CRASHES 💥
```

### ✅ CORRECT: New Architecture Data Flow

```
Screen Component
      ↓
useAuth() Hook (from AuthContext)
      ↓
Domain Services (authDomain, childrenDomain, etc.)
      ↓
Supabase Database
```

## 4. Detailed Dependency Mapping

### Example 1: Parent Home Screen (BROKEN)

**File:** `app/(tabs)/index.tsx`

**Current Imports (BROKEN):**
```typescript
import { getCurrentUser } from '@/lib/authService'; // ❌ DELETED
import {
  getParentProfile,
  getFamily,
  getChildren,
  getResearchMessages,
  type Child,
} from '@/lib/familyService'; // ❌ DELETED
```

**Required Fix:**
```typescript
import { useAuth } from '@/app/context/AuthContext'; // ✅ NEW
import { childrenDomain, familyDomain } from '@/lib/domains'; // ✅ NEW
```

**Data Flow Changes:**
| Old (Broken) | New (Working) |
|-------------|---------------|
| `getCurrentUser()` | `const { session, userProfile } = useAuth()` |
| `getParentProfile(userId)` | Already available in `userProfile` |
| `getFamily(userId)` | `await familyDomain.getFamilyByParent(userId)` |
| `getChildren(familyId)` | `await childrenDomain.getFamilyChildren(familyId)` |
| `getResearchMessages()` | Direct Supabase query (feature-specific) |

### Example 2: Add Child Screen (BROKEN)

**File:** `app/add-child.tsx`

**Current Imports (BROKEN):**
```typescript
import { checkAuthState, generateCodeForChild } from '@/lib/authService'; // ❌ DELETED
import { createLinkedChild } from '@/lib/familyService'; // ❌ DELETED
```

**Required Fix:**
```typescript
import { useAuth } from '@/app/context/AuthContext'; // ✅ NEW
import { childrenDomain, devicePairing } from '@/lib/domains'; // ✅ NEW
```

**Data Flow Changes:**
| Old (Broken) | New (Working) |
|-------------|---------------|
| `checkAuthState()` | `const { session, userProfile } = useAuth()` |
| `createLinkedChild(familyId, name)` | `await childrenDomain.createLinkedChild({ familyId, name, age })` |
| `generateCodeForChild(childId)` | `await devicePairing.generateLinkingCode(childId)` |

### Example 3: Parent Login (BROKEN)

**File:** `app/auth/parent-login.tsx`

**Current Imports (BROKEN):**
```typescript
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithFacebook
} from '@/lib/authService'; // ❌ DELETED
```

**Required Fix:**
```typescript
import { authDomain } from '@/lib/domains'; // ✅ NEW
import { supabase } from '@/lib/supabase'; // ✅ NEW (for Supabase auth)
```

**Data Flow Changes:**
| Old (Broken) | New (Working) |
|-------------|---------------|
| `signInWithEmail({ email, password })` | `await supabase.auth.signInWithPassword({ email, password })` |
| `signUpWithEmail({ email, password, firstName })` | `await authDomain.signUp({ email, password, fullName: firstName, role: 'parent' })` |
| `signInWithGoogle('parent')` | Needs OAuth setup with Supabase |
| `signInWithFacebook('parent')` | Needs OAuth setup with Supabase |

## 5. User Navigation Flow

### Parent User Journey

```
1. App Launch (app/index.tsx)
   ↓
2. Check Auth State (AuthContext)
   ↓
3a. NOT AUTHENTICATED → User Type Selection (app/user-type.tsx)
    ↓
    Parent Selected → Parent Login (app/auth/parent-login.tsx)
    ↓
    Sign Up → Parent Onboarding (app/auth/onboarding.tsx)
    ↓
    [Create Family via API]
    ↓
3b. AUTHENTICATED (Parent) → Parent Home (app/(tabs)/index.tsx)
    ↓
4. View Options:
   - Add Child → Add Child Screen (app/add-child.tsx)
     ↓
     [Generate Pairing Code]
     ↓
     Display Code to Parent

   - View Child → Child Profile (app/child-profile/[id].tsx)
     ↓
     View Progress, Settings, Generate New Code

   - Navigate Tabs:
     • Home (dashboard)
     • Progress (family overview)
     • Gallery (browse exercises)
     • Settings (parent settings)
     • Info (help/information)
```

### Linked Child User Journey (Device Pairing)

```
1. App Launch (app/index.tsx)
   ↓
2. Check Auth State (AuthContext)
   ↓
   Check AsyncStorage for linked child
   ↓
3a. NOT LINKED → User Type Selection (app/user-type.tsx)
    ↓
    Child Selected → Child Login (app/auth/child-login.tsx)
    ↓
    Enter 6-Digit Code
    ↓
    [Validate Code via RPC]
    ↓
    [Store Child ID in AsyncStorage]
    ↓
3b. LINKED → Child Home (components/ChildHomeScreen.tsx)
    ↓
4. Child Activities:
   - Start Training → Progress Screen
   - View Exercises → Gallery → Exercise Detail
   - Check Points → View in Home Screen
   - View Notifications → See parent reactions
```

### Independent Child User Journey

```
1. App Launch (app/index.tsx)
   ↓
2. Check Auth State (AuthContext)
   ↓
3a. NOT AUTHENTICATED → User Type Selection (app/user-type.tsx)
    ↓
    Independent Child → Child Independent (app/auth/child-independent.tsx)
    ↓
    Sign Up → Child Onboarding (app/auth/child-onboarding.tsx)
    ↓
    [Create Profile + Child Record]
    ↓
3b. AUTHENTICATED (Child Independent) → Child Home (components/ChildHomeScreen.tsx)
    ↓
4. Child Activities:
   - All Linked Child Features +
   - Manage Profile → Independent Profile Screens
     • Personal Info
     • Settings
     • Contact
     • Q&A
```

## 6. Data Source Mapping

### Available Data Sources (✅ Working)

| Data Type | Source | Access Method |
|-----------|--------|---------------|
| **Auth State** | AuthContext | `useAuth()` hook |
| **User Profile** | Database `profiles` table | Via AuthContext or `authDomain.getProfile()` |
| **Family Data** | Database `families` table | `familyDomain.getFamilyByParent()` |
| **Children** | Database `children` table | `childrenDomain.getFamilyChildren()` |
| **Exercises** | Database `eye_exercises` table | `exercisesService` (existing) |
| **Points** | Database `points_wallet` table | `pointsService` (existing) |
| **Practice Logs** | Database `practice_logs` table | `exercisesService` (existing) |
| **Notifications** | Database (table TBD) | `notificationService` (existing) |

### Missing/Undefined Data Sources (❌ Needs Creation)

| Data Type | Expected Location | Required For | Action Needed |
|-----------|------------------|--------------|---------------|
| **Research Messages** | Database `research_messages` table | Parent home motivational messages | Query directly in screen |
| **Exercise Data Source** | `lib/exercisesDataSource` | Sync API endpoint | Create or remove reference |
| **Mock Progress Data** | `lib/mockProgressData` | ProgressExamples component | Create mock data or remove component |

## 7. Optimization Recommendations

### Priority 1: CRITICAL - Fix Broken Screens (Immediate)

These screens must be migrated to prevent application crashes:

1. **`app/(tabs)/index.tsx`** - Home screen router
2. **`app/add-child.tsx`** - Add child flow
3. **`app/auth/parent-login.tsx`** - Parent authentication
4. **`app/auth/child-login.tsx`** - Child device pairing
5. **`components/ChildHomeScreen.tsx`** - Child dashboard

**Estimated Impact:** 5 screens = ~60% of critical user flows

**Migration Pattern:**
```typescript
// OLD (BROKEN)
import { getCurrentUser } from '@/lib/authService';
const user = await getCurrentUser();

// NEW (WORKING)
import { useAuth } from '@/app/context/AuthContext';
const { session, userProfile } = useAuth();
```

### Priority 2: HIGH - Fix Remaining Auth Screens

6. **`app/auth/child-independent.tsx`** - Independent child login
7. **`app/auth/child-onboarding.tsx`** - Independent child registration
8. **`app/auth/callback.tsx`** - OAuth callback
9. **`app/(tabs)/progress.tsx`** - Progress screen
10. **`app/(tabs)/gallery.tsx`** - Gallery screen
11. **`app/(tabs)/settings.tsx`** - Settings screen
12. **`app/exercise/[id].tsx`** - Exercise detail
13. **`app/child-profile/[id].tsx`** - Child profile

### Priority 3: MEDIUM - Handle Missing Data Sources

14. Create or remove `lib/exercisesDataSource`
15. Create or remove `lib/mockProgressData`
16. Review and fix `app/auth/onboarding.tsx`
17. Review and fix independent profile screens

### Priority 4: LOW - Optimize Data Loading

Once functional, optimize:
- Implement caching for frequently accessed data
- Add pagination for large lists
- Lazy load components and data
- Implement optimistic UI updates

## 8. Proposed Optimized Data Flow

### Centralized State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION ENTRY                         │
│                     (app/index.tsx)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTH CONTEXT                              │
│                (Single Source of Truth)                      │
│                                                              │
│  State:                                                      │
│  • session (Supabase session or null)                       │
│  • userProfile (parent or independent child)                │
│  • activeChild (current child player)                       │
│  • isLoading, isInitialized                                 │
│                                                              │
│  Methods:                                                    │
│  • signOut()                                                 │
│  • pairChildDevice(code)                                    │
│  • refreshActiveChild()                                     │
│  • setActiveChild(child)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN SERVICES                            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Auth      │  │   Family     │  │   Children      │   │
│  │  Domain     │  │   Domain     │  │   Domain        │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Existing Services (exercises, points, tracks, etc)  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                              │
│  profiles → families → children → practice_logs             │
│                         ↓                                    │
│                   points_wallet                              │
└─────────────────────────────────────────────────────────────┘
```

### Screen-Level Data Access Pattern

```typescript
// 1. GET AUTH STATE (All Screens)
function MyScreen() {
  const { session, userProfile, activeChild, isLoading } = useAuth();

  // 2. HANDLE LOADING
  if (isLoading) return <LoadingSpinner />;

  // 3. HANDLE UNAUTHENTICATED
  if (!session && !activeChild) {
    return <Redirect to="/user-type" />;
  }

  // 4. LOAD SCREEN-SPECIFIC DATA
  const [screenData, setScreenData] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeChild?.id]);

  const loadData = async () => {
    // Use domain services for data operations
    const data = await someDomain.someMethod();
    setScreenData(data);
  };

  // 5. RENDER
  return <View>...</View>;
}
```

## 9. Migration Checklist

Use this checklist to track migration progress:

- [ ] **app/(tabs)/index.tsx** → Migrate to AuthContext + domains
- [ ] **app/add-child.tsx** → Migrate to AuthContext + domains
- [ ] **app/auth/parent-login.tsx** → Migrate to AuthContext + domains
- [ ] **app/auth/child-login.tsx** → Migrate to devicePairing
- [ ] **components/ChildHomeScreen.tsx** → Migrate to AuthContext + domains
- [ ] **app/auth/child-independent.tsx** → Migrate to authDomain
- [ ] **app/auth/child-onboarding.tsx** → Migrate to authDomain
- [ ] **app/auth/callback.tsx** → Migrate or remove OAuth handlers
- [ ] **app/(tabs)/progress.tsx** → Migrate to AuthContext
- [ ] **app/(tabs)/gallery.tsx** → Migrate to AuthContext
- [ ] **app/(tabs)/settings.tsx** → Migrate to AuthContext
- [ ] **app/exercise/[id].tsx** → Migrate to AuthContext + domains
- [ ] **app/child-profile/[id].tsx** → Migrate to AuthContext + domains
- [ ] **app/sync-exercises+api.ts** → Create or remove data source
- [ ] **components/ProgressExamples.tsx** → Create mock data or remove
- [ ] **Review all independent profile screens** → Check for broken imports
- [ ] **Test all user flows end-to-end**

## 10. Success Criteria

The application will be considered fully optimized when:

✅ **No TypeScript compilation errors**
✅ **All screens can be accessed without crashes**
✅ **Parent can sign up and add children**
✅ **Child can pair device with code**
✅ **Independent child can sign up and use app**
✅ **Data flows correctly through AuthContext**
✅ **All domain services are properly utilized**
✅ **No references to deleted service files**
✅ **All user journeys complete successfully**

## Conclusion

The application architecture is solid, but **critical screens are non-functional** due to broken imports. Immediate action is required to migrate 13 screens from deleted service files to the new domain-based architecture. Once completed, the application will have a clean, maintainable data flow with proper separation of concerns.

**Next Step:** Begin Priority 1 migrations immediately to restore basic functionality.
