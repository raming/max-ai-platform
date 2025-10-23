# Calendar Port Specification

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Purpose

The Calendar Port (`ICalendarPort`) provides a vendor-agnostic interface for managing calendar events, checking availability, and scheduling appointments. Primary adapters are Google Calendar and Microsoft Calendar (via Microsoft Graph API).

## Port Interface

```typescript
export interface ICalendarPort {
  // Event Management
  getEvent(eventId: string): Promise<CalendarEvent>;
  listEvents(filter: EventFilter): Promise<CalendarEvent[]>;
  createEvent(data: CreateEventDTO): Promise<CalendarEvent>;
  updateEvent(eventId: string, data: UpdateEventDTO): Promise<CalendarEvent>;
  deleteEvent(eventId: string): Promise<void>;
  
  // Availability
  checkAvailability(request: AvailabilityRequest): Promise<AvailabilitySlot[]>;
  getFreeBusy(emails: string[], start: Date, end: Date): Promise<FreeBusyResult>;
  
  // Calendar Management
  listCalendars(): Promise<Calendar[]>;
  getCalendar(calendarId: string): Promise<Calendar>;
  
  // Webhooks
  subscribeToCalendar(calendarId: string, webhookUrl: string): Promise<WebhookSubscription>;
  unsubscribeFromCalendar(subscriptionId: string): Promise<void>;
  
  // Provider Metadata
  getProviderName(): string;
  getProviderCapabilities(): CalendarCapabilities;
  isHealthy(): Promise<boolean>;
}
```

## Domain Models

### CalendarEvent

```typescript
export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay: boolean;
  attendees: Attendee[];
  organizer: Attendee;
  status: EventStatus;
  visibility: EventVisibility;
  meetingLink?: string; // Google Meet, Teams link
  conferenceData?: ConferenceData;
  reminders?: Reminder[];
  recurrence?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendee {
  email: string;
  name?: string;
  status: AttendeeStatus;
  isOptional?: boolean;
}

export enum AttendeeStatus {
  NEEDS_ACTION = 'needs_action',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
}

export enum EventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  CONFIDENTIAL = 'confidential',
}

export interface ConferenceData {
  provider: 'google_meet' | 'microsoft_teams' | 'zoom';
  joinUrl: string;
  conferenceId: string;
}

export interface Reminder {
  method: 'email' | 'popup' | 'sms';
  minutesBefore: number;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: Date;
  count?: number;
  byDay?: string[]; // ['MO', 'WE', 'FR']
}

export interface CreateEventDTO {
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;
  isAllDay?: boolean;
  attendees?: Omit<Attendee, 'status'>[];
  visibility?: EventVisibility;
  createMeetingLink?: boolean;
  reminders?: Reminder[];
  recurrence?: RecurrenceRule;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}

export interface EventFilter {
  calendarId?: string;
  startTimeMin?: Date;
  startTimeMax?: Date;
  query?: string; // text search
  attendeeEmail?: string;
  limit?: number;
}
```

### Availability

```typescript
export interface AvailabilityRequest {
  emails: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  timezone: string;
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  availableAttendees: string[];
}

export interface FreeBusyResult {
  calendars: Record<string, FreeBusyCalendar>;
}

export interface FreeBusyCalendar {
  busy: TimeRange[];
  errors?: FreeBusyError[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface FreeBusyError {
  domain: string;
  reason: string;
}
```

### Calendar

```typescript
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  isPrimary: boolean;
  accessRole: AccessRole;
  backgroundColor?: string;
}

export enum AccessRole {
  OWNER = 'owner',
  WRITER = 'writer',
  READER = 'reader',
  FREE_BUSY_READER = 'freeBusyReader',
}
```

### Webhook Subscription

```typescript
export interface WebhookSubscription {
  id: string;
  calendarId: string;
  webhookUrl: string;
  expiresAt: Date;
  resourceId: string; // provider-specific
  channelId: string;  // provider-specific
}
```

## Google Calendar Adapter

### Configuration

```typescript
export interface GoogleCalendarConfig {
  oauth: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  apiUrl: string; // https://www.googleapis.com/calendar/v3
  scopes: string[]; // ['https://www.googleapis.com/auth/calendar']
}
```

### Authentication

Google Calendar uses OAuth 2.0:

