# LLM Port Specification

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Purpose

The LLM Port (`ILlmPort`) provides a vendor-agnostic interface for Large Language Model (LLM) operations including chat completions, streaming responses, and token usage tracking. The primary adapter is OpenRouter, which provides unified access to multiple LLM providers.

## Port Interface

```typescript
export interface ILlmPort {
  // Chat Completions
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletion>;
  createStreamingCompletion(
    request: ChatCompletionRequest,
    onChunk: StreamChunkHandler
  ): Promise<ChatCompletion>;
  
  // Model Management
  listModels(): Promise<LlmModel[]>;
  getModel(modelId: string): Promise<LlmModel>;
  
  // Usage Tracking
  calculateCost(usage: TokenUsage, modelId: string): Promise<Cost>;
  
  // Provider Metadata
  getProviderName(): string;
  getProviderCapabilities(): LlmCapabilities;
  isHealthy(): Promise<boolean>;
}
```

## Domain Models

### Chat Completion

```typescript
export interface ChatCompletionRequest {
  model: string; // e.g., 'anthropic/claude-3.5-sonnet', 'openai/gpt-4'
  messages: ChatMessage[];
  temperature?: number; // 0-2, defaults to 1
  maxTokens?: number;
  topP?: number; // 0-1, defaults to 1
  frequencyPenalty?: number; // -2 to 2, defaults to 0
  presencePenalty?: number; // -2 to 2, defaults to 0
  stop?: string[]; // stop sequences
  stream?: boolean;
  user?: string; // end-user ID for abuse monitoring
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string; // optional name of participant
}

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

export interface ChatCompletion {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage: TokenUsage;
  created: Date;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: FinishReason;
}

export enum FinishReason {
  STOP = 'stop',           // natural stop
  LENGTH = 'length',       // max tokens reached
  CONTENT_FILTER = 'content_filter', // filtered by content policy
  FUNCTION_CALL = 'function_call',
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type StreamChunkHandler = (chunk: ChatCompletionChunk) => void;

export interface ChatCompletionChunk {
  id: string;
  model: string;
  choices: StreamChoice[];
  created: Date;
}

export interface StreamChoice {
  index: number;
  delta: ChatMessageDelta;
  finishReason?: FinishReason;
}

export interface ChatMessageDelta {
  role?: MessageRole;
  content?: string;
}
```

### Model Information

```typescript
export interface LlmModel {
  id: string;
  name: string;
  provider: string; // 'anthropic', 'openai', 'meta', etc.
  contextWindow: number; // max tokens
  maxOutputTokens: number;
  pricing: ModelPricing;
  capabilities: ModelCapabilities;
}

export interface ModelPricing {
  promptTokenPrice: number; // price per 1M tokens
  completionTokenPrice: number; // price per 1M tokens
  currency: string; // 'USD'
}

export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  visionSupport: boolean;
}

export interface Cost {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  currency: string;
}
```

## OpenRouter Adapter

### Configuration

```typescript
export interface OpenRouterConfig {
  apiKey: string;
  apiUrl: string; // https://openrouter.ai/api/v1
  defaultModel: string; // 'anthropic/claude-3.5-sonnet'
  appName: string; // for usage attribution
  appUrl?: string;
  rateLimits: {
    requestsPerMinute: number; // 60 by default
    tokensPerMinute: number; // 500,000 by default
  };
}
```

### Authentication

OpenRouter uses API key authentication:

```typescript
Authorization: Bearer <api-key>
HTTP-Referer: <app-url>
X-Title: <app-name>
```

### API Mapping

| Port Operation | OpenRouter API Endpoint | Method |
|---------------|-------------------------|--------|
| `createChatCompletion` | `/chat/completions` | POST |
| `createStreamingCompletion` | `/chat/completions` (with stream=true) | POST |
| `listModels` | `/models` | GET |
| `getModel` | `/models/{model_id}` | GET |

### Supported Models

OpenRouter provides unified access to multiple providers:

| Provider | Models | Context Window | Pricing (per 1M tokens) |
|----------|--------|----------------|-------------------------|
| Anthropic | claude-3.5-sonnet | 200K | $3 / $15 |
| Anthropic | claude-3-opus | 200K | $15 / $75 |
| OpenAI | gpt-4-turbo | 128K | $10 / $30 |
| OpenAI | gpt-4 | 8K | $30 / $60 |
| OpenAI | gpt-3.5-turbo | 16K | $0.50 / $1.50 |
| Meta | llama-3-70b | 8K | $0.70 / $0.90 |
| Google | gemini-pro | 32K | $0.50 / $1.50 |

### Streaming Implementation

