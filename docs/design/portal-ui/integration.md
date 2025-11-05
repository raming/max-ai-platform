# Portal UI Component — Integration

**Tracker**: Issue #155  
**Related**: [Overview](./overview.md), [Features](./features.md), [State Management](./state-management.md), [Routing](./routing.md)

## Purpose

This document defines the integration architecture for the Portal UI Component with backend services. It covers API client implementation, authentication handling, error management, request/response interceptors, RBAC enforcement, and WebSocket connections.

---

## API Client Architecture

### Overview

**Purpose**: Centralize HTTP communication with backend services

**Technology**: Axios with custom wrapper

**Benefits**:
- Centralized error handling
- Automatic auth token injection
- Request/response interceptors
- Retry logic
- Type-safe API contracts
- Mock support for testing

---

### Base Configuration

**File**: `lib/apiClient.ts`

**Implementation**:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

// Create Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (add auth token)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor (handle errors)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      try {
        const newToken = await refreshToken()
        useAuthStore.getState().setToken(newToken)
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export const apiClient = axiosInstance
```

---

### Typed API Functions

**Pattern**: Create typed wrapper functions for each API endpoint

**Example** (`api/users.ts`):
```typescript
import { apiClient } from '@/lib/apiClient'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'member' | 'viewer'
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  company?: string
  timezone?: string
}

// GET /api/v1/users/:userId
export async function fetchUser(userId: string): Promise<User> {
  const response = await apiClient.get<User>(`/v1/users/${userId}`)
  return response.data
}

// PATCH /api/v1/users/:userId
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  const response = await apiClient.patch<User>(`/v1/users/${userId}`, data)
  return response.data
}

// POST /api/v1/users/:userId/photo
export async function uploadUserPhoto(userId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('photo', file)
  
  const response = await apiClient.post<{ url: string }>(
    `/v1/users/${userId}/photo`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return response.data
}
```

---

### Usage with TanStack Query

**Example**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUser, updateUser } from '@/api/users'

function UserProfile({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  
  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })
  
  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('Profile updated successfully')
    },
  })
  
  if (isLoading) return <Spinner />
  
  return <UserForm user={user} onSubmit={updateMutation.mutate} />
}
```

---

## Authentication

### NextAuth.js Integration

**Configuration** (`lib/auth.ts`):
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { apiClient } from './apiClient'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        try {
          // Call backend login API
          const response = await apiClient.post('/v1/auth/login', {
            email: credentials.email,
            password: credentials.password,
          })
          
          const { user, accessToken } = response.data
          
          // Return user object (stored in session)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            accessToken,
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      // On signin, add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.tenantId = user.tenantId
        token.accessToken = user.accessToken
      }
      return token
    },
    
    async session({ session, token }) {
      // Add user data to session
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
        tenantId: token.tenantId as string,
      }
      session.accessToken = token.accessToken as string
      return session
    },
  },
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}
```

---

### Session Provider

**Root Layout** (`app/layout.tsx`):
```typescript
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

### Using Session in Components

**Client Component**:
```typescript
'use client'

import { useSession } from 'next-auth/react'

function UserMenu() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <Spinner />
  if (!session) return <LoginButton />
  
  return (
    <div>
      <span>Welcome, {session.user.name}</span>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  )
}
```

