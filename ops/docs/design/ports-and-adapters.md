# Ports and Adapters

Purpose
Define canonical ports and the plugin/adapter pattern for platform-agnostic integrations.

Ports (contracts)
- ICRMPort
  - upsertContact, getContact, updateCustomFields, createOpportunity, listWebhooks, registerWebhook
- ICalendarPort
  - getAvailability, book, reschedule, cancel
- IMessagePort
  - sendSms, sendMms, sendVoice (optional), validateNumber
- IPaymentProviderPort
  - createCustomer, attachPayment, subscribe, reportUsage/createInvoiceItem, generateInvoice, refund, verifyWebhook, getInvoice
- ILlmPort
  - generateContent (prompt templates, flow specs), evaluate (lint/critique), embeddings (optional), model selection

Notes

Notes
- All adapter IO validated against JSON Schemas (non-prod runtime) and in CI contract tests
- Adapters are tenant-bound via declarative flow bindings; no direct service-to-adapter coupling in domain code
- Observability: every port call carries correlation_id, tenant_id, client_id; sensitive data redacted in logs

Examples (TypeScript signatures)
```ts
export interface ICRMPort {
  upsertContact(input: UpsertContactInput, ctx: RequestCtx): Promise<Contact>;
  updateCustomFields(input: UpdateCustomFieldsInput, ctx: RequestCtx): Promise<void>;
  createOpportunity(input: CreateOpportunityInput, ctx: RequestCtx): Promise<Opportunity>;
}

export interface ICalendarPort {
  getAvailability(input: AvailabilityQuery, ctx: RequestCtx): Promise<Availability[]>;
  book(input: BookingRequest, ctx: RequestCtx): Promise<BookingConfirmation>;
  reschedule(input: RescheduleRequest, ctx: RequestCtx): Promise<BookingConfirmation>;
  cancel(input: CancelRequest, ctx: RequestCtx): Promise<void>;
}

export interface IMessagePort {
  sendSms(input: SmsMessage, ctx: RequestCtx): Promise<MessageResult>;
}

export interface IPaymentProviderPort {
  createCustomer(input: CreateCustomer, ctx: RequestCtx): Promise<CustomerRef>;
  subscribe(input: SubscribeRequest, ctx: RequestCtx): Promise<SubscriptionRef>;
  reportUsage(input: UsageRecord, ctx: RequestCtx): Promise<void>;
  generateInvoice(input: GenerateInvoice, ctx: RequestCtx): Promise<InvoiceRef>;
  refund(input: RefundRequest, ctx: RequestCtx): Promise<RefundRef>;
  verifyWebhook(payload: string, signature: string): Promise<boolean>;
}
export interface ILlmPort {
  generateContent(input: GenerateRequest, ctx: RequestCtx): Promise<GeneratedArtifact>;
  evaluate(input: EvaluateRequest, ctx: RequestCtx): Promise<EvaluationReport>;
}
```

References
- See ADRs for decisions and binding rules.
