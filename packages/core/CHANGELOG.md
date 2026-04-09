# @odysseon/whoami-core

## 0.0.0-beta.0

### Major Changes

- 28cfb75: Bifurcate public/internal API surface and promote NestJS adapter to a global module

## 0.0.0-dev-20260408132748

### Major Changes

- 2a97f79: - **Breaking Change**: Bifurcated the public API surface. [cite_start]Moved concrete use-case classes to the `@odysseon/whoami-core/internal` entry point to prevent implementation leakage [cite: 82, 86-87, 103].
  - [cite_start]Standardized the main index to export only shared primitives, domain entities, ports, and the `createAuth` factory [cite: 83-91, 96].
  - [cite_start]**Feature**: Introduced the `AUTH_METHODS` DI token, allowing the full auth facade to be injected directly into services [cite: 61-63, 72].

## 5.0.0

### Major Changes

- ba4a6f5: Removed Magic-Link authentication support to focus on Password and OAuth providers.
  Finalized the `createAuth` factory with improved internal use-case composition.
  Standardized workspace-wide TypeScript configurations and added new example implementation packages.
- 140fc3d: Introduced a plugin-based authentication architecture and added full OAuth support.
  - Refactored `createAuth` to support modular configuration for password and OAuth strategies.
  - Added `authenticateWithOAuth` and `linkOAuthToAccount` methods.
  - Added support for adding/removing authentication methods with safety guards against "orphaned" accounts.
  - Updated registration and login flows to consistently return authentication receipts.
  - Moved and standardized authentication types in a dedicated `types.ts` file.

### Minor Changes

- d4e597b: Refactored authentication use cases to use structured input objects and moved callback handlers to the core library.
  - Moved `OAuthCallbackHandler` from NestJS adapter to core to make it framework-agnostic.
  - Introduced `PasswordCallbackHandler` and `MagicLinkCallbackHandler` in core.
  - Changed `VerifyPasswordUseCase.execute` to accept a `VerifyPasswordInput` object instead of positional arguments.
  - Standardized NestJS `WhoamiOAuthModule` to act as a DI wrapper for core handlers.

- 92e265d: - Added one-time use enforcement for magic-link authentication to prevent replay attacks.
  - Introduced stable machine-readable error codes across all domain errors to improve error handling in consumers.
  - Enhanced authentication use cases with detailed warning logs for failed verification attempts.
  - Updated CredentialStore port to support `deleteByEmail`.

## 4.0.0

### Major Changes

- 7facf91: Ship the feature-first core API for accounts, authentication, and receipts, add feature-layer tests, and include an Express example app that consumes the public core exports.

  Remove the legacy facade and interface surface from `@odysseon/whoami-core`, and migrate all first-party adapters to the new contracts:
  - `@odysseon/whoami-adapter-argon2` now implements `PasswordManager`
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
  - `src/adapters/security/webcrypto-token-passwordManager.adapter.ts`
  - `src/adapters/security/webcrypto-token-passwordManager.adapter.spec.ts`
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

- ee6fcb0: Added Argon2PasswordManager adapter utilizing native argon2 for secure, salted password hashing.
- 6d15ddb: Refactor: Removed all Node-dependent cryptographic adapters (Argon2 and Jose) from the core package to ensure it is completely framework-agnostic and edge-compatible.

## 0.2.0

### Minor Changes

- 4b28d73: Added the JoseTokenSigner adapter utilizing the lightweight `jose` library for native Web Crypto JWT generation and verification.
- 01a2345: Added CryptoTokenHasher adapter using native Node.js crypto for deterministic refresh token hashing
