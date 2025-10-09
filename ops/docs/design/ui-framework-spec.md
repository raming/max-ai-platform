# UI Framework Implementation Specification

## Overview
This specification details the implementation of the UI framework stack for the MaxAI Platform portal (apps/portal-web). The stack must support multi-tenant, RBAC-enforced client experiences with high performance, accessibility, and security compliance.

## Technology Stack
- **Next.js 14** (App Router)
- **React 18** (Server Components)
- **shadcn/ui** + **Tailwind CSS**
- **Zustand** (client state)
- **TanStack Query** (server state)

## Installation and Setup

### Prerequisites
- Node.js 18+
- NX workspace configured
- Existing Next.js app in `client/web`

### Dependencies to Add
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.15",
    "zustand": "^4.4.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.294.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.19.9",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint-config-next": "^14.0.4"
  }
}
```

### Configuration Files

#### tailwind.config.js
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... additional theme colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### postcss.config.js
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### next.config.js Updates
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Add any existing config
}

module.exports = nextConfig
```

## Project Structure

### Folder Layout
```
client/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Route groups for RBAC
│   │   ├── (dashboard)/
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Tailwind imports
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilities
│   │   ├── store/            # Zustand stores
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Helper functions
│   │   └── queries/          # TanStack Query hooks
│   └── types/                # TypeScript types
├── tailwind.config.js
├── postcss.config.js
└── components.json          # shadcn/ui config
```

### Key Files

#### src/app/layout.tsx
```tsx
import { Inter } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MaxAI Platform',
  description: 'AI-Employee services platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          return failureCount < 3
        },
      },
    },
  })

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### src/lib/store/auth.ts (Zustand)
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  tenantId: string
  roles: string[]
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
```

#### src/lib/queries/user.ts (TanStack Query)
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export function useUser() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          'x-correlation-id': `cid-${Date.now()}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!user?.id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': `cid-${Date.now()}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
```

## Component Implementation

### shadcn/ui Setup
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add textarea
```

### Example Components

#### src/components/ui/button.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

#### src/components/layout/header.tsx
```tsx
'use client'

import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="font-semibold">MaxAI Platform</div>
        <div className="ml-auto flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.email} />
                    <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
```

## Integration with Existing Architecture

### RBAC Integration
- Use `useAuthStore` for user roles
- Conditionally render components based on permissions
- Integrate with feature flags for UI gating

### API Integration
- TanStack Query hooks in `src/lib/queries/`
- Include correlation IDs in headers
- Handle authentication errors (401 redirects)

### Security Compliance
- No sensitive data in client state
- Server Components for sensitive operations
- Audit logging via API calls

## Testing Strategy

### Unit Tests
- Component tests with Testing Library
- Store tests with Zustand
- Query hook tests with MSW

### Integration Tests
- Page-level tests with Playwright
- API integration tests

### Accessibility Tests
- axe-core for a11y validation
- Keyboard navigation tests

## Performance Considerations

### Bundle Optimization
- Tree-shaking with Next.js
- Dynamic imports for heavy components
- Image optimization with Next.js Image

### Caching Strategy
- TanStack Query for API caching
- Next.js ISR for static pages
- Service Worker for offline support (future)

## Migration Plan

### Phase 1: Setup
1. Install dependencies
2. Configure Tailwind and shadcn/ui
3. Set up Zustand and TanStack Query providers
4. Create base UI components

### Phase 2: Core Components
1. Implement layout components (Header, Sidebar, Footer)
2. Create form components with validation
3. Build dashboard widgets

### Phase 3: Feature Integration
1. Integrate with RBAC and feature flags
2. Add API integration
3. Implement error boundaries

## Acceptance Criteria
- [ ] Next.js 14 with App Router configured
- [ ] shadcn/ui components installed and themed
- [ ] Zustand store for auth state implemented
- [ ] TanStack Query for API data management
- [ ] Basic layout and navigation working
- [ ] Accessibility compliance (WCAG AA)
- [ ] Performance benchmarks met (<3s initial load)
- [ ] ESLint clean with 0 warnings
- [ ] Unit test coverage >80% for UI components