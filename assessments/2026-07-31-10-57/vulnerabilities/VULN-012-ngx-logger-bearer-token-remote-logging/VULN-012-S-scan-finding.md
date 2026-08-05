# VULN-012-S: Scanner Finding - ngx-logger-bearer-token-remote-logging

**Phase**: Scanner
**Vulnerability ID**: VULN-012
**Assessment**: 2026-07-31-10-57
**Task**: R-M-002 - Error Message Information Disclosure and Log Injection
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/logger.service.ts`
**Line**: 8–20
**Function**: `AuthTokenServerService.alterHttpRequest() / getAuthToken()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`AuthTokenServerService` extends `NGXLoggerServerService` and overrides `alterHttpRequest()` to attach the Bearer token to every outbound log HTTP request via `Authorization: Bearer <gx_token>`. Combined with ngx-logger's configured `serverLogLevel: NgxLoggerLevel.ERROR` and `serverLoggingUrl`, every `logger.error()` call transmits:
1. The log message content (which may include raw error messages, macro names, screen data, host addresses)
2. The active Bearer token in the request Authorization header

**Dual risk:**
- **Token in log requests**: If the log endpoint (`/logger`) is behind weaker TLS, a different access control tier, or logged by a proxy, the Bearer token is exposed
- **Sensitive content in logs**: Error messages containing server-supplied text (host addresses, session IDs, ApplinX internal messages) are forwarded to the remote log endpoint without any scrubbing

Note: `logger.service.ts:19` directly reads `sessionStorage.getItem('gx_token')` — a bypass of the centralized `StorageService.getAuthToken()` pattern, creating a secondary token access path.

### Code Snippet

```typescript
// logger.service.ts:8–20
@Injectable()
export class AuthTokenServerService extends NGXLoggerServerService {
    protected override alterHttpRequest(httpRequest: HttpRequest<any>): HttpRequest<any> {
        httpRequest = httpRequest.clone({
            setHeaders: {
                ['Authorization']: this.getAuthToken(),  // Bearer token attached to ALL log requests
            },
        });
        return httpRequest;
    }
    getAuthToken(): string {
        return 'Bearer ' + sessionStorage.getItem('gx_token');  // direct sessionStorage access
    }
}
```

---

## Context

**Scan Task**: [R-M-002](../../01-recon/tasks/R-M-002-error-message-log-injection.json)
**Target**: logger.service.ts, app.module.ts
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-005
**Related Attack Surface**: AS-013

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Verify the actual `serverLoggingUrl` configuration (in app.module.ts or environment files) — confirm logging IS enabled in production
- Assess whether the /logger endpoint requires the same TLS and access controls as the main ApplinX REST API
- Recommend: not attaching the full Bearer token to log requests; use a separate log-only token with minimal scope, or remove the Authorization header from log requests entirely
- Assess log content: does any `logger.error()` call log field values, screen content, or user data?

**For Registry**: Update vulnerability-registry.json with VULN-012 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
