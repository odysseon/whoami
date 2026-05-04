# Source Code (@odysseon/whoami-core)

This directory contains the source code for `@odysseon/whoami-core`, organised by feature.

```
src/
├── index.ts                Public API — kernel, modules, no central factory
├── internal/
│   └── index.ts            Internal API — concrete use-case classes for adapter DI wiring
├── kernel/
│   ├── domain/             Account, Credential, Receipt entities, value objects, errors
│   ├── ports/              Shared contracts (AuthModule, AccountRepository, ReceiptSigner, ...)
│   └── shared/             AuthOrchestrator, CompositeDeserializer
└── modules/
    ├── password/
    │   ├── index.ts        PasswordModule factory, PasswordMethods, ports, entities, use-cases
    │   ├── password.module.ts
    │   ├── entities/
    │   ├── ports/
    │   └── use-cases/
    ├── oauth/
    │   ├── index.ts        OAuthModule factory, OAuthMethods, ports, entities, use-cases
    │   ├── oauth.module.ts
    │   ├── entities/
    │   ├── ports/
    │   └── use-cases/
    └── magiclink/
        ├── index.ts        MagicLinkModule factory, MagicLinkMethods, ports, entities, use-cases
        ├── magiclink.module.ts
        ├── entities/
        ├── ports/
        └── use-cases/
```

## API boundary

`index.ts` exports the public surface. `internal/index.ts` exports concrete use-case classes — only for use by adapter packages that need to wire use-cases into a DI container (e.g. `WhoamiModule` in `adapter-nestjs`). Application code must not import from `internal`.

## Architecture Principle

**No central factory.** Each module exports its own fully-typed facade. The application layer composes what it needs. The kernel provides cross-module policy (`AuthOrchestrator`) but does not aggregate method surfaces.
