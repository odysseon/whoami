# @odysseon/whoami-core

## 12.0.0-dev.1

### Minor Changes

- 9d6b1db: **New Package:** `@odysseon/whoami-adapter-prisma`
  - Implements all five credential stores (Account, PasswordHash, PasswordResetToken, OAuthCredential, MagicLinkToken)
  - Schema fragment approach with postinstall merge script
  - No build-time dependency on `@prisma/client` (uses structural typing)
  - Works with Prisma 5, 6, and 7
  - Includes `createPrismaAdapters()` factory for easy wiring

  **Example Express Updates:**
  - Migrates from in-memory to Prisma-backed stores
  - Adds MagicLinkModule with request/verify endpoints
  - Includes Prisma 7+ setup with PostgreSQL and migrations
  - Requires `DATABASE_URL` environment variable

  **Documentation:**
  - Migration guide from in-memory to Prisma
  - Relationship patterns between Account and User models

### Patch Changes

- 82db1e2: **Password Module**
  - `PasswordCredentialStore` has been split into two separate ports:
    - `PasswordHashStore` — manages password hash credentials (unique per account, permanent)
    - `PasswordResetTokenStore` — manages password reset tokens (many per account, short-lived, expirable)
  - If you implemented `PasswordCredentialStore`, you must now implement both `PasswordHashStore` and `PasswordResetTokenStore`
  - The `deleteAllResetCredentialsForAccount` and `deleteExpiredResetCredentials` methods moved to `PasswordResetTokenStore`

  **MagicLink Module**
  - `MagicLinkCredentialStore` renamed to `MagicLinkTokenStore` (reflects that magic links are transient tokens)

  Separating hash storage from token storage resolves a fundamental design conflict where a single store was forced to manage both permanent credentials and transient tokens with incompatible invariants:
  - Hash store: at most ONE record per accountId (unique constraint required)
  - Token store: MANY records per accountId allowed (no unique constraint)

  ```diff
  - const password = PasswordModule({
  -   passwordStore: myPasswordStore,
  -   // ...
  - });

  + const password = PasswordModule({
  +   passwordHashStore: myPasswordHashStore,
  +   resetTokenStore: myPasswordResetTokenStore,
  +   // ...
  + });

  - const magiclink = MagicLinkModule({
  -   magicLinkStore: myMagicLinkStore,
  -   // ...
  - });

  + const magiclink = MagicLinkModule({
  +   magicLinkStore: myMagicLinkTokenStore,  // same interface, renamed
  +   // ...
  + });
  ```

## 12.0.0-dev.0

### Major Changes

- 5254b01: **Core API Removal**
  - `createAuth` factory function removed — applications now compose modules directly
  - `AuthConfig`, `AuthMethods`, `CoreAuthMethods` types removed
  - No central composition layer — each module can be used independently

  **AuthModule Interface Redesign**
  - Removed generic `TMethods` parameter and `methods` property
  - Module factories return `Methods & AuthModule` intersection type
  - `removeAllCredentialsForAccount` now accepts optional provider filter
  - `AuthOrchestrator` handles filtering generically (no per-module conditionals)

  **Export Changes**
  - Root export now only contains kernel + modules (no composition layer)
  - New `/internal` sub-path for adapter authors (use-case classes only)
  - All type casts replace `as unknown as AccountId` with `createAccountId` factory

  **SecureTokenPort**
  - New port for platform-agnostic cryptographic token operations
  - `generateToken()` — 256-bit secure random tokens
  - `hashToken()` — SHA-256 hashing with base64url encoding
  - All module deserializers now use helper functions (`assertObject`, `credentialProof`)
  - Verification script expanded to 13 checks (type safety, module independence, build)
  - Better non-null assertion detection in code quality checks

  ```typescript
  // v11: Centralized factory
  import { createAuth } from '@odysseon/whoami-core';
  const auth = createAuth({ password: {...}, oauth: {...} });

  // v12: Direct application composition
  import { PasswordModule, OAuthModule } from '@odysseon/whoami-core';
  import { AuthOrchestrator } from '@odysseon/whoami-core/kernel';

  const password = PasswordModule({ ... });
  const oauth = OAuthModule({ ... });
  const orchestrator = new AuthOrchestrator([password, oauth]);

  // Use methods directly from modules
  await password.registerWithPassword({ email, password });
  await oauth.authenticateWithOAuth({ provider, providerId, email });

  // Use orchestrator for cross-module operations
  await orchestrator.removeAuthMethod(accountId, "oauth", { provider: "google" });
  ```

