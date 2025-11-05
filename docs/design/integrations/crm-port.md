# CRM Port Specification

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Purpose

The CRM Port (`ICRMPort`) provides a vendor-agnostic interface for managing customer relationship data including contacts, opportunities, and tasks. The primary adapter is GoHighLevel (GHL), with future support for Salesforce and HubSpot.

## Port Interface

```typescript
export interface ICRMPort {
  // Contact Management
  getContact(contactId: string): Promise<Contact>;
  listContacts(filter: ContactFilter): Promise<PaginatedResult<Contact>>;
  createContact(data: CreateContactDTO): Promise<Contact>;
  updateContact(contactId: string, data: UpdateContactDTO): Promise<Contact>;
  deleteContact(contactId: string): Promise<void>;
  searchContacts(query: string): Promise<Contact[]>;
  
  // Opportunity Management
  getOpportunity(opportunityId: string): Promise<Opportunity>;
  listOpportunities(filter: OpportunityFilter): Promise<PaginatedResult<Opportunity>>;
  createOpportunity(data: CreateOpportunityDTO): Promise<Opportunity>;
  updateOpportunity(opportunityId: string, data: UpdateOpportunityDTO): Promise<Opportunity>;
  deleteOpportunity(opportunityId: string): Promise<void>;
  
  // Task Management
  getTask(taskId: string): Promise<Task>;
  listTasks(filter: TaskFilter): Promise<PaginatedResult<Task>>;
  createTask(data: CreateTaskDTO): Promise<Task>;
  updateTask(taskId: string, data: UpdateTaskDTO): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // Appointment Sync
  syncAppointment(appointmentId: string, calendarEventId: string): Promise<void>;
  
  // Provider Metadata
  getProviderName(): string;
  getProviderCapabilities(): CRMCapabilities;
  isHealthy(): Promise<boolean>;
}
```

## Domain Models

### Contact

```typescript
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: Address;
  tags?: string[];
  customFields?: Record<string, unknown>;
  source?: string; // lead source
  assignedTo?: string; // user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: Address;
  tags?: string[];
  customFields?: Record<string, unknown>;
  source?: string;
  assignedTo?: string;
}

export interface UpdateContactDTO extends Partial<CreateContactDTO> {}

export interface ContactFilter {
  email?: string;
  phone?: string;
  tags?: string[];
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}
```

### Opportunity

```typescript
export interface Opportunity {
  id: string;
  name: string;
  contactId: string;
  stage: OpportunityStage;
  value: number;
  currency: string;
  probability?: number; // 0-100
  expectedCloseDate?: Date;
  assignedTo?: string;
  pipelineId?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum OpportunityStage {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export interface CreateOpportunityDTO {
  name: string;
  contactId: string;
  stage: OpportunityStage;
  value: number;
  currency?: string; // defaults to 'USD'
  probability?: number;
  expectedCloseDate?: Date;
  assignedTo?: string;
  pipelineId?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateOpportunityDTO extends Partial<CreateOpportunityDTO> {}

export interface OpportunityFilter {
  contactId?: string;
  stage?: OpportunityStage;
  assignedTo?: string;
  minValue?: number;
  maxValue?: number;
  pipelineId?: string;
  limit?: number;
  offset?: number;
}
```

### Task

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  contactId?: string;
  opportunityId?: string;
  type: TaskType;
  status: TaskStatus;
  dueDate?: Date;
  assignedTo?: string;
  priority?: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum TaskType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TODO = 'todo',
  FOLLOW_UP = 'follow_up',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  contactId?: string;
  opportunityId?: string;
  type: TaskType;
  status?: TaskStatus; // defaults to PENDING
  dueDate?: Date;
  assignedTo?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {}

export interface TaskFilter {
  contactId?: string;
  opportunityId?: string;
  type?: TaskType;
  status?: TaskStatus;
  assignedTo?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  limit?: number;
  offset?: number;
}
```

## GoHighLevel (GHL) Adapter

### Configuration

```typescript
export interface GHLConfig {
  apiUrl: string; // https://rest.gohighlevel.com
  oauth: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  webhookSecret: string;
  rateLimits: {
    requestsPerSecond: number; // 10 by default
    burstSize: number; // 50 by default
  };
}
```

### Authentication

GHL uses OAuth 2.0 authorization code flow:

1. **Authorization Request**
   - Redirect user to: `https://marketplace.gohighlevel.com/oauth/chooselocation`
   - Scopes: `contacts.readonly`, `contacts.write`, `opportunities.readonly`, `opportunities.write`, `calendars.readonly`, `calendars.write`

2. **Token Exchange**
   ```typescript
   POST https://services.leadconnectorhq.com/oauth/token
   {
     "client_id": "...",
     "client_secret": "...",
     "grant_type": "authorization_code",
     "code": "...",
     "redirect_uri": "..."
   }
   ```

