# 🖥️ Client-Side Security

Security for everything that runs in the **user's browser** — HTML, CSS,
JavaScript, cookies, and the DOM. This is the *frontend trust zone*: code you
ship but no longer control, executing on a machine you don't own, next to the
user's session, tokens, and other tabs.

> **Core rule:** the client is hostile territory. Anything the browser holds
> (tokens, form data, DOM) can be read or tampered with by an attacker who gets
> code running in the page. Client-side security is about stopping *attacker
> code from executing in your users' browsers* — and limiting the blast radius
> when it does.

## Why it matters

The browser mixes your trusted code with untrusted input (URLs, user content,
third-party scripts) in the same execution context. One injected `<script>` runs
with full access to the page: it can steal cookies, forge requests as the user,
rewrite the UI, or exfiltrate keystrokes. No firewall or backend check sees it —
it happens entirely on the victim's device.

## Topics in this zone

| # | Topic | What it covers |
|---|-------|----------------|
| [01](01_XSS_Vulnerabilities/) | XSS Vulnerabilities | Stored, reflected, and DOM-based cross-site scripting — the #1 client-side risk. |
| [02](02_Defense_Mechanisms/) | Defense Mechanisms | CSP, safe rendering, and validation/sanitization/escaping. |
| [03](03_Cookie_Security/) | Cookie Security | `HttpOnly`, `Secure`, `SameSite` — protecting session tokens. |
| [04](04_Prototype_Pollution/) | Prototype Pollution | Polluting `Object.prototype` in JS to alter app behavior. |
| [05](05_Clickjacking/) | Clickjacking | UI-redressing attacks that trick users into unintended clicks. |

## Scenarios client-side security takes care of

| Scenario | Threat | Defense |
|----------|--------|---------|
| A user posts a comment containing `<script>` and it renders for everyone | **Stored XSS** — session theft, account takeover | Output-encode on render; Content-Security-Policy; sanitize rich HTML |
| A link like `?q=<img onerror=...>` reflects the query into the page | **Reflected XSS** | Context-aware escaping; never build DOM from raw URL params |
| Client JS does `element.innerHTML = location.hash` | **DOM-based XSS** | Use `textContent`/framework binding, not `innerHTML`; avoid `eval` |
| Attacker's JS reads `document.cookie` to grab the session | **Token theft** | `HttpOnly` cookies (invisible to JS) + short-lived tokens |
| A cross-site page auto-submits a form to your app | **CSRF-style abuse** | `SameSite=Lax/Strict` cookies (see Transition zone) |
| Your page is embedded in a hidden `<iframe>` over a fake button | **Clickjacking** | `X-Frame-Options: DENY` / CSP `frame-ancestors` |
| User input like `{"__proto__":{"isAdmin":true}}` merges into an object | **Prototype pollution** | Guard against `__proto__`/`constructor` keys; `Object.create(null)` |
| A compromised third-party CDN script runs in your page | **Supply-chain / Magecart** | Subresource Integrity (`integrity=`); pin & review deps |
| Sensitive value stored in `localStorage` read by injected script | **Data exposure** | Keep secrets out of web storage; treat all client storage as public |

## The frontend engineer's checklist

- [ ] Never inject untrusted data into HTML, JS, or URLs without context-aware encoding
- [ ] Prefer `textContent` / framework binding over `innerHTML`
- [ ] Ship a strict **Content-Security-Policy** (no `unsafe-inline`)
- [ ] Set session cookies `HttpOnly; Secure; SameSite`
- [ ] Set `frame-ancestors` / `X-Frame-Options` to block framing
- [ ] Add **Subresource Integrity** to third-party `<script>`/`<link>` tags
- [ ] Keep secrets and tokens out of `localStorage`/`sessionStorage`
- [ ] Validate input on the client for UX — **but never trust it**; re-validate on the server

> Client-side defenses reduce risk but never replace server-side checks — the
> browser can be bypassed entirely. Defense in depth: validate here, enforce there.
