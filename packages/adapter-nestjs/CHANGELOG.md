# @odysseon/whoami-adapter-nestjs

## 11.0.0-alpha.1

### Patch Changes

- 9ae2c63: Refactored NestJS adapter for better type safety and core alignment.
- Updated dependencies [efc9136]
- Updated dependencies [fe6abbf]
  - @odysseon/whoami-core@11.0.0-alpha.1

## 11.0.0-alpha.0

### Patch Changes

- Updated dependencies
  - @odysseon/whoami-core@11.0.0-alpha.0

## 10.0.0

### Major Changes

- f0808d8: New API
- d0db366: Breaking Change: Refactored NestJS integration for better developer experience.
  - `WhoamiModule` is now a Global module; manual imports in feature modules are no longer required.
  - Deleted `WhoamiOAuthModule`. `OAuthCallbackHandler` is now provided directly by the main `WhoamiModule`.
  - Moved `AUTH_METHODS` token to `@odysseon/whoami-adapter-nestjs/tokens`.

- 28cfb75: Bifurcate public/internal API surface and promote NestJS adapter to a global module
- 19cffd7: Formalize beta release for global NestJS module and bifurcated core API.

### Patch Changes

- Updated dependencies [f0808d8]
- Updated dependencies [f0808d8]
- Updated dependencies [28cfb75]
- Updated dependencies [19cffd7]
  - @odysseon/whoami-core@10.0.0

## 0.0.0-beta.2

### Major Changes

- 19cffd7: Formalize beta release for global NestJS module and bifurcated core API.

### Patch Changes

- Updated dependencies [19cffd7]
  - @odysseon/whoami-core@0.0.0-beta.1

## 0.0.0-beta.1

### Major Changes

- 28cfb75: Bifurcate public/internal API surface and promote NestJS adapter to a global module

### Patch Changes

- Updated dependencies [28cfb75]
  - @odysseon/whoami-core@0.0.0-beta.0

## 0.0.0-beta.0

### Major Changes

- d0db366: Breaking Change: Refactored NestJS integration for better developer experience.
  - `WhoamiModule` is now a Global module; manual imports in feature modules are no longer required.
  - Deleted `WhoamiOAuthModule`. `OAuthCallbackHandler` is now provided directly by the main `WhoamiModule`.
  - Moved `AUTH_METHODS` token to `@odysseon/whoami-adapter-nestjs/tokens`.

## 0.0.0-dev-20260408132748

### Minor Changes

- 2a97f79: - **Breaking Change**: Bifurcated the public API surface. [cite_start]Moved concrete use-case classes to the `@odysseon/whoami-core/internal` entry point to prevent implementation leakage [cite: 82, 86-87, 103].
  - [cite_start]Standardized the main index to export only shared primitives, domain entities, ports, and the `createAuth` factory [cite: 83-91, 96].
  - [cite_start]**Feature**: Introduced the `AUTH_METHODS` DI token, allowing the full auth facade to be injected directly into services [cite: 61-63, 72].

### Patch Changes

- Updated dependencies [2a97f79]
  - @odysseon/whoami-core@0.0.0-dev-20260408132748

## 7.1.0

### Minor Changes

- 0e6fe8b: Added support for custom token extractors in WhoamiModule.
  - Users can now override the default Bearer token extraction logic via module options.
  - Improved DI registration to support both static and async configuration for extractors.

### Patch Changes

- 7cb2816: Fixed Dependency Injection issues in NestJS by using abstract classes for tokens.
  Added explicit types to Swagger DTOs to ensure correct OpenAPI documentation.
  Cleaned up redundant providers in WhoamiModule.

## 7.0.0

### Major Changes

- ba4a6f5: Removed Magic-Link authentication support to focus on Password and OAuth providers.
  Finalized the `createAuth` factory with improved internal use-case composition.
  Standardized workspace-wide TypeScript configurations and added new example implementation packages.

### Minor Changes

- d4e597b: Refactored authentication use cases to use structured input objects and moved callback handlers to the core library.
  - Moved `OAuthCallbackHandler` from NestJS adapter to core to make it framework-agnostic.
  - Introduced `PasswordCallbackHandler` and `MagicLinkCallbackHandler` in core.
  - Changed `VerifyPasswordUseCase.execute` to accept a `VerifyPasswordInput` object instead of positional arguments.
  - Standardized NestJS `WhoamiOAuthModule` to act as a DI wrapper for core handlers.

### Patch Changes

- Updated dependencies [d4e597b]
- Updated dependencies [ba4a6f5]
- Updated dependencies [140fc3d]
- Updated dependencies [92e265d]
  - @odysseon/whoami-core@5.0.0

## 6.0.0

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

## 5.0.0

### Major Changes

- d961d66: resolve covariant types

### Patch Changes

- Updated dependencies [d961d66]
  - @odysseon/whoami-core@3.0.0

## 4.0.0

### Major Changes

- 25785d9: Add CJS support

## 3.0.0

### Patch Changes

- Updated dependencies [d986e71]
  - @odysseon/whoami-core@2.0.0

## 2.0.0

### Major Changes

- d800def: Completely rebuilt the NestJS adapter to align with the pure identity core `0.6.0`.
  - **Generic OAuth Routing:** Replaced `loginWithGoogle` with the generic `loginWithOAuth` controller endpoint.
  - **Enterprise Boundaries:** Introduced `WhoamiExceptionFilter` to automatically map pure core domain errors (e.g., `TOKEN_EXPIRED`) to standard HTTP status codes (`410 Gone`).
  - **Secure By Default:** Added a globally bindable `WhoamiAuthGuard` paired with a `@Public()` decorator.
  - **DX Luxuries:** Added the `@CurrentIdentity()` parameter decorator for strictly-typed JWT payload extraction in route handlers.
  - **Decoupled Extraction:** Implemented the `ITokenExtractor` port via `BearerTokenExtractor`, allowing consumers to override how tokens are pulled from requests via `WhoamiModule` options.

### Patch Changes

- Updated dependencies [2a70ab2]
  - @odysseon/whoami-core@1.0.0

## 1.0.0

### Minor Changes

- 5978258: Add configurable credentials and Google OAuth support to `whoami-core`, make refresh tokens optional with status reporting, and extend the NestJS adapter with matching controller routes, wiring, and service exports for override-friendly apps.

### Patch Changes

- Updated dependencies [5978258]
  - @odysseon/whoami-core@0.5.0

## 0.2.0

### Minor Changes

- e22184f: Add a built-in NestJS auth controller, bearer-token extractor, and access-token guard so apps can get working auth routes and baseline identity confirmation from module configuration alone, while still being able to override the controller with the re-exported `WhoamiService`.

## 0.1.0

### Minor Changes

- 8c14cd2: add async configuration support for WhoamiModule
- 7eb7f32: first implementation of nestjs framework adapter