```typescript
async createStreamingCompletion(
  request: ChatCompletionRequest,
  onChunk: StreamChunkHandler
): Promise<ChatCompletion> {
  const response = await this.httpClient.post('/chat/completions', {
    ...request,
    stream: true,
  }, {
    responseType: 'stream',
  });
  
  let fullCompletion: ChatCompletion;
  let contentBuffer = '';
  
  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n').filter(Boolean);
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        if (data === '[DONE]') {
          break;
        }
        
        const parsed = JSON.parse(data);
        const domainChunk = this.mapChunkToDomain(parsed);
        
        onChunk(domainChunk);
        
        // Accumulate content
        const delta = domainChunk.choices[0]?.delta;
        if (delta?.content) {
          contentBuffer += delta.content;
        }
      }
    }
  }
  
  // Return final completion
  return fullCompletion;
}
```

### Usage Tracking Integration

All LLM operations report usage to Billing-Usage component:

```typescript
// After completion
const cost = await this.calculateCost(completion.usage, request.model);

await billingService.recordUsage({
  tenantId: completion.tenantId,
  provider: 'openrouter',
  resourceType: 'llm_tokens',
  quantity: completion.usage.totalTokens,
  unitPrice: cost.totalCost / completion.usage.totalTokens,
  metadata: {
    model: completion.model,
    promptTokens: completion.usage.promptTokens,
    completionTokens: completion.usage.completionTokens,
    promptCost: cost.promptCost,
    completionCost: cost.completionCost,
  },
});
```

### Cost Calculation

```typescript
async calculateCost(usage: TokenUsage, modelId: string): Promise<Cost> {
  const model = await this.getModel(modelId);
  
  const promptCost = (usage.promptTokens / 1_000_000) * model.pricing.promptTokenPrice;
  const completionCost = (usage.completionTokens / 1_000_000) * model.pricing.completionTokenPrice;
  
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
    currency: model.pricing.currency,
  };
}
```

## Prompt Engineering Patterns

### System Prompt Template

```typescript
export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Record<string, string>;
}

// Example: Lead qualification agent
const leadQualificationPrompt: PromptTemplate = {
  systemPrompt: `You are a friendly AI sales assistant for {{companyName}}.
Your goal is to qualify leads by understanding their needs and budget.
Always be professional, concise, and helpful.`,
  
  userPromptTemplate: `New lead information:
Name: {{leadName}}
Company: {{leadCompany}}
Message: {{leadMessage}}

Please respond with a qualifying question to understand their needs better.`,
  
  variables: {
    companyName: 'MAX AI Platform',
    leadName: '',
    leadCompany: '',
    leadMessage: '',
  },
};
```

### Token Management

```typescript
// Estimate tokens before API call
private estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Truncate messages to fit context window
private truncateMessages(
  messages: ChatMessage[],
  maxTokens: number
): ChatMessage[] {
  const systemMessage = messages.find(m => m.role === MessageRole.SYSTEM);
  const otherMessages = messages.filter(m => m.role !== MessageRole.SYSTEM);
  
  let totalTokens = systemMessage ? this.estimateTokens(systemMessage.content) : 0;
  const result: ChatMessage[] = systemMessage ? [systemMessage] : [];
  
  // Add messages in reverse order (keep most recent)
  for (let i = otherMessages.length - 1; i >= 0; i--) {
    const msg = otherMessages[i];
    const msgTokens = this.estimateTokens(msg.content);
    
    if (totalTokens + msgTokens > maxTokens) {
      break;
    }
    
    result.unshift(msg);
    totalTokens += msgTokens;
  }
  
  return result;
}
```

## Error Handling

### Rate Limiting

- **Limit**: 60 requests/minute, 500K tokens/minute
- **Response**: HTTP 429 with `Retry-After` header
- **Strategy**: Token bucket with exponential backoff

### Common Errors

| OpenRouter Error | HTTP Status | Domain Error |
|------------------|-------------|--------------|
| Invalid API key | 401 | `AuthenticationError` |
| Insufficient credits | 402 | `PaymentRequiredError` |
| Model not found | 404 | `NotFoundError` |
| Context length exceeded | 400 | `ContextLengthError` |
| Rate limit exceeded | 429 | `RateLimitError` |
| Content filtered | 400 | `ContentFilterError` |
| Server error | 500 | `IntegrationError` |

### Context Length Handling

```typescript
private handleContextLengthError(error: any): void {
  if (error.response?.data?.error?.code === 'context_length_exceeded') {
    const maxTokens = error.response.data.error.param?.max_tokens;
    throw new ContextLengthError(
      `Message exceeds context window of ${maxTokens} tokens`,
      { maxTokens }
    );
  }
}
```

## Testing Strategy

### Unit Tests
- Mock OpenRouter HTTP responses for each operation
- Test streaming chunk handling
- Validate cost calculation logic
- Test token estimation and truncation
- Validate error mapping

### Integration Tests
- Use OpenRouter test API key
- Test completions with various models
- Validate streaming responses
- Test rate limit handling
- Verify usage tracking integration

### Contract Tests
- Verify adapter implements all ILlmPort methods
- Validate domain model structure
- Test all supported models

---

**Related**: See [overview.md](./overview.md) for ports & adapters pattern details.
