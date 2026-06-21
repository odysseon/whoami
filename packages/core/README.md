# @odysseon/whoami-core

Domain logic, port interfaces, and module factories for the whoami identity kernel. Zero framework and I/O dependencies.

## Installation

```bash
npm install @odysseon/whoami-core
```

## Concept

There is no central factory. Each auth method is a self-contained module that returns its own fully-typed facade. You compose what you need. Cross-module policy (e.g., the last-credential guard) lives in `AuthOrchestrator`, which you instantiate separately.

```ts
import { PasswordModule } from "@odysseon/whoami-core/password";
import { OAuthModule } from "@odysseon/whoami-core/oauth";
import { MagicLinkModule } from "@odysseon/whoami-core/magiclink";
import { AuthOrchestrator } from "@odysseon/whoami-core/kernel";

const password = PasswordModule({
  accountRepo,
  passwordHashStore, // stores hashed passwords (one per account)
  resetTokenStore, // stores password reset tokens (many per account, short-lived)
  passwordHasher,
  receiptSigner,
  idGenerator: { generate: () => crypto.randomUUID() },
  logger,
  clock: { now: () => new Date() },
  secureToken,
});

const oauth = OAuthModule({
  accountRepo,
  oauthStore,
  receiptSigner,
  idGenerator: { generate: () => crypto.randomUUID() },
  logger,
});

const magicLink = MagicLinkModule({
  accountRepo,
  magicLinkStore,
  receiptSigner,
  idGenerator: { generate: () => crypto.randomUUID() },
  logger,
  clock: { now: () => new Date() },
  secureToken,
});

// Each module is fully typed — no casts, no assertions
const { receipt } = await password.authenticateWithPassword({
  email,
  password,
});

// Cross-module policy — explicit opt-in
const orchestrator = new AuthOrchestrator([password, oauth, magicLink]);
await orchestrator.removeAuthMethod(accountId, "password"); // last-credential guard applies
```

## Entry points

| Entry point                       | Consumer             | Contains                                                |
| --------------------------------- | -------------------- | ------------------------------------------------------- |
| `@odysseon/whoami-core`           | Application code     | All ports, entities, errors, value objects              |
| `@odysseon/whoami-core/password`  | Application code     | `PasswordModule`, `PasswordMethods`, password ports     |
| `@odysseon/whoami-core/oauth`     | Application code     | `OAuthModule`, `OAuthMethods`, OAuth ports              |
| `@odysseon/whoami-core/magiclink` | Application code     | `MagicLinkModule`, `MagicLinkMethods`, magic-link ports |
| `@odysseon/whoami-core/kernel`    | Application code     | `AuthOrchestrator`, entities, shared ports              |
| `@odysseon/whoami-core/internal`  | Adapter authors only | Concrete use-case classes for DI token wiring           |

## Module factories

### `PasswordModule(config)`

Returns `PasswordMethods & AuthModule`.

**Config** — all fields required unless noted:

| Field                       | Type                      | Required | Description                                                            |
| --------------------------- | ------------------------- | -------- | ---------------------------------------------------------------------- |
| `accountRepo`               | `AccountRepository`       | ✅       | Account persistence                                                    |
| `passwordHashStore`         | `PasswordHashStore`       | ✅       | Stores hashed passwords — one record per account                       |
| `resetTokenStore`           | `PasswordResetTokenStore` | ✅       | Stores password reset tokens — many per account, short-lived           |
| `passwordHasher`            | `PasswordHasher`          | ✅       | Slow hash for passwords — use `Argon2PasswordHasher`                   |
| `receiptSigner`             | `ReceiptSigner`           | ✅       | Signs receipt JWTs — use `JoseReceiptSigner`                           |
| `idGenerator`               | `IdGeneratorPort`         | ✅       | `{ generate(): string }` — any unique-ID strategy                      |
| `logger`                    | `LoggerPort`              | ✅       | Structured logging                                                     |
| `clock`                     | `ClockPort`               | ✅       | Time source — pass `{ now: () => new Date() }` in production           |
| `secureToken`               | `SecureTokenPort`         | ✅       | Generates and hashes opaque tokens — use `WebCryptoSecureTokenAdapter` |
| `tokenLifespanMinutes`      | `number`                  | ✗        | Receipt token lifespan (default: 60)                                   |
| `resetTokenLifespanMinutes` | `number`                  | ✗        | Reset token lifespan (default: 15)                                     |

**Methods:**

