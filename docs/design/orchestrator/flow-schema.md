# Orchestrator - Flow Schema (DSL)

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Status**: Specification  

## Purpose

This document defines the Flow Definition Language (DSL) for declaring AI agent workflows in YAML/JSON format.

## Flow Structure

### Basic Flow Template

```yaml
flow:
  id: unique-flow-id
  name: Human Readable Name
  version: 1.0.0
  description: What this flow accomplishes
  
  metadata:
    category: support | sales | campaign | system
    tags:
      - tag1
      - tag2
    owner: team-name
    
  trigger:
    type: webhook | schedule | manual | event
    config: {}
    
  variables:
    - name: variableName
      type: string | number | boolean | object
      required: true | false
      default: value
      
  steps:
    - step_id:
        action: adapter.method
        params: {}
        
  error_handlers:
    - on_error:
        steps: []
```

## Trigger Types

### 1. Webhook Trigger

**Purpose**: Start flow when external webhook received

```yaml
trigger:
  type: webhook
  config:
    path: /webhooks/customer-inquiry
    method: POST
    auth:
      type: bearer | hmac | none
      secret: ${SECRET_KEY}
    timeout: 30s
    extract:
      customerId: $.body.customer_id
      message: $.body.message
```

**Webhook Request**:
```http
POST /webhooks/customer-inquiry
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": "12345",
  "message": "I need help with my order"
}
```

**Extracted Variables**:
```yaml
customerId: "12345"
message: "I need help with my order"
```

### 2. Schedule Trigger

**Purpose**: Run flow on cron schedule

```yaml
trigger:
  type: schedule
  config:
    cron: "0 9 * * MON-FRI"  # 9am weekdays
    timezone: America/New_York
    enabled: true
```

**Cron Examples**:
- `0 * * * *` - Every hour
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * *` - Daily at midnight
- `0 9 * * MON` - Mondays at 9am

### 3. Manual Trigger

**Purpose**: User-initiated execution

```yaml
trigger:
  type: manual
  config:
    require_confirmation: true
    allowed_roles:
      - admin
      - support_manager
```

### 4. Event Trigger

**Purpose**: React to internal system events

```yaml
trigger:
  type: event
  config:
    event_type: user.registered | order.created | payment.failed
    filters:
      source: retell | ghl | n8n
      condition: $.amount > 100
```

## Variable Declarations

### Variable Types

```yaml
variables:
  # String
  - name: customerName
    type: string
    required: true
    description: Customer's full name
    
  # Number
  - name: orderAmount
    type: number
    required: true
    default: 0
    validation:
      min: 0
      max: 10000
      
  # Boolean
  - name: isPremium
    type: boolean
    default: false
    
  # Object
  - name: customerData
    type: object
    required: false
    schema:
      name: string
      email: string
      phone: string
      
  # Array
  - name: productIds
    type: array
    items:
      type: string
    default: []
```

### Variable Sources

**From Trigger**:
```yaml
variables:
  - name: webhookData
    source: trigger.payload
```

**From Environment**:
```yaml
variables:
  - name: apiKey
    source: env.RETELL_API_KEY
```

**From Previous Steps**:
```yaml
variables:
  - name: authToken
    source: steps.authenticate.result.token
```

## Step Definitions

### Step Schema

```yaml
steps:
  - step_id:
      description: What this step does
      adapter: service_name
      action: method_name
      params:
        param1: value
        param2: ${variable}
      timeout: 30s
      retry:
        attempts: 3
        backoff: exponential
      condition: ${previous_step.success}
      on_success:
        - next_step
      on_error:
        - error_handler
```

### Sequential Steps

```yaml
steps:
  - authenticate:
      adapter: iam
      action: verify_token
      params:
        token: ${trigger.headers.authorization}
        
  - load_customer:
      adapter: database
      action: query
      params:
        table: customers
        where:
          id: ${authenticate.result.user_id}
          
  - send_greeting:
      adapter: retell
      action: send_message
      params:
        message: "Hello ${load_customer.result.name}"
```

**Execution Order**: authenticate → load_customer → send_greeting

### Parallel Steps

```yaml
steps:
  - parallel:
      - send_email:
          adapter: email
          action: send
          params:
            to: ${customer.email}
            subject: Welcome
            
      - send_sms:
          adapter: twilio
          action: send
          params:
            to: ${customer.phone}
            body: Welcome message
            
      - update_crm:
          adapter: ghl
          action: update_contact
          params:
            contact_id: ${customer.crm_id}
