# Packages

| Package                                            | npm scope                            | Description                                                               |
| -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| [`core`](core/README.md)                           | `@odysseon/whoami-core`              | Domain entities, use cases, port interfaces, and the `createAuth` factory |
| [`adapter-argon2`](adapter-argon2/README.md)       | `@odysseon/whoami-adapter-argon2`    | `PasswordManager` via argon2                                              |
| [`adapter-jose`](adapter-jose/README.md)           | `@odysseon/whoami-adapter-jose`      | `ReceiptSigner` / `ReceiptVerifier` via jose (HS256 JWT)                  |
| [`adapter-webcrypto`](adapter-webcrypto/README.md) | `@odysseon/whoami-adapter-webcrypto` | `TokenHasher` via native Web Crypto API                                   |
| [`adapter-nestjs`](adapter-nestjs/README.md)       | `@odysseon/whoami-adapter-nestjs`    | NestJS module, guard, decorator, exception filter, OAuth handler          |
| [`example-nestjs`](example-nestjs/README.md)       | `@odysseon/whoami-example-nestjs`    | NestJS 11 reference app                                                   |
| [`example-express`](example-express/README.md)     | `@odysseon/whoami-example-express`   | Express 5 reference app                                                   |

## Dependency graph

```mermaid
graph TD
    Core["@odysseon/whoami-core"]

    Argon2["@odysseon/whoami-adapter-argon2"] --> Core
    Jose["@odysseon/whoami-adapter-jose"] --> Core
    WebCrypto["@odysseon/whoami-adapter-webcrypto"] --> Core
    NestJS["@odysseon/whoami-adapter-nestjs"] --> Core

    ExNest["example-nestjs"] --> Core
    ExNest --> Argon2
    ExNest --> Jose
    ExNest --> WebCrypto
    ExNest --> NestJS

    ExExpress["example-express"] --> Core
    ExExpress --> Argon2
    ExExpress --> Jose
    ExExpress --> WebCrypto
```