**Server Component**:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <Dashboard user={session.user} />
}
```

---

### Token Refresh

**Implementation** (`lib/auth.ts`):
```typescript
export async function refreshToken(): Promise<string> {
  const response = await apiClient.post('/v1/auth/refresh', {
    // Refresh token from HTTP-only cookie (sent automatically)
  })
  return response.data.accessToken
}
```

**Automatic Refresh** (in API client response interceptor):
- Intercept 401 responses
- Call `refreshToken()` to get new access token
- Retry original request with new token
- If refresh fails, logout user

---

## Error Handling

### Error Types

**Network Errors**:
- No internet connection
- Timeout
- DNS resolution failed

**HTTP Errors**:
- 400 Bad Request — Client error (validation failed)
- 401 Unauthorized — Auth token missing/invalid
- 403 Forbidden — Insufficient permissions
- 404 Not Found — Resource doesn't exist
- 429 Too Many Requests — Rate limit exceeded
- 500 Internal Server Error — Backend error

**Business Logic Errors**:
- Custom error codes from backend (e.g., `DUPLICATE_AGENT_NAME`)

---

### Global Error Handler

**Implementation** (`lib/apiClient.ts`):
```typescript
import { toast } from '@/components/ui/use-toast'

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error (no response)
    if (!error.response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }
    
    const status = error.response.status
    const data = error.response.data as { message?: string; code?: string }
    
    // Handle specific status codes
    switch (status) {
      case 400:
        toast.error(data.message || 'Invalid request')
        break
      case 401:
        // Handled by token refresh logic
        break
      case 403:
        toast.error('You do not have permission to perform this action')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 429:
        toast.error('Too many requests. Please slow down.')
        break
      case 500:
      case 502:
      case 503:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error(data.message || 'An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)
```

---

### Component-Level Error Handling

**Example**:
```typescript
import { useMutation } from '@tanstack/react-query'
import { createAgent } from '@/api/agents'

function CreateAgentForm() {
  const mutation = useMutation({
    mutationFn: createAgent,
    onError: (error: AxiosError) => {
      const data = error.response?.data as { message?: string; code?: string }
      
      // Handle specific business errors
      if (data.code === 'DUPLICATE_AGENT_NAME') {
        toast.error('An agent with this name already exists')
      } else if (data.code === 'QUOTA_EXCEEDED') {
        toast.error('You have reached the maximum number of agents for your plan')
      } else {
        toast.error(data.message || 'Failed to create agent')
      }
    },
  })
  
  return <form onSubmit={(data) => mutation.mutate(data)} />
}
```

---

## RBAC Enforcement

### Permission Checking

**Backend Contract**: API returns 403 Forbidden if user lacks permission

**Frontend Approach**:
1. **Pessimistic** (default): Show UI, disable on 403 error
2. **Optimistic**: Hide UI elements based on user role (UX enhancement)

---

### Role-Based UI Rendering

**Example**:
```typescript
'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

function TeamManagement() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  
  return (
    <div>
      <h1>Team Members</h1>
      <TeamList />
      
      {/* Only show invite button to admins */}
      {isAdmin && (
        <Button onClick={() => openInviteModal()}>
          Invite Team Member
        </Button>
      )}
    </div>
  )
}
```

---

### Permission-Based Components

**Pattern**: Wrapper component for conditional rendering

**Implementation** (`components/Can.tsx`):
```typescript
import { useSession } from 'next-auth/react'

interface CanProps {
  perform: string // e.g., "manage:team", "view:billing"
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ perform, children, fallback = null }: CanProps) {
  const { data: session } = useSession()
  
  // Simple role-based permissions (extend with RBAC system)
  const permissions: Record<string, string[]> = {
    admin: ['manage:team', 'view:billing', 'manage:integrations', 'manage:agents'],
    member: ['view:billing', 'manage:agents'],
    viewer: ['view:billing'],
  }
  
  const userPermissions = permissions[session?.user?.role || 'viewer']
  const hasPermission = userPermissions.includes(perform)
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}
```

**Usage**:
```typescript
<Can perform="manage:team">
  <Button onClick={openInviteModal}>Invite Team Member</Button>
</Can>

<Can perform="manage:integrations" fallback={<p>Contact admin to manage integrations</p>}>
  <IntegrationSettings />
</Can>
```

---

## Request/Response Interceptors

### Request Interceptors

**Use Cases**:
- Add auth token to headers
- Add correlation IDs for tracing
- Log outgoing requests (debug mode)

**Implementation**:
```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Add auth token
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 2. Add correlation ID
    const correlationId = crypto.randomUUID()
    config.headers['X-Correlation-ID'] = correlationId
    
    // 3. Log request (debug mode)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }
    
    return config
  },
  (error) => Promise.reject(error)
)
```

---

### Response Interceptors

**Use Cases**:
- Handle auth token refresh
- Transform response data
- Log responses (debug mode)
- Track API performance

**Implementation**:
```typescript
axiosInstance.interceptors.response.use(
  (response) => {
    // 1. Log response (debug mode)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }
    
    // 2. Track API performance
    const duration = Date.now() - (response.config.metadata?.startTime || 0)
    if (duration > 5000) {
      console.warn(`Slow API call: ${response.config.url} (${duration}ms)`)
    }
    
    return response
  },
  async (error: AxiosError) => {
    // Error handling (see Error Handling section)
    return Promise.reject(error)
  }
)
```

---

## Loading States

### Global Loading Indicator

**Pattern**: Show loading bar at top of page for all API calls

**Implementation** (`components/LoadingBar.tsx`):
```typescript
'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { Progress } from '@/components/ui/progress'

export function LoadingBar() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    let progressTimer: NodeJS.Timeout
    
    // Request interceptor (start loading)
    const requestInterceptor = apiClient.interceptors.request.use((config) => {
      setLoading(true)
      setProgress(30) // Initial progress
      
      // Simulate progress
      progressTimer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)
      
      return config
    })
    
    // Response interceptor (stop loading)
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => {
        clearInterval(progressTimer)
        setProgress(100)
        setTimeout(() => {
          setLoading(false)
          setProgress(0)
        }, 300)
        return response
      },
      (error) => {
        clearInterval(progressTimer)
        setProgress(100)
        setTimeout(() => {
          setLoading(false)
          setProgress(0)
        }, 300)
        return Promise.reject(error)
      }
    )
    
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor)
      apiClient.interceptors.response.eject(responseInterceptor)
      clearInterval(progressTimer)
    }
  }, [])
  
  if (!loading) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={progress} className="h-1" />
    </div>
  )
}
```

**Usage** (Root Layout):
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoadingBar />
        {children}
      </body>
    </html>
  )
}
```

