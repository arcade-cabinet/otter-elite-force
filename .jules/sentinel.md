## 2024-05-23 - Client-Side Data Security via CSP
**Vulnerability:** Lack of Content Security Policy (CSP) in a client-side game using `localStorage` for persistence.
**Learning:** Even without a traditional backend, client-side games are vulnerable to XSS. If an attacker can inject a script (e.g., via a compromised third-party library or reflected XSS if URL parameters were used dangerously), they could access `localStorage` and modify or delete save data (the "persistence" layer).
**Prevention:** Implementing a strict CSP that only allows scripts from 'self' effectively mitigates this risk by preventing the execution of unauthorized scripts, thus protecting the integrity of the client-side database.
