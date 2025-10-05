# Architecture Layering and DTO Conventions

Purpose
Define a clear separation between presentation (API/DTO), domain (business logic), and data (repositories/DB) with strict contracts.

Layers
- API (controllers)
  - Accept/return DTOs only (validated against JSON Schemas)
  - No business logic
- Domain (services)
  - Business rules and orchestration; depends on ports (CRM, Calendar, Payments, Message, LLM)
  - Uses domain entities/value objects (internal types), not DB models
- Data (repositories/adapters)
  - Implements repositories and external adapters (DB, CRM, etc.)
  - Maps between domain entities and persistence models

DTO vs Entity vs Persistence
- DTOs: request/response payloads (stable, versioned contracts)
- Entities: domain types; internal to services
- Persistence models: DB schema-mapped types; not exposed

Code conventions (TypeScript)
```ts path=null start=null
// DTO example (API layer)
export type CreateCustomerDto = {
  tenantId: string;
  clientId: string;
  name: string;
  email: string;
};

// Domain entity
export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public email: string
  ) {}
}

// Repository port
export interface CustomerRepository {
  create(c: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
}

// Mapper between DTO and entity
export const toCustomer = (dto: CreateCustomerDto): Customer =>
  new Customer(crypto.randomUUID(), dto.tenantId, dto.name, dto.email);
```

References
- docs/design/architecture-overview.md
- docs/design/ports-and-adapters.md