---

### Component-Level Loading

**Pattern**: Show spinner/skeleton while fetching data

**Example**:
```typescript
function UserProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  })
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }
  
  return <UserForm user={data} />
}
```

---

## WebSocket Integration

### Connection Setup

**File**: `lib/websocket.ts`

**Implementation**:
```typescript
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

let socket: Socket | null = null

export function connectWebSocket(): Socket {
  if (socket?.connected) {
    return socket
  }
  
  const token = useAuthStore.getState().accessToken
  
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })
  
  socket.on('connect', () => {
    console.log('WebSocket connected')
  })
  
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected')
  })
  
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error)
  })
  
  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
```

---

### React Hook

**File**: `hooks/useWebSocket.ts`

**Implementation**:
```typescript
import { useEffect, useRef } from 'react'
import { connectWebSocket, disconnectWebSocket } from '@/lib/websocket'
import { Socket } from 'socket.io-client'

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  
  useEffect(() => {
    socketRef.current = connectWebSocket()
    
    return () => {
      // Disconnect on unmount (optional, depends on use case)
      // disconnectWebSocket()
    }
  }, [])
  
  return socketRef.current
}
```

---

### Usage in Components

**Example — Real-Time Usage Updates**:
```typescript
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '@/hooks/useWebSocket'

interface UsageEvent {
  type: 'call' | 'message' | 'token'
  provider: string
  quantity: number
  cost: number
  timestamp: string
}

function UsageDashboard() {
  const queryClient = useQueryClient()
  const socket = useWebSocket()
  
  useEffect(() => {
    if (!socket) return
    
    // Subscribe to usage events
    socket.on('usage-event', (event: UsageEvent) => {
      console.log('Usage event received:', event)
      
      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['usage', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['usage', 'trends'] })
    })
    
    // Cleanup listener on unmount
    return () => {
      socket.off('usage-event')
    }
  }, [socket, queryClient])
  
  // Queries defined normally
  const { data } = useQuery({
    queryKey: ['usage', 'summary'],
    queryFn: fetchUsageSummary,
  })
  
  return <div>{data?.totalCalls}</div>
}
```

---

### Fallback to Polling

**Pattern**: Fall back to polling if WebSocket unavailable

**Example**:
```typescript
function UsageDashboard() {
  const queryClient = useQueryClient()
  const socket = useWebSocket()
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  
  useEffect(() => {
    if (!socket) return
    
    socket.on('connect', () => setIsWebSocketConnected(true))
    socket.on('disconnect', () => setIsWebSocketConnected(false))
    
    socket.on('usage-event', (event) => {
      queryClient.invalidateQueries({ queryKey: ['usage', 'summary'] })
    })
    
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('usage-event')
    }
  }, [socket, queryClient])
  
  // Query with conditional polling
  const { data } = useQuery({
    queryKey: ['usage', 'summary'],
    queryFn: fetchUsageSummary,
    refetchInterval: isWebSocketConnected ? false : 30_000, // Poll every 30s if WebSocket down
  })
  
  return <div>{data?.totalCalls}</div>
}
```

---

## Data Transformation

### Response Transformation

**Pattern**: Transform backend response to frontend-friendly format

**Example**:
```typescript
// Backend response
interface BackendUsageSummary {
  total_calls: number
  total_messages: number
  total_tokens: number
  estimated_cost: number
  trend_percentage: number
}

// Frontend format (camelCase)
interface UsageSummary {
  totalCalls: number
  totalMessages: number
  totalTokens: number
  estimatedCost: number
  trendPercentage: number
}

// Transformation function
function transformUsageSummary(data: BackendUsageSummary): UsageSummary {
  return {
    totalCalls: data.total_calls,
    totalMessages: data.total_messages,
    totalTokens: data.total_tokens,
    estimatedCost: data.estimated_cost,
    trendPercentage: data.trend_percentage,
  }
}

// API function
export async function fetchUsageSummary(): Promise<UsageSummary> {
  const response = await apiClient.get<BackendUsageSummary>('/v1/billing/usage/summary')
  return transformUsageSummary(response.data)
}
```

---

### Request Transformation

**Pattern**: Transform frontend data to backend-expected format

