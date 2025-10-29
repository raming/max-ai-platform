# Rate Limiting, Quotas & Operational Constraints

**Status**: ✅ Documented from reference implementation  
**Based on**: `/tools/GHL-Integration/` monitoring and `/tools/ghl-seo/` experience  
**Last Updated**: 2025-10-24  

---

## Rate Limiting Overview

### Discovered Limits

| Metric | Value | Confidence | Source |
|--------|-------|-----------|--------|
| **Global Limit** | ~300 requests | HIGH | Reference implementation headers |
| **Time Window** | Unknown (1-60 min) | MEDIUM | Inferred from patterns |
| **Per-Endpoint** | Varies | LOW | Not documented |
| **Burst Capacity** | Unknown | LOW | Requires live testing |
| **Concurrent Requests** | Unknown | LOW | Not documented |

### Rate Limit Headers

Every GHL API response includes:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1698157872  (Unix timestamp)
```

### Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200/201 | Success | Proceed normally |
| 429 | Rate Limited | Backoff and retry |
| 503 | Service Unavailable | Exponential backoff |

---

## Rate Limit Behavior

### Request Counting

Based on `/tools/GHL-Integration/` monitoring analysis:

```
Each API call counts as 1 request toward limit
GET /users/me              = 1 request
POST /contact              = 1 request  
PUT /contact/{id}          = 1 request
GET /contact (with limit) = 1 request (regardless of results)
```

### Window Reset Behavior

**Window Duration**: Unknown (likely 60 seconds or 1 hour)

From `X-RateLimit-Reset` timestamps:
```
Request 1 at 12:00:00
  X-RateLimit-Reset: 12:01:00 (60 second window)
  
Request 300 at 12:00:59
  X-RateLimit-Remaining: 0
  
Request 301 at 12:00:60  
  429 Too Many Requests
  Retry-After: 1 second
```

### Backoff Strategy

```
Attempt 1: Request
Attempt 2: Wait 1s, retry
Attempt 3: Wait 2s, retry
Attempt 4: Wait 4s, retry
Attempt 5: Wait 8s, retry
Attempt 6: Wait 16s, retry
```

---

## Operational Impact

### With 300 Req/Window Limit

#### Scenario 1: Real-Time Monitoring

```
Required: Sync contacts every 1 second
Available per window: 300 requests

Calculation:
  Contacts to fetch: 500+
  API calls per sync: 500 GET requests (single-item endpoints)
  Time per sync: 500 calls / 300-req-limit = IMPOSSIBLE
  
Result: ❌ Real-time monitoring NOT feasible
```

#### Scenario 2: Periodic Batch Sync

```
Required: Sync contacts every 5 minutes
Available per window: 300 requests

Calculation:
  Window = 1 minute (estimated)
  Windows in 5 minutes = 5 windows
  Total requests available = 300 × 5 = 1500 requests
  
  Batch operations:
    GET /contact (paginated, 50/call) = 10 calls
    Process + update relevant = 20 calls
    Sync opportunities (50) = 1 call per 5 opportunities = 10 calls
    Total per cycle = 40 calls
    
  Sustainable rate = 40 calls / 5 min = 8 calls/min ✅
  
Result: ✅ Periodic sync feasible with careful batching
```

#### Scenario 3: Autonomous Agent Operations

```
Required: Autonomous agent making decisions every 30 seconds
Available: 300 requests/window

Calculation:
  Operations per 30s cycle:
    - Fetch new contacts: 5 calls
    - Fetch opportunities: 5 calls
    - Create/update tasks: 10 calls
    - Send notifications: 5 calls
    Total: 25 calls/30s = 50 calls/min
    
  Sustainable rate: 50 calls/min × 60 min = 3000 calls/hour
  
  If window is 60 seconds:
    300 limit / 60 sec = 5 calls/sec = 300 calls/min
    3000 calls/hour > 300 calls/min ❌
    
  If window is 1 hour:
    300 limit / 3600 sec = 0.083 calls/sec
    3000 calls/hour > 300 calls/hour ❌
    
