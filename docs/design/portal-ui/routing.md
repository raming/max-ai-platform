# Portal UI Component — Routing

**Tracker**: Issue #155  
**Related**: [Overview](./overview.md), [Features](./features.md), [State Management](./state-management.md)

## Purpose

This document defines the routing architecture for the Portal UI Component using Next.js 14 App Router. It covers route structure, authentication guards, middleware, navigation patterns, and dynamic routes.

---

## Next.js App Router Overview

### File-System Based Routing

**Convention**: File structure in `app/` directory maps directly to URL paths

**Special Files**:
- `page.tsx` — Route component (renders at the path)
- `layout.tsx` — Shared layout for route segment and children
- `loading.tsx` — Loading UI (Suspense boundary)
- `error.tsx` — Error boundary
- `not-found.tsx` — 404 page
- `route.ts` — API route handler

**Example Structure**:
```
app/
├── layout.tsx         → Root layout (all pages)
├── page.tsx           → Home page (/)
├── (auth)/
│   ├── layout.tsx     → Auth layout (login, signup)
│   ├── login/
│   │   └── page.tsx   → /login
│   └── signup/
│       └── page.tsx   → /signup
└── (dashboard)/
    ├── layout.tsx     → Dashboard layout (authenticated routes)
    ├── onboarding/
    │   └── page.tsx   → /onboarding
    ├── connections/
    │   └── page.tsx   → /connections
    ├── usage/
    │   └── page.tsx   → /usage
    ├── billing/
    │   └── page.tsx   → /billing
    └── settings/
        └── page.tsx   → /settings
```

**Route Groups** (parentheses notation):
- `(auth)` and `(dashboard)` are route groups
- Do NOT appear in URL path
- Used to organize routes and apply shared layouts
- Example: `app/(auth)/login/page.tsx` → `/login` (not `/auth/login`)

---

## Route Structure

### Public Routes (Unauthenticated)

**Landing Page** (`/`):
- File: `app/page.tsx`
- Purpose: Marketing landing page or redirect to login
- Layout: Root layout only (no auth/dashboard layout)

**Authentication Routes** (`/login`, `/signup`, `/forgot-password`):
- Route Group: `(auth)`
- Files:
  - `app/(auth)/login/page.tsx` → `/login`
  - `app/(auth)/signup/page.tsx` → `/signup`
  - `app/(auth)/forgot-password/page.tsx` → `/forgot-password`
- Layout: `app/(auth)/layout.tsx` (centered card layout)
- Redirects authenticated users to dashboard

---

### Protected Routes (Authenticated)

**Dashboard Routes** (`/onboarding`, `/connections`, `/usage`, `/billing`, `/settings`):
- Route Group: `(dashboard)`
- Files:
  - `app/(dashboard)/onboarding/page.tsx` → `/onboarding`
  - `app/(dashboard)/connections/page.tsx` → `/connections`
  - `app/(dashboard)/usage/page.tsx` → `/usage`
  - `app/(dashboard)/billing/page.tsx` → `/billing`
  - `app/(dashboard)/settings/page.tsx` → `/settings`
- Layout: `app/(dashboard)/layout.tsx` (sidebar + header)
- Auth Guard: Middleware redirects unauthenticated users to `/login`

---

### Dynamic Routes

**Invoice Details** (`/billing/invoices/:invoiceId`):
- File: `app/(dashboard)/billing/invoices/[invoiceId]/page.tsx`
- URL: `/billing/invoices/INV-2025-10-001`
- Access param: `params.invoiceId`

