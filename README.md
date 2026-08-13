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

## 🧠 Threat Modeling

Think like an attacker before they do — the four questions plus a STRIDE pass.

<div align="center">
<img src="resources/threat-modeling-flow.svg" width="100%" alt="Threat modeling four questions and STRIDE checklist" />
</div>

## 🧼 Handling Untrusted Input: Validation vs Sanitization vs Escaping

Three distinct defenses, applied at different stages — do not confuse them.

<div align="center">
<img src="resources/validation.svg" width="100%" alt="Validation: accept or reject input" />
<img src="resources/sanitization.svg" width="100%" alt="Sanitization: clean dangerous parts of input" />
<img src="resources/escaping.svg" width="100%" alt="Escaping: context-aware output encoding" />
</div>

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
│   ├── 📁 03_Cookie_Security
│   │   └── 📝 cookie-flags.md
│   ├── 🎯 04_Prototype_Pollution
│   └── 🎯 05_Clickjacking
├── 📁 03_Security_In_Transition
│   ├── 📁 CSRF_Protection
│   │   ├── 📝 csrf-attacks.md
│   │   └── 📝 csrf-defenses.md
│   ├── 🎯 01_CSRF
│   ├── 🎯 02_Web_Cache_Deception
│   ├── 🎯 03_WebSockets_Vulnerabilities
│   ├── 🎯 04_CORS
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
│   ├── 🎯 04_API_Testing
│   ├── 🎯 05_Server_Side_Vulnerabilities
│   ├── 🎯 06_SQL_Injection
│   ├── 🎯 07_Web_LLM_Attacks
│   ├── 🎯 08_Authentication_Vulnerabilities
│   ├── 🎯 09_SSRF
│   ├── 🎯 10_GraphQL_API_Vulnerabilities
│   ├── 🎯 11_Path_Traversal
│   ├── 🎯 12_NoSQL_Injection
│   ├── 🎯 13_Race_Conditions
│   ├── 🎯 14_File_Upload_Vulnerabilities
│   └── 📝 never-trust-the-client.md
├── 📄 LICENSE
└── 📝 README.md
```

> 🎯 = hands-on [PortSwigger Web Security Academy](https://portswigger.net/web-security/learning-paths)
> learning path — each folder has a README with the path link, a progress
> checklist, and space for notes.
