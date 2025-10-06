# Nx Foldering Guide (Client Workspace)

Purpose
Establish a consistent Nx workspace layout for Next.js (web) and NestJS (backend) services with clear boundaries, caching, and maintainability.

Scope
- Workspace: client/ (this Nx wrapper lives here)
- Frameworks: Next.js (web), NestJS (API), Node.js libraries
- Polyglot note: non-Node services (Go/Python) can be coordinated via Nx run-commands; out of scope for default foldering, documented in “Future extensions.”

1) Standard folder layout
- apps/ — deployable applications (Next.js, NestJS)
- libs/ — shared, versioned libraries (feature, domain, data-access, util, ui)

Recommended initial structure:
- apps/
  - web/                # Next.js app (public portal or console)
  - api/                # NestJS service (main API)
- libs/
  - domain/<bounded-context>/
    - core/             # domain models, invariants (pure TS)
    - use-cases/        # application services (pure TS)
  - data-access/<name>/ # API clients, DB adapters (no inline SQL in services)
  - feature/<name>/     # reusable feature logic
  - ui/<name>/          # shared UI components (for Next.js)
  - util/<name>/        # general-purpose utilities
  - shared/config/      # config schemas, environment parsing
  - shared/validation/  # JSON schemas, contract validators (AJV)

2) Naming conventions
- Project names: kebab-case (e.g., web, api, domain-ordering-core)
- Paths: apps/<name>, libs/<category>/<name>
- Avoid cross-cutting “misc” buckets; prefer domain-based placement

3) Project tags and boundaries
Use tags to enforce allowed dependencies with @nx/enforce-module-boundaries for TS/JS code.
Suggested tags per project.json:
- type:app or type:lib
- framework:next|nest|none
- domain:<bounded-context> (e.g., domain:ordering)
- layer:ui|feature|data-access|domain|util|shared

Example dep constraints (TS/JS) to add in ESLint config:
- type:app can only depend on type:lib
- domain:* libs should depend only on their own domain, shared, or util

4) Generators and plugins
Install first-class Nx plugins for Node/TS:
- @nx/next for Next.js apps (web)
- @nx/nest for NestJS apps (api)
- @nx/jest for testing, @nx/eslint for lint targets
- @nx/js for general TS libs shared across app types

Typical scaffolding commands (run in client/):
- npm i -D @nx/next @nx/nest @nx/jest @nx/eslint @nx/js typescript jest ts-jest eslint
- npx nx g @nx/next:app web
- npx nx g @nx/nest:app api
- npx nx g @nx/js:lib shared/validation --directory=libs --tags "type:lib,layer:shared"

5) Targets and caching (workspace-wide)
Define default inputs/outputs once in nx.json so all projects benefit:
- build: cache true, outputs to dist/…
- test: cache true
- lint: cache true
- serve: non-cacheable

Also exclude artifacts like dist, coverage, .venv from inputs.

6) Example project.json (NestJS API)
- apps/api/project.json
{
  "name": "api",
  "root": "apps/api",
  "sourceRoot": "apps/api/src",
  "projectType": "application",
  "tags": ["type:app", "framework:nest", "domain:core"],
  "targets": {
    "build": {
      "executor": "@nx/nest:build",
      "options": {
        "outputPath": "dist/apps/api",
        "main": "apps/api/src/main.ts",
        "tsConfig": "apps/api/tsconfig.app.json"
      }
    },
    "serve": {
      "executor": "@nx/nest:serve",
      "options": {
        "buildTarget": "api:build"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "apps/api/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["apps/api/**/*.ts"]
      }
    }
  }
}

7) Example project.json (Next.js Web)
- apps/web/project.json
{
  "name": "web",
  "root": "apps/web",
  "sourceRoot": "apps/web",
  "projectType": "application",
  "tags": ["type:app", "framework:next", "domain:core"],
  "targets": {
    "build": {
      "executor": "@nx/next:build",
      "options": {
        "outputPath": "dist/apps/web"
      }
    },
    "serve": {
      "executor": "@nx/next:serve",
      "options": {}
    },
    "test": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "apps/web/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["apps/web/**/*.{ts,tsx}"]
      }
    }
  }
}

8) Libraries: roles and layering
- domain/*: pure business logic; can depend on util/shared but avoid framework specifics
- data-access/*: adapters/SDKs; never contain inline SQL in services/controllers
- feature/*: compose domain, data-access for reusable platform features
- ui/*: framework-specific components (Next.js)
- shared/*: cross-cutting concerns (validation, config, observability)

9) Testing & quality gates
- Jest for unit/integration tests; use @nx/jest executors
- Coverage goals: ≥95% for changed packages
- ESLint v9 (zero-warnings policy) with @nx/eslint executors
- Contract tests (JSON Schema) live in libs/shared/validation (or domain-specific lib) and run via Nx target test

10) TS configuration
- client/tsconfig.base.json defines path aliases for libs/* and apps/*
- Each project extends base and sets its own tsconfig.app.json / tsconfig.spec.json

11) Environment & config
- Do not commit secrets; use .env.local, .env.development, .env.test, .env.production as needed (not in VCS)
- Place typed config schemas in libs/shared/config and validate at bootstrap

12) CI & task caching
- Enable Nx remote caching if available; otherwise local cache default is fine
- Use nx affected to run changed targets in PRs
- All app PRs must pass: lint (no warnings), type-check, test + coverage, contract tests

13) Example repository view (partial)
client/
  apps/
    api/
      src/
      project.json
    web/
      pages/  # or app/ for Next.js App Router
      project.json
  libs/
    shared/validation/
      src/
      project.json
    domain/ordering/core/
      src/
      project.json
    data-access/iam/
      src/
      project.json
  nx.json
  .nx/
  nx

14) Module boundaries enforcement (TS/JS)
Add @nx/enforce-module-boundaries in the ESLint config for TS/JS projects and express constraints via tags:
- type:app -> only depends on type:lib
- domain:* -> only depends on domain:$1, domain:shared, type:lib

15) Future extensions (polyglot)
- Go/Python services can be added under apps/ and controlled via @nx/workspace:run-commands targets (build/test/lint/serve)
- Consider community plugins if deeper language integration is desired; otherwise keep them as leaf apps with run-commands for consistency and caching

16) Migration guidance
- When adding new bounded contexts, prefer new domain/* subtrees over growing shared/*
- Split coarse libs into smaller, focused libs when boundaries blur
- Keep project.json small and focused; rely on nx.json for targetDefaults and namedInputs
