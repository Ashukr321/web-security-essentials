# Web Cache Deception

## What is Web Cache Deception — in Simple Words

You're logged into a website and viewing your account page (with your name, email, API keys). An attacker sends you a link like `example.com/account/settings/logo.css`. The web server ignores the fake `/logo.css` part and shows your real account page. But the **cache** (CDN sitting in front of the server) sees `.css` and thinks "oh, a static file — let me save this for everyone." Now the attacker visits the same URL and gets **your private data** straight from the cache.

**Web Cache Deception = the origin server and the cache disagree on what a URL means, and an attacker exploits that disagreement to steal cached private pages.**

## Real-World Analogy

Imagine a hospital has a rule: any document labeled "Public Notice" gets pinned to the bulletin board for everyone to see. A nurse writes your private medical report, and someone slaps a "Public Notice" sticker on the envelope. The front desk sees the sticker, pins it to the board. Anyone can now read your medical report. The nurse (origin server) knew it was private. The front desk (cache) only looked at the label (URL extension).

## How Caching Works — The Background

Before understanding the attack, you need to know why caches exist:

```
Without cache:                          With cache (CDN):

User A ──► Origin Server                User A ──► CDN ──► Origin Server
User B ──► Origin Server                           CDN saves response
User C ──► Origin Server                User B ──► CDN (serves saved copy, fast!)
                                        User C ──► CDN (serves saved copy, fast!)
3 requests hit the server               1 request hits server, 2 served from cache
```

CDNs/caches decide **what to cache** using rules like:
- URL ends in `.css`, `.js`, `.png`, `.jpg` → cache it (static asset)
- URL ends in `.html` or has no extension → don't cache (dynamic page)
- Response headers like `Cache-Control` say what to do

The problem: **the cache and the origin server may interpret the same URL differently.**

## How the Attack Works — Step by Step

```
 1. Attacker crafts a URL:
    https://example.com/account/settings/anything.css
                        ▲                  ▲
                        │                  │
                   real endpoint      fake path segment
                   (dynamic, private)  (looks like a static file)

 2. Attacker sends this link to the victim (phishing email, chat, etc.)

 3. Victim clicks the link while logged in

 4. Request reaches the ORIGIN SERVER:
    ┌─────────────────────────────────────────────────┐
    │ Server routing: /account/settings/*              │
    │ Ignores "anything.css" (wildcard / path param)   │
    │ Returns: victim's private account page           │
    │ With: name, email, tokens, personal data         │
    └─────────────────────────────────────────────────┘

 5. Response passes through the CACHE (CDN):
    ┌─────────────────────────────────────────────────┐
    │ Cache sees: URL ends in .css                     │
    │ Cache rule: .css = static asset = CACHE IT       │
    │ Cache stores the full response (private data!)   │
    └─────────────────────────────────────────────────┘

 6. Attacker visits the SAME URL (no login needed):
    https://example.com/account/settings/anything.css
    Cache serves the stored response → attacker gets victim's data
```

## The Core Problem — Path Confusion

The attack works because two systems interpret the same URL path differently:

```
URL: /account/settings/nonexistent.css

 Origin Server sees:        Cache/CDN sees:
 ┌──────────────────┐       ┌──────────────────┐
 │ Route: /account/* │       │ Extension: .css   │
 │ "nonexistent.css" │       │ Decision: static  │
 │  is just noise,   │       │  asset, cache it! │
 │  serve /account/  │       │                   │
 │  settings page    │       │                   │
 └──────────────────┘       └──────────────────┘

 Result: private page        Result: stored publicly
```

This mismatch is called **path confusion** — the origin and cache disagree about what the URL points to.

## Types of Path Confusion

### 1. Path Mapping Discrepancy

```
URL: /account/settings/anything.css

 Origin (framework routing):       Cache (extension-based):
 Maps /account/settings/*     →    Sees .css extension      →
 Ignores trailing segments         Treats as static asset
 Returns account settings page     Caches the response
```

Many frameworks (Express, Django, Spring) use pattern-based routing that ignores or accepts extra path segments. Caches classify by file extension.

### 2. Delimiter Discrepancy

Different systems treat different characters as path delimiters:

```
URL: /account/settings;anything.css

 Origin server:                    Cache:
 Treats ; as parameter delimiter   Treats ; as part of filename
 Routes to /account/settings       Sees filename ending in .css
 Returns private page              Caches it
```

Common delimiter tricks:
```
 /account;x.css        →  ; (semicolon — Java/Tomcat path parameter)
 /account%00x.css      →  %00 (null byte)
 /account#x.css        →  # (fragment — usually stripped by browser though)
 /account?x.css        →  ? (query string — parsed differently)
```

### 3. Normalization Discrepancy

```
URL: /account/settings/..%2f..%2fstatic/logo.css

 Origin server:                    Cache:
 Decodes %2f → /                   Doesn't decode (or decodes differently)
 Resolves ../.. → goes up          Sees path ending in .css
 Serves /static/logo.css (safe?)   Caches response at original URL
 OR serves /account/settings       Keys cache to encoded URL
```

