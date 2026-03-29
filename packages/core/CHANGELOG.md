# @odysseon/whoami-core

## 4.0.0

### Major Changes

- 7facf91: Ship the feature-first core API for accounts, authentication, and receipts, add feature-layer tests, and include an Express example app that consumes the public core exports.

  Remove the legacy facade and interface surface from `@odysseon/whoami-core`, and migrate all first-party adapters to the new contracts:
  - `@odysseon/whoami-adapter-argon2` now implements `PasswordHasher`
  - `@odysseon/whoami-adapter-jose` now provides receipt signing and verification
  - `@odysseon/whoami-adapter-webcrypto` now implements `DeterministicStringHasher`
  - `@odysseon/whoami-adapter-nestjs` now centers on receipt verification, route protection, and domain error translation

## 3.0.0

### Major Changes

- d961d66: resolve covariant types

## 2.0.0

### Major Changes

- d986e71: - Change: Migrated from `tsc` to `tsup` with dual CJS/ESM output
  - Impact: New exports field structure with separate require and import paths
  - Semver: Major (breaking change to module resolution)

## 1.0.0

### Major Changes

- 2a70ab2: - **Contract Purity:** Removed all Google-specific interfaces and ports. OAuth is now handled via a generic `IOAuthUserRepository` and `IOAuthCredentials` contract.
  - **Repository Segregation:** Renamed `IEmailUserRepository` to `IPasswordUserRepository` and updated all methods to use Parameter Objects to prevent argument-order errors.
  - **Service Refactor:** `WhoamiService` is now a Facade. Internal logic has been moved to specialized sub-services.
  - **Config Schema:** `configuration.authMethods.googleOAuth` renamed to `configuration.authMethods.oauth`.

## 0.5.0

### Minor Changes

- 5978258: Add configurable credentials and Google OAuth support to `whoami-core`, make refresh tokens optional with status reporting, and extend the NestJS adapter with matching controller routes, wiring, and service exports for override-friendly apps.

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
