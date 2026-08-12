# Threat Modeling

Threat modeling is the practice of **thinking like an attacker before they do**.
Instead of reacting to breaches, you systematically ask: what are we building,
what can go wrong, and what will we do about it?

## The Four Questions

Every threat model answers these (Shostack's framework):

1. **What are we building?** — Diagram the system: components, data flows, and
   trust boundaries (where data crosses from less-trusted to more-trusted).
2. **What can go wrong?** — Enumerate threats against each component and flow.
3. **What are we going to do about it?** — Decide to mitigate, eliminate,
   transfer, or accept each risk.
4. **Did we do a good job?** — Validate the model against the real system and
   revisit it as the system changes.

## STRIDE: A Threat Checklist

STRIDE gives you categories so you do not miss classes of attack:

| Threat | Violates | Web Example |
| --- | --- | --- |
| **S**poofing | Authentication | Stealing a session cookie to impersonate a user |
| **T**ampering | Integrity | Modifying a hidden `price` field in a form |
| **R**epudiation | Non-repudiation | User denies making a transaction; no audit log |
| **I**nformation Disclosure | Confidentiality | Verbose stack traces leaking DB structure |
| **D**enial of Service | Availability | Flooding an endpoint that lacks [rate limiting](../05_Backend_Security/02_API_Protection/rate-limiting.md) |
| **E**levation of Privilege | Authorization | Normal user reaching an admin-only API |

## Trust Boundaries

A trust boundary is any point where data or control passes between zones of
different trust. In web apps the big three map directly to this encyclopedia:

- **Browser → Network** — the client is fully attacker-controllable.
- **Network → Server** — requests can be forged, replayed, or intercepted.
- **App → Dependencies / DB** — third-party code and data stores run with your
  privileges.

Anywhere you cross a boundary, validate and authorize. This is why we
[never trust the client](../05_Backend_Security/never-trust-the-client.md).

## Rating Risk

A simple, workable prioritization:

```
Risk = Likelihood × Impact
```

Fix high-likelihood, high-impact issues first (e.g. SQL injection on a login
form). Track the rest so nothing silently rots into the "later means never"
pile.

## Keep It Lightweight

Threat modeling is not a one-time 200-page document. A whiteboard diagram, a
STRIDE pass, and a short list of mitigations at the start of each feature catches
most design-level flaws — the ones that are cheapest to fix before code exists.
