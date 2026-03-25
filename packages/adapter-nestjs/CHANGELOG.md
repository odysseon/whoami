# @odysseon/whoami-adapter-nestjs

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
