# Clickjacking (UI Redressing)

## What is Clickjacking?

Clickjacking is an attack where a malicious site loads your legitimate website inside a hidden/transparent `<iframe>` and tricks the user into clicking something they didn't intend to. The user thinks they're clicking a button on the attacker's page, but they're actually clicking a button on **your** hidden page — transferring money, changing settings, deleting an account, etc.

## How the Attack Works

```
 Attacker's Page (visible to user)
 ┌─────────────────────────────────────────┐
 │                                         │
 │   "Click here to win a prize!"          │
 │   ┌─────────────────────┐               │
 │   │   [Win Now!]        │  ← user sees  │
 │   └─────────────────────┘               │
 │                                         │
 │   ┌─────────────────────┐               │
 │   │ YOUR SITE (iframe)  │  ← hidden,    │
 │   │  [Delete Account]   │    opacity: 0  │
 │   └─────────────────────┘               │
 │     ↑ positioned exactly over "Win Now" │
 └─────────────────────────────────────────┘

 User clicks "Win Now!" → actually clicks "Delete Account"
```

### Attacker's Minimal Payload

```html
<style>
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 500px;
    height: 500px;
    opacity: 0;          /* invisible */
    z-index: 10;         /* on top of everything */
  }
</style>

<h1>Click to claim your reward!</h1>
<button>Claim Now</button>

<!-- Your real site loaded invisibly on top -->
<iframe src="https://yourbank.com/transfer?to=attacker&amount=10000"></iframe>
```

The iframe is transparent (`opacity: 0`) but sits on top. The user's click passes through to the iframe — executing the real action on the victim site.

## Variations

| Variant | Technique |
|---------|-----------|
| **Classic clickjacking** | Invisible iframe over a decoy button |
| **Likejacking** | Hidden Facebook/Twitter "Like" button under a decoy |
| **Cursorjacking** | Custom cursor image offset from the real pointer — user clicks somewhere else |
| **Drag-and-drop** | Trick user into dragging data from a hidden iframe into attacker's page |
| **Multi-step** | Multiple positioned iframes — trick user through a whole workflow (confirm dialogs, etc.) |

## Why It's Dangerous

- User is **already authenticated** on the victim site (cookies sent automatically)
- The real site's UI actually executes the action — no XSS or injection needed
- User sees nothing suspicious — the action happens invisibly
- Works against any site that allows itself to be framed

---

## Prevention Flow

```
 Request arrives at your server
          │
          ▼
 ┌─────────────────────────────┐
 │ Set HTTP Response Headers   │
 │                             │
 │ 1. X-Frame-Options: DENY   │
 │    (or SAMEORIGIN)         │
 │                             │
 │ 2. Content-Security-Policy: │
 │    frame-ancestors 'none'   │
 │    (or 'self')             │
 └────────────┬────────────────┘
              │
              ▼
 ┌─────────────────────────────┐
 │ Browser receives response   │
 │                             │
 │ Is this page inside an      │
 │ <iframe>?                   │
 ├──────────┬──────────────────┤
 │  NO      │      YES         │
 │  ↓       │       ↓          │
 │ Render   │  Check headers:  │
 │ normally │  frame-ancestors │
 │          │  / X-Frame-Opts  │
 │          ├───────┬──────────┤
 │          │Allowed│ Blocked  │
 │          │  ↓    │    ↓     │
 │          │Render │ REFUSE   │
 │          │       │ to load  │
 └──────────┴───────┴──────────┘
```

### Defense 1: `X-Frame-Options` Header (Legacy but widely supported)

```
X-Frame-Options: DENY              # never allow framing
X-Frame-Options: SAMEORIGIN        # only same-origin frames allowed
```

**Set it on your server:**

```js
// Express.js
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

```nginx
# Nginx
add_header X-Frame-Options "DENY" always;
```

```apache
# Apache
Header always set X-Frame-Options "DENY"
```

### Defense 2: `Content-Security-Policy: frame-ancestors` (Modern, preferred)

```
Content-Security-Policy: frame-ancestors 'none'        # same as DENY
Content-Security-Policy: frame-ancestors 'self'         # same as SAMEORIGIN
Content-Security-Policy: frame-ancestors https://trusted.com  # only this origin
```

**Why `frame-ancestors` is better than `X-Frame-Options`:**

| Feature | X-Frame-Options | frame-ancestors |
|---------|----------------|-----------------|
| Allow specific origins | No | Yes |
| Multiple origins | No | Yes |
| CSP standard | No (custom header) | Yes |
| Browser support | All | All modern |
| Overrides X-Frame-Options | — | Yes |

**Use both** for backward compatibility:

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

### Defense 3: SameSite Cookies (Defense in Depth)

Even if framing is somehow possible, `SameSite` cookies won't be sent in cross-origin iframe requests:

```
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```

- `SameSite=Strict` — cookie never sent in any cross-site context (iframe included)
- `SameSite=Lax` — cookie sent on top-level navigations but **not in iframes** (partial protection)

### Defense 4: JavaScript Frame-Busting (Last Resort / Legacy)

```js
// Basic frame-buster (can be bypassed — don't rely on this alone)
if (window.top !== window.self) {
  window.top.location = window.self.location;
}
```

**Why it's unreliable:** attacker can block it with `sandbox` attribute:

```html
<iframe src="https://victim.com" sandbox="allow-forms"></iframe>
<!-- sandbox without allow-scripts blocks the frame-buster JS -->
```

Only use as an extra layer, never as the sole defense.

---

## Defense Priority

```
Best ──► Content-Security-Policy: frame-ancestors 'none'
  +
Good ──► X-Frame-Options: DENY  (backward compat)
  +
Extra ─► SameSite=Strict cookies (limits damage if framed)
  +
Weak ──► JS frame-busting (bypassable, last resort only)
```

## Quick Checklist

- [x] Set `Content-Security-Policy: frame-ancestors 'none'` (or `'self'` if you need same-origin framing)
- [x] Set `X-Frame-Options: DENY` for older browsers
- [x] Session cookies use `SameSite=Strict` or `Lax`
- [x] Sensitive actions require re-authentication or CSRF tokens (limits blast radius)
- [x] Don't rely on JavaScript frame-busting alone

## Testing for Clickjacking

Create a simple test page:

```html
<iframe src="https://your-site.com/sensitive-page" width="500" height="500"></iframe>
```

If the page loads inside the iframe, it's **vulnerable**. If the browser blocks it or shows a blank frame, your headers are working.

## Key Takeaway

Clickjacking is trivial to prevent with two headers. The attack surface exists **only** when your site can be loaded inside an iframe. Block framing with `frame-ancestors` + `X-Frame-Options`, and the entire attack class disappears.
