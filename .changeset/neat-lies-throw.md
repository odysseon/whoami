---
"@odysseon/whoami-core": minor
---

- Add `toDTO()` method to `Account` and `Receipt` entities returning typed DTOs
- Export `AccountDTO` and `ReceiptDTO` types shared across all auth modules
- Derive all I/O types from `*Methods` interfaces using `Parameters`/`ReturnType`
- Define `*Deps` types per use-case using `Pick` from unified module deps

- Split each module's `*.config.ts` into `*.deps.ts`, `*.methods.ts`, and `*.types.ts`
- Split `password.proof.ts` into `password-hash.proof.ts`, `password-reset.proof.ts`, and `password-proof.guards.ts`
- Move `OAuthProofDeserializer` from `oauth.module.ts` to own `oauth.deserializer.ts`
- Extract `MagicLinkProofDeserializer` to own `magiclink.deserializer.ts`

- Add `CredentialStoreBase` port interface for common credential store operations
- Add `buildAuthLifecycle` builder in `kernel/shared` to eliminate per-module lifecycle duplication
- Extract `assertObject`/`credentialProof` helpers to `kernel/shared/deserializer-helpers.ts`
- Extract `parseEmail` helper to `kernel/shared/email-parser.ts`
- Make `deleteAllForAccount` optional on `CredentialStoreBase` with runtime guard
- Add `getAccountAuthMethods` helper to `AuthOrchestrator`

- Consolidate use-case dependencies into single `#deps` object with typed `*Deps`
- Split `AuthenticateWithOAuthUseCase.execute` into `#fastPath` and `#autoRegister` methods
- Remove duplicate I/O type definitions from individual use-case files
- Replace inline email parsing with shared `parseEmail` helper

- Remove `PasswordProof` union type

- Extract `WhoamiModuleOptions`/`WhoamiModuleAsyncOptions` to `whoami.options.ts`
- Extract provider builders to `whoami.providers.ts`
- Define reusable `resolve` factory to reduce async provider boilerplate

- Use `ReceiptDTO` instead of `Receipt` in `OAuthCallbackHandler`
- Replace bare `Error` with `InvalidConfigurationError` for missing OAuth module

- Bump `@swc/core` to ^1.15.33, `eslint` to ^10.3.0, and `typescript-eslint` packages to ^8.59.1
