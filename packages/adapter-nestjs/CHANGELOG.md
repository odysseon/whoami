# @odysseon/whoami-adapter-nestjs

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