Result: ⚠️ Autonomous agent requires aggressive rate limit management
```

---

## Quota Management Strategy

### For Periodic Sync (Recommended)

```javascript
class GHLRateLimiter {
  constructor(requestsPerWindow = 300, windowMs = 60000) {
    this.requestsPerWindow = requestsPerWindow;
    this.windowMs = windowMs;
    this.queue = [];
    this.windowStart = Date.now();
    this.requestCount = 0;
  }

  async executeRequest(fn) {
    // Check if window needs reset
    if (Date.now() - this.windowStart > this.windowMs) {
      this.windowStart = Date.now();
      this.requestCount = 0;
      console.log('Rate limit window reset');
    }

    // If at limit, wait for window reset
    if (this.requestCount >= this.requestsPerWindow) {
      const waitMs = this.windowMs - (Date.now() - this.windowStart);
      console.log(`Rate limited. Waiting ${Math.ceil(waitMs)}ms for window reset...`);
      await this.sleep(waitMs + 100);
      
      this.windowStart = Date.now();
      this.requestCount = 0;
    }

    // Execute request and track
    this.requestCount++;
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limited - aggressive backoff
        const retryAfter = parseInt(error.headers['Retry-After'] || '60');
        console.log(`Received 429. Waiting ${retryAfter}s...`);
        await this.sleep(retryAfter * 1000);
        this.windowStart = Date.now();
        this.requestCount = 0;
        return fn();
      }
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeBatch(operations) {
    const results = [];
    for (const op of operations) {
      results.push(await this.executeRequest(op));
    }
    return results;
  }
}

// Usage
const limiter = new GHLRateLimiter(300, 60000);

async function syncContacts() {
  const operations = contacts.map(c => async () => {
    return fetch(`/contact/${c.id}`, { headers: getAuthHeaders() });
  });

  const results = await limiter.executeBatch(operations);
  return results;
}
```

### For Autonomous Agents (Advanced)

```javascript
class AdaptiveRateLimiter {
  constructor(targetRequestsPerMin = 50) {
    this.targetRPM = targetRequestsPerMin;
    this.requestLog = [];  // Array of timestamps
    this.successRate = 0;
    this.backoffMultiplier = 1.0;
  }

