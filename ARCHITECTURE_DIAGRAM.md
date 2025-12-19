# Architecture Visual Diagrams

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PRESENTATION LAYER                          │   │
│  │                                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Parent  │  │  Linked  │  │Independent│  │   Shared     │   │   │
│  │  │  Screens │  │  Child   │  │  Child    │  │  Components  │   │   │
│  │  │          │  │  Screens │  │  Screens  │  │              │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │       │              │              │              │            │   │
│  └───────┼──────────────┼──────────────┼──────────────┼────────────┘   │
│          │              │              │              │                │
│          └──────────────┴──────────────┴──────────────┘                │
│                            │                                            │
│  ┌─────────────────────────▼───────────────────────────────────────┐   │
│  │                   STATE MANAGEMENT LAYER                        │   │
│  │                                                                  │   │
│  │              ┌────────────────────────────┐                     │   │
│  │              │      AuthContext           │                     │   │
│  │              │  ┌──────────────────────┐  │                     │   │
│  │              │  │ session              │  │                     │   │
│  │              │  │ userProfile          │  │                     │   │
│  │              │  │ activeChild          │  │                     │   │
│  │              │  │ isLoading            │  │                     │   │
│  │              │  │ isInitialized        │  │                     │   │
│  │              │  └──────────────────────┘  │                     │   │
│  │              │  ┌──────────────────────┐  │                     │   │
│  │              │  │ signOut()            │  │                     │   │
│  │              │  │ pairChildDevice()    │  │                     │   │
│  │              │  │ refreshActiveChild() │  │                     │   │
│  │              │  │ setActiveChild()     │  │                     │   │
│  │              │  └──────────────────────┘  │                     │   │
│  │              └────────────────────────────┘                     │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│  ┌──────────────────────────────▼─────────────────────────────────┐   │
│  │                      DOMAIN LAYER                               │   │
│  │                                                                  │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │  Auth Domain    │  │  Family Domain   │  │   Existing   │  │   │
│  │  │                 │  │                  │  │   Services   │  │   │
│  │  │ • authDomain    │  │ • familyDomain   │  │ • exercises  │  │   │
│  │  │ • devicePairing │  │ • childrenDomain │  │ • points     │  │   │
│  │  │                 │  │                  │  │ • tracks     │  │   │
│  │  └─────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  │         │                      │                    │           │   │
│  └─────────┼──────────────────────┼────────────────────┼───────────┘   │
│            │                      │                    │               │
│  ┌─────────▼──────────────────────▼────────────────────▼───────────┐   │
│  │                       API LAYER                                  │   │
│  │                                                                  │   │
│  │    /api/auth/signup        /api/children/manage                 │   │
│  │    /api/auth/pairing       /api/exercises/*                     │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                          SUPABASE BACKEND                                │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         AUTHENTICATION                            │  │
│  │                                                                   │  │
│  │    auth.users  →  Email/Password Auth  ←  Session Management    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE (PostgreSQL)                        │  │
│  │                                                                   │  │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │  │
│  │  │ profiles │ ←1:1→ │ families │ ←1:N→ │ children │                 │  │
│  │  │          │     │          │     │          │                 │  │
│  │  │  parent  │     │ parent_  │     │ linked & │                 │  │
│  │  │  child_  │     │ user_id  │     │ indep.   │                 │  │
│  │  │ indep.   │     │          │     │ children │                 │  │
│  │  └──────────┘     └──────────┘     └──────────┘                 │  │
│  │       │                                   │                      │  │
│  │       │                                   └──────────┐           │  │
│  │       │                                              │           │  │
│  │  ┌────▼──────┐     ┌──────────────┐     ┌──────────▼─────────┐ │  │
│  │  │   eye_    │     │   points_    │     │  practice_logs     │ │  │
│  │  │ exercises │     │   wallet     │     │                    │ │  │
│  │  └───────────┘     └──────────────┘     └────────────────────┘ │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    ROW LEVEL SECURITY (RLS)                       │  │
│  │                                                                   │  │
│  │  • Users can only access their own profiles                      │  │
│  │  • Parents can only access their own family                      │  │
│  │  • Parents can only manage their own children                    │  │
│  │  • Children can only access their own data                       │  │
│  │  • Device pairing validated server-side                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE FUNCTIONS (RPC)                       │  │
│  │                                                                   │  │
│  │  • generate_linking_code(child_id)                               │  │
│  │  • verify_linking_code(code)                                     │  │
│  │  • get_linked_child(child_id)                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DEVICE STORAGE                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        AsyncStorage                                │ │
│  │                                                                    │ │
│  │   zoomi_linked_child_id  →  Stores child ID for device pairing   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## User Authentication Flows

### Parent Flow

```
┌──────────────────┐
│  Parent Opens    │
│  App             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      No Session
│  Check Session   ├──────────────────┐
└────────┬─────────┘                  │
         │ Has Session                │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌────────────────┐
│  Load Profile    │         │  Show Login    │
│  role='parent'   │         │  Screen        │
└────────┬─────────┘         └────────┬───────┘
         │                            │
         │                            │ Login/Signup
         │                            │
         │                            ▼
         │                   ┌────────────────┐
         │                   │ authDomain     │
         │                   │ .signUp()      │
         │                   └────────┬───────┘
         │                            │
         │                            ▼
         │                   ┌────────────────┐
         │                   │ familyDomain   │
         │                   │ .createFamily()│
         │                   └────────┬───────┘
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────┐
         │  Parent Dashboard  │
         │                    │
         │  • View Children   │
         │  • Add Children    │
         │  • Generate Codes  │
         │  • View Progress   │
         └────────────────────┘
```

### Linked Child Flow (Device Pairing)

```
┌──────────────────┐
│  Child Opens     │
│  App             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      No Session, No Stored Child
│  Check Session & ├────────────────────────────────────┐
│  AsyncStorage    │                                    │
└────────┬─────────┘                                    │
         │ Has Stored Child ID                          │
         │                                              │
         ▼                                              ▼
┌──────────────────┐                          ┌────────────────┐
│  Load Child via  │                          │  Show Pairing  │
│  get_linked_     │                          │  Code Screen   │
│  child() RPC     │                          └────────┬───────┘
└────────┬─────────┘                                   │
         │                                             │ Enter Code
         │                                             │
         │                                             ▼
         │                                    ┌────────────────┐
         │                                    │ devicePairing  │
         │                                    │ .pairDevice()  │
         │                                    └────────┬───────┘
         │                                             │
         │                                             │ Validate
         │                                             │
         │                                             ▼
         │                                    ┌────────────────┐
         │                                    │  Store child   │
         │                                    │  ID in         │
         │                                    │  AsyncStorage  │
         │                                    └────────┬───────┘
         │                                             │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
              ┌────────────────────┐
              │  Child Training    │
              │  Screen            │
              │                    │
              │  • View Progress   │
              │  • Do Exercises    │
              │  • Earn Points     │
              └────────────────────┘
```

### Independent Child Flow

```
┌──────────────────┐
│  Child Opens     │
│  App             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      No Session
│  Check Session   ├──────────────────┐
└────────┬─────────┘                  │
         │ Has Session                │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌────────────────┐
│  Load Profile    │         │  Show Login    │
│  role='child_    │         │  or Signup     │
│  independent'    │         │  Screen        │
└────────┬─────────┘         └────────┬───────┘
         │                            │
         │                            │ Login/Signup
         ▼                            │
┌──────────────────┐                  ▼
│  Load Child      │         ┌────────────────┐
│  Record via      │         │ authDomain     │
│  user_id         │         │ .signUp()      │
└────────┬─────────┘         └────────┬───────┘
         │                            │
         │                            ▼
         │                   ┌────────────────┐
         │                   │ childrenDomain │
         │                   │ .createIndep() │
         │                   └────────┬───────┘
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────┐
         │  Child Training    │
         │  Screen            │
         │                    │
         │  • View Progress   │
         │  • Do Exercises    │
         │  • Earn Points     │
         │  • Manage Account  │
         └────────────────────┘
```

## Data Flow Examples

### Parent Generates Pairing Code

```
┌──────────────┐     Click "Generate Code"      ┌──────────────────┐
│   Parent     │ ──────────────────────────────> │  Parent UI       │
│   Dashboard  │                                 │  Component       │
└──────────────┘                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  devicePairing     │
                                                 │  .generateLinking  │
                                                 │  Code(childId)     │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  RPC Function      │
                                                 │  generate_linking  │
                                                 │  _code()           │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  Generate random   │
                                                 │  6-char code       │
                                                 │  Store in children │
                                                 │  table with expiry │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  Return code       │
                                                 │  "ABC123"          │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
┌──────────────┐     Display Code to Parent     ┌────────────────────┐
│   Parent     │ <────────────────────────────── │  Parent UI         │
│   sees       │                                 │  Shows Code        │
│   "ABC123"   │                                 │  on Screen         │
└──────────────┘                                 └────────────────────┘
```

### Child Completes Exercise

```
┌──────────────┐     Child completes exercise   ┌──────────────────┐
│   Exercise   │ ──────────────────────────────> │  Exercise        │
│   Screen     │                                 │  Component       │
└──────────────┘                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  exerciseService   │
                                                 │  .logPractice()    │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  Database INSERT   │
                                                 │  into practice_logs│
                                                 └────────┬───────────┘
                                                          │
                                  ┌───────────────────────┼────────────────────────┐
                                  │                       │                        │
                                  ▼                       ▼                        ▼
                         ┌────────────────┐     ┌────────────────┐      ┌────────────────┐
                         │  Trigger       │     │  Trigger       │      │  Trigger       │
                         │  Update child  │     │  Update streak │      │  Award points  │
                         │  minutes       │     │                │      │  to wallet     │
                         └────────────────┘     └────────────────┘      └────────────────┘
                                  │                       │                        │
                                  └───────────────────────┼────────────────────────┘
                                                          │
                                                          ▼
                                                 ┌────────────────────┐
                                                 │  refreshActiveChild│
                                                 │  ()                │
                                                 └────────┬───────────┘
                                                          │
                                                          ▼
┌──────────────┐     Display updated stats      ┌────────────────────┐
│   Exercise   │ <────────────────────────────── │  UI updates with   │
│   Screen     │                                 │  new data          │
│   Updates    │                                 │                    │
└──────────────┘                                 └────────────────────┘
```

## Domain Service Boundaries

```
┌───────────────────────────────────────────────────────────────────┐
│                         AUTH DOMAIN                               │
│                                                                   │
│  Responsibilities:                                                │
│  • User registration (parent & independent child)                 │
│  • User authentication (email/password)                           │
│  • Session management                                             │
│  • Device pairing with temporary codes                            │
│                                                                   │
│  Services:                                                        │
│  • authDomain.ts                                                  │
│  • devicePairing.ts                                               │
│                                                                   │
│  Does NOT handle:                                                 │
│  • Family creation (→ Family Domain)                              │
│  • Child creation (→ Family Domain)                               │
│  • Exercise logging (→ Exercise Service)                          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        FAMILY DOMAIN                              │
│                                                                   │
│  Responsibilities:                                                │
│  • Family creation and management                                 │
│  • Child creation (linked & independent)                          │
│  • Child profile updates                                          │
│  • Family-child relationships                                     │
│                                                                   │
│  Services:                                                        │
│  • familyDomain.ts                                                │
│  • childrenDomain.ts                                              │
│                                                                   │
│  Does NOT handle:                                                 │
│  • User authentication (→ Auth Domain)                            │
│  • Exercise progress (→ Exercise Service)                         │
│  • Points calculation (→ Points Service)                          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    EXISTING SERVICES                              │
│                                                                   │
│  • exercisesService.ts    → Exercise library & logging            │
│  • pointsService.ts       → Points & rewards system               │
│  • trackService.ts        → Training track management             │
│  • sessionService.ts      → Session/workout management            │
│  • notificationService.ts → User notifications                    │
│  • childMetricsService.ts → Child analytics & metrics             │
│  • textService.ts         → Internationalization                  │
│                                                                   │
│  These services remain unchanged and work alongside new domains   │
└───────────────────────────────────────────────────────────────────┘
```

## File Import Relationships

```
app/
├── _layout.tsx
│   └── imports: AuthProvider
│
├── index.tsx
│   └── imports: useAuth
│
├── (tabs)/
│   ├── index.tsx
│   │   └── imports: useAuth, childrenDomain
│   │
│   ├── progress.tsx
│   │   └── imports: useAuth, exerciseService
│   │
│   └── settings.tsx
│       └── imports: useAuth, authDomain
│
├── auth/
│   ├── parent-login.tsx
│   │   └── imports: authDomain
│   │
│   ├── child-login.tsx
│   │   └── imports: devicePairing
│   │
│   └── child-independent.tsx
│       └── imports: authDomain
│
├── api/
│   ├── auth/
│   │   ├── signup+api.ts
│   │   │   └── imports: authDomain, familyDomain, childrenDomain
│   │   │
│   │   └── pairing+api.ts
│   │       └── imports: devicePairing
│   │
│   └── children/
│       └── manage+api.ts
│           └── imports: childrenDomain
│
└── context/
    └── AuthContext.tsx
        └── imports: authDomain, devicePairing, childrenDomain


lib/domains/
├── index.ts (exports all domains)
│
├── auth/
│   ├── authDomain.ts
│   │   └── imports: supabase
│   │
│   └── devicePairing.ts
│       └── imports: supabase, AsyncStorage
│
└── family/
    ├── familyDomain.ts
    │   └── imports: supabase
    │
    └── childrenDomain.ts
        └── imports: supabase
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE SECURITY                         │
│                                                                 │
│  • AuthContext validates state before rendering                │
│  • Route guards check authentication status                    │
│  • UI components verify user roles                             │
│  • Device pairing codes validated before storage               │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER SECURITY                           │
│                                                                 │
│  • Validate request parameters                                  │
│  • Check authentication before operations                       │
│  • Return appropriate HTTP status codes                         │
│  • Use domain services (not direct DB access)                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE RLS SECURITY                         │
│                                                                 │
│  • Row Level Security enabled on all tables                     │
│  • Users can only access their own data                         │
│  • Parents restricted to their own family                       │
│  • Children restricted to their own records                     │
│  • Server-side validation of all operations                     │
└─────────────────────────────────────────────────────────────────┘
```

This architecture ensures defense in depth with security at every layer.
