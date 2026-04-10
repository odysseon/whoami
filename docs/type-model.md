# Type Model

## AccountId

Accepts `string | number`. The `.value` property preserves whatever type you pass in — no silent coercion.

```ts
new AccountId(1);           // numeric PK — value is number 1
new AccountId("user-uuid"); // string UUID — value is "user-uuid"
new AccountId("");          // throws InvalidAccountIdError
```

Use `accountId.value` as the foreign key in your `users` table. Store it as whatever your database natively uses.

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
  token: string;      // the signed JWT
  accountId: AccountId; // the authenticated account
  expiresAt: Date;    // when the token expires
}
```

`WhoamiAuthGuard` stores a verified `Receipt` on `request.identity`. `@CurrentIdentity()` resolves it in route handlers.

```mermaid
sequenceDiagram
    participant Client
    participant Guard as WhoamiAuthGuard
    participant VerifyUC as VerifyReceiptUseCase
    participant Handler as Route Handler

    Client->>Guard: Authorization: Bearer <token>
    Guard->>VerifyUC: execute(token)
    VerifyUC-->>Guard: Receipt { token, accountId, expiresAt }
    Guard->>Handler: request.identity = receipt
    Handler-->>Client: response (uses @CurrentIdentity())
```

## CredentialProof

A discriminated union stored inside a `Credential` entity. Each credential holds exactly one proof kind. Two kinds are currently supported:

```ts
type CredentialProof =
  | { kind: "password"; hash: string }
  | { kind: "oauth"; provider: string; providerId: string };
```

New credentials should be created through the `Credential` factory methods:

- `Credential.createPassword({ id, accountId, hash })`
- `Credential.createOAuth({ id, accountId, provider, providerId })`

`Credential.loadExisting(...)` is intended for rehydrating persisted credentials only.

Calling a proof accessor that doesn't match the stored kind throws `WrongCredentialTypeError`. For example, calling `credential.passwordHash` on an OAuth credential throws immediately — no silent fallthrough.

## AuthConfig and AuthMethods

`createAuth(config: AuthConfig): AuthMethods` is the primary factory. Configure only the sections your application needs:

```ts
interface AuthConfig {
  accountRepo: AccountRepository;        // required
  tokenSigner: IssueReceiptUseCase;      // required — mints receipts
  verifyReceipt: VerifyReceiptUseCase;   // required — validates receipts
  logger: LoggerPort;                    // required
  generateId: () => string;             // required — e.g. crypto.randomUUID

  password?: {                           // omit to disable password auth
    hashManager: PasswordManager;
    passwordStore: PasswordCredentialStore;
  };

  oauth?: {                              // omit to disable OAuth auth
    oauthStore: OAuthCredentialStore;
  };
}
```

The returned `AuthMethods` facade has methods that are always present and methods that are only present when the corresponding section is configured:

```mermaid
graph LR
    Always["Always present\n──────────────────────\ngetAccountAuthMethods(accountId)\nremoveAuthMethod(accountId, method, options?)"]
    PwdOnly["Present when password configured\n──────────────────────────────────\nregisterWithPassword(input)\nauthenticateWithPassword(input)\naddPasswordToAccount(accountId, password)"]
    OAuthOnly["Present when oauth configured\n──────────────────────────────\nauthenticateWithOAuth(input)\nlinkOAuthToAccount(input)"]
