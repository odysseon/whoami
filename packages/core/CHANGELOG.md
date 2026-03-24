# @odysseon/whoami-core

## 0.3.0

### Minor Changes

- ee6fcb0: Added Argon2PasswordHasher adapter utilizing native argon2 for secure, salted password hashing.
- 6d15ddb: Refactor: Removed all Node-dependent cryptographic adapters (Argon2 and Jose) from the core package to ensure it is completely framework-agnostic and edge-compatible.

## 0.2.0

### Minor Changes

- 4b28d73: Added the JoseTokenSigner adapter utilizing the lightweight `jose` library for native Web Crypto JWT generation and verification.
- 01a2345: Added CryptoTokenHasher adapter using native Node.js crypto for deterministic refresh token hashing
