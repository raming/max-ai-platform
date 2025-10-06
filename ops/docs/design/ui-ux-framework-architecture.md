# ARCH-08: UI/UX Framework and Portal Scaffolding Architecture

## Executive Summary

This architecture defines the UI/UX framework and portal scaffolding for the MaxAI platform, establishing a cohesive design system built on Next.js 14, Tailwind CSS, and shadcn/ui that integrates seamlessly with our Nx monorepo structure.

## Technical Stack Decision

### Core Stack (Recommended)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v3.4+ with CSS-in-JS for dynamic theming
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Charts**: Tremor v3 for dashboard analytics
- **Tables**: TanStack Table v8 for complex data grids
- **Forms**: React Hook Form + Zod for validation
- **State Management**: Zustand for client state, TanStack Query for server state
- **Testing**: Vitest + React Testing Library + Playwright
- **Accessibility**: Built-in via Radix primitives + automated axe testing

### Rationale
- **Performance**: App Router provides optimal SSR/SSG capabilities
- **Developer Experience**: Type-safe forms with Zod, excellent DX with shadcn/ui
- **Accessibility**: Radix primitives ensure WCAG 2.1 AA compliance out of the box  
- **Consistency**: shadcn/ui provides a cohesive design system while remaining customizable
- **Enterprise Ready**: Tremor and TanStack Table handle complex business requirements

## Nx-Compliant Architecture

### Application Structure
```
client/
  apps/
    web/                           # 👈 Main portal application
      app/                         # Next.js App Router
        (dashboard)/               # Route groups for navigation
          clients/
          integrations/
          flows/
          billing/
          templates/
          settings/
        (auth)/
          login/
          callback/
        layout.tsx                 # Root layout with nav
        page.tsx                   # Dashboard home
        globals.css                # Tailwind imports
      components/                  # App-specific components
        nav/
        auth/
        layouts/
      lib/                        # App utilities
        auth.ts
        api.ts
      project.json                # Nx project config
```

### Library Structure
```
client/
  libs/
    ui/
      components/                  # 👈 Shared UI component library
        src/
          components/
            ui/                    # shadcn/ui components
            forms/                 # Form components with RHF+Zod
            data-display/          # Tables, charts, lists
            navigation/            # Nav, breadcrumbs, tabs
            feedback/              # Toasts, alerts, modals
            layout/                # Grid, containers, spacing
          lib/
            theme.ts               # Design tokens
            utils.ts               # Component utilities
          stories/                 # Storybook stories
        project.json
      
      wizard/                      # 👈 Multi-step wizard components  
        src/
          components/
            wizard-shell.tsx       # Main wizard container
            wizard-step.tsx        # Individual step wrapper
            wizard-navigation.tsx  # Step navigation
            wizard-progress.tsx    # Progress indicator
          lib/
            wizard-state.ts        # Zustand store for wizard state
            wizard-types.ts        # TypeScript definitions
        project.json
      
      charts/                      # 👈 Business chart components
        src/
          components/
            usage-chart.tsx        # Billing usage visualization
            performance-chart.tsx  # Agent performance metrics
            timeline-chart.tsx     # Activity timelines
          lib/
            chart-config.ts        # Tremor configuration
        project.json
    
    shared/
      design-tokens/               # 👈 Design system foundation
        src/
          tokens/
            colors.ts              # Color palette
            typography.ts          # Font scales
            spacing.ts             # Layout spacing
            breakpoints.ts         # Responsive breakpoints
          themes/
            light.ts               # Light theme configuration
            dark.ts                # Dark theme configuration
        project.json
```

## Design System Architecture

### Design Tokens
```typescript
// libs/shared/design-tokens/src/tokens/colors.ts
export const colors = {
  // Brand colors
  primary: {
    50: '#eff6ff',
    500: '#3b82f6', 
    900: '#1e3a8a',
  },
  // Semantic colors
  success: { /* ... */ },
  warning: { /* ... */ },
  error: { /* ... */ },
  // Neutral palette
  gray: { /* ... */ },
}

// libs/shared/design-tokens/src/themes/light.ts
export const lightTheme = {
  colors: {
    background: colors.gray[50],
    foreground: colors.gray[900],
    primary: colors.primary[500],
    // ... semantic mappings
  }
}
```

