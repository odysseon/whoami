# Source Code (@odysseon/whoami-core)

This directory contains the source code for `@odysseon/whoami-core`, organised by feature.

```
src/
├── whoami.ts               createAuth() factory — composes all use-cases into AuthMethods
├── types.ts                AuthConfig, AuthMethods, AuthMethod types
├── index.ts                Public API (createAuth, ports, entities, errors, VOs)
├── internal/
│   └── index.ts            Internal API — concrete use-case classes for adapter DI wiring
└── features/
    ├── accounts/
    │   ├── application/    RegisterAccountUseCase
    │   ├── domain/         Account entity, AccountRepository port
    │   └── index.ts
    ├── authentication/
    │   ├── add-password-auth.usecase.ts       AddPasswordAuthUseCase
    │   ├── authenticate-oauth.usecase.ts      AuthenticateOAuthUseCase
    │   ├── authenticate-password.usecase.ts   AuthenticateWithPasswordUseCase
    │   └── index.ts
    ├── credentials/
    │   ├── application/    RegisterWithPasswordUseCase, LinkOAuthToAccountUseCase,
    │   │                   RemovePasswordUseCase
    │   ├── domain/         Credential entity, PasswordCredentialStore port,
    │   │                   OAuthCredentialStore port, PasswordManager port,
    │   │                   TokenHasher port, CredentialProof types
    │   └── index.ts
    └── receipts/
        ├── application/    IssueReceiptUseCase, VerifyReceiptUseCase
        ├── domain/         Receipt entity, ReceiptSigner port, ReceiptVerifier port
        └── index.ts
```

## API boundary

`index.ts` exports the public surface. `internal/index.ts` exports concrete use-case classes — only for use by adapter packages that need to wire use-cases into a DI container (e.g. `WhoamiModule` in `adapter-nestjs`). Application code must not import from `internal`.
