# Type Model

## AccountId

Accepts `string | number`. The `.value` property preserves whatever type you pass in — no silent coercion.

```ts
new AccountId(1); // numeric PK — value is number 1
new AccountId("user-uuid"); // string UUID — value is "user-uuid"
new AccountId(""); // throws InvalidAccountIdError
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
  token: string; // the signed JWT
  accountId: AccountId; // the authenticated account
  expiresAt: Date; // when the token expires
}
```

`WhoamiAuthGuard` stores a verified `Receipt` on `request.identity`. `@CurrentIdentity()` resolves it in route handlers.

## CredentialProof

A discriminated union stored inside a `Credential` entity. Each credential holds exactly one proof kind.

```ts
type CredentialProof =
  | { kind: "password"; hash: string }
  | { kind: "magic_link"; token: string; expiresAt: Date }
  | { kind: "oauth"; provider: string; providerId: string };
```

New credentials should be created through the `Credential` factory methods:

- `Credential.createPassword(id, accountId, hash)`
- `Credential.createMagicLink(id, accountId, token, expiresAt)`
- `Credential.createOAuth(id, accountId, provider, providerId)`

`Credential.loadExisting(...)` is intended for rehydrating persisted credentials only.

Calling a method that doesn't match the stored proof kind throws `WrongCredentialTypeError`. For example, calling `getPasswordHash()` on an OAuth credential throws immediately — no silent fallthrough.

## Domain errors

All domain errors extend `DomainError`. They are thrown by domain methods and use cases, and translated into HTTP responses by `WhoamiExceptionFilter`.

| Error                       | Thrown when                                              |
| --------------------------- | -------------------------------------------------------- |
| `AccountAlreadyExistsError` | Registering an email that already has an account         |
| `AuthenticationError`       | Credential verification fails                            |
| `WrongCredentialTypeError`  | Calling a method incompatible with the stored proof kind |
| `InvalidReceiptError`       | Receipt token is malformed, expired, or empty            |
| `InvalidEmailError`         | Constructing `EmailAddress` with an invalid value        |
| `InvalidConfigurationError` | A use case is constructed with an invalid config value   |
