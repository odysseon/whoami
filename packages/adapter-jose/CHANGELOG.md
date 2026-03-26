# @odysseon/whoami-adapter-jose

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
