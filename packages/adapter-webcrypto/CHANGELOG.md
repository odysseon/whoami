# @odysseon/whoami-adapter-webcrypto

## 11.0.0-dev.2

### Patch Changes

- Updated dependencies [7408441]
  - @odysseon/whoami-core@12.0.0-dev.2

## 11.0.0-dev.1

### Patch Changes

- Updated dependencies [82db1e2]
- Updated dependencies [9d6b1db]
  - @odysseon/whoami-core@12.0.0-dev.1

## 11.0.0-dev.0

### Major Changes

- 5254b01: - Add SecureTokenPort interface for cryptographically secure token operations
  - Inject SecureTokenPort into MagicLinkModule and PasswordModule
  - Remove direct Web Crypto calls from use cases (now behind port boundary)
  - Rename WebCryptoTokenHasher → WebCryptoSecureTokenAdapter
  - Implement full SecureTokenPort (generateToken + hashToken)
  - Use base64url encoding (RFC 4648 §5) instead of hex
  - Generate 256-bit (32-byte) secure tokens
  - Migrate build from tsup to native TypeScript (ESM + CJS)
  - Reset version to 1.0.0 for new package lifecycle
  - Add DOM lib for Web Crypto API type definitions

### Patch Changes

- Updated dependencies [5254b01]
- Updated dependencies [5254b01]
- Updated dependencies [5254b01]
  - @odysseon/whoami-core@12.0.0-dev.0

## 11.0.0-alpha.0

### Patch Changes

- Updated dependencies
  - @odysseon/whoami-core@11.0.0-alpha.0

## 10.0.0

### Patch Changes

- Updated dependencies [f0808d8]
- Updated dependencies [f0808d8]
- Updated dependencies [28cfb75]
- Updated dependencies [19cffd7]
  - @odysseon/whoami-core@10.0.0

## 0.0.0-beta.1

### Patch Changes

- Updated dependencies [19cffd7]
  - @odysseon/whoami-core@0.0.0-beta.1

## 0.0.0-beta.0

### Patch Changes

- Updated dependencies [28cfb75]
  - @odysseon/whoami-core@0.0.0-beta.0

## 0.0.0-dev-20260408132748

### Minor Changes

- 2a97f79: - **Breaking Change**: Bifurcated the public API surface. [cite_start]Moved concrete use-case classes to the `@odysseon/whoami-core/internal` entry point to prevent implementation leakage [cite: 82, 86-87, 103].
  - [cite_start]Standardized the main index to export only shared primitives, domain entities, ports, and the `createAuth` factory [cite: 83-91, 96].
  - [cite_start]**Feature**: Introduced the `AUTH_METHODS` DI token, allowing the full auth facade to be injected directly into services [cite: 61-63, 72].

### Patch Changes

- Updated dependencies [2a97f79]
  - @odysseon/whoami-core@0.0.0-dev-20260408132748

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