**Example**:
```typescript
// Frontend form data
interface AgentFormData {
  name: string
  promptTemplate: string
  voiceProvider: string
  voiceSettings: {
    language: string
    voiceId: string
    speed: number
  }
}

// Backend request format
interface CreateAgentRequest {
  name: string
  prompt_template: string
  voice_provider: string
  voice_settings: {
    language: string
    voice_id: string
    speed: number
  }
}

// Transformation function
function transformCreateAgentRequest(data: AgentFormData): CreateAgentRequest {
  return {
    name: data.name,
    prompt_template: data.promptTemplate,
    voice_provider: data.voiceProvider,
    voice_settings: {
      language: data.voiceSettings.language,
      voice_id: data.voiceSettings.voiceId,
      speed: data.voiceSettings.speed,
    },
  }
}

// API function
export async function createAgent(data: AgentFormData): Promise<Agent> {
  const request = transformCreateAgentRequest(data)
  const response = await apiClient.post<Agent>('/v1/agents', request)
  return response.data
}
```

---

## Retry Logic

### Automatic Retries

**Configuration** (`lib/apiClient.ts`):
```typescript
import axiosRetry from 'axios-retry'

// Configure retry logic
axiosRetry(axiosInstance, {
  retries: 3, // Max retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ?? 0) >= 500
  },
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount} for ${error.config?.url}`)
  },
})
```

**Behavior**:
- Retry on network errors (no response)
- Retry on 5xx errors (server errors)
- Do NOT retry on 4xx errors (client errors)
- Exponential backoff: 1s, 2s, 4s between retries

---

### Manual Retries

**Pattern**: Provide "Retry" button for failed queries

**Example**:
```typescript
function UserProfile() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    retry: false, // Disable automatic retries for manual control
  })
  
  if (isLoading) return <Spinner />
  
  if (error) {
    return (
      <div>
        <p>Failed to load profile</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }
  
  return <UserForm user={data} />
}
```

---

## Rate Limiting

### Client-Side Rate Limiting

**Pattern**: Prevent excessive API calls from client

**Implementation** (`lib/rateLimiter.ts`):
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(key) || []
    
    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs)
    
    if (validTimestamps.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    // Add current request timestamp
    validTimestamps.push(now)
    this.requests.set(key, validTimestamps)
    
    return true
  }
}

export const rateLimiter = new RateLimiter()
```

**Usage**:
```typescript
export async function createAgent(data: AgentFormData): Promise<Agent> {
  const allowed = rateLimiter.isAllowed('create-agent', 5, 60_000) // 5 requests per minute
  
  if (!allowed) {
    throw new Error('Too many requests. Please wait a moment.')
  }
  
  const response = await apiClient.post<Agent>('/v1/agents', data)
  return response.data
}
```

---

### Backend Rate Limit Handling

**Pattern**: Handle 429 Too Many Requests from backend

**Implementation** (in response interceptor):
```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const seconds = parseInt(retryAfter || '60', 10)
      
      toast.error(`Rate limit exceeded. Please try again in ${seconds} seconds.`)
    }
    
    return Promise.reject(error)
  }
)
```

---

## Testing

### Mocking API Calls

**Library**: MSW (Mock Service Worker)

**Setup** (`mocks/handlers.ts`):
```typescript
import { rest } from 'msw'

export const handlers = [
  // Mock user endpoint
  rest.get('/api/v1/users/:userId', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.userId,
        email: 'john@example.com',
        name: 'John Doe',
        role: 'admin',
        tenantId: 'tenant-123',
      })
    )
  }),
  
  // Mock create agent endpoint
  rest.post('/api/v1/agents', async (req, res, ctx) => {
    const body = await req.json()
    return res(
      ctx.status(201),
      ctx.json({
        id: 'agent-123',
        name: body.name,
        promptTemplate: body.prompt_template,
        voiceProvider: body.voice_provider,
      })
    )
  }),
]
```

**Test Example**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { fetchUser } from '@/api/users'

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('fetchUser', () => {
  it('should fetch user data', async () => {
    const { result } = renderHook(
      () => useQuery({ queryKey: ['user', '123'], queryFn: () => fetchUser('123') }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('John Doe')
  })
})
```

---

## Related Documentation

- [Portal UI Overview](./overview.md) — Architecture and design philosophy
- [Portal UI Features](./features.md) — Detailed feature specifications
- [State Management](./state-management.md) — Zustand and TanStack Query patterns
- [Routing](./routing.md) — App Router structure and auth guards
- [IAM Component](../iam/README.md) — Backend authentication and authorization
- [Billing-Usage Component](../billing-usage/README.md) — Usage metrics backend
- [Payments Component](../payments/README.md) — Billing and invoicing backend

---

**Next Steps**:
1. Review and approve integration architecture
2. Implement API client with interceptors
3. Set up NextAuth.js configuration
4. Create typed API functions for all endpoints
5. Implement WebSocket connection for real-time updates
6. Set up MSW for testing