| Method                                                        | Returns                                              | Description                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `registerWithPassword({ email, password })`                   | `{ account }`                                        | Creates account + password credential                                           |
| `authenticateWithPassword({ email, password })`               | `{ receipt, account }`                               | Verifies password, issues receipt                                               |
| `addPasswordToAccount({ accountId, password })`               | `{ success }`                                        | Adds a password credential to an existing account                               |
| `changePassword({ accountId, currentPassword, newPassword })` | `{ success }`                                        | Verifies current password, stores new hash                                      |
| `requestPasswordReset({ email })`                             | `{ challengeId, plainTextToken, expiresAt } \| null` | Generates a secure reset token (`plainTextToken` should be delivered via email) |
| `verifyPasswordReset({ token })`                              | `{ receipt }`                                        | Exchanges a valid token for a short-lived receipt                               |
| `revokeAllPasswordResets({ accountId })`                      | `{ success }`                                        | Invalidates all pending reset tokens for an account                             |

---

### `OAuthModule(config)`

Returns `OAuthMethods & AuthModule`.

**Config** — all fields required unless noted:

| Field                  | Type                   | Required | Description                          |
| ---------------------- | ---------------------- | -------- | ------------------------------------ |
| `accountRepo`          | `AccountRepository`    | ✅       | Account persistence                  |
| `oauthStore`           | `OAuthCredentialStore` | ✅       | Stores OAuth credentials             |
| `receiptSigner`        | `ReceiptSigner`        | ✅       | Signs receipt JWTs                   |
| `idGenerator`          | `IdGeneratorPort`      | ✅       | Unique-ID strategy                   |
| `logger`               | `LoggerPort`           | ✅       | Structured logging                   |
| `tokenLifespanMinutes` | `number`               | ✗        | Receipt token lifespan (default: 60) |

**Methods:**

| Method                                                    | Returns                | Description                                                  |
| --------------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `authenticateWithOAuth({ provider, providerId, email })`  | `{ receipt, account }` | Three-phase flow: fast-path / conflict-guard / auto-register |
| `linkOAuthToAccount({ accountId, provider, providerId })` | `{ success }`          | Links a provider to an already-authenticated account         |
| `unlinkProvider(accountId, provider)`                     | `void`                 | Removes a specific OAuth provider from an account            |

---

### `MagicLinkModule(config)`

Returns `MagicLinkMethods & AuthModule`.

**Config** — all fields required unless noted:

| Field                    | Type                  | Required | Description                                          |
| ------------------------ | --------------------- | -------- | ---------------------------------------------------- |
| `accountRepo`            | `AccountRepository`   | ✅       | Account persistence                                  |
| `magicLinkStore`         | `MagicLinkTokenStore` | ✅       | Stores magic-link tokens                             |
| `receiptSigner`          | `ReceiptSigner`       | ✅       | Signs receipt JWTs                                   |
| `idGenerator`            | `IdGeneratorPort`     | ✅       | Unique-ID strategy                                   |
| `logger`                 | `LoggerPort`          | ✅       | Structured logging                                   |
| `clock`                  | `ClockPort`           | ✅       | Time source                                          |
| `secureToken`            | `SecureTokenPort`     | ✅       | Generates and hashes opaque tokens                   |
| `tokenLifespanMinutes`   | `number`              | ✗        | Magic-link token lifespan (default: 15)              |
| `receiptLifespanMinutes` | `number`              | ✗        | Receipt lifespan after magic-link auth (default: 60) |

**Methods:**

| Method                                 | Returns                         | Description                                                           |
| -------------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `requestMagicLink({ email })`          | `{ token }`                     | Generates a secure magic-link token (plaintext — embed in email link) |
| `authenticateWithMagicLink({ token })` | `{ receipt, accountId, email }` | Verifies token, issues receipt                                        |

---

### `AuthOrchestrator(modules)`

Cross-module policy enforcement. Pass an array of `AuthModule` instances:

| Method                                          | Returns                  | Description                                                                              |
| ----------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `getAccountAuthMethods(accountId)`              | `Array<{ kind, count }>` | All active auth methods for the account                                                  |
| `removeAuthMethod(accountId, method, options?)` | `void`                   | Removes an auth method; throws `CannotRemoveLastCredentialError` if it would be the last |
| `countTotalCredentials(accountId)`              | `number`                 | Counts credentials across all registered modules                                         |
| `getModule(kind)`                               | `AuthModule`             | Returns a registered module by kind                                                      |
| `hasModule(kind)`                               | `boolean`                | Checks if a module is registered                                                         |
| `getRegisteredKinds()`                          | `string[]`               | Lists all registered module kinds                                                        |

```ts
// Remove password auth (enforces last-credential guard)
await orchestrator.removeAuthMethod(accountId, "password");

// Unlink a specific OAuth provider
await orchestrator.removeAuthMethod(accountId, "oauth", { provider: "google" });

// Inspect what methods an account has
const methods = await orchestrator.getAccountAuthMethods(accountId);
// [{ kind: "password", count: 1 }, { kind: "oauth", count: 2 }]
```

## Ports

