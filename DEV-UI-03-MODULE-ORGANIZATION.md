# DEV-UI-03: Module Organization & Architecture

## Directory Structure

```
client/web/src/
├── lib/
│   ├── api/                          # API Integration Layer
│   │   ├── __tests__/
│   │   │   └── client.test.ts        # API client tests (22 tests)
│   │   └── client.ts                 # ✨ NEW: API adapter with correlation IDs
│   │
│   ├── hooks/                        # React Hooks
│   │   ├── __tests__/
│   │   │   ├── rbac.test.ts          # RBAC hook tests (17 tests)
│   │   │   └── feature-flags.test.ts # Feature flag tests (11 tests)
│   │   ├── rbac.ts                   # ✨ NEW: Role-based access control
│   │   └── feature-flags.ts          # ✨ NEW: Feature flag management
│   │
│   ├── services/                     # Business Logic Services
│   │   ├── __tests__/
│   │   │   ├── audit-logger.test.ts           # Audit logger tests (19 tests)
│   │   │   └── performance-monitor.test.ts    # Performance monitor tests (21 tests)
│   │   ├── audit-logger.ts           # ✨ NEW: Audit logging service
│   │   ├── performance-monitor.ts    # ✨ NEW: Performance monitoring
│   │   ├── mock-api.ts               # (existing)
│   │   ├── mock-content.ts           # (existing)
│   │   └── mock-dashboard.ts         # (existing)
│   │
│   └── queries/                      # TanStack Query Hooks (existing)
│
└── components/
    ├── rbac/                         # ✨ NEW: RBAC Components
    │   └── protected.tsx             # Protected, FeatureGated, RoleBased, ProtectedAction
    │
    ├── ui/                           # (existing UI primitives)
    ├── layout/                       # (existing layout components)
    ├── forms/                        # (existing form components)
    ├── data-display/                 # (existing data display)
    ├── dashboard/                    # (existing dashboard)
    └── content/                      # (existing content)
```

## Module Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   React Components                          │
│  (app/, pages, dashboard, content, layout)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────────┐ ┌──────────┐ ┌──────────────┐
    │ Protected  │ │ Forms    │ │ DataDisplay  │
    │ Components │ │ (existing)│ │ (existing)   │
    │ (NEW)      │ └──────────┘ └──────────────┘
    └────────────┘
        │
        │ Uses
        ▼
    ┌─────────────────────────────────────────┐
    │          Access Control Layer            │
    ├─────────────────────────────────────────┤
    │  • rbac.ts       (RBAC Hooks) ✨ NEW    │
    │  • feature-      (Feature Flags) ✨ NEW │
    │    flags.ts                             │
    └────────────────────┬────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────────┐ ┌───────────┐ ┌──────────────┐
    │ Zustand    │ │ TanStack  │ │ Audit Logger │
    │ Stores     │ │ Query     │ │ (NEW)        │
    │ (existing) │ │ (existing)│ └──────────────┘
    └────────────┘ └───────────┘
        │
        │ With Auth Context
        ▼
    ┌─────────────────────────────────────────┐
    │          API Integration Layer           │
    ├─────────────────────────────────────────┤
    │  • client.ts (API Adapter) ✨ NEW       │
    │    - Correlation IDs                    │
    │    - Auth Headers                       │
    │    - Multi-tenant Support               │
    │    - Error Handling                     │
    └────────────────────┬────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────────┐ ┌───────────┐ ┌──────────────┐
    │ Performance│ │ Mock API  │ │ Backend API  │
    │ Monitor    │ │ Services  │ │ Endpoints    │
    │ (NEW)      │ │ (existing)│ └──────────────┘
    └────────────┘ └───────────┘
```

## Module Details

### 1. RBAC Layer (`lib/hooks/rbac.ts`)

**Purpose**: Role-based access control for component-level permissions

**Exports**:
```typescript
// Constants
PERMISSIONS: { DASHBOARD_VIEW, CONTENT_CREATE, ... (24 total) }

// Type
type Permission

// Hooks (6)
usePermissions()        // Returns user permissions based on roles
useHasPermission()      // Check single/multiple permissions
useHasAnyPermission()   // Check if user has any permission
useRoles()              // Get user roles
useHasRole()            // Check if user has specific role
useIsAdmin()            // Convenience check for admin
```

**Integration**:
- Uses: `useAuthStore` (Zustand store with user & roles)
- Memoized calculations to prevent re-renders
- Role-to-permissions mapping (admin → all, editor → content+settings, etc.)

**Test File**: `__tests__/rbac.test.ts` (17 tests)

---

### 2. Feature Flags (`lib/hooks/feature-flags.ts`)

**Purpose**: Feature flag management for UI gating and A/B testing

**Exports**:
```typescript
// Constants
FEATURES: { BETA_DASHBOARD, ADVANCED_ANALYTICS, ... (10 total) }

