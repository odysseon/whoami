# @odysseon/whoami-adapter-nestjs

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