### Component Architecture Pattern
```typescript
// libs/ui/components/src/components/forms/client-form.tsx
interface ClientFormProps {
  initialData?: ClientData
  onSubmit: (data: ClientData) => Promise<void>
  mode: 'create' | 'edit'
}

export function ClientForm({ initialData, onSubmit, mode }: ClientFormProps) {
  const form = useForm<ClientData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields using shadcn/ui components */}
      </form>
    </Form>
  )
}
```

## Portal Shell Architecture

### Navigation Structure
- **Primary Navigation**: Dashboard, Clients, Integrations, Flows, Billing, Templates, Settings
- **Secondary Navigation**: Context-sensitive sub-navigation per section
- **User Menu**: Profile, preferences, logout
- **Theme Toggle**: Light/dark mode switcher

### Layout Patterns
```typescript
// apps/web/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <Header />
                <div className="p-6">
                  {children}
                </div>
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Authentication Boundaries
- **Protected Routes**: All dashboard routes require authentication
- **Public Routes**: Landing page, login, documentation
- **Auth Middleware**: Next.js middleware for route protection
- **Session Management**: NextAuth.js integration with IAM service

## Multi-Step Wizard Architecture

### Wizard State Management
```typescript
// libs/ui/wizard/src/lib/wizard-state.ts
interface WizardStore {
  steps: WizardStep[]
  currentStep: number
  formData: Record<string, any>
  isValid: boolean
  
  // Actions
  nextStep: () => void
  previousStep: () => void
  setStepData: (stepId: string, data: any) => void
  validateCurrentStep: () => boolean
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  // Implementation
}))
```

### Wizard Implementation Pattern
```typescript
// apps/web/app/(dashboard)/clients/onboarding/page.tsx
export default function ClientOnboardingWizard() {
  return (
    <WizardShell
      steps={[
        { id: 'client-info', title: 'Client Information', component: ClientInfoStep },
        { id: 'templates', title: 'Select Templates', component: TemplateSelectionStep },
        { id: 'customize', title: 'Customize', component: CustomizationStep },
        { id: 'deploy', title: 'Deploy', component: DeploymentStep },
      ]}
      onComplete={handleWizardComplete}
    />
  )
}
```

## Form Architecture

### Schema-First Validation
```typescript
// libs/shared/validation/src/schemas/client.ts
export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  // ... other fields
})

export type ClientData = z.infer<typeof clientSchema>
```

### Form Component Pattern
```typescript
// libs/ui/components/src/components/forms/form-field.tsx
interface FormFieldProps<T> {
  name: keyof T
  label: string
  description?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField<T>({ name, label, description, required, children }: FormFieldProps<T>) {
  return (
    <FormItem>
      <FormLabel className={required ? 'required' : ''}>
        {label}
      </FormLabel>
      <FormControl>
        {children}
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}
```

## Data Display Architecture

### Table Configuration
```typescript
// libs/ui/components/src/components/data-display/data-table.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  selection?: boolean
}

export function DataTable<T>({ columns, data, ...options }: DataTableProps<T>) {
  // TanStack Table implementation with shadcn/ui styling
}
```

### Chart Integration
```typescript
// libs/ui/charts/src/components/usage-chart.tsx
interface UsageChartProps {
  data: UsageData[]
  timeRange: 'day' | 'week' | 'month'
  showComparison?: boolean
}

export function UsageChart({ data, timeRange, showComparison }: UsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          categories={['calls', 'messages', 'ai_tokens']}
          colors={['blue', 'green', 'amber']}
          // ... Tremor configuration
        />
      </CardContent>
    </Card>
  )
}
```

## Theming and Dark Mode

### Theme Configuration
```typescript
// libs/shared/design-tokens/src/lib/theme-provider.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### CSS Variables for Dynamic Theming
```css
/* apps/web/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... other variables */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* ... dark theme variables */
  }
}
```

## Testing Architecture