// Type
type Feature

// Hooks (5)
useFeatureFlags()       // Get all flags with loading state
useFeatureEnabled()     // Check if feature(s) enabled (memoized)
useHasAnyFeature()      // Check if any feature enabled
useEnabledFeatures()    // Get array of enabled features
useFeatureFlagsContext() // Wrapper for context usage
```

**Integration**:
- Uses: `TanStack Query` (5-minute staleTime caching)
- Mock server implementation (100ms delay simulation)
- Memoized feature checks to prevent re-renders

**Test File**: `__tests__/feature-flags.test.ts` (11 tests)

---

### 3. API Adapter (`lib/api/client.ts`)

**Purpose**: Authenticated API requests with correlation IDs and multi-tenant support

**Exports**:
```typescript
// Functions
generateCorrelationId()  // Creates unique cid-{timestamp}-{random}

// Classes
class ApiError          // Custom error with status, message, code, details
class ApiAdapter        // Core API client (singleton pattern)

// Singleton & Hook
apiClient               // ApiAdapter singleton
useApiClient()          // Hook to use apiClient
```

**Features**:
- Auto-injects Authorization header (Bearer token)
- Auto-injects x-correlation-id (for request tracing)
- Auto-injects x-tenant-id (from user.tenantId)
- Request timeout handling (30s default)
- AbortController for request cancellation
- Multi-tenant request isolation
- Custom error handling with detailed messages

**HTTP Methods**:
```typescript
request<T>(method, path, config)   // Core method
get<T>(path, config)               // GET request
post<T>(path, body, config)        // POST request
patch<T>(path, body, config)       // PATCH request
delete<T>(path, config)            // DELETE request
```

**Test File**: `__tests__/client.test.ts` (22 tests)

---

### 4. Audit Logger (`lib/services/audit-logger.ts`)

**Purpose**: Sensitive action logging for compliance and security auditing

**Exports**:
```typescript
// Constants
AUDIT_EVENTS: {
  AUTH_LOGIN, AUTH_LOGOUT, AUTH_LOGIN_FAILED, AUTH_SESSION_EXPIRED,
  CONTENT_CREATE, CONTENT_UPDATE, CONTENT_DELETE, CONTENT_PUBLISH, CONTENT_UNPUBLISH,
  USER_CREATE, USER_UPDATE, USER_DELETE, USER_ROLE_CHANGE,
  SETTINGS_UPDATE, SETTINGS_SECURITY_CHANGE,
  SECURITY_2FA_ENABLED, SECURITY_2FA_DISABLED, SECURITY_PASSWORD_CHANGED,
  SECURITY_API_KEY_CREATED, SECURITY_API_KEY_REVOKED
}

// Type
type AuditEvent

// Interface
interface AuditLogEntry {
  event, timestamp, userId, tenantId, resourceId, resourceType,
  changes, metadata, ipAddress, userAgent, status, errorMessage
}

// Singleton & Hook
auditLogger             // AuditLogger singleton
useAuditLogger()        // Hook to use auditLogger
```

**Logging Methods**:
```typescript
log(event, options)              // Core logging method
logAuthEvent(event, status)      // Auth-specific logging
logContentEvent(event, id, changes)    // Content logging
logUserEvent(event, userId, changes)   // User logging
logSettingsEvent(event, changes) // Settings logging
```

**Features**:
- 16 audit event types across 5 categories
- Non-blocking async design (catches errors)
- Captures userId, tenantId, userAgent, resource changes
- Dev logging to console
- Production logging via apiClient
- Detailed error message tracking

**Test File**: `__tests__/audit-logger.test.ts` (19 tests)

---

### 5. Performance Monitor (`lib/services/performance-monitor.ts`)

**Purpose**: Track API response times, render times, and detect bottlenecks

**Exports**:
```typescript
// Interface
interface PerformanceMetric {
  name: string
  value: number        // milliseconds
  timestamp: string
  metadata?: Record<string, unknown>
}

