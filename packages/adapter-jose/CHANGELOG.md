# @odysseon/whoami-adapter-jose

## 14.0.0-dev.1

### Patch Changes

- Updated dependencies [82db1e2]
- Updated dependencies [9d6b1db]
  - @odysseon/whoami-core@12.0.0-dev.1

## 14.0.0-dev.0

### Patch Changes

- 5254b01: Patch to follow new core API
- Updated dependencies [5254b01]
- Updated dependencies [5254b01]
- Updated dependencies [5254b01]
  - @odysseon/whoami-core@12.0.0-dev.0

## 13.0.0

### Patch Changes

- Updated dependencies [b1777a4]
  - @odysseon/whoami-core@11.2.0

## 12.0.0

### Patch Changes

- Updated dependencies [98e4524]
  - @odysseon/whoami-core@11.1.0

## 11.0.0

### Patch Changes

- Updated dependencies [efc9136]
- Updated dependencies [fe6abbf]
- Updated dependencies [343561f]
  - @odysseon/whoami-core@11.0.0

## 11.0.0-alpha.1

### Patch Changes

- Updated dependencies [efc9136]
- Updated dependencies [fe6abbf]
  - @odysseon/whoami-core@11.0.0-alpha.1

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

- 53038e4: **New Package:** `@odysseon/whoami-adapter-jose` — A JWT signing adapter for the Whoami authentication system.
  - **JWT signing** using HS256 symmetric algorithm via the `jose` library
  - **Token verification** with runtime validation of required `sub` claim
  - **Configurable** issuer and audience claims
  - **Comprehensive error mapping** — converts library errors to domain errors:
    - `JWTExpired` → `TOKEN_EXPIRED`
    - `JWTInvalid`, `JWSInvalid`, `JWSSignatureVerificationFailed`, `JWTClaimValidationFailed` → `TOKEN_MALFORMED`
  - Enforces minimum 32-character secret key requirement
  - Validates `sub` claim exists and is non-empty at runtime
  - Protects against tampered, expired, or malformed tokens

### Patch Changes

- Updated dependencies [c7731b5]
- Updated dependencies [da11601]
  - @odysseon/whoami-core@0.4.0