  async executeRequest(fn) {
    // Check current rate
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old entries
    this.requestLog = this.requestLog.filter(t => t > oneMinuteAgo);
    
    // If exceeding target, wait
    if (this.requestLog.length >= this.targetRPM) {
      const waitMs = 60000 - (now - this.requestLog[0]);
      console.log(`Target rate reached. Waiting ${Math.ceil(waitMs)}ms...`);
      await this.sleep(waitMs);
      this.requestLog = [];
    }

    // Execute with backoff
    this.requestLog.push(now);
    
    try {
      const result = await fn();
      this.backoffMultiplier = Math.max(1.0, this.backoffMultiplier - 0.1);
      return result;
    } catch (error) {
      if (error.status === 429) {
        // Increase backoff aggressively
        this.backoffMultiplier = Math.min(10.0, this.backoffMultiplier * 2);
        const waitMs = 1000 * this.backoffMultiplier;
        console.log(`Rate limited. Backing off ${waitMs}ms (multiplier: ${this.backoffMultiplier})`);
        await this.sleep(waitMs);
        return fn();  // Retry
      }
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Quota Allocation for Typical Operations

### Operational Budget (Per 5-Minute Cycle)

Assuming:
- 300 requests per 1-minute window
- 5-minute cycle = 5 windows = 1500 total requests

**Allocation**:
```
Contact Sync:        200 requests (50 contacts × 4 ops)
Opportunity Sync:     200 requests (50 opportunities × 4 ops)
Pages/Content:        200 requests (page checks, updates)
Metadata/Admin:       100 requests (user, location info)
Error Recovery:       100 requests (retries, validation)
Buffer:               200 requests (contingency)
─────────────────────
Total:              1000 requests / 1500 available (67% utilization)
```

**Remaining Capacity**: 500 requests (33%) for peak operations

### Conservative Allocation

For production safety, only use 50% of limit:

```
Available: 1500 requests/5min
Target:    750 requests/5min (50%)

Per minute: 150 requests/min
Per second: 2.5 requests/sec

Safe operations:
  - 5 contact updates/sec = 5 requests/sec ❌ Over budget
  - 2 contact updates/sec = 2 requests/sec ✅ Within budget
  - Sync opportunities quarterly = minimal impact
  - Batch page updates = batch 5+ together
```

---

## Operational Constraints

### Constraint 1: No Bulk Operations

**Problem**: All endpoints are single-item only

```javascript
// To create 100 contacts:
for (let i = 0; i < 100; i++) {
  await POST /contact (1 request per contact)
}
// Total: 100 requests

// Estimate: 100+ requests minimum for any bulk operation
// With 300 req/window limit → can do 3 bulk operations max per window
```

### Constraint 2: Pagination Overhead

**Problem**: GET operations are paginated (max 100 items)

```javascript
// To get all contacts if system has 5000:
// GET /contact?limit=100&offset=0   = 1 request
// GET /contact?limit=100&offset=100 = 1 request
// ... × 50 pages = 50 requests just to list contacts

// Plus filtering/searching adds overhead
```

### Constraint 3: No Transaction Support

**Problem**: Multi-step operations lack atomicity

```javascript
// Scenario: Create contact + add to campaign + send email
1. POST /contact                   ← Success
2. POST /campaign/addContact       ← Fails!
3. /send-email endpoint (if exists) ← Not attempted

// If step 2 fails, contact exists but not in campaign
// Manual recovery = additional API calls
```

### Constraint 4: Token Lifecycle Overhead

**Problem**: Token refresh adds latency every 15-20 minutes

```
In 5-minute cycle:
  - 0-15 min: Normal operation (300 requests available)
  - 15-20 min: Token refresh (~1-2 requests overhead)
  - Effective: 298-299 requests available

In 1-hour period:
  - 4× token refreshes needed
  - 4-8 requests consumed on refreshes
  - Impact: ~1% overhead, acceptable
```

---

## Monitoring & Alerting

### Track These Metrics

```javascript
class RateLimitMonitor {
  constructor() {
    this.metrics = {
      requestsThisCycle: 0,
      successCount: 0,
      errorCount: 0,
      rateLimitedCount: 0,
      avgResponseTime: 0,
      peakRPM: 0
    };
  }

  recordRequest(success, responseTimeMs, statusCode) {
    this.metrics.requestsThisCycle++;
    
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
      
      if (statusCode === 429) {
        this.metrics.rateLimitedCount++;
      }
    }

    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requestsThisCycle - 1) + responseTimeMs) / 
      this.metrics.requestsThisCycle;
  }

  getReport() {
    return {
      requests: this.metrics.requestsThisCycle,
      successRate: `${(this.metrics.successCount / this.metrics.requestsThisCycle * 100).toFixed(2)}%`,
      errors: this.metrics.errorCount,
      rateLimited: this.metrics.rateLimitedCount,
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(0)}ms`
    };
  }