// Singleton & Hook
performanceMonitor     // PerformanceMonitor singleton
useRenderTime()        // Hook for render timing
useFetchMetrics()      // Hook for fetch metrics
useMutationMetrics()   // Hook for mutation metrics
usePerformanceMetrics() // Hook to get all metrics
```

**Core Methods**:
```typescript
recordMetric(name, value, metadata?)    // Record single metric
measureAsync<T>(name, fn, metadata?)    // Measure async function
measureSync<T>(name, fn, metadata?)     // Measure sync function
getMetrics()                            // Get all metrics
clear()                                 // Clear metrics
```

**Features**:
- Circular buffer (max 100 metrics) to prevent memory leaks
- Automatic status tracking (success/error)
- Dev logging to console
- TODO: Analytics backend integration (Sentry, DataDog, New Relic)

**Test File**: `__tests__/performance-monitor.test.ts` (21 tests)

---

### 6. Protected Components (`components/rbac/protected.tsx`)

**Purpose**: React component wrappers for access control

**Exports**:
```typescript
// Component Wrappers (4)
function Protected(props)        // Checks permissions, roles, features
function ProtectedAction(props)  // Button wrapper with disabled state
function FeatureGated(props)     // Renders based on feature flag
function RoleBased(props)        // Renders based on user role
```

**Features**:
- Permission-based rendering
- Role-based rendering
- Feature-gated rendering
- Custom fallback UI
- Locked state card display
- All hooks called at top level (React rules compliance)

**Example Usage**:
```tsx
// Protected entire section
<Protected 
  requiredPermissions={PERMISSIONS.CONTENT_CREATE}
  requiredRoles="editor"
  fallback={<div>Unauthorized</div>}
>
  <ContentCreator />
</Protected>

// Feature-gated component
<FeatureGated feature={FEATURES.BETA_DASHBOARD}>
  <BetaDashboard />
</FeatureGated>

// Role-based rendering
<RoleBased roles={['admin', 'editor']}>
  <AdminPanel />
</RoleBased>
```

---

## Data Flow Diagram

```
User Action
    │
    ▼
┌─────────────────┐
│ React Component │
│  (Protected,    │
│   FeatureGated) │
└────────┬────────┘
         │
         ├─→ useHasPermission()  ─→ RBAC.ts ─→ useAuthStore
         │
         ├─→ useHasRole()        ─→ RBAC.ts ─→ useAuthStore
         │
         └─→ useFeatureEnabled() ─→ Feature-Flags.ts ─→ TanStack Query
         
    Evaluation Result
         │
    ┌────┴────┐
    │          │
    ▼          ▼
 ALLOW     DENY (show fallback)
    │          │
    ▼          ▼
┌──────────┐ ┌──────────────┐
│ Render   │ │ Render       │
│ Protected│ │ Fallback or  │
│ Content  │ │ Locked Card  │
└────┬─────┘ └──────────────┘
     │
     ├─→ API Call needed?
     │   └─→ apiClient.get/post/patch/delete()
     │       ├─→ Add x-correlation-id header
     │       ├─→ Add Authorization header
     │       ├─→ Add x-tenant-id header
     │       └─→ Send request
     │
     ├─→ Audit log event
     │   └─→ auditLogger.log() ─→ API POST /audit-logs
     │
     └─→ Track performance
         └─→ performanceMonitor.measureAsync()
             └─→ Store metrics (max 100)
```

---

## Test Coverage Summary

| Module | Tests | Coverage | Status |
|--------|-------|----------|--------|
| RBAC Hooks | 17 | Permissions, roles, admin checks | ✅ PASS |
| Feature Flags | 11 | Feature constants, categorization | ✅ PASS |
| API Client | 22 | Correlation IDs, errors, HTTP methods | ✅ PASS |
| Audit Logger | 19 | Event types, logging methods | ✅ PASS |
| Performance Monitor | 21 | Metrics, async/sync measurement | ✅ PASS |
| **Total** | **90** | **>80% average** | **✅ PASS** |

---

## Integration Architecture

```
┌──────────────────────────────────────┐
│   DEV-UI-03: Integration Layer       │
│  (New Modules - 1,600 LOC)          │
├──────────────────────────────────────┤
│ • RBAC (24 permissions)              │
│ • Feature Flags (10 flags)           │
│ • API Adapter (correlation IDs)      │
│ • Audit Logger (16 event types)      │
│ • Performance Monitor (metrics)      │
└──────────────────────────────────────┘
           │
           │ Depends On
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────────┐ ┌──────────────────┐
│ DEV-UI-09    │ │ DEV-UI-02        │
│ State Mgmt   │ │ Core Components  │
├──────────────┤ ├──────────────────┤
│ • Zustand    │ │ • Header         │
│   Stores     │ │ • Sidebar        │
│ • TanStack   │ │ • Footer         │
│   Query      │ │ • FormComponent  │
│ • Queries    │ │ • DataTable      │
└──────────────┘ └──────────────────┘
    │                    │
    └────────┬───────────┘
             │
             ▼
    ┌──────────────────┐
    │ DEV-UI-01        │
    │ UI Framework     │
    ├──────────────────┤
    │ • Theme          │
    │ • Typography     │
    │ • shadcn/ui (50+)│
    └──────────────────┘
