# HTTPS & HSTS

**Level:** Practitioner  
**Topics:** TLS/SSL, certificate validation, HSTS, mixed content, SSL stripping

## What Is HTTPS?

HTTPS = HTTP + TLS (Transport Layer Security). It wraps every HTTP request/response in an encrypted tunnel so that:

1. **Confidentiality** — no one between client and server can read the traffic (passwords, tokens, data)
2. **Integrity** — no one can modify the data in transit (inject ads, malware, tracking scripts)
3. **Authentication** — the client verifies it's talking to the real server (not an impersonator) via the server's TLS certificate

Without HTTPS, everything travels in plaintext — anyone on the same network (coffee shop WiFi, ISP, corporate proxy) can read and modify every request.

## How TLS Works (Simplified)

### The TLS Handshake

```
Client                              Server
  |                                    |
  |  1. ClientHello                    |
  |    (supported TLS versions,        |
  |     cipher suites, random)         |
  |----------------------------------->|
  |                                    |
  |  2. ServerHello                    |
  |    (chosen version, cipher,        |
  |     random, certificate)           |
  |<-----------------------------------|
  |                                    |
  |  3. Client verifies certificate    |
  |    (chain of trust → CA)           |
  |                                    |
  |  4. Key exchange                   |
  |    (ECDHE — both sides derive      |
  |     the same session key)          |
  |<=================================>|
  |                                    |
  |  5. Encrypted HTTP traffic         |
  |    (symmetric encryption with      |
  |     the shared session key)        |
  |<=================================>|
```

**Key points:**
- Asymmetric crypto (certificates, key exchange) is only for the handshake
- Actual data uses symmetric encryption (AES-GCM) — much faster
- TLS 1.3 reduced the handshake to 1 round trip (1-RTT), or 0-RTT for resumed sessions

### Certificate Validation

The browser checks:
1. Certificate is signed by a trusted Certificate Authority (CA)
2. The domain name matches the certificate's Subject/SAN
3. Certificate hasn't expired
4. Certificate hasn't been revoked (CRL/OCSP)

If any check fails → browser shows a security warning and blocks the page.

## What Is HSTS?

**HTTP Strict Transport Security** tells the browser: "Never connect to this domain over plain HTTP. Always use HTTPS."

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Why HSTS Exists — The SSL Stripping Attack

Without HSTS:
1. User types `bank.com` in the address bar
2. Browser sends `http://bank.com` (plain HTTP first)
3. Server redirects to `https://bank.com`
4. **But** an attacker on the network intercepts step 2 and proxies the connection — user talks HTTP to attacker, attacker talks HTTPS to the bank
5. User sees a working page, no padlock — attacker reads everything

**HSTS stops this** because after the first HTTPS visit, the browser remembers: "This domain is HTTPS-only." Future visits skip HTTP entirely — the browser internally rewrites `http://` to `https://` before the request leaves.

### HSTS Parameters

| Parameter | Meaning |
|-----------|---------|
| `max-age` | How long (seconds) the browser remembers the HSTS rule. `31536000` = 1 year |
| `includeSubDomains` | Apply HSTS to all subdomains too |
| `preload` | Signal that the domain should be added to the browser's built-in HSTS preload list |

### The First-Visit Problem

HSTS has a weakness: the **very first visit** is still vulnerable to SSL stripping (the browser hasn't seen the HSTS header yet). 

**Solution: HSTS Preload List**
- A hardcoded list of HTTPS-only domains shipped with every browser
- Submit at https://hstspreload.org
- Once preloaded, even the first visit is protected
- Requires: `max-age >= 1 year`, `includeSubDomains`, `preload` directive

## Common Vulnerabilities

### 1. Mixed Content
HTTPS page loads resources over HTTP (images, scripts, stylesheets). Active mixed content (scripts, iframes) is blocked by modern browsers. Passive mixed content (images) may still load but shows a warning.

### 2. SSL Stripping
Man-in-the-middle downgrades HTTPS to HTTP. Fixed by HSTS + preloading.

### 3. Weak TLS Configuration
- TLS 1.0/1.1 are deprecated (known vulnerabilities: BEAST, POODLE)
- Weak cipher suites (RC4, DES, export ciphers)
- Missing forward secrecy (ECDHE)

### 4. Certificate Issues
- Self-signed certificates (no chain of trust)
- Expired certificates
- Wrong domain on certificate
- Certificate pinning bypass (deprecated — use Certificate Transparency instead)

### 5. HSTS Not Set
Without HSTS, every visit is vulnerable to downgrade attacks until the redirect completes.

## Testing

```bash
# Check TLS version and cipher
openssl s_client -connect example.com:443 -tls1_3

# Check HSTS header
curl -sI https://example.com | grep -i strict-transport

# Check certificate details
openssl s_client -connect example.com:443 | openssl x509 -text -noout

# SSL Labs full scan
# https://www.ssllabs.com/ssltest/
```

## Files

- [https-and-hsts.md](https-and-hsts.md) — Deep dive into TLS mechanics and HSTS behavior
- [https-hsts-visualization.html](https-hsts-visualization.html) — Interactive HTTPS & HSTS flow visualization