3. **Token Refresh**
   ```typescript
   POST https://services.leadconnectorhq.com/oauth/token
   {
     "client_id": "...",
     "client_secret": "...",
     "grant_type": "refresh_token",
     "refresh_token": "..."
   }
   ```

### API Mapping

#### Contacts

| Port Operation | GHL API Endpoint | Method |
|---------------|------------------|--------|
| `getContact` | `/contacts/{contactId}` | GET |
| `listContacts` | `/contacts/` | GET |
| `createContact` | `/contacts/` | POST |
| `updateContact` | `/contacts/{contactId}` | PUT |
| `deleteContact` | `/contacts/{contactId}` | DELETE |
| `searchContacts` | `/contacts/search` | POST |

#### Opportunities

| Port Operation | GHL API Endpoint | Method |
|---------------|------------------|--------|
| `getOpportunity` | `/opportunities/{opportunityId}` | GET |
| `listOpportunities` | `/opportunities/search` | POST |
| `createOpportunity` | `/opportunities/` | POST |
| `updateOpportunity` | `/opportunities/{opportunityId}` | PUT |
| `deleteOpportunity` | `/opportunities/{opportunityId}` | DELETE |

#### Tasks

| Port Operation | GHL API Endpoint | Method |
|---------------|------------------|--------|
| `getTask` | `/contacts/{contactId}/tasks/{taskId}` | GET |
| `listTasks` | `/contacts/{contactId}/tasks` | GET |
| `createTask` | `/contacts/{contactId}/tasks/` | POST |
| `updateTask` | `/contacts/{contactId}/tasks/{taskId}` | PUT |
| `deleteTask` | `/contacts/{contactId}/tasks/{taskId}` | DELETE |

### Error Handling

#### Rate Limiting

GHL enforces rate limits:
- **Limit**: 10 requests/second, burst up to 50
- **Response**: HTTP 429 with `Retry-After` header
- **Strategy**: Exponential backoff with jitter

```typescript
private async handleRateLimit(retryAfter: number): Promise<void> {
  const delayMs = (retryAfter + Math.random()) * 1000;
  this.logger.warn('GHL rate limit hit, retrying after delay', { delayMs });
  await sleep(delayMs);
}
```

#### Common Errors

| GHL Error | HTTP Status | Domain Error |
|-----------|-------------|--------------|
| Invalid token | 401 | `AuthenticationError` |
| Insufficient scopes | 403 | `AuthorizationError` |
| Contact not found | 404 | `NotFoundError` |
| Duplicate email | 409 | `ValidationError` |
| Rate limit exceeded | 429 | `RateLimitError` |
| Server error | 500 | `IntegrationError` |

### Data Transformation

#### Contact Mapping

```typescript
private mapGHLContactToDomain(ghlContact: any): Contact {
  return {
    id: ghlContact.id,
    firstName: ghlContact.firstName || '',
    lastName: ghlContact.lastName || '',
    email: ghlContact.email,
    phone: ghlContact.phone,
    companyName: ghlContact.companyName,
    address: {
      street: ghlContact.address1,
      city: ghlContact.city,
      state: ghlContact.state,
      postalCode: ghlContact.postalCode,
      country: ghlContact.country,
    },
    tags: ghlContact.tags || [],
    customFields: ghlContact.customFields || {},
    source: ghlContact.source,
    assignedTo: ghlContact.assignedTo,
    createdAt: new Date(ghlContact.dateAdded),
    updatedAt: new Date(ghlContact.dateUpdated),
  };
}
```

## Future Adapters

### Salesforce

- **Authentication**: OAuth 2.0 with JWT bearer flow
- **API**: Salesforce REST API v58.0
- **Objects**: Contact, Lead, Opportunity, Task, Event
- **Rate Limits**: 15,000 API calls per 24 hours (varies by edition)
- **Considerations**: Lead vs Contact distinction, multi-org support

### HubSpot

- **Authentication**: OAuth 2.0 or Private App access token
- **API**: HubSpot CRM API v3
- **Objects**: Contact, Deal (Opportunity), Task, Engagement
- **Rate Limits**: 100 requests/10 seconds
- **Considerations**: Properties API for custom fields, associations for relationships

## Testing Strategy

### Unit Tests
- Mock GHL HTTP responses for each operation
- Test error mapping and retry logic
- Validate data transformations (GHL ↔ domain)

### Integration Tests
- Use GHL sandbox account
- Test OAuth flow end-to-end
- Validate CRUD operations for contacts, opportunities, tasks
- Test rate limit handling

### Contract Tests
- Verify adapter implements all ICRMPort methods
- Validate domain model structure
- Test error types thrown match port interface

---

**Related**: See [overview.md](./overview.md) for ports & adapters pattern details.