**Agent Details** (`/agents/:agentId`):
- File: `app/(dashboard)/agents/[agentId]/page.tsx`
- URL: `/agents/a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Access param: `params.agentId`

**Example Component**:
```typescript
// app/(dashboard)/billing/invoices/[invoiceId]/page.tsx
export default function InvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const { data: invoice } = useQuery({
    queryKey: ['invoice', params.invoiceId],
    queryFn: () => fetchInvoice(params.invoiceId),
  })
  
  return <InvoiceDetails invoice={invoice} />
}
```

---

## Authentication Guards

### Middleware-Based Auth

**File**: `middleware.ts` (root of project, not in `app/`)

**Purpose**: Run before every request to check auth status and apply redirects

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/onboarding') ||
                          request.nextUrl.pathname.startsWith('/connections') ||
                          request.nextUrl.pathname.startsWith('/usage') ||
                          request.nextUrl.pathname.startsWith('/billing') ||
                          request.nextUrl.pathname.startsWith('/settings')
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && isDashboardPage) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname) // Return after login
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Flow**:
1. User requests `/usage`
2. Middleware runs before page loads
3. Checks for valid JWT token (NextAuth.js session)
4. If no token: Redirect to `/login?callbackUrl=/usage`
5. If token valid: Allow request to proceed
6. After login: Redirect back to `/usage`

---

### Layout-Based Auth Checks

**Dashboard Layout** (`app/(dashboard)/layout.tsx`):
- Secondary auth check (redundant with middleware, but provides better UX)
- Fetches user session on mount
- Shows loading spinner while checking auth
- Redirects if session expired

**Implementation**:
```typescript
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  if (status === 'loading') {
    return <FullPageSpinner />
  }
  
  if (!session) {
    return null // Redirecting...
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

### Role-Based Access Control (RBAC)

**Scenario**: Certain routes restricted to admins only

**Approach 1: Middleware RBAC**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const userRole = token?.role as string
  
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/403', request.url)) // Forbidden
  }
  
  return NextResponse.next()
}
```

**Approach 2: Layout/Component RBAC**
```typescript
// app/(dashboard)/settings/team/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { PermissionDenied } from '@/components/PermissionDenied'

export default function TeamManagementPage() {
  const { data: session } = useSession()
  
  if (session?.user?.role !== 'admin') {
    return <PermissionDenied message="Only admins can manage team members" />
  }
  
  return <TeamManagement />
}
```

**Approach 3: Server Component RBAC**
```typescript
// app/(dashboard)/settings/team/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function TeamManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role !== 'admin') {
    redirect('/403')
  }
  
  return <TeamManagement />
}
```

---

## Navigation Patterns

### Client-Side Navigation

**Next.js Link Component**:
```typescript
import Link from 'next/link'

function Sidebar() {
  return (
    <nav>
      <Link href="/usage" className="nav-link">
        Usage Dashboard
      </Link>
      <Link href="/billing" className="nav-link">
        Billing Portal
      </Link>
      <Link href="/settings" className="nav-link">
        Settings
      </Link>
    </nav>
  )
}
```

**Benefits**:
- Client-side navigation (no full page reload)
- Automatic prefetching on hover (production only)
- Scroll restoration
- Focus management

---

### Programmatic Navigation

**useRouter Hook**:
```typescript
'use client'

import { useRouter } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  
  const handleLogin = async (credentials) => {
    const result = await signIn(credentials)
    if (result.success) {
      router.push('/onboarding') // Navigate to onboarding
    }
  }
  
  return <form onSubmit={handleLogin} />
}
```

**Methods**:
- `router.push('/path')` — Navigate to path (adds to history)
- `router.replace('/path')` — Navigate to path (replaces current history entry)
- `router.back()` — Go back one page
- `router.forward()` — Go forward one page
- `router.refresh()` — Refresh current route (refetch server data)
- `router.prefetch('/path')` — Prefetch route in background

---

### Active Link Highlighting

**Pattern**: Highlight current route in navigation

**Implementation**:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  
  return (
    <Link
      href={href}
      className={cn(
        'nav-link',
        isActive && 'bg-accent text-accent-foreground' // Highlight active link
      )}
    >
      {children}
    </Link>
  )
}
```

---

### Breadcrumbs

**Pattern**: Show navigation hierarchy for deep routes

**Example**:
```typescript
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const label = segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = index === segments.length - 1
        
        return (
          <div key={href} className="flex items-center space-x-2">
            <span>/</span>
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
```

**Result**: `Home / Billing / Invoices / INV-2025-10-001`

---

## Loading States

### Route-Level Loading UI

**File**: `loading.tsx` in route segment

**Purpose**: Show loading UI while route is loading (Suspense boundary)

**Example**:
```typescript
// app/(dashboard)/usage/loading.tsx
export default function UsageLoadingPage() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" /> {/* Key metrics cards */}
      <Skeleton className="h-64 w-full" /> {/* Chart */}
      <Skeleton className="h-96 w-full" /> {/* Table */}
    </div>
  )
}
```

**Behavior**:
- Automatically wraps `page.tsx` in `<Suspense fallback={<loading.tsx />}>`
- Shows while route component is loading
- Works with streaming SSR

---

### Component-Level Loading

**Pattern**: Show loading spinner for individual components

**Example**:
```typescript
import { Suspense } from 'react'
import { UsageChart } from '@/components/UsageChart'
import { ChartSkeleton } from '@/components/ChartSkeleton'

export default function UsagePage() {
  return (
    <div>
      <h1>Usage Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <UsageChart />
      </Suspense>
    </div>
  )
}
```

---

## Error Handling

