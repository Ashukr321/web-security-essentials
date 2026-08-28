# Third-Party Risks & Supply Chain Attacks

**Level:** Practitioner  
**Topics:** npm supply chain, dependency confusion, typosquatting, CDN risks, SRI, third-party scripts, Magecart

## What Are Supply Chain Attacks?

Instead of attacking your application directly, the attacker compromises something your application depends on — a package, a CDN, a build tool, a third-party script. Your code doesn't change, but what it loads does.

This is the software equivalent of poisoning the water supply instead of poisoning individual glasses.

## Why This Matters

- The average web app loads **30+ third-party scripts** (analytics, ads, chat widgets, A/B testing, payment processors)
- The average Node.js project has **hundreds of transitive dependencies**
- Each dependency is a trust decision: you're running someone else's code with your users' data
- One compromised package can affect thousands of downstream applications simultaneously

## Attack Vectors

### 1. npm Package Compromise

**Account takeover**: Attacker gains access to a maintainer's npm account (phished credentials, leaked token, no 2FA) and publishes a malicious version.

**Real incidents:**
- `event-stream` (2018) — maintainer handed off ownership to attacker who added crypto-stealing code. 8M weekly downloads.
- `ua-parser-js` (2021) — hijacked account pushed cryptominer. 7M weekly downloads.
- `colors` and `faker` (2022) — maintainer intentionally sabotaged their own packages.

### 2. Dependency Confusion

Attacker publishes a public package with the same name as a private/internal package. If the package manager checks the public registry first (or alongside), it may install the attacker's version instead.

```
Your private registry: @company/auth-utils v1.2.0
Public npm:            auth-utils v99.0.0  ← attacker publishes this
                       (higher version wins)
```

**Real incidents:** Alex Birsan's 2021 research compromised Apple, Microsoft, PayPal, Tesla, Uber using this technique.

### 3. Typosquatting

Attacker publishes packages with names similar to popular ones:
- `lodash` → `1odash`, `lodahs`, `loadash`
- `cross-env` → `crossenv` (2017 — actually happened, stole env vars)

### 4. CDN Compromise / Manipulation

Loading scripts from a CDN means trusting that CDN operator and their infrastructure:
```html
<script src="https://cdn.example.com/lib.js"></script>
```
If the CDN is compromised, every site loading that script is compromised. No code change on your end.

### 5. Magecart / Third-Party Script Attacks

Injecting card-skimming code into e-commerce checkout pages via:
- Compromised third-party analytics/marketing scripts
- Compromised tag managers (one tag manager = access to every script on the page)
- Compromised payment form iframes

**Real incidents:** British Airways (2018), Ticketmaster (2018), thousands of Magento stores.

### 6. Build Pipeline Attacks

Compromising CI/CD tools, build plugins, or GitHub Actions:
- Malicious GitHub Action reads secrets during build
- Compromised Webpack/Babel plugin injects code at build time
- Stolen CI tokens used to push malicious releases

**Real incident:** Codecov (2021) — compromised bash uploader script exfiltrated CI environment variables (secrets, tokens) from thousands of companies for 2 months.

### 7. Protestware / Maintainer Sabotage

Maintainers intentionally breaking their own packages for political or personal reasons:
- `colors` / `faker` (2022) — infinite loop added
- `node-ipc` (2022) — wiped files on Russian/Belarusian IPs
- `peacenotwar` — similar geopolitical targeting

## Defenses

### Package Management

| Defense | What It Does |
|---------|-------------|
| **Lock files** (`package-lock.json`, `yarn.lock`) | Pin exact versions + integrity hashes. Prevents silent upgrades |
| **`npm audit`** | Scans dependencies for known vulnerabilities |
| **Scoped packages** (`@company/pkg`) | Prevents dependency confusion by namespacing |
| **`.npmrc` registry config** | Force private packages to resolve from your private registry |
| **Renovate / Dependabot** | Automated PRs for dependency updates — review diffs |
| **Socket.dev / Snyk** | Detect suspicious package behavior (install scripts, network access) |
| **`--ignore-scripts`** | Prevent packages from running arbitrary code on install |

### Third-Party Scripts

| Defense | What It Does |
|---------|-------------|
| **Subresource Integrity (SRI)** | `<script integrity="sha384-...">` — browser verifies hash before executing |
| **Content Security Policy (CSP)** | Whitelist which domains can serve scripts |
| **Sandboxed iframes** | Isolate third-party widgets from your DOM |
| **Tag manager review** | Audit what scripts your tag manager loads |
| **Self-hosting** | Copy third-party scripts to your own infrastructure |

### Build Pipeline

| Defense | What It Does |
|---------|-------------|
| **Pin GitHub Actions by commit SHA** | `uses: actions/checkout@abc123` not `@v3` |
| **Least-privilege CI tokens** | Minimal permissions, short-lived |
| **Reproducible builds** | Same source → same output, verifiable |
| **SLSA framework** | Supply chain Levels for Software Artifacts — provenance verification |

## Subresource Integrity (SRI) in Detail

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
```

1. Browser downloads the script
2. Computes SHA-384 hash of the content
3. Compares with the `integrity` attribute
4. If mismatch → **script is not executed** (network error)

Generate SRI hashes:
```bash
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
# or use https://www.srihash.org/
```

## Files

- [supply-chain-attacks.md](supply-chain-attacks.md) — Deep dive into attack mechanics and case studies
- [supply-chain-visualization.html](supply-chain-visualization.html) — Interactive supply chain attack visualization
