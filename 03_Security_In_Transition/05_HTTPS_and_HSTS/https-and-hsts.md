# HTTPS & HSTS Deep Dive

## TLS 1.3 vs TLS 1.2

### TLS 1.2 Handshake (2 round trips)
```
Client                              Server
  |  ClientHello                       |
  |  (versions, ciphers, random)       |
  |----------------------------------->|
  |                                    |
  |  ServerHello + Certificate +       |
  |  ServerKeyExchange + Done          |
  |<-----------------------------------|
  |                                    |
  |  ClientKeyExchange +               |
  |  ChangeCipherSpec + Finished       |
  |----------------------------------->|
  |                                    |
  |  ChangeCipherSpec + Finished       |
  |<-----------------------------------|
  |                                    |
  |  ═══ Encrypted HTTP traffic ═══    |
```

### TLS 1.3 Handshake (1 round trip)
```
Client                              Server
  |  ClientHello + KeyShare            |
  |  (version, ciphers, ECDHE share)   |
  |----------------------------------->|
  |                                    |
  |  ServerHello + KeyShare +          |
  |  {Certificate + Finished}          |  ← encrypted already
  |<-----------------------------------|
  |                                    |
  |  {Finished}                        |
  |----------------------------------->|
  |                                    |
  |  ═══ Encrypted HTTP traffic ═══    |
```

**TLS 1.3 improvements:**
- Removed insecure cipher suites (RSA key exchange, CBC ciphers, SHA-1)
- Mandatory forward secrecy (ECDHE only)
- Encrypted certificate (server cert is no longer visible to passive observers)
- 0-RTT resumption (fast but replay-vulnerable — use for safe GET requests only)

## Certificate Chain of Trust

```
Root CA (built into OS/browser)
  └── Intermediate CA (signed by Root)
        └── Your certificate (signed by Intermediate)
```

- Root CAs are pre-installed in the OS/browser trust store
- Servers send the full chain (leaf + intermediates) — never the root
- If any link breaks (expired, revoked, untrusted), validation fails

### Certificate Transparency (CT)

All publicly trusted certificates must be logged to public CT logs. This means:
- Anyone can monitor which certificates are issued for their domain
- Misissued or fraudulent certificates are detectable
- Browsers enforce CT: certificates without SCTs (Signed Certificate Timestamps) are rejected

## HSTS Behavior in Detail

### Timeline of Protection
```
Visit 1: http://bank.com
  → 301 redirect to https://bank.com        ← VULNERABLE WINDOW
  → Browser receives HSTS header
  → Browser stores: "bank.com = HTTPS-only for 1 year"

Visit 2+: user types bank.com
  → Browser internally rewrites to https://  ← PROTECTED
  → No HTTP request ever leaves the machine
  → 307 Internal Redirect (visible in DevTools)
```

### The 307 Internal Redirect

When HSTS is active, the browser shows a `307 Internal Redirect` in DevTools network tab:
- This is NOT a real network request
- The browser rewrites the URL before any network activity
- It's purely local — no bytes go over the wire as HTTP

### HSTS Preload List

The preload list is a text file compiled into every major browser:
- Chrome, Firefox, Safari, Edge all share the same list
- Adding a domain takes weeks (manual review)
- **Removing a domain takes months** — think carefully before preloading
- Requires: valid HTTPS on root + all subdomains, `max-age >= 31536000`, `includeSubDomains`, `preload`

## SSL Stripping Attack in Detail

**Tools:** sslstrip, mitmproxy, Bettercap

```
Victim                  Attacker (MITM)              Bank Server
  |                          |                            |
  |  http://bank.com         |                            |
  |------------------------->|                            |
  |                          |  https://bank.com          |
  |                          |--------------------------->|
  |                          |                            |
  |                          |  200 OK (HTTPS page)       |
  |                          |<---------------------------|
  |                          |                            |
  |  200 OK (HTTP page)      |  (rewrites all https://    |
  |  (looks identical)       |   links to http://)        |
  |<-------------------------|                            |
  |                          |                            |
  |  POST /login             |                            |
  |  (plaintext creds!)      |  POST /login (HTTPS)       |
  |------------------------->|--------------------------->|
```

The attacker:
1. Intercepts the initial HTTP request (ARP spoofing, DNS spoofing, rogue AP)
2. Forwards it to the real server over HTTPS
3. Rewrites all HTTPS links in the response to HTTP
4. Victim stays on HTTP — sees a working page, just no padlock
5. All form submissions (passwords, cards) travel in plaintext to the attacker

**HSTS kills this** because the browser refuses to make the HTTP request in step 1.

## Common Misconfigurations

### 1. Short max-age
```http
Strict-Transport-Security: max-age=86400
```
Only 1 day — attacker just needs to wait for it to expire.

### 2. Missing includeSubDomains
```http
Strict-Transport-Security: max-age=31536000
```
`http://sub.example.com` is still vulnerable to stripping.

### 3. HSTS on HTTP response
```
http://example.com → Strict-Transport-Security: max-age=...
```
Browsers IGNORE HSTS headers on HTTP responses (could be injected by MITM).

### 4. Mixed content on HTTPS pages
```html
<script src="http://cdn.example.com/app.js"></script>
```
Browser blocks active mixed content. If the script is critical, the page breaks.

### 5. No OCSP stapling
Without OCSP stapling, the browser makes a separate request to the CA to check revocation. This adds latency and leaks which sites the user visits to the CA.

## Security Headers Companion

HSTS works best alongside:

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy: upgrade-insecure-requests` | Auto-upgrades HTTP subresource URLs to HTTPS |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | Restricts browser features (camera, mic, geolocation) |

## Testing Checklist

- [ ] TLS 1.3 supported, TLS 1.0/1.1 disabled
- [ ] Strong cipher suites only (AES-GCM, ChaCha20-Poly1305)
- [ ] Forward secrecy enabled (ECDHE)
- [ ] HSTS header present with `max-age >= 31536000`
- [ ] `includeSubDomains` set
- [ ] Domain submitted to HSTS preload list
- [ ] No mixed content (check DevTools console)
- [ ] Certificate Transparency SCTs present
- [ ] OCSP stapling enabled
- [ ] HTTP redirects to HTTPS (301, not 302)
