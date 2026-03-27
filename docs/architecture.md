# Architecture

```mermaid
graph TD
    App["Consumer App"] --> Core["WhoamiService (Core Facade)"]
    Core --> Config["ConfigurationValidator"]
    Core --> Creds["CredentialAuthenticator"]
    Core --> OAuth["OAuthAuthenticator"]
    Core --> Tokens["TokenOrchestrator"]
    Creds --> PasswordRepo["Password User Repository Port"]
    Creds --> PasswordHasher["Password Hasher Port"]
    OAuth --> OAuthRepo["OAuth User Repository Port"]
    Tokens --> TokenSigner["Token Signer Port"]
    Tokens --> TokenHasher["Deterministic Token Hasher Port"]
    Tokens --> TokenGenerator["Token Generator Port"]
    Tokens --> RefreshRepo["Refresh Token Repository Port"]
    Nest["NestJS Adapter"] --> Core
    Jose["JOSE Adapter"] --> TokenSigner
    Argon2["Argon2 Adapter"] --> PasswordHasher
    WebCrypto["WebCrypto Adapter"] --> TokenHasher
```

## Architecture

Whoami uses a hexagonal layout. The core package owns the authentication rules and contracts, while adapters implement framework and crypto details outside the domain.

## Core Responsibilities

- `ConfigurationValidator` fails fast when a dependency is present without an explicit feature flag.
- `CredentialAuthenticator` manages registration, password login, and password updates.
- `OAuthAuthenticator` manages provider login and provider linking.
- `TokenOrchestrator` issues access tokens, rotates refresh tokens, and detects reuse.

## Type Boundaries

- User entities must satisfy `HasId`, and `id` may be either `string` or `number`.
- Repository ports preserve the concrete `TEntity["id"]` type end to end.
- The JOSE adapter serializes numeric IDs into JWT-safe strings and restores them on verification so the core can still work with `number` IDs safely.
