---
"@odysseon/whoami-core": major
---

- `createAuth` now accepts `modules` array instead of flat `password`/`oauth` config keys
- Removed deprecated top-level module configuration (password, oauth)
- Removed sub-path exports (`/password`, `/oauth`, `/magiclink`) - all exports now from root
- Removed internal API entry point (`/internal`) - use direct imports from root
- `AccountId` now accepts only string (removed number support)
- `IdGeneratorPort` now returns string only (no number)

- Value objects now use branded types with factory functions:
  - `createAccountId()`, `isAccountId()` instead of `new AccountId()`
  - `createEmailAddress()`, `isEmailAddress()` instead of `new EmailAddress()`
  - `createCredentialId()`, `isCredentialId()` instead of `new CredentialId()`
- Domain errors now have `statusCode` property and `toJSON()` serialization
- `WrongCredentialTypeError` now maps to 500 (server error) instead of 400

- `PasswordCredentialStore.save()` no longer requires email parameter
- Removed `findByEmail()` from `PasswordCredentialStore` (use `findByAccountId`)
- Password recovery now lives INSIDE password module (no orphaned module)
- Added `RequestPasswordResetUseCase`, `VerifyPasswordResetUseCase`

- `OAuthCredentialStore` now requires `countForAccount()` method
- Removed `OAuthCredential` wrapper class (use kernel Credential directly)

- `WhoamiModule` now accepts `modules` array in config
- `AUTH_METHODS` token now returns `AnyAuthMethods` type
- Added `VERIFY_RECEIPT` token for receipt verifier
- `WhoamiAuthGuard` now injects `ReceiptVerifier` port directly

- Added `AuthModule` interface for vertical slice modules
- Added `AuthOrchestrator` for coordinating multiple auth modules
- Added `CompositeDeserializer` for runtime credential proof assembly
- Zero kernel changes required to add new auth methods

- Complete passwordless email authentication module
- Secure token generation (256-bit crypto.randomUUID)
- SHA-256 token hashing (never store plaintext)
- Single-use enforcement with used tracking
- Auto-registration for new email addresses

- Password reset flow now inside password module
- Cryptographically secure reset tokens
- Token hashing and expiration
- Single-use enforcement

- All modules are completely independent (no cross-module imports)
- Kernel has zero external dependencies
- Added verification script (11 checks) for code quality
- Better error codes and HTTP status mapping
- Improved type safety with branded types
- Reduced bundle size through better tree-shaking