```

**Execution Order**: All three run concurrently

### Conditional Steps

```yaml
steps:
  - classify_inquiry:
      adapter: ai
      action: classify
      params:
        text: ${trigger.message}
        categories:
          - billing
          - support
          - sales
          
  - conditional:
      - if: ${classify_inquiry.result.category} == 'billing'
        then:
          - route_to_billing:
              adapter: iam
              action: assign_agent
              params:
                department: billing
                
      - elif: ${classify_inquiry.result.category} == 'support'
        then:
          - route_to_support:
              adapter: iam
              action: assign_agent
              params:
                department: support
                
      - else:
          - route_to_general:
              adapter: iam
              action: assign_agent
              params:
                department: general
```

### Loop Steps

```yaml
steps:
  - foreach:
      items: ${trigger.product_ids}
      item_var: product_id
      steps:
        - load_product:
            adapter: database
            action: query
            params:
              table: products
              where:
                id: ${product_id}
                
        - check_stock:
            adapter: inventory
            action: get_stock
            params:
              product_id: ${product_id}
```

## Adapter Bindings

### Built-in Adapters

#### IAM Adapter

```yaml
- authenticate_user:
    adapter: iam
    action: verify_token
    params:
      token: ${token}
      
- check_permission:
    adapter: iam
    action: check_permission
    params:
      user_id: ${user_id}
      permission: flow:execute
```

#### Prompt Service Adapter

```yaml
- load_prompt:
    adapter: prompt_service
    action: get_template
    params:
      template_id: customer-support-v1
      version: 1.2.0
      
- render_prompt:
    adapter: prompt_service
    action: substitute_variables
    params:
      template_id: ${load_prompt.result.id}
      variables:
        customerName: ${customer.name}
        issue: ${trigger.message}
```

#### Retell Adapter

```yaml
- start_call:
    adapter: retell
    action: create_call
    params:
      agent_id: ${retell_agent_id}
      to_number: ${customer.phone}
      prompt: ${render_prompt.result}
      
- end_call:
    adapter: retell
    action: end_call
    params:
      call_id: ${start_call.result.call_id}
```

#### n8n Adapter

```yaml
- trigger_workflow:
    adapter: n8n
    action: trigger
    params:
      workflow_id: ${n8n_workflow_id}
      payload:
        customer_id: ${customer.id}
        data: ${customer_data}
```

#### Database Adapter

```yaml
- query_data:
    adapter: database
    action: query
    params:
      query: SELECT * FROM customers WHERE id = :id
      params:
        id: ${customer_id}
        
- insert_record:
    adapter: database
    action: insert
    params:
      table: audit_log
      data:
        user_id: ${user_id}
        action: flow_executed
        timestamp: ${now}
```

#### HTTP Adapter

```yaml
- call_api:
    adapter: http
    action: request
    params:
      method: POST
      url: https://api.example.com/endpoint
      headers:
        Authorization: Bearer ${api_key}
        Content-Type: application/json
      body:
        customer_id: ${customer_id}
      timeout: 30s
```

## Expression Language

### Variable References

```yaml
${variable_name}                    # Simple reference
${step_id.result.field}            # Nested field access
${trigger.payload.customer.email}  # Deep nesting
${env.API_KEY}                     # Environment variable
```

### Operators

**Comparison**:
```yaml
${age > 18}
${status == 'active'}
${balance >= 100}
${name != null}
```

**Logical**:
```yaml
${is_premium && balance > 0}
${age < 18 || has_guardian}
${!is_blocked}
```

**Arithmetic**:
```yaml
${price * quantity}
${total - discount}
${count + 1}
${amount / 100}
```

**String Operations**:
```yaml
${name.toUpperCase()}
${email.contains('@')}
${phone.startsWith('+1')}
${message.length > 100}
```

### Built-in Functions

```yaml
${now()}                           # Current timestamp
${uuid()}                          # Generate UUID
${random(1, 100)}                  # Random number
${formatDate(timestamp, 'YYYY-MM-DD')}
${parseJSON(json_string)}
${stringify(object)}
${concat(str1, str2)}
${substring(str, 0, 10)}
```

## Error Handling

### Step-Level Error Handling

```yaml
steps:
  - charge_card:
      adapter: stripe
      action: charge
      params:
        amount: ${order_total}
      retry:
        attempts: 3
        backoff: exponential
        backoff_multiplier: 2
      on_error:
        - log_error:
            adapter: logger
            action: error
            params:
              message: Failed to charge card
              error: ${error}
              
        - notify_admin:
            adapter: email
            action: send
            params:
              to: admin@example.com
              subject: Payment failure
```

### Flow-Level Error Handling

```yaml
error_handlers:
  - on_step_error:
      condition: ${error.step} == 'charge_card'
      steps:
        - rollback_order:
            adapter: database
            action: update
            params:
              table: orders
              where:
                id: ${order_id}
              set:
                status: failed
                
  - on_timeout:
      steps:
        - notify_timeout:
            adapter: logger
            action: warn
            params:
              message: Flow timeout exceeded
