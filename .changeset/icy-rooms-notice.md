---
"@odysseon/whoami-adapter-jose": minor
---

**New Package:** `@odysseon/whoami-adapter-jose` — A JWT signing adapter for the Whoami authentication system.

- **JWT signing** using HS256 symmetric algorithm via the `jose` library
- **Token verification** with runtime validation of required `sub` claim
- **Configurable** issuer and audience claims
- **Comprehensive error mapping** — converts library errors to domain errors:
  - `JWTExpired` → `TOKEN_EXPIRED`
  - `JWTInvalid`, `JWSInvalid`, `JWSSignatureVerificationFailed`, `JWTClaimValidationFailed` → `TOKEN_MALFORMED`

- Enforces minimum 32-character secret key requirement
- Validates `sub` claim exists and is non-empty at runtime
- Protects against tampered, expired, or malformed tokens