### Route-Level Error Boundary

**File**: `error.tsx` in route segment

**Purpose**: Catch errors in route component and children

**Example**:
```typescript
// app/(dashboard)/usage/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function UsageErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Usage page error:', error)
  }, [error])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground">
        We couldn't load the usage dashboard. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

**Behavior**:
- Automatically wraps `page.tsx` in error boundary
- Shows when component throws error
- `reset()` function re-renders page

---

### Global Error Handler

**File**: `app/error.tsx` (root level)

**Purpose**: Catch errors in root layout and all routes

**Example**:
```typescript
// app/error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="text-xl mb-8">Something went wrong</p>
          <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded">
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

---

### 404 Not Found

**File**: `app/not-found.tsx`

**Purpose**: Show custom 404 page

**Example**:
```typescript
// app/not-found.tsx
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-8">Page not found</p>
      <Link href="/" className="text-primary hover:underline">
        Go back home
      </Link>
    </div>
  )
}
```

**Trigger**:
- Accessing non-existent route
- Calling `notFound()` function in server component

**Example Programmatic 404**:
```typescript
import { notFound } from 'next/navigation'

export default async function InvoicePage({ params }: { params: { invoiceId: string } }) {
  const invoice = await fetchInvoice(params.invoiceId)
  
  if (!invoice) {
    notFound() // Trigger 404 page
  }
  
  return <InvoiceDetails invoice={invoice} />
}
```

---

## URL Query Parameters

### Reading Query Params

**Client Component**:
```typescript
'use client'

import { useSearchParams } from 'next/navigation'

export default function UsagePage() {
  const searchParams = useSearchParams()
  const start = searchParams.get('start') // /usage?start=2025-10-01
  const end = searchParams.get('end')     // /usage?end=2025-10-23
  
  return <UsageDashboard start={start} end={end} />
}
```

**Server Component**:
```typescript
export default function UsagePage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string }
}) {
  const start = searchParams.start
  const end = searchParams.end
  
  return <UsageDashboard start={start} end={end} />
}
```

---

### Updating Query Params

**Client Component**:
```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function DateRangeSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const updateDateRange = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('start', start)
    params.set('end', end)
    router.push(`/usage?${params.toString()}`) // Navigate with new query params
  }
  
  return <DatePicker onChange={updateDateRange} />
}
```

---

## Prefetching

### Automatic Prefetching (Links)

**Behavior**: Next.js automatically prefetches routes in viewport

**Example**:
```typescript
<Link href="/usage">Usage Dashboard</Link>
// On hover (desktop) or on viewport entry (mobile), Next.js prefetches /usage route
```

**Disable Prefetch**:
```typescript
<Link href="/usage" prefetch={false}>Usage Dashboard</Link>
```

---

### Manual Prefetching

**Pattern**: Prefetch routes programmatically

**Example**:
```typescript
'use client'

import { useRouter } from 'next/navigation'

function Dashboard() {
  const router = useRouter()
  
  const prefetchUsage = () => {
    router.prefetch('/usage') // Prefetch route in background
  }
  
  return (
    <div>
      <button onMouseEnter={prefetchUsage} onClick={() => router.push('/usage')}>
        Go to Usage
      </button>
    </div>
  )
}
```

---

## SEO and Metadata

### Static Metadata

**File**: `page.tsx` or `layout.tsx`

**Export**: `metadata` object

**Example**:
```typescript
// app/(dashboard)/usage/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usage Dashboard | Max AI Platform',
  description: 'Monitor your platform usage and costs in real-time',
  openGraph: {
    title: 'Usage Dashboard',
    description: 'Monitor your platform usage and costs in real-time',
    images: ['/og-usage.png'],
  },
}

export default function UsagePage() {
  return <UsageDashboard />
}
```

---

### Dynamic Metadata

**Function**: `generateMetadata`

**Example**:
```typescript
// app/(dashboard)/billing/invoices/[invoiceId]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { invoiceId: string }
}): Promise<Metadata> {
  const invoice = await fetchInvoice(params.invoiceId)
  
  return {
    title: `Invoice ${invoice.number} | Max AI Platform`,
    description: `Invoice for ${invoice.period} - ${invoice.amount}`,
  }
}

export default function InvoicePage({ params }: { params: { invoiceId: string } }) {
  return <InvoiceDetails invoiceId={params.invoiceId} />
}
```

---

## Route Handlers (API Routes)

### Purpose
Create backend API endpoints within Next.js app

### File Convention
`app/api/[route]/route.ts`