```

## Complete Example

```yaml
flow:
  id: customer-support-inquiry
  name: Customer Support Inquiry Handler
  version: 1.0.0
  description: Routes customer inquiries to appropriate support channels
  
  metadata:
    category: support
    tags:
      - customer-service
      - ai-routing
    owner: support-team
    
  trigger:
    type: webhook
    config:
      path: /webhooks/inquiry
      method: POST
      auth:
        type: bearer
      extract:
        customer_id: $.body.customer_id
        message: $.body.message
        channel: $.body.channel
        
  variables:
    - name: customer_id
      type: string
      required: true
      
    - name: message
      type: string
      required: true
      
    - name: channel
      type: string
      default: web
      
  steps:
    # Step 1: Authenticate and load customer
    - authenticate:
        adapter: iam
        action: verify_token
        params:
          token: ${trigger.headers.authorization}
          
    - load_customer:
        adapter: database
        action: query
        params:
          query: SELECT * FROM customers WHERE id = :id
          params:
            id: ${customer_id}
            
    # Step 2: Classify inquiry using AI
    - classify_inquiry:
        adapter: ai
        action: classify
        params:
          text: ${message}
          categories:
            - billing
            - technical_support
            - sales
            - general
          model: gpt-4
          
    # Step 3: Load appropriate prompt template
    - load_prompt:
        adapter: prompt_service
        action: get_template
        params:
          template_id: ${classify_inquiry.result.category}-agent
          version: latest
          
    - render_prompt:
        adapter: prompt_service
        action: substitute_variables
        params:
          template_id: ${load_prompt.result.id}
          variables:
            customer_name: ${load_customer.result.name}
            customer_tier: ${load_customer.result.tier}
            inquiry: ${message}
            
    # Step 4: Route based on channel
    - conditional:
        - if: ${channel} == 'phone'
          then:
            - start_voice_call:
                adapter: retell
                action: create_call
                params:
                  agent_id: ${load_prompt.result.retell_agent_id}
                  to_number: ${load_customer.result.phone}
                  prompt: ${render_prompt.result}
                  
        - elif: ${channel} == 'web' || ${channel} == 'email'
          then:
            - send_email_response:
                adapter: email
                action: send
                params:
                  to: ${load_customer.result.email}
                  subject: Re: Your inquiry
                  body: ${render_prompt.result}
                  
        - else:
            - create_ticket:
                adapter: ghl
                action: create_opportunity
                params:
                  contact_id: ${load_customer.result.crm_id}
                  title: ${classify_inquiry.result.category} inquiry
                  description: ${message}
                  
    # Step 5: Log interaction
    - log_interaction:
        adapter: database
        action: insert
        params:
          table: support_interactions
          data:
            customer_id: ${customer_id}
            category: ${classify_inquiry.result.category}
            channel: ${channel}
            timestamp: ${now()}
            
  error_handlers:
    - on_step_error:
        condition: ${error.step} == 'classify_inquiry'
        steps:
          - fallback_to_human:
              adapter: ghl
              action: assign_agent
              params:
                contact_id: ${load_customer.result.crm_id}
                department: general
```

## Validation Rules

### Schema Validation

**Required Fields**:
- `flow.id` - Unique identifier
- `flow.name` - Human-readable name
- `flow.trigger` - Trigger configuration
- `flow.steps` - At least one step

**Naming Conventions**:
- Flow ID: `kebab-case`
- Step IDs: `snake_case`
- Variable names: `camelCase`

### Dependency Validation

**Circular Dependencies**:
```yaml
# ❌ INVALID - Step A references Step B which references Step A
steps:
  - step_a:
      params:
        value: ${step_b.result}
  - step_b:
      params:
        value: ${step_a.result}
```

**Undefined Variables**:
```yaml
# ❌ INVALID - ${undefined_var} not declared
steps:
  - use_var:
      params:
        value: ${undefined_var}
```

**Missing Steps**:
```yaml
# ❌ INVALID - 'missing_step' not defined
steps:
  - step_a:
      on_success:
        - missing_step
```

## Best Practices

### 1. Descriptive Naming
✅ **Good**: `load_customer_profile`, `authenticate_user`, `send_confirmation_email`  
❌ **Bad**: `step1`, `do_stuff`, `action`

### 2. Single Responsibility
Each step should do one thing well.

✅ **Good**:
```yaml
- load_customer: {...}
- validate_customer: {...}
- send_email: {...}
```

❌ **Bad**:
```yaml
- load_validate_and_email_customer: {...}
```

### 3. Error Handling
Always define error handlers for critical steps.

### 4. Timeouts
Set reasonable timeouts for all external calls.

### 5. Idempotency
Design flows to be safely retryable.

## Related Documentation

- [Overview](./overview.md) - Component architecture
- [Execution Engine](./execution-engine.md) - Runtime behavior
- [Adapter Binding](./adapter-binding.md) - Adapter integration
- [n8n Integration](./n8n-integration.md) - Complex workflows
