# 🏗️ Nivasi Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Owner      │  │   Tenant     │  │    Auth      │     │
│  │  Interface   │  │  Interface   │  │   System     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  API Client    │                       │
│                    │  (fetch)       │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────▼──────────────────────────────┐
│                    WEB SERVER (Next.js)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes (/api/*)                     │  │
│  │                                                       │  │
│  │  /auth/*        /dashboard    /properties           │  │
│  │  /tenants       /payments     /maintenance          │  │
│  │  /documents                                          │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Authentication Middleware                  │  │
│  │           (JWT Validation)                          │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Database Client (@vercel/postgres)        │  │
│  └──────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │ SQL
                          │
┌─────────────────────────▼────────────────────────────────┐
│                  PostgreSQL Database                      │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  users   │  │properties│  │ tenants  │  │ payments │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │documents │  │maintenance│  │notifications│            │
│  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────┐
│  User   │
│ Opens   │
│  App    │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Check SecureStore   │
│ for saved JWT       │
└────┬────────────────┘
     │
     ├─── JWT Found ────────┐
     │                      │
     │                      ▼
     │              ┌───────────────┐
     │              │ Validate JWT  │
     │              │ with /api/me  │
     │              └───────┬───────┘
     │                      │
     │                      ├─── Valid ────┐
     │                      │              │
     │                      │              ▼
     │                      │      ┌───────────────┐
     │                      │      │ Fetch user    │
     │                      │      │ details       │
     │                      │      └───────┬───────┘
     │                      │              │
     │                      │              ▼
     │                      │      ┌───────────────┐
     │                      │      │ If tenant:    │
     │                      │      │ Fetch         │
     │                      │      │ tenant_id     │
     │                      │      └───────┬───────┘
     │                      │              │
     │                      │              ▼
     │                      │      ┌───────────────┐
     │                      │      │ Route to      │
     │                      │      │ Dashboard     │
     │                      │      └───────────────┘
     │                      │
     │                      └─── Invalid ──┐
     │                                     │
     └─── No JWT ─────────────────────────┤
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ Show Login    │
                                   │ Screen        │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ User enters   │
                                   │ credentials   │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ POST /api/    │
                                   │ auth/signin   │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ Verify        │
                                   │ password      │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ Generate JWT  │
                                   │ Save to       │
                                   │ SecureStore   │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ Route to      │
                                   │ Dashboard     │
                                   └───────────────┘
```

## Tenant Data Access Flow

```
┌──────────────────┐
│ Tenant logs in   │
│ (user_id = 20)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ JWT created with user_id=20  │
│ Stored in SecureStore        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ useTenantInfo() hook runs    │
│ Checks: user_type = 'tenant' │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ GET /api/auth/tenant-info    │
│ Authorization: Bearer {jwt}  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Backend validates JWT        │
│ Extracts user_id = 20        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ SQL Query:                   │
│ SELECT * FROM tenants        │
│ WHERE user_id = 20           │
│ AND status = 'active'        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Returns:                     │
│ - tenant_id = 1              │
│ - property_id = 5            │
│ - property info              │
│ - owner info                 │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Cache in SecureStore         │
│ Key: tenant-info             │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Tenant screens use           │
│ tenant_id = 1 for all APIs   │
└──────────────────────────────┘
```

## Owner Data Access Flow

```
┌──────────────────┐
│ Owner logs in    │
│ (user_id = 10)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ JWT created with user_id=10  │
│ user_type = 'owner'          │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Owner Dashboard loads        │
│ GET /api/dashboard?          │
│ owner_id=10                  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ SQL Queries:                 │
│                              │
│ 1. Properties owned by 10    │
│ 2. Tenants in those props    │
│ 3. Payments from tenants     │
│ 4. Maintenance requests      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Returns aggregated stats:    │
│ - Total properties: 2        │
│ - Total tenants: 3           │
│ - Monthly income: ₹45,000    │
│ - Pending payments: 2        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Display on Owner Dashboard   │
└──────────────────────────────┘
```

## API Request Flow Example

### Tenant Viewing Payments

```
Mobile App                    Web Server                  Database
    │                             │                          │
    │  GET /api/payments?         │                          │
    │  tenant_id=1                │                          │
    ├────────────────────────────>│                          │
    │                             │                          │
    │                             │  Validate JWT            │
    │                             │  Extract user_id         │
    │                             │                          │
    │                             │  SELECT pay.*,           │
    │                             │    u.name, p.name        │
    │                             │  FROM payments pay       │
    │                             │  JOIN tenants t          │
    │                             │    ON pay.tenant_id=t.id │
    │                             │  WHERE pay.tenant_id=1   │
    │                             ├─────────────────────────>│
    │                             │                          │
    │                             │  [Payment records]       │
    │                             │<─────────────────────────┤
    │                             │                          │
    │  { payments: [...] }        │                          │
    │<────────────────────────────┤                          │
    │                             │                          │
    │  Display in UI              │                          │
    │                             │                          │
```

### Owner Viewing All Tenants

```
Mobile App                    Web Server                  Database
    │                             │                          │
    │  GET /api/tenants?          │                          │
    │  owner_id=10                │                          │
    ├────────────────────────────>│                          │
    │                             │                          │
    │                             │  Validate JWT            │
    │                             │  Verify owner_id=10      │
    │                             │                          │
    │                             │  SELECT t.*, u.name,     │
    │                             │    p.name                │
    │                             │  FROM tenants t          │
    │                             │  JOIN users u            │
    │                             │    ON t.user_id=u.id     │
    │                             │  JOIN properties p       │
    │                             │    ON t.property_id=p.id │
    │                             │  WHERE p.owner_id=10     │
    │                             ├─────────────────────────>│
    │                             │                          │
    │                             │  [All tenants in         │
    │                             │   owner's properties]    │
    │                             │<─────────────────────────┤
    │                             │                          │
    │  { tenants: [...] }         │                          │
    │<────────────────────────────┤                          │
    │                             │                          │
    │  Display tenant list        │                          │
    │                             │                          │
```

## Data Isolation Mechanism

### How Tenant A Cannot See Tenant B's Data

```
┌─────────────────────────────────────────────────────────┐
│                    Database Level                        │
│                                                          │
│  Tenant A (tenant_id=1)    Tenant B (tenant_id=2)      │
│         │                         │                      │
│         ▼                         ▼                      │
│  ┌─────────────┐          ┌─────────────┐              │
│  │ Payments    │          │ Payments    │              │
│  │ WHERE       │          │ WHERE       │              │
│  │ tenant_id=1 │          │ tenant_id=2 │              │
│  └─────────────┘          └─────────────┘              │
│         │                         │                      │
│         ▼                         ▼                      │
│  ┌─────────────┐          ┌─────────────┐              │
│  │ Only A's    │          │ Only B's    │              │
│  │ payments    │          │ payments    │              │
│  └─────────────┘          └─────────────┘              │
│                                                          │
│  ✅ Isolation enforced by WHERE clause                  │
│  ✅ No cross-tenant data leakage                        │
└─────────────────────────────────────────────────────────┘
```

### How Owner Sees All Their Tenants

```
┌─────────────────────────────────────────────────────────┐
│                    Database Level                        │
│                                                          │
│  Owner (owner_id=10)                                    │
│         │                                                │
│         ▼                                                │
│  ┌─────────────────────────────────────┐               │
│  │ Properties WHERE owner_id=10        │               │
│  │  - Property A (id=5)                │               │
│  │  - Property B (id=6)                │               │
│  └──────────┬──────────────────────────┘               │
│             │                                            │
│             ▼                                            │
│  ┌─────────────────────────────────────┐               │
│  │ Tenants in Properties 5 & 6         │               │
│  │  - Tenant A (property_id=5)         │               │
│  │  - Tenant B (property_id=5)         │               │
│  │  - Tenant C (property_id=6)         │               │
│  └──────────┬──────────────────────────┘               │
│             │                                            │
│             ▼                                            │
│  ┌─────────────────────────────────────┐               │
│  │ All payments from these tenants     │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│  ✅ Owner sees all data through property ownership      │
│  ✅ Cannot see other owners' data                       │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Mobile)
- **Framework:** React Native (Expo)
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Secure Storage:** expo-secure-store
- **UI Components:** Custom components with Lucide icons
- **Styling:** Inline styles with theme system

### Backend (Web)
- **Framework:** Next.js 14 (App Router)
- **API:** Next.js API Routes
- **Authentication:** Auth.js with JWT
- **Password Hashing:** Argon2
- **Database Client:** @vercel/postgres

### Database
- **Type:** PostgreSQL
- **Hosting Options:** Neon, Supabase, Railway, or local
- **Features Used:**
  - Foreign keys with CASCADE
  - Indexes for performance
  - Triggers for auto-updates
  - Functions for business logic

### Security
- **Authentication:** JWT tokens
- **Password Storage:** Argon2 hashing
- **Token Storage:** SecureStore (encrypted)
- **API Security:** JWT validation on all protected routes
- **SQL Injection:** Prevented by parameterized queries
- **XSS:** Prevented by React's built-in escaping

---

**This architecture ensures:**
- ✅ Secure authentication
- ✅ Proper data isolation
- ✅ Scalable design
- ✅ Clean separation of concerns
- ✅ Mobile-first approach
