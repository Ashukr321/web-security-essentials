# Web Security Overview

Web security problems become far easier to reason about when you group them by
**where the trust boundary is crossed**. This encyclopedia uses three zones:

![Web Security Zones](../resources/web-security-flow.svg)

## 1. Frontend / Client-Side Security

Code that runs inside the user's browser. You do not control this environment —
the user (or an attacker) can inspect, modify, and replay anything here.

- **Cross-Site Scripting (XSS)** — injecting malicious script into pages other
  users view. See [reflected](../02_Client_Side_Security/01_XSS_Vulnerabilities/reflected-xss.md),
  [stored](../02_Client_Side_Security/01_XSS_Vulnerabilities/stored-xss.md), and
  [DOM-based](../02_Client_Side_Security/01_XSS_Vulnerabilities/dom-based-xss.md) XSS.
- **Defenses** — [CSP](../02_Client_Side_Security/02_Defense_Mechanisms/XSS_Vulnerabilities/csp-policy.md),
  [safe rendering](../02_Client_Side_Security/02_Defense_Mechanisms/XSS_Vulnerabilities/safe-rendering.md),
  and [validation vs sanitization vs escaping](../02_Client_Side_Security/02_Defense_Mechanisms/XSS_Vulnerabilities/validation-vs-sanitization-vs-escaping.md).
- **Cookie security** — [cookie flags](../02_Client_Side_Security/03_Cookie_Security/cookie-flags.md)
  (`HttpOnly`, `Secure`, `SameSite`).

## 2. Security In Transition (Network)

Data moving between the browser and the server. The threat is anyone able to
read, forge, or replay requests across origins or on the wire.

- **HTTPS & HSTS** — encrypting traffic and forcing it. See [https-and-hsts](../03_Security_In_Transition/https-and-hsts.md).
- **CORS** — controlling cross-origin access. See [cors-policy](../03_Security_In_Transition/cors-policy.md).
- **CSRF** — tricking a logged-in browser into sending forged requests. See
  [attacks](../03_Security_In_Transition/CSRF_Protection/csrf-attacks.md) and
  [defenses](../03_Security_In_Transition/CSRF_Protection/csrf-defenses.md).

## 3. Backend / Server-Side Security

Code and data you fully control — and the last line of defense. The golden rule:
[never trust the client](../05_Backend_Security/never-trust-the-client.md).

- **SQL Injection** — [basics](../05_Backend_Security/01_SQL_Injection/sql-injection-basics.md)
  and [defenses](../05_Backend_Security/01_SQL_Injection/sql-defenses.md).
- **API protection** — [rate limiting](../05_Backend_Security/02_API_Protection/rate-limiting.md)
  and [error handling](../05_Backend_Security/02_API_Protection/error-handling.md).
- **Data storage** — [password hashing](../05_Backend_Security/03_Data_Storage/password-hashing.md)
  and [secure storage](../05_Backend_Security/03_Data_Storage/secure-storage.md).

## Cross-Cutting: Third-Party Risk

Your dependencies run with your privileges. A compromised package is a
compromised app. See [supply-chain-attacks](../04_Third_Party_Risks/supply-chain-attacks.md).

## Defense in Depth

No single control is enough. Assume every layer can fail and stack independent
defenses so that one bypass does not mean full compromise — validate on the
client for UX, but **enforce on the server**, encrypt in transit, and minimize
what you store.
