# Source Code

This directory contains the source code for `@odysseon/whoami-core`, organised by feature.

```
src/
├── features/
│   ├── accounts/
│   │   ├── application/    RegisterAccountUseCase
│   │   ├── domain/         Account entity, AccountRepository port
│   │   └── index.ts
│   ├── authentication/
│   │   ├── application/    VerifyPasswordUseCase, VerifyMagicLinkUseCase,
│   │   │                   VerifyOAuthUseCase, AuthenticateOAuthUseCase
│   │   ├── domain/         Credential entity, CredentialStore port,
│   │   │                   PasswordManager port, TokenHasher port, types
│   │   └── index.ts
│   └── receipts/
│       ├── application/    IssueReceiptUseCase, VerifyReceiptUseCase
│       ├── domain/         Receipt entity, ReceiptSigner port, ReceiptVerifier port
│       └── index.ts
└── shared/
    ├── domain/
    │   ├── errors/         DomainError, AccountAlreadyExistsError, AuthenticationError,
    │   │                   InvalidReceiptError, InvalidEmailError, InvalidConfigurationError
    │   ├── ports/          LoggerPort
    │   └── value-objects/  AccountId, EmailAddress, CredentialId
    └── index.ts
```