### Example
```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

**URL**: `/api/health`

---

### CRUD Operations

**GET**:
```typescript
// app/api/users/[userId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = await fetchUser(params.userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json(user)
}
```

**POST**:
```typescript
// app/api/agents/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const agent = await createAgent(body)
  return NextResponse.json(agent, { status: 201 })
}
```

**PATCH**:
```typescript
// app/api/users/[userId]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const body = await request.json()
  const user = await updateUser(params.userId, body)
  return NextResponse.json(user)
}
```

**DELETE**:
```typescript
// app/api/integrations/[provider]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  await deleteIntegration(params.provider)
  return NextResponse.json({ success: true }, { status: 204 })
}
```

---

### Authentication in Route Handlers

**Example**:
```typescript
// app/api/protected/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const data = await fetchProtectedData(session.user.id)
  return NextResponse.json(data)
}
```

---

## Parallel Routes

### Purpose
Render multiple pages in the same layout simultaneously (e.g., modals, split views)

### File Convention
`@slot` directories

### Example Structure
```
app/
└── (dashboard)/
    └── usage/
        ├── page.tsx          → Main usage page
        ├── @modal/
        │   └── details/
        │       └── page.tsx  → Modal content
        └── layout.tsx        → Renders both slots
```

**Layout**:
```typescript
// app/(dashboard)/usage/layout.tsx
export default function UsageLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <div>
      {children}  {/* Main usage page */}
      {modal}     {/* Modal slot (conditionally rendered) */}
    </div>
  )
}
```

**Navigate to Modal**:
```typescript
<Link href="/usage/details">View Details</Link>
// Renders modal slot while keeping main page visible
```

---

## Intercepting Routes

### Purpose
Intercept navigation to show content in a modal while preserving URL

### File Convention
`(.)` prefix for intercepting

### Example
```
app/
└── (dashboard)/
    └── billing/
        ├── invoices/
        │   └── [invoiceId]/
        │       └── page.tsx       → Full invoice page
        └── (.)invoices/
            └── [invoiceId]/
                └── page.tsx       → Modal view of invoice
```

**Behavior**:
- Soft navigation (clicking link): Shows modal from `(.)invoices/...`
- Hard navigation (refreshing URL): Shows full page from `invoices/...`

---

## Route Groups and Organization

### Recommended Structure

```
app/
├── (marketing)/          → Public routes (landing, pricing, etc.)
│   ├── layout.tsx        → Marketing layout (simple header/footer)
│   ├── page.tsx          → Home page (/)
│   ├── pricing/
│   │   └── page.tsx      → /pricing
│   └── about/
│       └── page.tsx      → /about
│
├── (auth)/               → Auth routes
│   ├── layout.tsx        → Auth layout (centered card)
│   ├── login/
│   │   └── page.tsx      → /login
│   ├── signup/
│   │   └── page.tsx      → /signup
│   └── forgot-password/
│       └── page.tsx      → /forgot-password
│
└── (dashboard)/          → Authenticated routes
    ├── layout.tsx        → Dashboard layout (sidebar + header)
    ├── onboarding/
    │   └── page.tsx      → /onboarding
    ├── connections/
    │   └── page.tsx      → /connections
    ├── usage/
    │   └── page.tsx      → /usage
    ├── billing/
    │   ├── page.tsx      → /billing
    │   └── invoices/
    │       └── [invoiceId]/
    │           └── page.tsx → /billing/invoices/:invoiceId
    ├── settings/
    │   ├── page.tsx      → /settings (redirects to /settings/profile)
    │   ├── layout.tsx    → Settings tab layout
    │   ├── profile/
    │   │   └── page.tsx  → /settings/profile
    │   ├── preferences/
    │   │   └── page.tsx  → /settings/preferences
    │   ├── api-keys/
    │   │   └── page.tsx  → /settings/api-keys
    │   ├── team/
    │   │   └── page.tsx  → /settings/team
    │   └── security/
    │       └── page.tsx  → /settings/security
    └── agents/
        ├── page.tsx      → /agents (list)
        └── [agentId]/
            ├── page.tsx  → /agents/:agentId (details)
            └── edit/
                └── page.tsx → /agents/:agentId/edit
```

---

## Related Documentation

- [Portal UI Overview](./overview.md) — Architecture and design philosophy
- [Portal UI Features](./features.md) — Detailed feature specifications
- [State Management](./state-management.md) — Zustand and TanStack Query patterns
- [Integration](./integration.md) — API client and backend communication

---

**Next Steps**:
1. Review and approve routing structure
2. Specify API integration in `integration.md`
3. Implement auth middleware and route guards
4. Set up route-level loading and error boundaries
