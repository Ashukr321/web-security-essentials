# Cross-Origin Resource Sharing (CORS)

**Level:** Practitioner  
**Path:** https://portswigger.net/web-security/learning-paths/cors

CORS is a browser mechanism that uses HTTP headers to let a server declare which origins (domain + scheme + port) are allowed to read its responses. Without CORS, the Same-Origin Policy (SOP) blocks all cross-origin reads — CORS is the controlled relaxation of SOP.

## Why CORS Exists

The Same-Origin Policy blocks cross-origin reads by default. But modern apps need legitimate cross-origin access: a frontend at `app.example.com` calling an API at `api.example.com`, third-party integrations, CDN-hosted fonts. CORS gives servers a way to opt specific origins into reading their responses — without disabling SOP entirely.

## How It Works

### Simple Requests (No Preflight)

A request that meets ALL of these conditions skips the preflight:
- Method: `GET`, `HEAD`, or `POST`
- Headers: only "safe" headers (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type` limited to `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`)
- No `ReadableStream` body

The browser sends the request directly. The server's response includes `Access-Control-Allow-Origin`. If it doesn't match the request's `Origin`, the browser blocks the JavaScript from reading the response — **but the request was still sent and processed by the server**.

### Preflight Requests

Any request that doesn't qualify as "simple" triggers a preflight:
1. Browser sends an `OPTIONS` request with `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers`
2. Server responds with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Access-Control-Max-Age`
3. If the preflight passes, the browser sends the actual request
4. If it fails, the actual request is **never sent**

### Credentialed Requests

By default, cross-origin `fetch`/`XMLHttpRequest` don't send cookies. To include them:
- Client: `fetch(url, { credentials: 'include' })`
- Server: `Access-Control-Allow-Credentials: true` AND `Access-Control-Allow-Origin` must be the exact origin (not `*`)

## CORS Headers Reference

| Header | Direction | Purpose |
|--------|-----------|---------|
| `Origin` | Request | Browser-set, tells server where the request came from |
| `Access-Control-Allow-Origin` | Response | Which origin can read the response (`*` or exact origin) |
| `Access-Control-Allow-Methods` | Response (preflight) | Allowed HTTP methods |
| `Access-Control-Allow-Headers` | Response (preflight) | Allowed custom headers |
| `Access-Control-Allow-Credentials` | Response | Whether cookies/auth are allowed |
| `Access-Control-Expose-Headers` | Response | Which response headers JS can read |
| `Access-Control-Max-Age` | Response (preflight) | How long to cache the preflight result |
| `Access-Control-Request-Method` | Request (preflight) | What method the actual request will use |
| `Access-Control-Request-Headers` | Request (preflight) | What custom headers the actual request will send |

## Common CORS Misconfigurations (Vulnerabilities)

### 1. Reflecting the Origin header
```http
Access-Control-Allow-Origin: [whatever Origin was sent]
Access-Control-Allow-Credentials: true
```
The server blindly reflects any origin — any site can read authenticated responses. This is as bad as having no SOP at all.

### 2. Trusting null origin
```http
Access-Control-Allow-Origin: null
Access-Control-Allow-Credentials: true
```
Sandboxed iframes and `data:` URLs send `Origin: null`. An attacker can craft a page that sends `null` origin and read sensitive data.

### 3. Weak regex matching
```
if origin.endsWith("example.com")  // matches evil-example.com
if origin.contains("example.com")  // matches example.com.evil.com
```

### 4. Wildcard with credentials
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```
Browsers reject this combination, but some servers try it — indicating the developer wanted to allow everything, and the real config might be worse.

### 5. Pre-domain wildcard
```
*.example.com → allows attacker.example.com (any subdomain takeover = full access)
```

## Attack Scenarios

1. **Data theft via reflected origin**: Attacker's page sends credentialed request to vulnerable API, reads the response (user data, tokens, PII)
2. **Internal network scanning**: If CORS is misconfigured on internal services, an external page can probe internal IPs and read responses
3. **Cache poisoning**: Exploit CORS misconfig + server-side cache to serve attacker-controlled responses to other users

## Defenses

1. **Whitelist specific origins** — never reflect the `Origin` header blindly
2. **Never allow `null` origin** with credentials
3. **Use exact string matching** — no regex, no `.endsWith()`
4. **Minimize `Access-Control-Allow-Methods`** — only what the API actually needs
5. **Set `Access-Control-Max-Age`** — reduce preflight traffic
6. **Vary: Origin** — if you conditionally set `Access-Control-Allow-Origin`, always include `Vary: Origin` to prevent cache poisoning

## CORS vs SOP vs CSP

| | SOP | CORS | CSP |
|---|-----|------|-----|
| **What** | Browser default | Server opt-in to relax SOP | Server directive for page behavior |
| **Controls** | Cross-origin reads | Which origins can read responses | What scripts/resources can load |
| **Direction** | Blocks by default | Allows selectively | Restricts selectively |

## Files

- [cors-policy.md](cors-policy.md) — Deep dive into CORS policy mechanics
- [cors-visualization.html](cors-visualization.html) — Interactive CORS flow visualization
