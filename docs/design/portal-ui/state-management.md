# Portal UI Component — State Management

**Tracker**: Issue #155  
**Related**: [Overview](./overview.md), [Features](./features.md)

## Purpose

This document defines the state management architecture for the Portal UI Component. It covers client-side state (Zustand), server state (TanStack Query), caching strategies, state synchronization, and performance optimization patterns.

---

## State Management Philosophy

### Separation of Concerns

**Client State** (Zustand):
- UI state (sidebar collapsed, modals open/closed)
- Form state (temporary, unsaved data)
- User preferences (theme, language)
- Transient application state (onboarding progress, filters)

**Server State** (TanStack Query):
- Data fetched from backend APIs
- User profiles, usage metrics, invoices, connections
- Cached responses with automatic revalidation
- Optimistic updates for mutations

**Why Separate?**:
- **Clarity**: Clear distinction between local UI state and remote data
- **Performance**: Server state caching reduces API calls
- **Simplicity**: Each tool optimized for its use case
- **Debugging**: Easier to track state changes

---

## Client State Management (Zustand)

### Overview

**Zustand**: Lightweight state management library with minimal boilerplate

**Benefits**:
- No providers/context needed (stores are singletons)
- Simple API: `create((set, get) => ({ ... }))`
- React hooks integration: `const value = useStore(state => state.value)`
- Middleware support: persist, devtools, immer
- TypeScript-friendly

---

### Store Structure

**Recommended Pattern**: Multiple focused stores (not one global store)

**Store Organization**:
- `stores/authStore.ts` — Authentication state
- `stores/uiStore.ts` — UI preferences and state
- `stores/onboardingStore.ts` — Onboarding wizard progress
- `stores/usageStore.ts` — Usage dashboard filters and settings
- `stores/billingStore.ts` — Billing portal filters

**Anti-Pattern**: Single monolithic store with all application state

---

### Auth Store

**Purpose**: Manage authentication state (session, user info)

**State**:
```typescript
interface AuthState {
  // Session data
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}
```

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'member' | 'viewer'
  tenantId: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ accessToken: token }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ accessToken: state.accessToken }), // Only persist token
    }
  )
)
```

**Usage in Components**:
```typescript
function Header() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  
  if (!user) return null
  
  return (
    <div>
      <span>Welcome, {user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

**Persistence**:
- `accessToken` persisted to `localStorage` (HTTP-only cookies preferred for production)
- User data fetched on app load (not persisted to avoid stale data)

---

### UI Store

**Purpose**: Manage UI preferences and transient state

**State**:
```typescript
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Layout
  sidebarCollapsed: boolean
  sidebarOpen: boolean // Mobile drawer state
  
  // Modals
  activeModal: string | null
  
  // Toasts
  toasts: Toast[]
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}
```

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  activeModal: string | null
  toasts: Toast[]
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      sidebarOpen: false,
      activeModal: null,
      toasts: [],
      
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
      addToast: (toast) => set({ toasts: [...get().toasts, toast] }),
      removeToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)
```

**Usage**:
```typescript
function Sidebar() {
  const collapsed = useUIStore(state => state.sidebarCollapsed)
  const toggleSidebar = useUIStore(state => state.toggleSidebar)
  
  return (
    <aside className={collapsed ? 'w-16' : 'w-64'}>
      <button onClick={toggleSidebar}>Toggle</button>
      {!collapsed && <NavigationMenu />}
    </aside>
  )
}
```

---

### Onboarding Store

**Purpose**: Track onboarding wizard progress

**State**:
```typescript
interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  profile: { name: string; industry: string; timezone: string }
  integrations: { ghl?: GHLConfig; retell?: RetellConfig; twilio?: TwilioConfig }
  agent: { name: string; promptTemplate: string; voiceProvider: string }
  
  setStep: (step: number) => void
  markStepComplete: (step: number) => void
  updateProfile: (profile: Partial<Profile>) => void
  updateIntegrations: (provider: string, config: any) => void
  updateAgent: (agent: Partial<Agent>) => void
  reset: () => void
}
```

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  profile: { name: string; industry: string; timezone: string }
  integrations: { ghl?: any; retell?: any; twilio?: any }
  agent: { name: string; promptTemplate: string; voiceProvider: string }
  
  setStep: (step: number) => void
  markStepComplete: (step: number) => void
  updateProfile: (profile: any) => void
  updateIntegrations: (provider: string, config: any) => void
  updateAgent: (agent: any) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      completedSteps: [],
      profile: { name: '', industry: '', timezone: '' },
      integrations: {},
      agent: { name: '', promptTemplate: '', voiceProvider: '' },
      
      setStep: (step) => set({ currentStep: step }),
      markStepComplete: (step) => {
        const completed = get().completedSteps
        if (!completed.includes(step)) {
          set({ completedSteps: [...completed, step] })
        }
      },
      updateProfile: (profile) => set({ profile: { ...get().profile, ...profile } }),
      updateIntegrations: (provider, config) => set({
        integrations: { ...get().integrations, [provider]: config }
      }),
      updateAgent: (agent) => set({ agent: { ...get().agent, ...agent } }),
      reset: () => set({
        currentStep: 1,
        completedSteps: [],
        profile: { name: '', industry: '', timezone: '' },
        integrations: {},
        agent: { name: '', promptTemplate: '', voiceProvider: '' },
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
```

