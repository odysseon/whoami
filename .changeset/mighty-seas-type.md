---
"@odysseon/whoami-core": patch
---

Hardened the domain layer and cleaned up legacy use-case paths.

- **Internal API Change**: Updated `PasswordCredentialStore.save` to require the `EmailAddress`. This allows infrastructure implementations to maintain efficient email-to-credential lookup indexes .
- **Refactor**: Switched manual string normalization in `LinkOAuthToAccountUseCase` to use `EmailAddress` Value Object equality.
- **Cleanup**: Removed deprecated files and the redundant `RegisterAccountUseCase`.
- **DX**: Added comprehensive unit tests for `Credential`, `Receipt`, and Value Objects using the native Node.js test runner.
