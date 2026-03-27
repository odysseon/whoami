# @odysseon/whoami-core

```mermaid
graph TD
    Service["WhoamiService"] --> Config["ConfigurationValidator"]
    Service --> Creds["CredentialAuthenticator"]
    Service --> OAuth["OAuthAuthenticator"]
    Service --> Tokens["TokenOrchestrator"]
    Creds --> PasswordRepo["IPasswordUserRepository"]
    OAuth --> OAuthRepo["IOAuthUserRepository"]
    Tokens --> Signer["ITokenSigner"]
    Tokens --> TokenHasher["IDeterministicTokenHasher"]
    Tokens --> TokenGenerator["ITokenGenerator"]
    Tokens --> RefreshRepo["IRefreshTokenRepository"]
```

## Delegated Responsibility

This package is responsible for enforcing authentication rules and exposing the contracts that adapters must implement.

## Purpose And Content

- `WhoamiService` exposes a single facade for registration, login, refresh, and verification.
- Service classes split credential auth, OAuth auth, configuration validation, and token orchestration into focused units.
- Interface modules define repository, security, and utility ports without importing infrastructure code.
- Error types keep the domain vocabulary explicit and framework-agnostic.

## Type Guarantees

- `HasId["id"]` supports both `string` and `number`.
- Repository and refresh-token contracts preserve `TEntity["id"]` instead of downgrading to `string`.
- The core leaves JWT serialization details to the token signer adapter, but the domain payload still models `sub` as `string | number`.

## Local Flow

- Validate configuration.
- Route the request to the credential or OAuth authenticator.
- Issue or refresh tokens through the token orchestrator.
- Delegate persistence and cryptography through injected ports.

## License

[ISC](LICENSE)