**Usage**:
```typescript
function OnboardingWizard() {
  const currentStep = useOnboardingStore(state => state.currentStep)
  const setStep = useOnboardingStore(state => state.setStep)
  const markStepComplete = useOnboardingStore(state => state.markStepComplete)
  
  const handleNext = () => {
    markStepComplete(currentStep)
    setStep(currentStep + 1)
  }
  
  return (
    <div>
      <StepIndicator current={currentStep} />
      {currentStep === 1 && <ProfileStep />}
      {currentStep === 2 && <IntegrationsStep />}
      {/* ... */}
      <button onClick={handleNext}>Next</button>
    </div>
  )
}
```

**Persistence**:
- All onboarding state persisted to `localStorage`
- Cleared on completion (`reset()` called after final step)
- Resume onboarding if user refreshes midway

---

### Usage Store

**Purpose**: Manage usage dashboard filters and settings

**State**:
```typescript
interface UsageState {
  dateRange: { start: string; end: string }
  filters: { agents: string[]; providers: string[]; metrics: string[] }
  chartSettings: { showCalls: boolean; showMessages: boolean; showTokens: boolean; showCost: boolean }
  
  setDateRange: (range: { start: string; end: string }) => void
  updateFilters: (filters: Partial<Filters>) => void
  resetFilters: () => void
  toggleChartSeries: (series: string) => void
}
```

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UsageState {
  dateRange: { start: string; end: string }
  filters: { agents: string[]; providers: string[]; metrics: string[] }
  chartSettings: { showCalls: boolean; showMessages: boolean; showTokens: boolean; showCost: boolean }
  
  setDateRange: (range: { start: string; end: string }) => void
  updateFilters: (filters: any) => void
  resetFilters: () => void
  toggleChartSeries: (series: string) => void
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      dateRange: { start: '', end: '' }, // Populated on mount
      filters: { agents: [], providers: [], metrics: [] },
      chartSettings: { showCalls: true, showMessages: true, showTokens: true, showCost: true },
      
      setDateRange: (range) => set({ dateRange: range }),
      updateFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
      resetFilters: () => set({ filters: { agents: [], providers: [], metrics: [] } }),
      toggleChartSeries: (series) => set({
        chartSettings: { ...get().chartSettings, [series]: !get().chartSettings[series] }
      }),
    }),
    {
      name: 'usage-storage',
    }
  )
)
```

---

## Server State Management (TanStack Query)

### Overview

**TanStack Query** (formerly React Query): Powerful data-fetching library

**Benefits**:
- Automatic caching and background refetching
- Optimistic updates for mutations
- Stale-while-revalidate pattern
- Request deduplication
- Retry logic with exponential backoff
- DevTools for debugging

---

### Query Client Setup

**Configuration** (`lib/queryClient.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute (data considered fresh)
      cacheTime: 5 * 60_000, // 5 minutes (cache retention after unmount)
      retry: 3, // Retry failed requests 3 times
      refetchOnWindowFocus: false, // Disable refetch on window focus (enable selectively)
      refetchOnReconnect: true, // Refetch on network reconnect
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
})
```

**Provider Setup** (`app/layout.tsx`):
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

### Query Patterns

#### Fetching Data

**Basic Query**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchUser } from '@/api/users'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })
  
  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return <div>{data.name}</div>
}
```

**Query Keys**:
- Unique identifier for cached data
- Array format: `['entity', param1, param2]`
- Examples:
  - `['user', userId]`
  - `['usage', 'summary', dateRange]`
  - `['invoices', { page, status }]`

**Stale Time**:
- Data considered fresh for this duration
- No refetch if data is fresh
- Example: `staleTime: 60_000` (1 minute)

**Cache Time**:
- How long unused data stays in cache
- Default: 5 minutes after last component unmount
- Example: `cacheTime: 10 * 60_000` (10 minutes)

---

