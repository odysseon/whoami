# Type Model

## AccountId

Accepts a non-empty `string`. The `.value` property always returns the normalised string.

```ts
new AccountId("user-uuid"); // value is "user-uuid"
new AccountId("");          // throws InvalidAccountIdError
```

Use `accountId.value` as the foreign key in your `users` table.

## EmailAddress

Normalises on construction (lowercase, trimmed). The `.value` property always returns the normalised string.

```ts
const email = new EmailAddress("  User@Example.COM  ");
email.value; // "user@example.com"

new EmailAddress(""); // throws InvalidEmailError
```

## Receipt

The output of a successful authentication. Contains everything a route handler needs to identify the request.

```ts
class Receipt {
  token: string;        // the signed JWT
  accountId: AccountId; // the authenticated account
  expiresAt: Date;      // when the token expires
}
```

In NestJS, `WhoamiAuthGuard` stores a verified `Receipt` on `request.whoami.receipt`. `@CurrentReceipt()` resolves it in route handlers.

```mermaid
sequenceDiagram
    participant Client
    participant Guard as WhoamiAuthGuard
    participant VerifyUC as VerifyReceiptUseCase
    participant Handler as Route Handler

    Client->>Guard: Authorization: Bearer <token>
    Guard->>VerifyUC: execute(token)
    VerifyUC-->>Guard: Receipt { token, accountId, expiresAt }
    Guard->>Handler: request.whoami.receipt = receipt
    Handler-->>Client: response (uses @CurrentReceipt())
```

## CredentialProof

A discriminated union stored inside a `Credential` entity. Each credential holds exactly one proof kind:

```ts
type CredentialProof =
  | { kind: "password"; hash: string }
  | { kind: "oauth"; provider: string; providerId: string }
  | { kind: "magic-link"; tokenHash: string; expiresAt: Date };
```

New credentials should be created through `Credential` factory methods:

- `Credential.createPassword({ id, accountId, hash })`
- `Credential.createOAuth({ id, accountId, provider, providerId })`
- `Credential.createMagicLink({ id, accountId, tokenHash, expiresAt })`

`Credential.loadExisting(...)` is intended for rehydrating persisted credentials only.

Calling a proof accessor that doesn't match the stored kind throws `WrongCredentialTypeError` — no silent fallthrough.

## Module return types

Each module factory returns a fully-typed facade. No inference, no widening, no casts.

```ts
const { account } = await password.registerWithPassword({ email, password });
// account.id    → string ✅
// account.email → string ✅

const { receipt } = await password.authenticateWithPassword({ email, password });
// receipt.token     → string ✅
// receipt.accountId → AccountId ✅
// receipt.expiresAt → Date ✅

const { token } = await password.requestPasswordReset({ email });
// token → string (plaintext — deliver via email, store the hash) ✅
```

## Domain errors

All domain errors extend `DomainError`. Switch on `err.code` — codes are stable API, messages are for humans and may change.

```ts
try {
  await password.registerWithPassword(input);
} catch (err) {
  if (err instanceof DomainError) {
    switch (err.code) {
      case "ACCOUNT_ALREADY_EXISTS": ...
      case "INVALID_EMAIL": ...
    }
  }
}
```

Full error table in [`packages/core/README.md`](../packages/core/README.md#domain-errors).

## Port interfaces

Ports are the boundary contracts that your infrastructure must implement. A concise reference:

```mermaid
graph LR
    subgraph "Ports (interfaces)"
        AR["AccountRepository\n───────────────────\nsave(account)\nfindById(id)\nfindByEmail(email)\ndelete(id)"]
        PCS["PasswordCredentialStore\n────────────────────────\nfindByAccountId(accountId)\nfindById(credentialId)\nfindByTokenHash(tokenHash)\nsave(credential)\nupdate(credentialId, proof)\ndelete(credentialId)\nexistsForAccount(accountId)\ncountForAccount(accountId)\ndeleteAllResetCredentialsForAccount(accountId)"]
        OCS["OAuthCredentialStore\n──────────────────────\nfindByProvider(provider, providerId)\nfindAllByAccountId(accountId)\nsave(credential)\ndelete(credentialId)\ndeleteByProvider(accountId, provider)\ndeleteAllForAccount(accountId)\nexistsForAccount(accountId)\ncountForAccount(accountId)"]
        PH["PasswordHasher\n────────────────\nhash(plainText)\ncompare(plainText, hash)"]
        RS["ReceiptSigner\n──────────────\nsign(accountId, expiresAt)"]
        RV["ReceiptVerifier\n────────────────\nverify(token)"]
        ST["SecureTokenPort\n────────────────\ngenerateToken(): string\nhashToken(token): Promise‹string›"]
    end

    subgraph "Implementations"
        Argon2["Argon2PasswordHasher\n(@odysseon/whoami-adapter-argon2)"]
        Jose["JoseReceiptSigner\nJoseReceiptVerifier\n(@odysseon/whoami-adapter-jose)"]
        WC["WebCryptoSecureTokenAdapter\n(@odysseon/whoami-adapter-webcrypto)"]
        Yours["Your implementations\n(in-memory, PostgreSQL, etc.)"]
    end

    Argon2 -.->|implements| PH
    Jose -.->|implements| RS
    Jose -.->|implements| RV
    WC -.->|implements| ST
    Yours -.->|implements| AR
    Yours -.->|implements| PCS
    Yours -.->|implements| OCS
```
