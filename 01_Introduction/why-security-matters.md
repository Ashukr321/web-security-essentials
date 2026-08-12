# Why Web Security Matters

Every web application is exposed to the entire internet by default. Unlike a
desktop program, anyone with a browser and a network connection can send it
input — including attackers, bots, and automated scanners probing for weakness
around the clock.

## The Cost of Getting It Wrong

- **Data breaches** — leaked credentials, personal data, and payment details.
  Average breach cost is measured in millions, plus regulatory fines (GDPR,
  CCPA, PCI-DSS).
- **Account takeover** — stolen sessions or passwords let attackers act as
  legitimate users.
- **Reputation damage** — trust is hard to earn and easy to lose; a single
  headline breach can outlast the technical fix by years.
- **Service disruption** — defacement, ransomware, or denial of service takes
  revenue-generating systems offline.
- **Legal & compliance liability** — mishandling data is now a legal risk, not
  just an engineering one.

## Why Attacks Keep Working

1. **Input is untrusted.** Anything from the client — form fields, headers,
   cookies, URLs — can be forged. See [never-trust-the-client](../05_Backend_Security/never-trust-the-client.md).
2. **Complexity hides bugs.** Modern apps stitch together frameworks, APIs, and
   third-party packages; each is a potential entry point.
3. **Defaults are often insecure.** Verbose errors, permissive CORS, and
   missing security headers ship unless someone turns them off.
4. **The weakest link wins.** One unpatched dependency or one reused password
   can undo everything else.

## The Core Principle

> Security is not a feature you add at the end — it is a property of how the
> system is designed, built, and operated.

This encyclopedia is organized around **where** trust boundaries are crossed:
the **frontend** (code running in the user's browser), the **transition** (data
moving over the network), and the **backend** (code and data on your servers).
Start with [security-overview](security-overview.md) for the map, then
[threat-modeling](threat-modeling.md) to learn how to reason about risk.