#### Dependent Queries

**Pattern**: Query B depends on data from Query A

**Example**:
```typescript
function UserUsage({ userId }: { userId: string }) {
  // First, fetch user to get tenant ID
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })
  
  // Then, fetch usage for tenant (enabled only when user is loaded)
  const { data: usage } = useQuery({
    queryKey: ['usage', user?.tenantId],
    queryFn: () => fetchUsage(user!.tenantId),
    enabled: !!user, // Only run when user exists
  })
  
  return <div>{usage?.totalCalls}</div>
}
```

---

#### Pagination

**Pattern**: Fetch paginated data with page tracking

**Example**:
```typescript
function InvoiceList() {
  const [page, setPage] = useState(1)
  
  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => fetchInvoices(page),
    keepPreviousData: true, // Keep old data while fetching new page
  })
  
  return (
    <div>
      {data?.invoices.map(invoice => <InvoiceRow key={invoice.id} invoice={invoice} />)}
      <Pagination
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
        disabled={isPreviousData}
      />
    </div>
  )
}
```

**Key Points**:
- `keepPreviousData: true` — Show old data while fetching new page (no flash of loading)
- `isPreviousData` — Disable pagination buttons during fetch

---

#### Infinite Scroll

**Pattern**: Fetch data in chunks, appending to list

