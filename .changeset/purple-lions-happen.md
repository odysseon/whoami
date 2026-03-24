---
"@odysseon/whoami-adapter-webcrypto": minor
---

**New Package:** `@odysseon/whoami-adapter-webcrypto` — A deterministic token hashing adapter using native Web Crypto API.

- **SHA-256 hashing** via `globalThis.crypto.subtle` (Node.js 20+, Deno, Bun, browsers)
- **Deterministic** — same input produces same output for consistent token verification
- **Constant-time comparison** for timing attack defense without `node:crypto` dependency
- **Fast precheck** validates hex format (64 chars) before computing hash

- Rejects empty tokens with explicit error
- Validates hash format before verification to prevent unnecessary computation
- Implements constant-time string comparison to mitigate timing attacks
- Returns `false` early for invalid hash formats or empty tokens
