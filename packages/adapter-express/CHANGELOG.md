# @odysseon/whoami-adapter-express

## 2.0.0

### Major Changes

- 88d365c: Refactored authentication flows to use the unified `AuthenticateWithReceiptUseCase`. Replaced `ReceiptVerifier` with `AuthenticateWithReceiptUseCase` in the adapters to enforce existence checks alongside cryptographic verification. Identities now expose strictly `accountId` and `expiresAt` to avoid data leaks.

### Patch Changes

- Updated dependencies [88d365c]
  - @odysseon/whoami-core@13.1.0

## 1.0.0

### Minor Changes

- 3110d11: - add Express adapter package
  - Change compiler target from ES2022 to ESNext

### Patch Changes

- 98f80a7: DomainError statusCode property has been removed and replaced with a category field.

  Update exception filter for DomainError category field

- Updated dependencies [3110d11]
- Updated dependencies [98f80a7]
  - @odysseon/whoami-core@13.0.0