The origin normalizes the path (decodes, resolves dots), but the cache stores the response under the **original, un-normalized URL**.

## What Can Be Stolen

| Data | How |
|------|-----|
| Profile info (name, email, phone) | Cache the profile/account page |
| API keys / tokens | Cache a settings or developer page |
| Session tokens (in page body) | Some apps embed tokens in HTML |
| Payment info | Cache billing page |
| Admin dashboards | Cache admin panels |
| Any authenticated page | Anything the server returns with private data |

## Why This Is "Security in Transition"

Web Cache Deception doesn't exist in either the server or cache alone. It appears when you **add a caching layer to an existing application**:

```
 Before CDN:                         After CDN:
 ┌──────┐    ┌──────────┐           ┌──────┐    ┌─────┐    ┌──────────┐
 │ User │───►│ Server   │           │ User │───►│ CDN │───►│ Server   │
 └──────┘    └──────────┘           └──────┘    └─────┘    └──────────┘
 No cache = no deception             Cache + server disagree = attack

 The same app code, zero changes,
 becomes vulnerable just by adding a CDN.
```

This is the same pattern as CORS, CSRF, and HTTPS/HSTS — **the architecture changed but the security model didn't keep up.**

## How to Prevent Web Cache Deception

### Defense 1: Cache Only Known Static Paths (Best)

Don't cache by file extension. Cache only **exact paths you know are static**:

```
 BAD:  Cache anything ending in .css .js .png
 GOOD: Cache only /static/* and /assets/* (known safe directories)
```

### Defense 2: Use Cache-Control Headers

The origin server should explicitly mark private pages:

```
Cache-Control: no-store, private

 private   → CDN must NOT cache (only browser can)
 no-store  → Don't cache at all, anywhere
```

### Defense 3: Normalize Paths at the Cache Layer

Make the cache normalize URLs the same way the origin does before making caching decisions:

```
 Request:    /account/settings/fake.css
 Normalize:  Strip unknown trailing segments
 Cache key:  /account/settings (not cacheable → pass through)
```

### Defense 4: Strip or Reject Unexpected Path Segments

If the server routes `/account/settings` and receives `/account/settings/garbage.css`, return 404 instead of serving the page:

```
 /account/settings          → 200 OK (serve page)
 /account/settings/x.css    → 404 Not Found (strict routing)
```

### Defense Priority

```
Best ──► Cache only explicit static paths, not by extension
  +
Good ──► Cache-Control: no-store, private on all authenticated pages
  +
Extra ─► Normalize URLs identically at cache and origin
  +
Belt ──► Strict routing — reject URLs with unexpected trailing segments
```

## Quick Checklist

- [ ] CDN caches only known static directories (`/static/*`, `/assets/*`)
- [ ] All authenticated pages send `Cache-Control: no-store, private`
- [ ] Server returns 404 for unexpected path segments after dynamic routes
- [ ] Cache and origin normalize URLs the same way (decoding, dot resolution)
- [ ] Cache keys include the `Cookie` or `Authorization` header (Vary header)
- [ ] Regular audits: request `/sensitive-page/test.css` and check if it caches

## Interview Quick-Fire

| Question | Answer |
|----------|--------|
| What is Web Cache Deception? | Tricking a cache into storing a private page by making the URL look like a static asset |
| Why does it work? | Origin server and cache interpret the same URL differently (path confusion) |
| What is path confusion? | When two systems (server routing vs cache rules) disagree on what a URL points to |
| Can the attacker read private data? | Yes — unlike CSRF, this is a **read** attack. The cached private page is served to anyone |
| What's the simplest fix? | `Cache-Control: no-store, private` on all authenticated responses |
| How is it different from cache poisoning? | Deception caches a **legitimate but private response**. Poisoning injects **malicious content** into the cache |
| Does HTTPS prevent it? | No — the cache is usually between the CDN and origin, both on HTTPS. The issue is caching logic, not transport |
| Which layer is responsible? | Neither alone — the vulnerability exists in the **gap** between origin routing and cache classification |

## Web Cache Deception vs Web Cache Poisoning

```
 Cache Deception:                    Cache Poisoning:
 ┌────────────────────┐              ┌────────────────────┐
 │ Caches a REAL but   │              │ Caches a MODIFIED   │
 │ PRIVATE response    │              │ MALICIOUS response  │
 │                     │              │                     │
 │ Goal: steal data    │              │ Goal: serve malware │
 │                     │              │ or deface content   │
 │ Victim visits the   │              │ Attacker poisons    │
 │ crafted URL         │              │ the cache directly  │
 └────────────────────┘              └────────────────────┘
```

## Key Takeaway

Web Cache Deception works because caches and origin servers speak different languages when reading a URL. The cache sees a file extension and thinks "static, cache it." The server sees a route pattern and thinks "dynamic, serve the user's data." The attacker exploits this disagreement to make the cache store private pages that anyone can then retrieve. The fix: never let the cache guess — explicitly tell it what's cacheable with proper `Cache-Control` headers and cache only known static paths.