```

## Domain errors

All domain errors extend `DomainError`. They carry a stable `code` discriminant — switch on `err.code` rather than doing `instanceof` checks or matching on `message` (messages are for humans and may change; codes are part of the public API contract).

```ts
try {
  await auth.registerWithPassword(input);
} catch (err) {
  if (err instanceof DomainError) {
    switch (err.code) {
      case "ACCOUNT_ALREADY_EXISTS": ...
      case "INVALID_EMAIL": ...
    }
  }
}
```

Full error table:

| Error class | Code | Thrown when |
|---|---|---|
| `AccountAlreadyExistsError` | `ACCOUNT_ALREADY_EXISTS` | Registering an email that already has an account |
| `AccountNotFoundError` | `ACCOUNT_NOT_FOUND` | A use case looks up an account by ID and finds none |
| `AuthenticationError` | `AUTHENTICATION_ERROR` | Credential verification fails (intentionally vague to prevent enumeration) |
| `WrongCredentialTypeError` | `WRONG_CREDENTIAL_TYPE` | Accessing a proof field that doesn't match the credential's kind |
| `InvalidReceiptError` | `INVALID_RECEIPT` | Receipt token is empty, expired, or fails signature verification |
| `InvalidEmailError` | `INVALID_EMAIL` | Constructing `EmailAddress` with an invalid value |
| `InvalidConfigurationError` | `INVALID_CONFIGURATION` | A use case is constructed with an invalid config value |
| `InvalidCredentialError` | `INVALID_CREDENTIAL` | A credential factory receives an empty proof field |
| `CredentialAlreadyExistsError` | `CREDENTIAL_ALREADY_EXISTS` | Attempting to add a password to an account that already has one |
| `OAuthProviderNotFoundError` | `OAUTH_PROVIDER_NOT_FOUND` | Removing an OAuth provider that isn't linked to the account |
| `CannotRemoveLastCredentialError` | `CANNOT_REMOVE_LAST_CREDENTIAL` | Removing the last auth method would lock the account permanently |
| `UnsupportedAuthMethodError` | `UNSUPPORTED_AUTH_METHOD` | `removeAuthMethod` is called for a method that isn't configured |

`WhoamiExceptionFilter` (NestJS adapter) maps these codes to HTTP status codes automatically — see [`adapter-nestjs` docs](../packages/adapter-nestjs/README.md#http-status-mapping) for the full mapping table.

## Port interfaces

Ports are the boundary contracts that Zone 0 (domain) defines and Zone 3 (infrastructure) implements. You implement these in your data layer.

```mermaid
graph LR
    subgraph "Zone 0 — Ports (interfaces)"
        AR["AccountRepository\n───────────────────\nsave(account)\nfindById(id)\nfindByEmail(email)\ndelete(id)"]
        PCS["PasswordCredentialStore\n────────────────────────\nfindByEmail(email)\nfindByAccountId(accountId)\nsave(credential)\ndelete(credentialId)\ndeleteByAccountId(accountId)\nexistsForAccount(accountId)"]
        OCS["OAuthCredentialStore\n──────────────────────\nfindByProvider(provider, providerId)\nfindAllByAccountId(accountId)\nsave(credential)\ndelete(credentialId)\ndeleteByProvider(accountId, provider)\ndeleteAllForAccount(accountId)\nexistsForAccount(accountId)"]
        PM["PasswordManager\n────────────────\nhash(plainText)\ncompare(plainText, hash)"]
        TH["TokenHasher\n─────────────\nhash(token)"]
        RS["ReceiptSigner\n──────────────\nsign(accountId, expiresAt)"]
        RV["ReceiptVerifier\n────────────────\nverify(token)"]
        LP["LoggerPort\n───────────\ninfo(...)\nwarn(...)\nerror(...)"]
    end

    subgraph "Zone 3 — Implementations"
        Argon2["Argon2PasswordHasher\n(@odysseon/whoami-adapter-argon2)"]
        Jose["JoseReceiptSigner\nJoseReceiptVerifier\n(@odysseon/whoami-adapter-jose)"]
        WC["WebCryptoTokenHasher\n(@odysseon/whoami-adapter-webcrypto)"]
        Yours["Your implementations\n(in-memory, PostgreSQL, etc.)"]
    end

    Argon2 -.->|implements| PM
    Jose -.->|implements| RS
    Jose -.->|implements| RV
    WC -.->|implements| TH
    Yours -.->|implements| AR
    Yours -.->|implements| PCS
    Yours -.->|implements| OCS
    Yours -.->|implements| LP
```
