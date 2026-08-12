<div align="center">

# 🛡️ Web Security Mastry
### A Comprehensive Lab for Web Vulnerabilities & Defensive Engineering

<img src="https://images.unsplash.com/photo-1632910138458-5bf601f3835e?q=80&w=1631&auto=format&fit=crop" width="100%" height="250px" style="object-fit: cover; border-radius: 10px;" />

**Building Secure Systems for the Modern Web**
</div>

## 🗺️ Security Zones

Every topic in this repo maps to one of three trust zones — the **frontend**
(browser), the **transition** (network), and the **backend** (server). Data
crosses a trust boundary at every arrow, and that is where it must be validated
and authorized.

<div align="center">
<img src="resources/web-security-flow.svg" width="100%" alt="Web security three trust zones flow diagram" />
</div>

New here? Start with [why-security-matters](01_Introduction/why-security-matters.md),
then [security-overview](01_Introduction/security-overview.md) and
[threat-modeling](01_Introduction/threat-modeling.md).

## 📚 Repository Structure

```bash
├── 📁 01_Introduction
│   ├── 📝 security-overview.md
│   ├── 📝 threat-modeling.md
│   └── 📝 why-security-matters.md
├── 📁 02_Client_Side_Security
│   ├── 📁 01_XSS_Vulnerabilities
│   │   ├── 📝 dom-based-xss.md
│   │   ├── 📝 reflected-xss.md
│   │   └── 📝 stored-xss.md
│   ├── 📁 02_Defense_Mechanisms
│   │   └── 📁 XSS_Vulnerabilities
│   │       ├── 📝 csp-policy.md
│   │       ├── 📝 safe-rendering.md
│   │       └── 📝 validation-vs-sanitization-vs-escaping.md
│   └── 📁 03_Cookie_Security
│       └── 📝 cookie-flags.md
├── 📁 03_Security_In_Transition
│   ├── 📁 CSRF_Protection
│   │   ├── 📝 csrf-attacks.md
│   │   └── 📝 csrf-defenses.md
│   ├── 📝 cors-policy.md
│   └── 📝 https-and-hsts.md
├── 📁 04_Third_Party_Risks
│   └── 📝 supply-chain-attacks.md
├── 📁 05_Backend_Security
│   ├── 📁 01_SQL_Injection
│   │   ├── 📝 sql-defenses.md
│   │   └── 📝 sql-injection-basics.md
│   ├── 📁 02_API_Protection
│   │   ├── 📝 error-handling.md
│   │   └── 📝 rate-limiting.md
│   ├── 📁 03_Data_Storage
│   │   ├── 📝 password-hashing.md
│   │   └── 📝 secure-storage.md
│   └── 📝 never-trust-the-client.md
├── 📄 LICENSE
└── 📝 README.md
```
