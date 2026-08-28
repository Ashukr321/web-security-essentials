# CORS Policy Deep Dive

## The Origin Concept

An origin is defined by **scheme + host + port**:
- `https://example.com:443` and `http://example.com:80` are **different origins** (different scheme)
- `https://example.com` and `https://api.example.com` are **different origins** (different host)
- `https://example.com:443` and `https://example.com:8443` are **different origins** (different port)

The browser computes the origin of every request and attaches the `Origin` header automatically. JavaScript cannot override it.

## Request Flow in Detail

### Simple Request Flow
```
Browser                          Server
  |                                |
  |  GET /data                     |
  |  Origin: https://app.com      |
  |  Cookie: session=abc           |  (only if credentials: 'include')
  |------------------------------->|
  |                                |
  |  200 OK                        |
  |  Access-Control-Allow-Origin:  |
  |    https://app.com             |
  |  Access-Control-Allow-         |
  |    Credentials: true           |
  |<-------------------------------|
  |                                |
  Browser checks: origin match? ✓  |
  Credentials allowed? ✓           |
  → JS can read the response       |
```

### Preflight Flow
```
Browser                          Server
  |                                |
  |  OPTIONS /api/users            |
  |  Origin: https://app.com       |
  |  Access-Control-Request-       |
  |    Method: DELETE              |
  |  Access-Control-Request-       |
  |    Headers: X-Custom           |
  |------------------------------->|
  |                                |
  |  204 No Content                |
  |  Access-Control-Allow-Origin:  |
  |    https://app.com             |
  |  Access-Control-Allow-Methods: |
  |    GET, POST, DELETE           |
  |  Access-Control-Allow-Headers: |
  |    X-Custom                    |
  |  Access-Control-Max-Age: 3600  |
  |<-------------------------------|
  |                                |
  Browser: preflight passed ✓      |
  |                                |
  |  DELETE /api/users/42          |
  |  Origin: https://app.com       |
  |  X-Custom: value               |
  |------------------------------->|
  |                                |
  |  200 OK                        |
  |  Access-Control-Allow-Origin:  |
  |    https://app.com             |
  |<-------------------------------|
```

## What Triggers a Preflight

Any of these conditions:
1. **Non-simple method**: `PUT`, `DELETE`, `PATCH`, `CONNECT`, `TRACE`
2. **Custom headers**: `Authorization`, `X-*`, any non-safe header
3. **Non-simple Content-Type**: `application/json`, `application/xml`, etc.
4. **ReadableStream body**

## The `Vary: Origin` Problem

If a server conditionally returns different `Access-Control-Allow-Origin` values based on the request's `Origin`, it MUST include `Vary: Origin` in the response. Without it:

1. User A from `https://allowed.com` hits the API → response cached with `ACAO: https://allowed.com`
2. User B from `https://other.com` gets the cached response → browser sees `ACAO: https://allowed.com`, blocks it
3. OR worse: attacker from `https://evil.com` poisons the cache first

## Server-Side Implementation Patterns

### Allowlist (Correct)
```javascript
const ALLOWED = new Set(['https://app.example.com', 'https://admin.example.com']);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  // If not in allowlist: no ACAO header → browser blocks the read
  next();
});
```

### Reflected Origin (Vulnerable)
```javascript
// DO NOT DO THIS
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

## Common Pitfalls

1. **CORS does not prevent the request from being sent** — for simple requests, the server processes it regardless. CORS only controls whether JS can *read* the response.
2. **CORS is enforced by the browser** — server-to-server requests bypass CORS entirely. `curl` ignores it.
3. **`Access-Control-Allow-Origin: *`** cannot be used with credentials — the browser rejects it.
4. **Preflight caching** (`Max-Age`) is per-URL — a cached preflight for `/api/users` doesn't apply to `/api/orders`.
5. **`Access-Control-Expose-Headers`** is needed for JS to read non-simple response headers (`Content-Length`, `X-Request-Id`, etc.).

## Testing CORS

```bash
# Check simple request
curl -H "Origin: https://evil.com" -I https://target.com/api/data

# Check preflight
curl -X OPTIONS \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: DELETE" \
  -I https://target.com/api/data

# Check if null origin is allowed
curl -H "Origin: null" -I https://target.com/api/data
```

Look for:
- Does `Access-Control-Allow-Origin` reflect your evil origin?
- Is `Access-Control-Allow-Credentials: true` present?
- Does it allow `null` origin?
