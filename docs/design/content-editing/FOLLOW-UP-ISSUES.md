# DEV-UI-08 Follow-Up Issues — Minor Recommendations

**Date**: November 4, 2025  
**Related**: PR #165 - feat(DEV-UI-08): Content Editing Integration  
**Status**: Pending Creation as GitHub Issues  
**Priority**: P3 (Low - Non-blocking, post-launch optimization)

---

## Summary

QA has identified three minor, non-blocking recommendations for post-launch improvements to the Content Editing feature:

| Issue | Area | Priority | Impact | Effort |
|-------|------|----------|--------|--------|
| **Error Message Sanitization Middleware** | Security | P3 | Low - edge case prevention | 2-3 hours |
| **Rate Limiting on Export Endpoint** | Performance/Security | P3 | Low - abuse prevention | 3-4 hours |
| **Content Backup Strategy** | Operations | P3 | Low - operational planning | 1-2 hours |

---

## Issue 1: Error Message Sanitization Middleware

### Issue Title
`[Follow-up] DEV-UI-08: Error Message Sanitization Middleware`

### Problem Statement
Currently, error responses from the API may inadvertently leak database implementation details in edge cases:
- Column names from database errors
- SQL syntax information
- Internal service names
- Stack traces in development mode

While the current implementation follows good practices (using standardized error codes and correlation IDs), adding a sanitization middleware would provide defense-in-depth.

### Acceptance Criteria
- [ ] Create middleware that wraps all error responses
- [ ] Strip database-specific error messages and replace with generic messages
- [ ] Preserve correlation IDs and status codes for debugging
- [ ] Log original error details to server logs (for debugging)
- [ ] Add unit tests for error sanitization
- [ ] Document in error handling runbook

### Implementation Details
```typescript
// Middleware pseudocode
export function errorSanitizationMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  const correlationId = req.get('x-correlation-id') || generateId();
  
  // Log original error for debugging
  logger.error('API Error', {
    correlationId,
    originalMessage: err.message,
    stack: err.stack,
    userId: req.user?.id,
  });
  
  // Determine if error is from database
  if (isDatabaseError(err)) {
    // Replace database error with generic message
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal error occurred. Please try again later.',
        statusCode: 500,
        correlationId,
        timestamp: new Date().toISOString(),
      }
    });
  } else {
    // Handle other errors normally
    next(err);
  }
}
```

### Related Specs
- DEV-UI-08 specification (Section 6.3 - Error Handling)
- OWASP Top 10: A01:2021 – Broken Access Control (error disclosure)

### Estimated Effort
- Implementation: 2-3 hours
- Testing: 1 hour
- Documentation: 0.5 hours

---

## Issue 2: Rate Limiting on Export Endpoint

### Issue Title
`[Follow-up] DEV-UI-08: Rate Limiting for Export Endpoint`

### Problem Statement
The export endpoint (`POST /api/content/:id/export`) is currently unrestricted and could be abused by:
- Users exporting the same content repeatedly in bulk
- Denial-of-service attacks using large exports
- Unintended resource consumption from client-side loops

Implementing rate limiting would protect the API from accidental or intentional abuse while maintaining normal usage patterns.

### Acceptance Criteria
- [ ] Add rate limiting middleware to `/api/content/:id/export` endpoint only
- [ ] Configure limit: 10 exports per minute per user
- [ ] Return 429 (Too Many Requests) when limit exceeded
- [ ] Include `Retry-After` header in 429 response
- [ ] Log rate limit violations with user ID and correlation ID
- [ ] Add metrics/observability for rate limit events
- [ ] Write unit tests for rate limiting behavior
- [ ] Document rate limit in API documentation

### Implementation Details
```typescript
// Rate limit configuration
const exportRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,            // 10 requests per window
  keyGenerator: (req) => req.user.id, // Per-user limit
  message: 'Too many export requests. Please wait before exporting again.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  skip: (req) => !req.user, // Skip if not authenticated
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      userId: req.user.id,
      endpoint: req.path,
      correlationId: req.get('x-correlation-id'),
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message,
        statusCode: 429,
        retryAfter: 60,
      }
    });
  }
});

// Apply to export endpoint only
router.post('/:id/export', exportRateLimit, exportContentHandler);
```