- 5254b01: - `createAuth` now accepts `modules` array instead of flat `password`/`oauth` config keys
  - Removed deprecated top-level module configuration (password, oauth)
  - Removed sub-path exports (`/password`, `/oauth`, `/magiclink`) - all exports now from root
  - Removed internal API entry point (`/internal`) - use direct imports from root
  - `AccountId` now accepts only string (removed number support)
  - `IdGeneratorPort` now returns string only (no number)
  - Value objects now use branded types with factory functions:
    - `createAccountId()`, `isAccountId()` instead of `new AccountId()`
    - `createEmailAddress()`, `isEmailAddress()` instead of `new EmailAddress()`
    - `createCredentialId()`, `isCredentialId()` instead of `new CredentialId()`
  - Domain errors now have `statusCode` property and `toJSON()` serialization
  - `WrongCredentialTypeError` now maps to 500 (server error) instead of 400
  - `PasswordCredentialStore.save()` no longer requires email parameter
  - Removed `findByEmail()` from `PasswordCredentialStore` (use `findByAccountId`)
  - Password recovery now lives INSIDE password module (no orphaned module)
  - Added `RequestPasswordResetUseCase`, `VerifyPasswordResetUseCase`
  - `OAuthCredentialStore` now requires `countForAccount()` method
  - Removed `OAuthCredential` wrapper class (use kernel Credential directly)
  - `WhoamiModule` now accepts `modules` array in config
  - `AUTH_METHODS` token now returns `AnyAuthMethods` type
  - Added `VERIFY_RECEIPT` token for receipt verifier
  - `WhoamiAuthGuard` now injects `ReceiptVerifier` port directly
  - Added `AuthModule` interface for vertical slice modules
  - Added `AuthOrchestrator` for coordinating multiple auth modules
  - Added `CompositeDeserializer` for runtime credential proof assembly
  - Zero kernel changes required to add new auth methods
  - Complete passwordless email authentication module
  - Secure token generation (256-bit crypto.randomUUID)
  - SHA-256 token hashing (never store plaintext)
  - Single-use enforcement with used tracking
  - Auto-registration for new email addresses
  - Password reset flow now inside password module
  - Cryptographically secure reset tokens
  - Token hashing and expiration
  - Single-use enforcement
  - All modules are completely independent (no cross-module imports)
  - Kernel has zero external dependencies
  - Added verification script (11 checks) for code quality
  - Better error codes and HTTP status mapping
  - Improved type safety with branded types
  - Reduced bundle size through better tree-shaking

### Minor Changes

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

## 11.2.0

### Minor Changes

- b1777a4: This release completely decouples the identity kernel from specific authentication methods by replacing the rigid `CredentialProof` union type with an open interface.

  **Architectural Improvements**
  - **Open Proof Interface:** The kernel now treats all credential proofs as opaque. Pluggable authentication methods can now define their own proofs that satisfy the `CredentialProof` port without requiring modifications to kernel types.
  - **Module-Owned Deserialization:** Introduced `CompositeDeserializer` to handle dynamic proof rehydration. The `PasswordModule` and `OAuthModule` now supply their own `proofDeserializer` functions, allowing infrastructure adapters to reconstruct proofs without hardcoding module dependencies.
  - **Encapsulated Domain Wrappers:** Kernel `Credential` entities no longer expose module-specific typed getters (e.g., `passwordHash` or `oauthProvider`). Type narrowing and validation are now strictly isolated to the module-level domain wrappers (`PasswordCredential`, `OAuthCredential`).

## 11.1.0

### Minor Changes

- 98e4524: This release introduces the foundational, non-breaking architectural changes required for the upcoming v12.0.0 open-proof model. The focus is strictly on improving tree-shaking and enforcing module isolation.

  **Features & Improvements**
  - **Sub-path Exports:** Added `@odysseon/whoami-core/password` and `@odysseon/whoami-core/oauth` entry points. Consumers can now import auth modules selectively, ensuring no unused authentication logic or dependencies are included in the final bundle.
  - **Build Optimization:** The build pipeline has been reconfigured to emit isolated chunks for each sub-path.

  **Deprecations (Migration runway for v12.0.0)**
  - **Flat Configuration:** Configuring auth modules via top-level keys (`password`, `oauth`) in `createAuth()` is deprecated. A runtime warning is now emitted to guide consumers toward the explicit `modules: [...]` injection array pattern planned for v12.
  - **Root Barrel Imports:** Importing module-specific configs, methods, or ports from the root `@odysseon/whoami-core` barrel is deprecated. Consumers should migrate to importing these exclusively from their respective module sub-paths.