### Component Testing Strategy
```typescript
// libs/ui/components/src/components/forms/__tests__/client-form.test.tsx
describe('ClientForm', () => {
  it('validates required fields', async () => {
    render(<ClientForm onSubmit={jest.fn()} mode="create" />)
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })
  
  it('submits valid form data', async () => {
    const onSubmit = jest.fn()
    render(<ClientForm onSubmit={onSubmit} mode="create" />)
    
    // Fill form and submit
    // Assert onSubmit called with correct data
  })
})
```

### Accessibility Testing
```typescript
// libs/ui/components/src/components/__tests__/a11y.test.tsx
describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ClientForm onSubmit={jest.fn()} mode="create" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Storybook Configuration
```typescript
// libs/ui/components/.storybook/main.ts
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-design-tokens',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
}
```

## Build and Development Configuration

### Tailwind Configuration
```javascript
// libs/ui/components/tailwind.config.js
module.exports = {
  presets: [require('../../shared/design-tokens/tailwind.preset.js')],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../../apps/web/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Nx Project Configuration
```json
// libs/ui/components/project.json
{
  "name": "ui-components",
  "sourceRoot": "libs/ui/components/src",
  "projectType": "library",
  "tags": ["type:lib", "layer:ui", "framework:react"],
  "targets": {
    "build": {
      "executor": "@nx/rollup:rollup",
      "options": {
        "outputPath": "dist/libs/ui/components",
        "tsConfig": "libs/ui/components/tsconfig.lib.json",
        "main": "libs/ui/components/src/index.ts"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "config": "libs/ui/components/vite.config.ts"
      }
    },
    "storybook": {
      "executor": "@storybook/angular:start-storybook",
      "options": {
        "port": 4400,
        "configDir": "libs/ui/components/.storybook"
      }
    }
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Initialize Nx applications and libraries structure
- [ ] Set up Next.js 14 app with App Router in `client/apps/web`
- [ ] Configure Tailwind CSS and design tokens
- [ ] Implement basic shadcn/ui component integration
- [ ] Create theme provider with light/dark mode support

### Phase 2: Core Components (Week 2)
- [ ] Build foundational UI components library
- [ ] Implement form architecture with RHF + Zod
- [ ] Create wizard framework and components
- [ ] Set up data table with TanStack Table
- [ ] Integrate Tremor charts for analytics

### Phase 3: Portal Shell (Week 3)
- [ ] Build responsive navigation and layout system  
- [ ] Implement authentication boundaries and middleware
- [ ] Create dashboard landing page
- [ ] Build client onboarding wizard
- [ ] Add connect accounts wizard

### Phase 4: Testing and Documentation (Week 4)
- [ ] Set up comprehensive test suite (unit + e2e)
- [ ] Configure Storybook with all components
- [ ] Implement accessibility testing automation
- [ ] Create component documentation
- [ ] Performance optimization and bundle analysis

## Success Metrics

### Technical Metrics
- **Bundle Size**: Initial load < 200KB gzipped
- **Performance**: Lighthouse score > 90 for all metrics
- **Accessibility**: WCAG 2.1 AA compliance (100% automated tests passing)
- **Test Coverage**: > 95% for all UI components
- **Build Time**: Full build < 30 seconds

### User Experience Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Theme Switch Time**: < 100ms

## Risk Mitigation

### Technical Risks
1. **Bundle Size Bloat**: Use dynamic imports, tree shaking, and bundle analyzer
2. **Accessibility Regression**: Automated testing in CI/CD pipeline
3. **Theme Inconsistency**: Design token system with TypeScript enforcement
4. **Mobile Responsiveness**: Mobile-first design with comprehensive breakpoint testing

### Development Risks  
1. **Learning Curve**: Comprehensive documentation and Storybook examples
2. **Component Inconsistency**: Strict linting rules and PR review guidelines
3. **Performance Degradation**: Regular performance audits and monitoring

## Next Steps

1. **Team Lead Assignment**: Assign to development team for implementation
2. **Nx Structure Setup**: Complete foundation per compliance audit
3. **Design System Review**: Coordinate with design team on brand guidelines
4. **Development Kickoff**: Begin Phase 1 implementation per roadmap

This architecture provides a solid foundation for scalable, accessible, and maintainable UI development that aligns perfectly with our Nx monorepo structure and Phase 1 requirements.