### Related Specs
- DEV-UI-08 specification (Section 9 - Non-Functional Requirements)
- OWASP: Rate Limiting Best Practices

### Estimated Effort
- Implementation: 2-3 hours
- Testing: 1 hour
- Monitoring/metrics: 1 hour
- Documentation: 0.5 hours

---

## Issue 3: Content Backup Strategy & Operational Runbook

### Issue Title
`[Follow-up] DEV-UI-08: Content Backup Strategy & Operational Runbook`

### Problem Statement
While the content versioning system provides historical data access, there's no documented operational backup and disaster recovery strategy for:
- Point-in-time recovery procedures
- Backup frequency and retention policy
- Data loss scenarios and mitigation
- Restore procedures for different failure modes
- Backup verification and monitoring

This is necessary for operational readiness and compliance.

### Acceptance Criteria
- [ ] Document backup frequency (e.g., hourly, daily)
- [ ] Define retention policy (e.g., 30-day rolling backup window)
- [ ] Document point-in-time recovery procedures
- [ ] Outline scenarios: database corruption, accidental deletion, ransomware
- [ ] Define RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
- [ ] Document backup verification procedures
- [ ] Add backup monitoring and alerting configuration
- [ ] Create runbook for common recovery scenarios
- [ ] Include testing schedule for backup restoration

### Documentation Template
```markdown
# Content Editing (DEV-UI-08) Operational Runbook — Backup & Recovery

## Backup Strategy

### Backup Frequency
- Daily full backups at 2 AM UTC
- Hourly incremental backups
- 30-day rolling retention window

### RTO/RPO Targets
- RTO: 4 hours (recovery time to operational state)
- RPO: 1 hour (maximum acceptable data loss)

## Point-in-Time Recovery

### Scenario 1: User Accidentally Deletes Content
**Recovery Time**: <5 minutes
1. Soft delete marker stored in database
2. Content item marked as deleted but data retained
3. Restore via `/api/content/:id/restore` endpoint
4. Logged in audit trail

### Scenario 2: Database Corruption
**Recovery Time**: 2-4 hours
1. Detect via automated monitoring alerts
2. Initiate restore from last clean backup
3. Validate integrity of restored data
4. Notify affected users of recovery

### Scenario 3: Ransomware or Data Breach
**Recovery Time**: 4+ hours
1. Isolate affected systems immediately
2. Restore from air-gapped backup
3. Verify integrity and security
4. Full audit of recovered data

## Backup Monitoring & Alerting
- Alert if daily backup fails
- Alert if backup size deviates >20% from normal
- Alert if restore verification fails
- Weekly backup integrity checks
```

### Related Specs
- Operational guidelines document
- Disaster recovery policy

### Estimated Effort
- Documentation & planning: 1-2 hours
- Runbook creation: 1 hour
- Monitoring setup: 1-2 hours (may involve DevOps)

---

## Recommendations for Implementation

### Timing
- **Blocking for v1.0 release**: None
- **Recommended for v1.1 release** (1-2 weeks post-launch): Issues #1 and #2
- **Recommended for operational setup** (pre-production): Issue #3

### Priority Order (if all to be done)
1. **Content Backup Strategy** (operational requirement, no code changes)
2. **Error Message Sanitization** (security hardening)
3. **Rate Limiting** (performance/abuse prevention)

### Team Assignment
- **Issue 1 (Error Sanitization)**: dev.avery-kim or peer dev
- **Issue 2 (Rate Limiting)**: dev.avery-kim or peer dev
- **Issue 3 (Backup Runbook)**: DevOps + ops team lead

---

## Conclusion

These three follow-up issues represent **post-launch improvements** and **operational enhancements**. None are blocking for the current DEV-UI-08 implementation, which is **production-ready** and meets all acceptance criteria.

**Current Status**: ✅ Ready for merge and deployment  
**Follow-ups**: Document as GitHub issues for prioritization in next sprint

---

**Prepared by**: dev.avery-kim  
**Date**: November 4, 2025  
**Related PR**: #165 - feat(DEV-UI-08): Content Editing Integration  
**QA Sign-off**: Approved (pending follow-up issue creation)
