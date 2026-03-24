# @odysseon/whoami-core

## 0.4.0

### Minor Changes

- c7731b5: **Package Refactoring:** Extracted `WebCryptoTokenHasher` from core into a dedicated adapter package.

  **Removed from `@odysseon/whoami-core`:**
  - `src/adapters/security/webcrypto-token-hasher.adapter.ts`
  - `src/adapters/security/webcrypto-token-hasher.adapter.spec.ts`
  - Export of `WebCryptoTokenHasher` from core's `index.ts`

  **Moved to:** `@odysseon/whoami-adapter-webcrypto` (new package)
  - Improves modularity by separating adapter implementations from core business logic
  - Core package now focuses on domain logic and interfaces
  - Adapters are optional and can be installed as needed
  - Follows the plugin architecture pattern established by `adapter-jose` and `adapter-argon2`
  - Consumers who need WebCrypto hashing must now install `@odysseon/whoami-adapter-webcrypto` separately
  - Core package becomes lighter with fewer dependencies

### Patch Changes

- da11601: - **Input validation**: Added checks to reject empty/whitespace-only passwords in registration and login flows, with early exit to prevent unnecessary repository calls.

## 0.3.0

### Minor Changes

- ee6fcb0: Added Argon2PasswordHasher adapter utilizing native argon2 for secure, salted password hashing.
- 6d15ddb: Refactor: Removed all Node-dependent cryptographic adapters (Argon2 and Jose) from the core package to ensure it is completely framework-agnostic and edge-compatible.

## 0.2.0

### Minor Changes

- 4b28d73: Added the JoseTokenSigner adapter utilizing the lightweight `jose` library for native Web Crypto JWT generation and verification.
- 01a2345: Added CryptoTokenHasher adapter using native Node.js crypto for deterministic refresh token hashing
