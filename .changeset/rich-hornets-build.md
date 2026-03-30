---
"@odysseon/whoami-core": minor
"@odysseon/whoami-example-express": patch
"@odysseon/whoami-example-nestjs": patch
---

- Added one-time use enforcement for magic-link authentication to prevent replay attacks.
- Introduced stable machine-readable error codes across all domain errors to improve error handling in consumers.
- Enhanced authentication use cases with detailed warning logs for failed verification attempts.
- Updated CredentialStore port to support `deleteByEmail`.
