---
"@odysseon/whoami-core": major
---

- **`RemoveAuthMethodUseCase`** - Removes password or OAuth credentials from an account while enforcing the "last credential" invariant (account must always retain at least one authentication method)

- **`AuthMethod`** - Union type `"password" | "oauth"` for runtime auth method introspection (`shared/domain/auth-method.ts`)

**Removed properties:**

- `tokenSigner: IssueReceiptUseCase`
- `verifyReceipt: VerifyReceiptUseCase`

**Added properties:**

- `receiptSigner: ReceiptSigner` - Port for signing receipts
- `receiptVerifier: ReceiptVerifier` - Port for verifying receipts
- `tokenLifespanMinutes?: number` - Optional, defaults to 60

- **`RemovePasswordInput.credentialId`** - Changed from `string` to `CredentialId` (value object)
- **`RemovePasswordUseCase`** - No longer throws `InvalidCredentialIdError` (validation removed)
- **`RegisterWithPasswordDeps.issueReceipt`** - Changed from `IssueReceiptUseCase` to `Pick<IssueReceiptUseCase, "execute">`

Authentication use cases moved from root to `application/` subdirectory:

| Old Path                                                   | New Path                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `features/authentication/add-password-auth.usecase.ts`     | `features/authentication/application/add-password-auth.usecase.ts`     |
| `features/authentication/authenticate-oauth.usecase.ts`    | `features/authentication/application/authenticate-oauth.usecase.ts`    |
| `features/authentication/authenticate-password.usecase.ts` | `features/authentication/application/authenticate-password.usecase.ts` |

Any code importing these use cases directly from the old paths will break.

- `createAuth` factory now instantiates `IssueReceiptUseCase` and `VerifyReceiptUseCase` internally (no longer requires them as arguments)
- `removeAuthMethod` logic extracted from factory into `RemoveAuthMethodUseCase` (~80 lines removed from factory)
- Authentication use cases now imported directly, not from `internal/index.ts`

- `OAuthCredentialStore` - Documented immutability contract (no update method; delete + create for migrations)
- `TokenHasher` - Clarified as convenience port (not used internally by core)
- `LinkOAuthToAccountDeps.verifyReceipt` - Improved JSDoc
- `UpdatePasswordDeps.verifyReceipt` - Improved JSDoc

Changed from value imports to `type` imports where appropriate:

- `CredentialId`, `PasswordCredentialStore` in `remove-password.usecase.ts`
- Multiple imports in `types.ts`
- `Receipt` in `register-password.usecase.ts`

**New exports:**

- `AuthMethod` from `shared/index.ts` and re-exported from `types.ts`
- `RemoveAuthMethodUseCase` in `internal/index.ts`

**Updated exports:**

- `AuthenticateOAuthInput` path corrected in root `index.ts`
- Authentication feature `index.ts` now exports from `application/` subdirectory

- OAuth auto-registration includes compensating action: deletes orphaned account if credential save fails

- `UpdatePasswordUseCase` and `LinkOAuthToAccountUseCase` now import `VerifyReceiptUseCase` from `receipts/application/` (not root `receipts/index.js`)