```

---

## File Statistics

```
NEW FILES: 12
├── 5 Core Modules
│   ├── lib/api/client.ts (157 LOC)
│   ├── lib/hooks/rbac.ts (155 LOC)
│   ├── lib/hooks/feature-flags.ts (113 LOC)
│   ├── lib/services/audit-logger.ts (184 LOC)
│   └── lib/services/performance-monitor.ts (173 LOC)
│
├── 1 Component Module
│   └── components/rbac/protected.tsx (150 LOC)
│
└── 5 Test Modules
    ├── lib/api/__tests__/client.test.ts (170 LOC)
    ├── lib/hooks/__tests__/rbac.test.ts (268 LOC)
    ├── lib/hooks/__tests__/feature-flags.test.ts (85 LOC)
    ├── lib/services/__tests__/audit-logger.test.ts (125 LOC)
    └── lib/services/__tests__/performance-monitor.test.ts (220 LOC)

MODIFIED FILES: 1
└── jest.config.ts (moduleNameMapper fix)

TOTAL: ~1,600 LOC
TESTS: 90 passing
COVERAGE: >80%
```

---

## Usage Examples

### RBAC Example
```tsx
import { useHasPermission, useIsAdmin, PERMISSIONS } from '@/lib/hooks/rbac';

export function AdminPanel() {
  const isAdmin = useIsAdmin();
  const canDeleteUser = useHasPermission(PERMISSIONS.USERS_MANAGE);
  
  if (!isAdmin) return <div>Access Denied</div>;
  
  return (
    <>
      {canDeleteUser && <DeleteUserButton />}
    </>
  );
}
```

### Feature Flags Example
```tsx
import { useFeatureEnabled, FEATURES } from '@/lib/hooks/feature-flags';

export function Dashboard() {
  const betaDashboardEnabled = useFeatureEnabled(FEATURES.BETA_DASHBOARD);
  
  return (
    <>
      {betaDashboardEnabled ? <BetaDashboard /> : <OldDashboard />}
    </>
  );
}
```

### API Adapter Example
```tsx
import { apiClient } from '@/lib/api/client';

export async function fetchUsers() {
  try {
    const users = await apiClient.get('/users');
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error.message);
  }
}
```

### Audit Logging Example
```tsx
import { auditLogger, AUDIT_EVENTS } from '@/lib/services/audit-logger';

export async function deleteUser(userId: string) {
  try {
    await api.delete(`/users/${userId}`);
    auditLogger.logUserEvent(
      AUDIT_EVENTS.USER_DELETE,
      userId,
      { action: 'deleted_user' }
    );
  } catch (error) {
    auditLogger.logUserEvent(
      AUDIT_EVENTS.USER_DELETE,
      userId,
      { error: error.message }
    );
  }
}
```

### Performance Monitoring Example
```tsx
import { performanceMonitor } from '@/lib/services/performance-monitor';

export async function loadDashboard() {
  const data = await performanceMonitor.measureAsync(
    'dashboard-load',
    () => apiClient.get('/dashboard'),
    { endpoint: '/dashboard' }
  );
  
  const metrics = performanceMonitor.getMetrics();
  console.log('Dashboard load time:', metrics[0].value, 'ms');
}
```

---

## Key Design Decisions

1. **Singleton Pattern**: API, Audit Logger, and Performance Monitor use singletons for shared state
2. **Memoization**: RBAC and Feature Flags memoize calculations to prevent unnecessary re-renders
3. **Non-blocking Design**: Audit Logger catches errors to never block user actions
4. **Circular Buffer**: Performance Monitor limits to 100 metrics to prevent memory leaks
5. **Correlation IDs**: Every API request gets a unique trace ID for debugging
6. **Multi-tenant**: X-tenant-id header automatically injected in all requests
7. **React Hooks Rules**: All hooks called at top level, never conditionally

---

## Next Steps

- [ ] QA testing and review
- [ ] Merge PR #170 to main
- [ ] DEV-UI-04: Advanced Features (pagination, filtering, sorting)
- [ ] DEV-UI-05: Error Handling & Resilience
- [ ] DEV-UI-06: Analytics & Observability
