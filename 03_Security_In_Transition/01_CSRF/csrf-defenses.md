# CSRF Defenses — Deep Dive

> This file covers how to prevent CSRF in depth. For attack vectors, see [csrf-attacks.md](csrf-attacks.md). For the overview, see [README.md](README.md).

---

## Defense 1: SameSite Cookies

The simplest and most effective defense. Tells the browser **when** to attach cookies.

### How It Works

```
 Request from same site (yoursite.com → yoursite.com)
 ├─ SameSite=Strict  → Cookie sent ✓
 ├─ SameSite=Lax     → Cookie sent ✓
 └─ SameSite=None    → Cookie sent ✓

 Top-level navigation from another site (click link on google.com → yoursite.com)
 ├─ SameSite=Strict  → Cookie NOT sent ✗ (user must re-login)
 ├─ SameSite=Lax     → Cookie sent ✓ (good UX)
 └─ SameSite=None    → Cookie sent ✓

 Cross-site form POST / fetch / iframe (evil.com → yoursite.com)
 ├─ SameSite=Strict  → Cookie NOT sent ✗ (CSRF blocked)
 ├─ SameSite=Lax     → Cookie NOT sent ✗ (CSRF blocked)
 └─ SameSite=None    → Cookie sent ✓ (CSRF possible)
```

### Which to Choose

```
 Need third-party cookie access?  (embedded widgets, OAuth popups, iframes)
 ├─ YES → SameSite=None; Secure  (must also use CSRF tokens)
 └─ NO
      │
      Need users to stay logged in when clicking links from email/Google?
      ├─ YES → SameSite=Lax   ← recommended default
      └─ NO  → SameSite=Strict (maximum security, slight UX cost)
```

### Implementation

```js
// Express.js with express-session
app.use(session({
  cookie: {
    sameSite: 'lax',
    secure: true,          // HTTPS only
    httpOnly: true,         // no JS access
    maxAge: 3600000         // 1 hour
  }
}));
```

```python
# Django (settings.py)
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True

CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
```

```
# Raw Set-Cookie header
Set-Cookie: session=abc123; SameSite=Lax; Secure; HttpOnly; Path=/
```

### Gotchas

- **Old browsers** (IE 11, very old Safari) don't support SameSite — they ignore it and send cookies always. Use CSRF tokens as fallback.
- **Subdomains**: `SameSite` treats `a.example.com` and `b.example.com` as the same site. CSRF from a subdomain still works. If you run untrusted content on subdomains, you need additional protection.
- **Lax + POST timing**: Chrome sends Lax cookies with cross-site top-level POSTs for 2 minutes after the cookie is set (to avoid breaking flows). After 2 minutes, the cookie is blocked.

---

## Defense 2: CSRF Tokens

A random, unpredictable value that the server generates and the attacker can't guess.

### Token Flow

```
 1. User requests a page with a form
    
    Server generates: token = crypto.randomBytes(32).toString('hex')
    Server stores:    session.csrfToken = token
    Server renders:
    ┌──────────────────────────────────────────────┐
    │ <form method="POST" action="/transfer">      │
    │   <input type="hidden" name="_csrf"           │
    │          value="a1b2c3d4e5...">              │
    │   <input name="to">                          │
    │   <input name="amount">                      │
    │   <button>Transfer</button>                  │
    │ </form>                                      │
    └──────────────────────────────────────────────┘

 2. User submits the form
    
    POST /transfer
    Body: _csrf=a1b2c3d4e5...&to=friend&amount=100
    Cookie: session=xyz789

 3. Server validates
    
    req.body._csrf === req.session.csrfToken ?
    ├─ YES → process request
    └─ NO  → 403 Forbidden
```

### Why the Attacker Can't Get the Token

```
 evil.com tries to read bank.com's form to steal the token:

 fetch('https://bank.com/transfer')     ← blocked by Same-Origin Policy
 <iframe src="bank.com/transfer">       ← can load, but can't read DOM
   iframe.contentDocument.forms[0]       ← throws SecurityError
```

The Same-Origin Policy prevents cross-origin reads. The attacker can make the browser **send** a request but can't **read** pages from the target site.

### Synchronizer Token Pattern (Per-Session)

Simplest approach: one token per session.

```js
// Express.js implementation
const crypto = require('crypto');

function csrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function csrfValidate(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
}

app.use(csrfToken);
app.use(csrfValidate);
```

### Double-Submit Cookie Pattern (Stateless)

For stateless backends (no server-side session). Token stored in a cookie AND sent in the request body/header. Attacker can't read the cookie value to duplicate it.

```
 Server sets:
   Set-Cookie: csrf=random123; SameSite=Lax; Secure; Path=/

 Client must send the same value as a header:
   X-CSRF-Token: random123

 Server checks:
   cookie.csrf === header['x-csrf-token'] ?
   ├─ YES → valid (only the real page can read its own cookies via JS)
   └─ NO  → 403
```

```js
// Client-side: read cookie and send as header
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf='))
  ?.split('=')[1];

fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ to: 'friend', amount: 100 })
});
```