  checkHealthy() {
    // Alert if rate limited more than 5% of time
    if (this.metrics.rateLimitedCount / this.metrics.requestsThisCycle > 0.05) {
      console.warn('⚠️ Rate limit violations detected. Consider reducing request rate.');
    }

    // Alert if success rate drops below 95%
    if (this.metrics.successCount / this.metrics.requestsThisCycle < 0.95) {
      console.error('❌ High error rate detected. Check API health.');
    }
  }
}
```

### Recommended Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Rate Limit Hits | > 5% of requests | Reduce request rate by 10% |
| Error Rate | > 5% | Investigate errors, may indicate quota issues |
| Response Time | > 5 seconds avg | May indicate server issues or rate limiting |
| Token Refreshes | > Expected | Check token lifespan |
| Queued Requests | > 100 | System falling behind, reduce request rate |

---

## Comparison: GHL vs Other Platforms

### Rate Limits by Platform

| Platform | Limit | Window | Verdict |
|----------|-------|--------|---------|
| **GHL** | 300 requests | Unknown | 🔴 Very Tight |
| **Salesforce** | 15,000 requests | 1 hour | 🟢 Very Generous |
| **HubSpot** | 10 requests | 1 second | 🟢 Moderate (per second) |
| **Pipedrive** | 2 requests | 1 second | 🟢 Moderate (per second) |
| **Zapier** | Task-based | - | 🟡 Plan-dependent |

### GHL Constraints Impact

```
Per-Second Rate (Estimated):
  GHL:        ~5 req/sec (if 60-sec window)
  Salesforce: ~4 req/sec (still generous)
  HubSpot:    10 req/sec (but with per-second hard limit)
  
Worst-Case: GHL at only 0.083 req/sec (if 1-hour window!)
```

---

## Recommendations

### For Development

✅ **DO**:
- Use sandbox/test environment first
- Monitor X-RateLimit-* headers
- Implement exponential backoff
- Cache responses aggressively
- Batch operations where possible

❌ **DON'T**:
- Make per-contact individual requests
- Poll in real-time
- Ignore 429 responses
- Make synchronous sequential calls
- Forget to implement rate limiting

### For Production

✅ **DO**:
- Set conservative request budgets (50-70% of limit)
- Implement proactive token refresh
- Use caching layer (Redis)
- Schedule batch operations off-peak
- Monitor quota utilization continuously
- Set up alerts for quota exhaustion

❌ **DON'T**:
- Build real-time sync
- Attempt high-frequency polling
- Ignore rate limit headers
- Accumulate request backlogs
- Run multiple instances without coordination
- Update schema too frequently (excessive cache invalidation)

---

## Testing Rate Limits

### Load Test Script

```javascript
async function testRateLimits() {
  const startTime = Date.now();
  let requestCount = 0;
  let successCount = 0;
  let rateLimitCount = 0;

  try {
    // Make rapid requests until rate limited
    while (true) {
      const response = await fetch(
        'https://backend.leadconnectorhq.com/users/me',
        {
          headers: {
            'token-id': process.env.GHL_TOKEN,
            'version': '1.0'
          }
        }
      );

      requestCount++;

      if (response.status === 200) {
        successCount++;
        const data = await response.json();
        const remaining = response.headers.get('X-RateLimit-Remaining');
        console.log(`✓ ${requestCount}: ${remaining} remaining`);
      } else if (response.status === 429) {
        rateLimitCount++;
        const resetTime = response.headers.get('X-RateLimit-Reset');
        console.log(`✗ ${requestCount}: Rate limited. Reset at ${resetTime}`);
        break;
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  console.log(`\nResults:`);
  console.log(`  Total requests: ${requestCount}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Rate limited: ${rateLimitCount}`);
  console.log(`  Elapsed time: ${elapsedSeconds.toFixed(2)}s`);
  console.log(`  Requests/sec: ${(requestCount / elapsedSeconds).toFixed(2)}`);
}

testRateLimits();
```

---

## Conclusion

**GHL's rate limits are TIGHT** for autonomous operations but **MANAGEABLE for periodic sync**.

### Feasible Operations:
- ✅ 5-minute periodic sync (contacts, opportunities)
- ✅ Batch updates (scheduled, off-peak)
- ✅ Asynchronous processing
- ✅ Cached data queries

### Not Feasible:
- ❌ Real-time monitoring (<1 minute intervals)
- ❌ High-frequency polling (>1 call/sec per resource)
- ❌ Bulk operations without batching
- ❌ Concurrent parallel requests

**Success Requires**: Aggressive caching, careful batching, proactive monitoring, and realistic timeout expectations.

---

**Status**: ✅ Complete  
**Confidence**: MEDIUM (window duration untested)  
**Last Verified**: 2025-10-21

