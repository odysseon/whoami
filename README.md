# whoami

Proof of identity without the authorization bloat.

## Overview

Whoami is a framework-agnostic, zero-dependency authentication library for JavaScript/TypeScript. It provides a modular ecosystem for secure user authentication, focusing on identity management without the overhead of authorization logic.

Built with strict Hexagonal Architecture (Ports and Adapters), it separates core business logic from infrastructure concerns, making it adaptable to any environment—from Node.js servers to edge runtimes like Cloudflare Workers.

## Packages

This monorepo contains the following packages:

- **[@odysseon/whoami-core](packages/core/)** - The framework-agnostic core engine for identity and authentication.
- **[@odysseon/whoami-adapter-argon2](packages/adapter-argon2/)** - Argon2 password hashing adapter.
- **[@odysseon/whoami-adapter-jose](packages/adapter-jose/)** - JOSE JWT signing and verification adapter.
- **[@odysseon/whoami-adapter-webcrypto](packages/adapter-webcrypto/)** - WebCrypto API hashing adapter for refresh tokens.
- **[@odysseon/whoami-adapter-nestjs](packages/adapter-nestjs/)** - NestJS integration module for seamless dependency injection and secure-by-default routing.

## Installation

Install the core package and choose your adapters:

```bash
npm install @odysseon/whoami-core
# Plus adapters as needed
```

## Quick Start (Core)

```ts
import { WhoamiService } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

// Configure your service using strictly typed dependencies
const authService = new WhoamiService({
  configuration: {
    authMethods: { credentials: true, oauth: true },
    refreshTokens: { enabled: true, refreshTokenTtlSeconds: 604800 },
  },
  passwordHasher: new Argon2PasswordHasher(),
  tokenSigner: new JoseTokenSigner({ secret: "your-secret" }),
  tokenHasher: new WebCryptoTokenHasher(),
  passwordUserRepository: myPasswordRepo,
  oauthUserRepository: myOAuthRepo,
  refreshTokenRepository: myRefreshRepo,
});
```

## License

[ISC](LICENSE)

```

```