1. **Authorization Request**
   - Redirect to: `https://accounts.google.com/o/oauth2/v2/auth`
   - Scopes: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`

2. **Token Exchange**
   ```typescript
   POST https://oauth2.googleapis.com/token
   {
     "client_id": "...",
     "client_secret": "...",
     "code": "...",
     "grant_type": "authorization_code",
     "redirect_uri": "..."
   }
   ```

### API Mapping

| Port Operation | Google Calendar API | Method |
|---------------|---------------------|--------|
| `getEvent` | `/calendars/{calendarId}/events/{eventId}` | GET |
| `listEvents` | `/calendars/{calendarId}/events` | GET |
| `createEvent` | `/calendars/{calendarId}/events` | POST |
| `updateEvent` | `/calendars/{calendarId}/events/{eventId}` | PUT |
| `deleteEvent` | `/calendars/{calendarId}/events/{eventId}` | DELETE |
| `checkAvailability` | `/freeBusy` | POST |
| `listCalendars` | `/users/me/calendarList` | GET |
| `subscribeToCalendar` | `/calendars/{calendarId}/events/watch` | POST |

### Webhook Subscription

Google Calendar uses push notifications:

```typescript
POST /calendars/{calendarId}/events/watch
{
  "id": "unique-channel-id",
  "type": "web_hook",
  "address": "https://platform.example.com/webhooks/google-calendar",
  "token": "verification-token"
}
```

**Renewal**: Subscriptions expire after 7 days, must be renewed

## Microsoft Calendar Adapter

### Configuration

```typescript
export interface MSCalendarConfig {
  oauth: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
  };
  apiUrl: string; // https://graph.microsoft.com/v1.0
  scopes: string[]; // ['Calendars.ReadWrite', 'Calendars.ReadWrite.Shared']
}
```

### Authentication

Microsoft Calendar uses OAuth 2.0 via Microsoft Graph:

1. **Authorization Request**
   - Redirect to: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
   - Scopes: `Calendars.ReadWrite`, `Calendars.ReadWrite.Shared`

2. **Token Exchange**
   ```typescript
   POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
   {
     "client_id": "...",
     "client_secret": "...",
     "code": "...",
     "grant_type": "authorization_code",
     "redirect_uri": "...",
     "scope": "Calendars.ReadWrite"
   }
   ```

### API Mapping

| Port Operation | Microsoft Graph API | Method |
|---------------|---------------------|--------|
| `getEvent` | `/me/events/{eventId}` | GET |
| `listEvents` | `/me/events` | GET |
| `createEvent` | `/me/events` | POST |
| `updateEvent` | `/me/events/{eventId}` | PATCH |
| `deleteEvent` | `/me/events/{eventId}` | DELETE |
| `getFreeBusy` | `/me/calendar/getSchedule` | POST |
| `listCalendars` | `/me/calendars` | GET |
| `subscribeToCalendar` | `/subscriptions` | POST |

### Webhook Subscription

Microsoft Graph uses webhook subscriptions:

```typescript
POST /subscriptions
{
  "changeType": "created,updated,deleted",
  "notificationUrl": "https://platform.example.com/webhooks/microsoft-calendar",
  "resource": "/me/events",
  "expirationDateTime": "2024-12-31T18:00:00.0000000Z",
  "clientState": "verification-token"
}
```

**Renewal**: Subscriptions expire after 4230 minutes (3 days), must be renewed

## Error Handling

### Rate Limiting

| Provider | Rate Limit | Strategy |
|----------|-----------|----------|
| Google Calendar | 10,000 requests/day per project | Exponential backoff |
| Microsoft Graph | 10,000 requests/10 minutes per app | Token bucket with retry |

### Common Errors

| Error Scenario | Google Status | Microsoft Status | Domain Error |
|----------------|---------------|------------------|--------------|
| Invalid token | 401 | 401 | `AuthenticationError` |
| Insufficient permissions | 403 | 403 | `AuthorizationError` |
| Event not found | 404 | 404 | `NotFoundError` |
| Time conflict | 409 | 409 | `ConflictError` |
| Rate limit | 429 | 429 | `RateLimitError` |

## Testing Strategy

### Unit Tests
- Mock Google/Microsoft API responses
- Test data transformations (provider ↔ domain)
- Validate timezone handling
- Test recurrence rule parsing

### Integration Tests
- Use test OAuth accounts for Google and Microsoft
- Test full event CRUD lifecycle
- Validate availability checking with real calendars
- Test webhook subscription and renewal

### Contract Tests
- Verify both adapters implement ICalendarPort
- Validate domain model consistency
- Test error type mappings

---

**Related**: See [overview.md](./overview.md) for ports & adapters pattern details.
