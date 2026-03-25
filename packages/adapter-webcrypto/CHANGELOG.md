# @odysseon/whoami-adapter-webcrypto

## 2.0.0

### Patch Changes

- Updated dependencies [5978258]
  - @odysseon/whoami-core@0.5.0

## 1.0.0

### Minor Changes

- c7731b5: **New Package:** `@odysseon/whoami-adapter-webcrypto` — A deterministic token hashing adapter using native Web Crypto API.
  - **SHA-256 hashing** via `globalThis.crypto.subtle` (Node.js 20+, Deno, Bun, browsers)
  - **Deterministic** — same input produces same output for consistent token verification
  - **Constant-time comparison** for timing attack defense without `node:crypto` dependency
  - **Fast precheck** validates hex format (64 chars) before computing hash
  - Rejects empty tokens with explicit error
  - Validates hash format before verification to prevent unnecessary computation
  - Implements constant-time string comparison to mitigate timing attacks
  - Returns `false` early for invalid hash formats or empty tokens

### Patch Changes

- Updated dependencies [c7731b5]
- Updated dependencies [da11601]
  - @odysseon/whoami-core@0.4.0
