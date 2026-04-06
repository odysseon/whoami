# @odysseon/whoami-adapter-webcrypto

## 8.0.0

### Patch Changes

- Updated dependencies [d4e597b]
- Updated dependencies [ba4a6f5]
- Updated dependencies [140fc3d]
- Updated dependencies [92e265d]
  - @odysseon/whoami-core@5.0.0

## 7.0.0

### Major Changes

- 7facf91: Ship the feature-first core API for accounts, authentication, and receipts, add feature-layer tests, and include an Express example app that consumes the public core exports.

  Remove the legacy facade and interface surface from `@odysseon/whoami-core`, and migrate all first-party adapters to the new contracts:
  - `@odysseon/whoami-adapter-argon2` now implements `PasswordHasher`
  - `@odysseon/whoami-adapter-jose` now provides receipt signing and verification
  - `@odysseon/whoami-adapter-webcrypto` now implements `DeterministicStringHasher`
  - `@odysseon/whoami-adapter-nestjs` now centers on receipt verification, route protection, and domain error translation

### Patch Changes

- Updated dependencies [7facf91]
  - @odysseon/whoami-core@4.0.0

## 6.0.0

### Major Changes

- d961d66: resolve covariant types

### Patch Changes

- Updated dependencies [d961d66]
  - @odysseon/whoami-core@3.0.0

## 5.0.0

### Major Changes

- 25785d9: Add CJS support

## 4.0.0

### Patch Changes

- Updated dependencies [d986e71]
  - @odysseon/whoami-core@2.0.0

## 3.0.0

### Patch Changes

- Updated dependencies [2a70ab2]
  - @odysseon/whoami-core@1.0.0

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
