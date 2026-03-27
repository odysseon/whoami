---
"@odysseon/whoami-core": major
"@odysseon/whoami-adapter-argon2": major
"@odysseon/whoami-adapter-jose": major
"@odysseon/whoami-adapter-webcrypto": major
"@odysseon/whoami-adapter-nestjs": major
---

Ship the feature-first core API for accounts, authentication, and receipts, add feature-layer tests, and include an Express example app that consumes the public core exports.

Remove the legacy facade and interface surface from `@odysseon/whoami-core`, and migrate all first-party adapters to the new contracts:

- `@odysseon/whoami-adapter-argon2` now implements `PasswordHasher`
- `@odysseon/whoami-adapter-jose` now provides receipt signing and verification
- `@odysseon/whoami-adapter-webcrypto` now implements `DeterministicStringHasher`
- `@odysseon/whoami-adapter-nestjs` now centers on receipt verification, route protection, and domain error translation