**Weakness:** If the attacker can set cookies on the victim's domain (via a subdomain or cookie injection), they can set both the cookie and the header value. Use with SameSite cookies as defense in depth.

### CSRF Tokens for SPAs (Single Page Apps)

SPAs typically use `fetch`/`axios` with JSON — custom headers already trigger a CORS preflight, which blocks cross-origin requests. But belt-and-suspenders:

```js
// Login response sets a csrf cookie
// Every API request includes it as a header

// Axios global setup
axios.defaults.headers.common['X-CSRF-Token'] = getCookie('csrf');

// Or use meta tag
// Server renders: <meta name="csrf-token" content="abc123">
const token = document.querySelector('meta[name="csrf-token"]').content;
axios.defaults.headers.common['X-CSRF-Token'] = token;
```

---

## Defense 3: Origin / Referer Header Validation

The `Origin` header tells the server where the request came from. Cross-site requests will show the attacker's origin.

```
 Request from your site:
   Origin: https://bank.com           ← matches → allow

 Request from attacker:
   Origin: https://evil.com           ← doesn't match → reject

 Request with no Origin (some GETs, redirects):
   Referer: https://bank.com/page     ← check this as fallback
```

### Implementation

```js
function originCheck(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers['origin'] || req.headers['referer'];
    const allowed = ['https://bank.com', 'https://www.bank.com'];

    if (!origin) {
      // No Origin/Referer — could be a direct request or privacy setting
      // Strict: reject. Permissive: allow (less secure).
      return res.status(403).json({ error: 'Missing origin' });
    }

    const requestOrigin = new URL(origin).origin;
    if (!allowed.includes(requestOrigin)) {
      return res.status(403).json({ error: 'Invalid origin' });
    }
  }
  next();
}
```

### Limitations

- **Privacy extensions/settings** can strip `Referer` and occasionally `Origin`
- **Redirects** may drop the `Origin` header
- **Same-site requests** from attacker-controlled subdomains will have a trusted origin
- Best as a **secondary** defense, not the only one

---

## Defense 4: Custom Request Headers

Cross-origin requests with custom headers trigger a CORS preflight. If the server doesn't allow the attacker's origin, the request is blocked.

```js
// Client sends custom header with every request
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',  // custom header
    'Content-Type': 'application/json'       // non-simple content type
  },
  body: JSON.stringify(data)
});
```

```
 Cross-origin request with custom header?
       │
       ▼
 Browser sends OPTIONS preflight
       │
       ▼
 Server CORS config allows evil.com?
 ├─ NO  → Browser blocks the request entirely (CSRF prevented)
 └─ YES → Request proceeds (server misconfigured)
```

**This is why JSON APIs with proper CORS config are largely immune to CSRF** — the `Content-Type: application/json` header alone triggers a preflight.

---

## Defense 5: Re-Authentication for Critical Actions

For high-value actions, require the user to prove their identity again:

```
 User clicks "Transfer $10,000"
       │
       ▼
 Server responds: "Enter your password to confirm"
       │
       ▼
 User enters password → server verifies → processes transfer
```

An attacker's CSRF can trigger the transfer request but can't supply the user's password.

**Use for:** password changes, email changes, money transfers, account deletion, 2FA changes.

---

## Defense Comparison Matrix

| Defense | CSRF Protection | Stateless? | SPA-Friendly? | Legacy Browser? |
|---------|----------------|------------|---------------|-----------------|
| SameSite=Lax | Strong | Yes | Yes | No (old browsers ignore) |
| CSRF Token (session) | Strong | No | Needs meta tag / cookie | Yes |
| CSRF Token (double-submit) | Strong | Yes | Yes | Yes |
| Origin/Referer check | Moderate | Yes | Yes | Mostly |
| Custom headers + CORS | Strong (for APIs) | Yes | Yes | Yes |
| Re-authentication | Very strong | N/A | Yes | Yes |

---

## Recommended Layered Defense

```
 Layer 1: SameSite=Lax on all cookies          ← stops 90% of CSRF
      │
 Layer 2: CSRF token on all state-changing      ← catches the rest
      │   forms and API calls
      │
 Layer 3: Origin header validation              ← defense in depth
      │
 Layer 4: Re-auth for critical actions          ← limits blast radius
```

No single defense is perfect. The combination makes CSRF practically impossible.

---

## Framework Built-in CSRF Protection

Most modern frameworks handle this for you:

| Framework | Built-in CSRF | How to Enable |
|-----------|--------------|---------------|
| Django | Yes (on by default) | `{% csrf_token %}` in templates, `CsrfViewMiddleware` |
| Rails | Yes (on by default) | `protect_from_forgery with: :exception` |
| Laravel | Yes (on by default) | `@csrf` in Blade templates, `VerifyCsrfToken` middleware |
| Express | No (use csurf / csrf-csrf) | `npm install csrf-csrf`, add middleware |
| Spring | Yes | `CsrfFilter` enabled by default in Spring Security |
| ASP.NET | Yes | `@Html.AntiForgeryToken()` + `[ValidateAntiForgeryToken]` |
| Next.js | No built-in | Use SameSite cookies + custom middleware |

**Don't roll your own if your framework provides it.**