**Example**:
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function UsageBreakdown() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['usage', 'breakdown'],
    queryFn: ({ pageParam = 1 }) => fetchUsageBreakdown(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  })
  
  return (
    <div>
      {data?.pages.map(page =>
        page.items.map(item => <UsageRow key={item.id} item={item} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

### Mutation Patterns

#### Creating Data

**Basic Mutation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAgent } from '@/api/agents'

function CreateAgentForm() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      // Invalidate agents list to refetch
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`)
    },
  })
  
  const handleSubmit = (data) => {
    mutation.mutate(data)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Creating...' : 'Create Agent'}
      </button>
    </form>
  )
}
```

**Invalidation**:
- After mutation, mark related queries as stale
- Forces refetch on next render
- Example: After creating agent, invalidate `['agents']` list

---

#### Optimistic Updates

**Pattern**: Update UI immediately, rollback if mutation fails

**Example**:
```typescript
function ToggleConnectionStatus({ connectionId }: { connectionId: string }) {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => updateConnection(connectionId, { enabled }),
    
    // Before mutation, update cache optimistically
    onMutate: async (enabled) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['connections', connectionId] })
      
      // Snapshot previous value
      const previousConnection = queryClient.getQueryData(['connections', connectionId])
      
      // Optimistically update cache
      queryClient.setQueryData(['connections', connectionId], (old: any) => ({
        ...old,
        enabled,
      }))
      
      // Return context with snapshot
      return { previousConnection }
    },
    
    // On error, rollback to snapshot
    onError: (err, enabled, context) => {
      queryClient.setQueryData(['connections', connectionId], context?.previousConnection)
      toast.error('Failed to update connection')
    },
    
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', connectionId] })
    },
  })
  
  return (
    <Switch
      checked={connection.enabled}
      onCheckedChange={(enabled) => mutation.mutate(enabled)}
    />
  )
}
```

**Steps**:
1. **onMutate**: Update cache immediately, save snapshot
2. **onError**: Rollback to snapshot if mutation fails
3. **onSettled**: Refetch to ensure cache is accurate

---

### Caching Strategies

#### Per-Feature Cache Times

**Usage Dashboard**:
- Summary metrics: 1 minute stale time (near real-time)
- Daily trends: 5 minutes stale time (historical data)
- Breakdown table: 1 minute stale time

**Billing Portal**:
- Current cycle: 5 minutes stale time
- Invoice history: 10 minutes stale time
- Payment methods: 10 minutes stale time

**Connections Page**:
- Connection list: 5 minutes stale time
- Connection status: 30 seconds stale time (frequent checks)

**Settings**:
- User profile: 5 minutes stale time
- API keys: 10 minutes stale time
- Team members: 5 minutes stale time

**Implementation**:
```typescript
// Usage summary (1 minute stale)
const { data } = useQuery({
  queryKey: ['usage', 'summary', period],
  queryFn: () => fetchUsageSummary(period),
  staleTime: 60_000,
  refetchInterval: 60_000, // Refetch every minute
})

// Invoice history (10 minutes stale)
const { data } = useQuery({
  queryKey: ['invoices'],
  queryFn: fetchInvoices,
  staleTime: 10 * 60_000,
})

// Connection status (30 seconds stale)
const { data } = useQuery({
  queryKey: ['connections', connectionId, 'status'],
  queryFn: () => fetchConnectionStatus(connectionId),
  staleTime: 30_000,
  refetchInterval: 30_000, // Poll every 30 seconds
})
```

---

#### Prefetching

**Pattern**: Load data before it's needed (e.g., on hover, on route navigate)

**Example — Hover Prefetch**:
```typescript
import { useQueryClient } from '@tanstack/react-query'

function InvoiceRow({ invoice }) {
  const queryClient = useQueryClient()
  
  const prefetchDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['invoice', invoice.id],
      queryFn: () => fetchInvoiceDetails(invoice.id),
    })
  }
  
  return (
    <tr onMouseEnter={prefetchDetails} onClick={() => openInvoiceModal(invoice.id)}>
      <td>{invoice.number}</td>
      <td>{invoice.amount}</td>
    </tr>
  )
}
```

**Example — Route Prefetch**:
```typescript
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

function Navigation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const prefetchUsage = () => {
    queryClient.prefetchQuery({
      queryKey: ['usage', 'summary'],
      queryFn: fetchUsageSummary,
    })
  }
  
  return (
    <nav>
      <Link href="/usage" onMouseEnter={prefetchUsage}>
        Usage Dashboard
      </Link>
    </nav>
  )
}
```

---

#### Background Refetching

**Pattern**: Automatically refetch stale data in background

**Example**:
```typescript
const { data } = useQuery({
  queryKey: ['usage', 'summary'],
  queryFn: fetchUsageSummary,
  staleTime: 60_000, // Fresh for 1 minute
  refetchInterval: 60_000, // Refetch every 1 minute (even if page not visible)
  refetchIntervalInBackground: true, // Refetch even when tab is inactive
})
```

**Use Cases**:
- Usage metrics (update every minute)
- Connection status (poll every 30 seconds)
- Notification counts (poll every 2 minutes)

---

### Real-Time Updates (WebSocket Integration)

**Pattern**: Combine WebSocket events with TanStack Query cache invalidation

**Example**:
```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '@/hooks/useWebSocket'

function UsageDashboard() {
  const queryClient = useQueryClient()
  const ws = useWebSocket()
  
  useEffect(() => {
    // Listen for usage events
    const handleUsageEvent = (event: UsageEvent) => {
      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['usage', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['usage', 'trends'] })
    }
    
    ws.on('usage-event', handleUsageEvent)
    
    return () => {
      ws.off('usage-event', handleUsageEvent)
    }
  }, [ws, queryClient])
  
  // Queries defined normally
  const { data } = useQuery({
    queryKey: ['usage', 'summary'],
    queryFn: fetchUsageSummary,
  })
  
  return <div>{data?.totalCalls}</div>
}
```

**Alternative — Direct Cache Update**:
```typescript
const handleUsageEvent = (event: UsageEvent) => {
  // Directly update cache (no refetch)
  queryClient.setQueryData(['usage', 'summary'], (old: any) => ({
    ...old,
    totalCalls: old.totalCalls + 1,
    estimatedCost: old.estimatedCost + event.cost,
  }))
}
```

---

## Performance Optimization

### Selective Re-renders

**Problem**: Component re-renders when any part of query data changes

**Solution**: Use selector function to subscribe to specific fields

**Before (Re-renders on any data change)**:
```typescript
function Header() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  return <div>{user?.name}</div>
}
```

**After (Re-renders only when name changes)**:
```typescript
function Header() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    select: (data) => ({ name: data.name }), // Extract only name
  })
  return <div>{user?.name}</div>
}
```

---

### Memoization

**Problem**: Expensive computations run on every render

**Solution**: Use `useMemo` to cache computed values

**Example**:
```typescript
import { useMemo } from 'react'

function UsageChart({ data }) {
  // Expensive transformation
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: formatDate(item.date),
      calls: item.calls,
      cost: calculateCost(item),
    }))
  }, [data]) // Only recompute when data changes
  
  return <LineChart data={chartData} />
}
```

---

### Debouncing User Input

**Problem**: Search input triggers API call on every keystroke

**Solution**: Debounce input to reduce API calls

**Example**:
```typescript
import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'

function SearchAgents() {
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm) // Debounce
  
  const { data } = useQuery({
    queryKey: ['agents', 'search', deferredSearchTerm],
    queryFn: () => searchAgents(deferredSearchTerm),
    enabled: deferredSearchTerm.length >= 3, // Only search if 3+ characters
  })
  
  return (
    <div>
      <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <SearchResults results={data} />
    </div>
  )
}
```

**Alternative — Custom Hook**:
```typescript
import { useEffect, useState } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// Usage
function SearchAgents() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay
  
  const { data } = useQuery({
    queryKey: ['agents', 'search', debouncedSearchTerm],
    queryFn: () => searchAgents(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
  })
  
  return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
}
```

---

### Code Splitting

**Problem**: Large component bundles slow initial page load

**Solution**: Use `React.lazy` and `Suspense` for code splitting

**Example**:
```typescript
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('@/components/HeavyChart'))

function UsageDashboard() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={chartData} />
      </Suspense>
    </div>
  )
}
```

---

## State Synchronization

### URL State Sync

**Pattern**: Persist filters/settings to URL query params for shareable links

**Example**:
```typescript
import { useRouter, useSearchParams } from 'next/navigation'
import { useUsageStore } from '@/stores/usageStore'

function UsageDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dateRange, setDateRange } = useUsageStore()
  
  // On mount, read from URL
  useEffect(() => {
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (start && end) {
      setDateRange({ start, end })
    }
  }, [searchParams, setDateRange])
  
  // On change, update URL
  const handleDateChange = (range: { start: string; end: string }) => {
    setDateRange(range)
    router.push(`/usage?start=${range.start}&end=${range.end}`)
  }
  
  return <DateRangePicker value={dateRange} onChange={handleDateChange} />
}
```

**Benefits**:
- Shareable URLs (e.g., `/usage?start=2025-10-01&end=2025-10-23`)
- Browser back/forward navigation works
- Deep linking support

---

### localStorage Sync

**Pattern**: Persist Zustand state to `localStorage` with middleware

**Already Covered**: See Auth Store, UI Store examples above

**Key Points**:
- Use `persist` middleware from `zustand/middleware`
- Specify `name` (localStorage key)
- Use `partialize` to persist only needed fields (avoid large objects)

---

### Server State Sync

**Pattern**: Update server state after client state changes

**Example**:
```typescript
function ThemeToggle() {
  const { theme, setTheme } = useUIStore()
  const mutation = useMutation({
    mutationFn: (theme: string) => updateUserPreferences({ theme }),
  })
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme) // Update local state
    mutation.mutate(newTheme) // Sync to server
  }
  
  return <ThemeSelector value={theme} onChange={handleThemeChange} />
}
```

---

## Error Handling

### Query Errors

**Pattern**: Display error UI when query fails

**Example**:
```typescript
function UserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  })
  
  if (isLoading) return <Spinner />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading profile</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  
  return <div>{data.name}</div>
}
```

**Global Error Handler**:
```typescript
import { QueryCache } from '@tanstack/react-query'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Log to monitoring service
      console.error('Query error:', error)
      
      // Show toast notification
      toast.error(`Something went wrong: ${error.message}`)
    },
  }),
})
```

---

### Mutation Errors

**Pattern**: Show error feedback on mutation failure

**Example**:
```typescript
function CreateAgentForm() {
  const mutation = useMutation({
    mutationFn: createAgent,
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('An agent with this name already exists')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to create agents')
      } else {
        toast.error(`Failed to create agent: ${error.message}`)
      }
    },
  })
  
  return <form onSubmit={(data) => mutation.mutate(data)} />
}
```

---

## DevTools

### TanStack Query DevTools

**Setup** (already included in layout):
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Features**:
- View all queries and mutations
- Inspect cache data
- See query status (fresh, fetching, stale, inactive)
- Manually trigger refetch or clear cache
- View error details

**Access**: Click floating button in bottom-right corner (dev mode only)

---

### Zustand DevTools

**Setup**:
```typescript
import { devtools } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // ... store implementation
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' } // Name shown in Redux DevTools
  )
)
```

**Access**: Open Redux DevTools extension in browser

---

## Testing Strategies

### Testing Zustand Stores

**Example**:
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })
  
  it('should set user and mark as authenticated', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setUser({ id: '1', name: 'John Doe', email: 'john@example.com' })
    })
    
    expect(result.current.user?.name).toBe('John Doe')
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

---

### Testing TanStack Query

**Example**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('User Query', () => {
  it('should fetch user data', async () => {
    const { result } = renderHook(
      () => useQuery({ queryKey: ['user'], queryFn: () => Promise.resolve({ name: 'John' }) }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('John')
  })
})
```

---

## Related Documentation

- [Portal UI Overview](./overview.md) — Architecture and design philosophy
- [Portal UI Features](./features.md) — Detailed feature specifications
- [Routing](./routing.md) — App Router structure and auth guards
- [Integration](./integration.md) — API client and backend communication

---

**Next Steps**:
1. Review and approve state management patterns
2. Document routing structure in `routing.md`
3. Specify API integration in `integration.md`