## 11.0.0

### Major Changes

- 343561f: - **`RemoveAuthMethodUseCase`** - Removes password or OAuth credentials from an account while enforcing the "last credential" invariant (account must always retain at least one authentication method)
  - **`AuthMethod`** - Union type `"password" | "oauth"` for runtime auth method introspection (`shared/domain/auth-method.ts`)

  **Removed properties:**
  - `tokenSigner: IssueReceiptUseCase`
  - `verifyReceipt: VerifyReceiptUseCase`

  **Added properties:**
  - `receiptSigner: ReceiptSigner` - Port for signing receipts
  - `receiptVerifier: ReceiptVerifier` - Port for verifying receipts
  - `tokenLifespanMinutes?: number` - Optional, defaults to 60
  - **`RemovePasswordInput.credentialId`** - Changed from `string` to `CredentialId` (value object)
  - **`RemovePasswordUseCase`** - No longer throws `InvalidCredentialIdError` (validation removed)
  - **`RegisterWithPasswordDeps.issueReceipt`** - Changed from `IssueReceiptUseCase` to `Pick<IssueReceiptUseCase, "execute">`

  Authentication use cases moved from root to `application/` subdirectory:

  | Old Path                                                   | New Path                                                               |
  | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
  | `features/authentication/add-password-auth.usecase.ts`     | `features/authentication/application/add-password-auth.usecase.ts`     |
  | `features/authentication/authenticate-oauth.usecase.ts`    | `features/authentication/application/authenticate-oauth.usecase.ts`    |
  | `features/authentication/authenticate-password.usecase.ts` | `features/authentication/application/authenticate-password.usecase.ts` |

  Any code importing these use cases directly from the old paths will break.
  - `createAuth` factory now instantiates `IssueReceiptUseCase` and `VerifyReceiptUseCase` internally (no longer requires them as arguments)
  - `removeAuthMethod` logic extracted from factory into `RemoveAuthMethodUseCase` (~80 lines removed from factory)
  - Authentication use cases now imported directly, not from `internal/index.ts`
  - `OAuthCredentialStore` - Documented immutability contract (no update method; delete + create for migrations)
  - `TokenHasher` - Clarified as convenience port (not used internally by core)
  - `LinkOAuthToAccountDeps.verifyReceipt` - Improved JSDoc
  - `UpdatePasswordDeps.verifyReceipt` - Improved JSDoc

  Changed from value imports to `type` imports where appropriate:
  - `CredentialId`, `PasswordCredentialStore` in `remove-password.usecase.ts`
  - Multiple imports in `types.ts`
  - `Receipt` in `register-password.usecase.ts`

  **New exports:**
  - `AuthMethod` from `shared/index.ts` and re-exported from `types.ts`
  - `RemoveAuthMethodUseCase` in `internal/index.ts`

  **Updated exports:**
  - `AuthenticateOAuthInput` path corrected in root `index.ts`
  - Authentication feature `index.ts` now exports from `application/` subdirectory
  - OAuth auto-registration includes compensating action: deletes orphaned account if credential save fails
  - `UpdatePasswordUseCase` and `LinkOAuthToAccountUseCase` now import `VerifyReceiptUseCase` from `receipts/application/` (not root `receipts/index.js`)

### Patch Changes

- efc9136: Hardened the domain layer and cleaned up legacy use-case paths.
  - **Internal API Change**: Updated `PasswordCredentialStore.save` to require the `EmailAddress`. This allows infrastructure implementations to maintain efficient email-to-credential lookup indexes .
  - **Refactor**: Switched manual string normalization in `LinkOAuthToAccountUseCase` to use `EmailAddress` Value Object equality.
  - **Cleanup**: Removed deprecated files and the redundant `RegisterAccountUseCase`.
  - **DX**: Added comprehensive unit tests for `Credential`, `Receipt`, and Value Objects using the native Node.js test runner.

- fe6abbf: Significant architectural hardening focused on Interface Segregation (ISP) and role-based dependency injection.

## 11.0.0-alpha.1

### Patch Changes

- efc9136: Hardened the domain layer and cleaned up legacy use-case paths.
  - **Internal API Change**: Updated `PasswordCredentialStore.save` to require the `EmailAddress`. This allows infrastructure implementations to maintain efficient email-to-credential lookup indexes .
  - **Refactor**: Switched manual string normalization in `LinkOAuthToAccountUseCase` to use `EmailAddress` Value Object equality.
  - **Cleanup**: Removed deprecated files and the redundant `RegisterAccountUseCase`.
  - **DX**: Added comprehensive unit tests for `Credential`, `Receipt`, and Value Objects using the native Node.js test runner.

