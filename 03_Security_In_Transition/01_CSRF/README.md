# Cross-Site Request Forgery (CSRF)

## What is CSRF — in Simple Words

You're logged into your bank. In another tab you open a funny meme site. That meme site secretly has a hidden form that submits a money transfer to **your bank** — and your browser happily sends your bank cookies along with it. The bank sees a valid session cookie, thinks it's you, and processes the transfer.

**CSRF = an attacker's site tricks your browser into making a real request to a site where you're already logged in.**

The attacker never sees your password or cookie. They don't need to. Your browser attaches cookies automatically to every request for that domain — the attacker just has to make your browser send the right request.

## Real-World Analogy

Imagine you have a signed blank cheque in your pocket (your session cookie). A stranger bumps into you, slips the cheque out, fills in "Pay $10,000 to Attacker", and hands it to the bank. The bank sees your valid signature and pays. You never agreed to the transaction — but the signature (cookie) was real.

## How It Works — Step by Step

```
 1. You log into bank.com
    Browser stores: Cookie: session=abc123

 2. You visit evil.com (attacker's site) in another tab

 3. evil.com has hidden HTML:
    ┌─────────────────────────────────────────┐
    │ <form action="https://bank.com/transfer"│
    │       method="POST">                    │
    │   <input name="to" value="attacker">    │
    │   <input name="amount" value="10000">   │
    │ </form>                                 │
    │ <script>document.forms[0].submit()</script>
    └─────────────────────────────────────────┘

 4. Browser sends POST to bank.com
    AND automatically attaches your session cookie
    (because the request is going to bank.com)

 5. bank.com sees valid cookie → processes the transfer
    You never clicked anything. You never knew.
```

## Why Does the Browser Do This?

Browsers follow a simple rule: **every request to a domain gets that domain's cookies**. It doesn't matter who triggered the request — you, a script, a form on another site. If the request goes to `bank.com`, the `bank.com` cookies go with it.

This is by design (otherwise you'd have to re-login on every page load). CSRF exploits this feature.

## What an Attacker Can Do

| Action | Example |
|--------|---------|
| Transfer money | Hidden form to bank's transfer endpoint |
| Change email/password | POST to account settings |
| Delete data | Submit a delete request |
| Post content as you | Create posts, send messages |
| Change settings | Disable 2FA, add attacker's email |

**What they CAN'T do:** read the response. The browser blocks cross-origin reads (Same-Origin Policy). So CSRF is a **write-only** attack — the attacker can make things happen but can't steal data directly.

## Three Things Needed for CSRF

```
 1. Relevant action     → Something worth doing (change password, transfer money)
 2. Cookie-based auth   → Server trusts the session cookie alone
 3. No unpredictable    → No token or header the attacker can't guess
    parameters
```

If any one of these is missing, CSRF doesn't work.

---

## How to Prevent CSRF

### Defense 1: SameSite Cookies (Easiest, Most Effective)

```
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```

| Value | What it does |
|-------|-------------|
| `Strict` | Cookie **never** sent from another site. Blocks all CSRF. But also blocks cookie when user clicks a link to your site from Google/email. |
| `Lax` | Cookie sent on top-level navigations (clicking links) but **NOT** on form POSTs or iframe/fetch from other sites. Best balance. |
| `None` | Cookie always sent (old behavior). Must pair with `Secure`. No CSRF protection. |

**`Lax` is the default in modern browsers.** This alone stops most CSRF.

### Defense 2: CSRF Tokens

Server generates a random token per session/form. Attacker can't guess it.

```
 Server                          Browser
   │                                │
   │── Render form with hidden ────►│
   │   <input name="_csrf"          │
   │    value="random-token-xyz">   │
   │                                │
   │◄── Form submitted with ────────│
   │    _csrf=random-token-xyz      │
   │                                │
   │  Server checks: does token     │
   │  match what I issued?          │
   │  YES → process                 │
   │  NO  → reject (403)           │
```

The attacker's hidden form on `evil.com` can't include this token because they can't read your bank's page (Same-Origin Policy blocks it).

### Defense 3: Check Origin / Referer Header

```
 Request from your site:     Origin: https://bank.com     ✓
 Request from attacker:      Origin: https://evil.com      ✗ reject
```

Server checks if the `Origin` (or `Referer`) header matches the expected domain. Cross-site requests will show the attacker's origin.

### Defense Priority

```
Best ──► SameSite=Lax cookies (default in modern browsers, zero code)
  +
Good ──► CSRF tokens (per-form random value)
  +
Extra ─► Origin/Referer header validation
  +
Belt ──► Re-authenticate for critical actions (password confirm)
```

## Quick Checklist

- [x] Session cookies set `SameSite=Lax` (or `Strict`)
- [x] State-changing endpoints use POST/PUT/DELETE, not GET
- [x] CSRF token on forms that mutate data
- [x] Validate `Origin` header on the server
- [x] Critical actions (password change, money transfer) require re-authentication

## Interview Quick-Fire

| Question | Answer |
|----------|--------|
| What is CSRF? | Attacker tricks user's browser into making an authenticated request to a site where the user is logged in |
| Why does it work? | Browsers attach cookies automatically to every request for a domain, regardless of who initiated it |
| Can the attacker read the response? | No — Same-Origin Policy blocks cross-origin reads. CSRF is write-only |
| Best single defense? | `SameSite=Lax` cookies (default in modern browsers) |
| What's a CSRF token? | Random value generated by the server, embedded in forms, validated on submit — attacker can't guess it |
| Why can't the attacker steal the CSRF token? | Same-Origin Policy prevents reading another site's pages/cookies |
| Does `Content-Type: application/json` help? | Yes — it triggers a CORS preflight, which blocks cross-origin requests unless explicitly allowed |
| Is login CSRF real? | Yes — attacker logs victim into attacker's account to harvest data the victim enters |
| CSRF vs XSS? | XSS executes code in the victim's browser. CSRF makes the victim's browser send a forged request. XSS can bypass CSRF tokens |

## Deep Dives

- **[csrf-attacks.md](csrf-attacks.md)** — 8 attack vectors with code examples (hidden forms, image tags, JSON tricks, login CSRF, multi-step)
- **[csrf-defenses.md](csrf-defenses.md)** — Implementation details for SameSite cookies, token patterns (synchronizer & double-submit), Origin validation, custom headers, and framework cheat sheet

## Key Takeaway

CSRF works because browsers automatically attach cookies to every request — regardless of who initiated it. The fix is simple: make the server require something the attacker can't provide — a `SameSite` cookie restriction, a random token, or an `Origin` check. Modern browsers default to `SameSite=Lax`, which kills most CSRF out of the box.
