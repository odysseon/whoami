# whoami

Proof of identity without the authorization bloat.

## Overview

Whoami is a framework-agnostic, zero-dependency authentication library for JavaScript/TypeScript. It provides a modular ecosystem for secure user authentication, focusing on identity management without the overhead of authorization logic.

Built with hexagonal architecture (ports and adapters), it separates core business logic from infrastructure concerns, making it adaptable to any environment—from Node.js servers to edge runtimes like Cloudflare Workers.

## Packages

This monorepo contains the following packages:

- **[@odysseon/whoami-core](packages/core/)** - The framework-agnostic core engine for identity and authentication.
- **[@odysseon/whoami-adapter-argon2](packages/adapter-argon2/)** - Argon2 password hashing adapter.
- **[@odysseon/whoami-adapter-jose](packages/adapter-jose/)** - JOSE JWT signing and verification adapter.
- **[@odysseon/whoami-adapter-webcrypto](packages/adapter-webcrypto/)** - WebCrypto API hashing adapter for tokens.
- **[@odysseon/whoami-adapter-nestjs](packages/adapter-nestjs/)** - NestJS integration module for easy dependency injection.

## Installation

Install the core package and choose your adapters:

```bash
npm install @odysseon/whoami-core
# Plus adapters as needed
```

## Quick Start

```ts
import { WhoamiService } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

// Configure your service
const authService = new WhoamiService({
  passwordHasher: new Argon2PasswordHasher(),
  tokenSigner: new JoseTokenSigner({ secret: "your-secret" }),
  tokenHasher: new WebCryptoTokenHasher(),
  // ... other dependencies
});
```

## License

[ISC](LICENSE)
