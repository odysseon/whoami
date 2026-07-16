---
"@odysseon/whoami-adapter-express": major
"@odysseon/whoami-adapter-nestjs": major
"@odysseon/whoami-core": minor
---

Refactored authentication flows to use the unified `AuthenticateWithReceiptUseCase`. Replaced `ReceiptVerifier` with `AuthenticateWithReceiptUseCase` in the adapters to enforce existence checks alongside cryptographic verification. Identities now expose strictly `accountId` and `expiresAt` to avoid data leaks.