| Port                      | Required by                         | Purpose                                                                              |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `AccountRepository`       | All modules                         | Persist and retrieve accounts                                                        |
| `PasswordHashStore`       | `PasswordModule`                    | Persist hashed passwords — one record per account, upsert semantics                  |
| `PasswordResetTokenStore` | `PasswordModule`                    | Persist reset tokens — many per account, short-lived                                 |
| `OAuthCredentialStore`    | `OAuthModule`                       | Persist and retrieve OAuth credentials                                               |
| `MagicLinkTokenStore`     | `MagicLinkModule`                   | Persist and retrieve magic-link tokens                                               |
| `PasswordHasher`          | `PasswordModule`                    | Hash and compare passwords — use `@odysseon/whoami-adapter-argon2`                   |
| `ReceiptSigner`           | All modules                         | Sign receipt JWTs — use `@odysseon/whoami-adapter-jose`                              |
| `LoggerPort`              | All modules                         | Structured logging (`info`, `warn`, `error`)                                         |
| `IdGeneratorPort`         | All modules                         | `{ generate(): string }` — any unique-ID strategy                                    |
| `ClockPort`               | `PasswordModule`, `MagicLinkModule` | Override `Date.now()` — useful for testing                                           |
| `SecureTokenPort`         | `PasswordModule`, `MagicLinkModule` | Generate opaque tokens and SHA-256 hashes — use `@odysseon/whoami-adapter-webcrypto` |

## Domain errors

All domain errors extend `DomainError`. Switch on `err.code` — codes are stable API, messages are for humans.

Core errors do **not** carry HTTP status codes. Instead, they carry a semantic `DomainErrorCategory`. Adapters (like `@odysseon/whoami-adapter-express`) map these categories to the appropriate HTTP status code. This is a load-bearing architectural constraint ensuring the domain remains completely agnostic to the transport layer.

```ts
try {
  await password.registerWithPassword(input);
} catch (err) {
  if (err instanceof DomainError) {
    switch (err.code) {
      case "ACCOUNT_ALREADY_EXISTS": // ...
      case "INVALID_EMAIL": // ...
    }
  }
}
```

| Error class                       | Code                            | Category       | Thrown when                                                      |
| --------------------------------- | ------------------------------- | -------------- | ---------------------------------------------------------------- |
| `AccountAlreadyExistsError`       | `ACCOUNT_ALREADY_EXISTS`        | `CONFLICT`     | Registering an email that already has an account                 |
| `AccountNotFoundError`            | `ACCOUNT_NOT_FOUND`             | `NOT_FOUND`    | A use case looks up an account by ID and finds none              |
| `AuthenticationError`             | `AUTHENTICATION_ERROR`          | `UNAUTHORIZED` | Credential verification fails (intentionally vague)              |
| `WrongCredentialTypeError`        | `WRONG_CREDENTIAL_TYPE`         | `INTERNAL`     | Accessing a proof field that doesn't match the credential kind   |
| `InvalidReceiptError`             | `INVALID_RECEIPT`               | `UNAUTHORIZED` | Receipt token is empty, expired, or fails signature verification |
| `InvalidEmailError`               | `INVALID_EMAIL`                 | `BAD_REQUEST`  | Constructing `EmailAddress` with an invalid value                |
| `InvalidConfigurationError`       | `INVALID_CONFIGURATION`         | `INTERNAL`     | A use case is constructed with an invalid config value           |
| `InvalidCredentialError`          | `INVALID_CREDENTIAL`            | `BAD_REQUEST`  | A credential factory receives an empty proof field               |
| `InvalidAccountIdError`           | `INVALID_ACCOUNT_ID`            | `BAD_REQUEST`  | Constructing `AccountId` with an empty value                     |
| `InvalidCredentialIdError`        | `INVALID_CREDENTIAL_ID`         | `BAD_REQUEST`  | Constructing `CredentialId` with an empty value                  |
| `CredentialAlreadyExistsError`    | `CREDENTIAL_ALREADY_EXISTS`     | `CONFLICT`     | Adding a password to an account that already has one             |
| `OAuthProviderNotFoundError`      | `OAUTH_PROVIDER_NOT_FOUND`      | `NOT_FOUND`    | Removing an OAuth provider not linked to the account             |
| `CannotRemoveLastCredentialError` | `CANNOT_REMOVE_LAST_CREDENTIAL` | `CONFLICT`     | Removing the last auth method would lock the account             |
| `UnsupportedAuthMethodError`      | `UNSUPPORTED_AUTH_METHOD`       | `BAD_REQUEST`  | `removeAuthMethod` called for an unconfigured method             |
| `InvalidResetTokenError`          | `INVALID_RESET_TOKEN`           | `UNAUTHORIZED` | Token not found, already used, or expired                        |
| `InvalidMagicLinkError`           | `INVALID_MAGIC_LINK`            | `UNAUTHORIZED` | Token not found, already used, or expired                        |

## License

[ISC](LICENSE)
