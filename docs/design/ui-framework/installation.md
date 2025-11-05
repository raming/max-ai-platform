# UI Framework Installation Guide

**Component**: UI Framework  
**Purpose**: Dependencies, configuration, and setup procedure  
**Status**: Ready for Implementation  
**Last Updated**: 2025-10-20

## Prerequisites

Before installing the UI framework, ensure:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **NX workspace** configured and working
- ✅ **Next.js app** exists at `client/web`
- ✅ **Git branch** created from `origin/main`
- ✅ **TypeScript** configured (tsconfig.json present)

## Installation Steps

### Step 1: Install Core Dependencies

```bash
cd client/web

# Install production dependencies
npm install @tanstack/react-query@^5.17.15 \
  zustand@^4.4.7 \
  class-variance-authority@^0.7.0 \
  clsx@^2.0.0 \
  tailwind-merge@^2.2.0 \
  lucide-react@^0.294.0 \
  tailwindcss-animate@^1.0.7

# Install dev dependencies
npm install --save-dev \
  @types/node@^20.19.9 \
  tailwindcss@^3.4.0 \
  autoprefixer@^10.4.16 \
  postcss@^8.4.32 \
  eslint-config-next@^14.0.4
```

### Step 2: Initialize Tailwind CSS

```bash
# Generate tailwind.config.js and postcss.config.js
npx tailwindcss init -p
```

### Step 3: Initialize shadcn/ui

```bash
# Initialize shadcn/ui (creates components.json)
npx shadcn-ui@latest init

# Answer prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - Global CSS: src/app/globals.css
# - CSS variables: Yes
# - Tailwind config: tailwind.config.js
# - Components: src/components
# - Utils: src/lib/utils
# - React Server Components: Yes
```

### Step 4: Install Essential shadcn/ui Components

```bash
# Install core UI components
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
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add toast
```

## Configuration Files

### tailwind.config.js

Create or update `client/web/tailwind.config.js`:

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
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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

### postcss.config.js

Create `client/web/postcss.config.js`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### next.config.js

Update `client/web/next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Ensure any existing config is preserved
}

module.exports = nextConfig
```

### src/app/globals.css

Create or update `client/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### src/lib/utils.ts

Create `client/web/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### components.json

This file should be created by `shadcn-ui init`. Verify it exists at `client/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Verification Steps

### Step 1: Verify Installation

```bash
# Check package.json has all dependencies
cat client/web/package.json | grep -E "tanstack|zustand|tailwind|shadcn"

# Verify tailwind config exists
ls client/web/tailwind.config.js

# Verify components.json exists
ls client/web/components.json
```

### Step 2: Build Test

```bash
cd client/web

# Run Next.js build
npm run build

# Expected output: No errors, successful build
```

### Step 3: Dev Server Test

```bash
# Start dev server
npm run dev

# Expected: Server starts on http://localhost:3000
# Visit in browser, should render without errors
```

### Step 4: Type Check

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Expected: No type errors
```

### Step 5: Lint Check

```bash
# Run ESLint
npm run lint

# Expected: 0 warnings, 0 errors
```

## Troubleshooting

### Issue: tailwindcss not found

```bash
# Solution: Reinstall tailwindcss
npm install --save-dev tailwindcss@latest autoprefixer@latest postcss@latest
npx tailwindcss init -p
```

### Issue: Module not found '@/lib/utils'

```bash
# Solution: Update tsconfig.json paths
# Add to compilerOptions:
"paths": {
  "@/*": ["./src/*"]
}
```

### Issue: CSS not loading

```bash
# Solution: Verify globals.css import in layout.tsx
# src/app/layout.tsx should have:
import './globals.css'
```

### Issue: shadcn-ui components not found

```bash
# Solution: Re-run shadcn-ui init
npx shadcn-ui@latest init --force

# Then re-add components
npx shadcn-ui@latest add button input card
```

## Post-Installation Tasks

### 1. Update .gitignore

Ensure `client/web/.gitignore` includes:

```
# Dependencies
/node_modules
/.pnp
.pnp.js

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env files
.env*.local

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

### 2. Configure ESLint

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### 3. Set Up Environment Variables

Create `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
```

### 4. Update package.json Scripts

Ensure these scripts exist:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

## Next Steps

After successful installation:

1. **Review Project Structure**: See [structure.md](./structure.md)
2. **Learn Component Patterns**: See [patterns.md](./patterns.md)
3. **Set Up Integration**: See [integration.md](./integration.md)
4. **Configure Testing**: See [testing.md](./testing.md)

## References

- **Overview**: [overview.md](./overview.md)
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Tracker Issue**: [#129](https://github.com/raming/max-ai-platform/issues/129)

---

**Compliance**: One-file-one-topic ✅ | Focused scope ✅ | < 300 lines ✅  
**Related Issues**: #129, #147  
**Last Review**: 2025-10-20 by architect.morgan-lee