- fe6abbf: Significant architectural hardening focused on Interface Segregation (ISP) and role-based dependency injection.

## 11.0.0-alpha.0

### Major Changes

- - **`RemoveAuthMethodUseCase`** - Removes password or OAuth credentials from an account while enforcing the "last credential" invariant (account must always retain at least one authentication method)
  - **`AuthMethod`** - Union type `"password" | "oauth"` for runtime auth method introspection (`shared/domain/auth-method.ts`)

  **Removed properties:**
  - `tokenSigner: IssueReceiptUseCase`
  - `verifyReceipt: VerifyReceiptUseCase`

  **Added properties:**
  - `receiptSigner: ReceiptSigner` - Port for signing receipts
  - `receiptVerifier: ReceiptVerifier` - Port for verifying receipts
  - `tokenLifespanMinutes?: number` - Optional, defaults to 60
  - **`RemovePasswordInput.credentialId`** - Changed from `string` to `CredentialId` (value object)
  - **`RemovePasswordUseCase`** - No longer throws `InvalidCredentialIdError` (validation removed)
  - **`RegisterWithPasswordDeps.issueReceipt`** - Changed from `IssueReceiptUseCase` to `Pick<IssueReceiptUseCase, "execute">`

  Authentication use cases moved from root to `application/` subdirectory:

  | Old Path                                                   | New Path                                                               |
  | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
  | `features/authentication/add-password-auth.usecase.ts`     | `features/authentication/application/add-password-auth.usecase.ts`     |
  | `features/authentication/authenticate-oauth.usecase.ts`    | `features/authentication/application/authenticate-oauth.usecase.ts`    |
  | `features/authentication/authenticate-password.usecase.ts` | `features/authentication/application/authenticate-password.usecase.ts` |

  Any code importing these use cases directly from the old paths will break.
  - `createAuth` factory now instantiates `IssueReceiptUseCase` and `VerifyReceiptUseCase` internally (no longer requires them as arguments)
  - `removeAuthMethod` logic extracted from factory into `RemoveAuthMethodUseCase` (~80 lines removed from factory)
  - Authentication use cases now imported directly, not from `internal/index.ts`
  - `OAuthCredentialStore` - Documented immutability contract (no update method; delete + create for migrations)
  - `TokenHasher` - Clarified as convenience port (not used internally by core)
  - `LinkOAuthToAccountDeps.verifyReceipt` - Improved JSDoc
  - `UpdatePasswordDeps.verifyReceipt` - Improved JSDoc

  Changed from value imports to `type` imports where appropriate:
  - `CredentialId`, `PasswordCredentialStore` in `remove-password.usecase.ts`
  - Multiple imports in `types.ts`
  - `Receipt` in `register-password.usecase.ts`

  **New exports:**
  - `AuthMethod` from `shared/index.ts` and re-exported from `types.ts`
  - `RemoveAuthMethodUseCase` in `internal/index.ts`

  **Updated exports:**
  - `AuthenticateOAuthInput` path corrected in root `index.ts`
  - Authentication feature `index.ts` now exports from `application/` subdirectory
  - OAuth auto-registration includes compensating action: deletes orphaned account if credential save fails
  - `UpdatePasswordUseCase` and `LinkOAuthToAccountUseCase` now import `VerifyReceiptUseCase` from `receipts/application/` (not root `receipts/index.js`)

## 10.0.0

### Major Changes

- f0808d8: New API
- 28cfb75: Bifurcate public/internal API surface and promote NestJS adapter to a global module
- 19cffd7: Formalize beta release for global NestJS module and bifurcated core API.

### Minor Changes

- f0808d8: - **Password Updates**: Added `UpdatePasswordUseCase` and `auth.updatePassword()` to allow authenticated users to securely change their passwords.
  - **Facade Architecture**: All authentication flows are now centralized in the `createAuth` factory. Concrete use cases are moved to the `/internal` entry point.
  - **NestJS Global Module**: `WhoamiModule` is now marked as `@Global()` and `WhoamiOAuthModule` has been merged into it.
  - **Port Updates**: `PasswordCredentialStore` now requires an `update` method.

## 0.0.0-beta.1

### Major Changes

- 19cffd7: Formalize beta release for global NestJS module and bifurcated core API.

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
