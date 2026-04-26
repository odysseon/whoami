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
import { AuthOrchestrator } from "@odysseon/whoami-core/kernel";

const password = PasswordModule({
  accountRepo,
  passwordStore,
  passwordHasher,
  receiptSigner,
  idGenerator,
  logger,
});

const oauth = OAuthModule({
  accountRepo,
  oauthStore,
  receiptSigner,
  idGenerator,
  logger,
});

// Each module is fully typed — no casts, no assertions
const { receipt } = await password.authenticateWithPassword({
  email,
  password,
});

// Cross-module policy — explicit opt-in
const orchestrator = new AuthOrchestrator([password, oauth]);
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

Returns `PasswordMethods & AuthModule`:

| Method                                                        | Returns                | Description                                         |
| ------------------------------------------------------------- | ---------------------- | --------------------------------------------------- |
| `registerWithPassword({ email, password })`                   | `{ account }`          | Creates account + password credential               |
| `authenticateWithPassword({ email, password })`               | `{ receipt, account }` | Verifies password, issues receipt                   |
| `addPasswordToAccount({ accountId, password })`               | `void`                 | Adds a password credential to an existing account   |
| `changePassword({ accountId, currentPassword, newPassword })` | `void`                 | Verifies current password, stores new hash          |
| `requestPasswordReset({ email })`                             | `{ token }`            | Generates a secure reset token (plaintext)          |
| `verifyPasswordReset({ token, newPassword })`                 | `{ receipt }`          | Exchanges valid token for a short-lived receipt     |
| `revokeAllPasswordResets({ accountId })`                      | `void`                 | Invalidates all pending reset tokens for an account |

Config requires: `accountRepo`, `passwordStore`, `passwordHasher`, `receiptSigner`, `idGenerator`, `logger`. Optional: `clock`, `secureToken`, `tokenLifespanMinutes`.

### `OAuthModule(config)`

Returns `OAuthMethods & AuthModule`:

| Method                                                           | Returns                | Description                                                  |
| ---------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `authenticateWithOAuth({ provider, providerId, email })`         | `{ receipt, account }` | Three-phase flow: fast-path / conflict-guard / auto-register |
| `linkOAuthToAccount({ accountId, provider, providerId, email })` | `void`                 | Links a provider to an already-authenticated account         |
| `unlinkProvider(accountId, provider)`                            | `void`                 | Removes a specific OAuth provider from an account            |

Config requires: `accountRepo`, `oauthStore`, `receiptSigner`, `idGenerator`, `logger`. Optional: `clock`, `tokenLifespanMinutes`.

### `MagicLinkModule(config)`

Returns `MagicLinkMethods & AuthModule`:

| Method                                 | Returns                | Description                                     |
| -------------------------------------- | ---------------------- | ----------------------------------------------- |
| `requestMagicLink({ email })`          | `{ token }`            | Generates a secure magic-link token (plaintext) |
| `authenticateWithMagicLink({ token })` | `{ receipt, account }` | Verifies token, returns receipt                 |

Config requires: `accountRepo`, `magicLinkStore`, `receiptSigner`, `idGenerator`, `logger`, `secureToken`. Optional: `clock`, `tokenLifespanMinutes`.

### `AuthOrchestrator(modules)`

Cross-module policy enforcement. Pass an array of `AuthModule` instances:

| Method                                          | Description                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `getAccountAuthMethods(accountId)`              | Returns all active auth methods for the account                                          |
| `removeAuthMethod(accountId, method, options?)` | Removes an auth method; throws `CannotRemoveLastCredentialError` if it would be the last |
| `countTotalCredentials(accountId)`              | Counts credentials across all registered modules                                         |

```ts
// Remove password auth
await orchestrator.removeAuthMethod(accountId, "password");

// Unlink a specific OAuth provider
await orchestrator.removeAuthMethod(accountId, "oauth", { provider: "google" });
```

## Ports

Ports are interfaces your infrastructure must implement. You provide them when constructing a module.

| Port                       | Required by                         | Purpose                                                                              |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `AccountRepository`        | All modules                         | Persist and retrieve accounts                                                        |
| `PasswordCredentialStore`  | `PasswordModule`                    | Persist and retrieve password credentials                                            |
| `OAuthCredentialStore`     | `OAuthModule`                       | Persist and retrieve OAuth credentials                                               |
| `MagicLinkCredentialStore` | `MagicLinkModule`                   | Persist and retrieve magic-link credentials                                          |
| `PasswordHasher`           | `PasswordModule`                    | Hash and compare passwords — use `@odysseon/whoami-adapter-argon2`                   |
| `ReceiptSigner`            | All modules                         | Sign receipt JWTs — use `@odysseon/whoami-adapter-jose`                              |
| `LoggerPort`               | All modules                         | Structured logging (`info`, `warn`, `error`)                                         |
| `IdGeneratorPort`          | All modules                         | `() => string` — any unique-ID strategy                                              |
| `ClockPort`                | Optional                            | Override `Date.now()` for testing                                                    |
| `SecureTokenPort`          | `PasswordModule`, `MagicLinkModule` | Generate opaque tokens and SHA-256 hashes — use `@odysseon/whoami-adapter-webcrypto` |

## Domain errors

All domain errors extend `DomainError`. Switch on `err.code` — codes are stable API, messages are for humans.

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

| Error class                       | Code                            | Thrown when                                                      |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `AccountAlreadyExistsError`       | `ACCOUNT_ALREADY_EXISTS`        | Registering an email that already has an account                 |
| `AccountNotFoundError`            | `ACCOUNT_NOT_FOUND`             | A use case looks up an account by ID and finds none              |
| `AuthenticationError`             | `AUTHENTICATION_ERROR`          | Credential verification fails (intentionally vague)              |
| `WrongCredentialTypeError`        | `WRONG_CREDENTIAL_TYPE`         | Accessing a proof field that doesn't match the credential kind   |
| `InvalidReceiptError`             | `INVALID_RECEIPT`               | Receipt token is empty, expired, or fails signature verification |
| `InvalidEmailError`               | `INVALID_EMAIL`                 | Constructing `EmailAddress` with an invalid value                |
| `InvalidConfigurationError`       | `INVALID_CONFIGURATION`         | A use case is constructed with an invalid config value           |
| `InvalidCredentialError`          | `INVALID_CREDENTIAL`            | A credential factory receives an empty proof field               |
| `InvalidAccountIdError`           | `INVALID_ACCOUNT_ID`            | Constructing `AccountId` with an empty value                     |
| `InvalidCredentialIdError`        | `INVALID_CREDENTIAL_ID`         | Constructing `CredentialId` with an empty value                  |
| `CredentialAlreadyExistsError`    | `CREDENTIAL_ALREADY_EXISTS`     | Adding a password to an account that already has one             |
| `OAuthProviderNotFoundError`      | `OAUTH_PROVIDER_NOT_FOUND`      | Removing an OAuth provider not linked to the account             |
| `CannotRemoveLastCredentialError` | `CANNOT_REMOVE_LAST_CREDENTIAL` | Removing the last auth method would lock the account             |
| `UnsupportedAuthMethodError`      | `UNSUPPORTED_AUTH_METHOD`       | `removeAuthMethod` called for an unconfigured method             |

## License

[ISC](LICENSE)
