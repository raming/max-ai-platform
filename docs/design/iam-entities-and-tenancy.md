# IAM Entities and Multi-Tenancy

Purpose
Define schemas and relationships for tenants, clients (companies), groups, roles, permissions, and assignments. Clarify correlation to tenantId and clientId across events and data.

Entities
- Tenant: logical isolation boundary for an organization (e.g., our platform org or an agency/reseller)
- Client (Company): the end-customer business served within a tenant
- Group: collection of users within a tenant (optionally scoped to a client)
- Role: named role with a set of permissions
- Permission: action on resource patterns
- Assignment: links user→role→scope (tenant and/or client)

Correlations
- All requests/events include tenantId; clientId present when the action/resource is client-scoped
- Audit entries always include tenantId and optionally clientId

References
- Contracts: ../../contracts/tenant.schema.json, ../../contracts/client.schema.json, ../../contracts/group.schema.json, ../../contracts/role.schema.json, ../../contracts/permission.schema.json, ../../contracts/role-assignment.schema.json
- Layering: ../../architecture-layering.md
- Security: ../../security-compliance.md
