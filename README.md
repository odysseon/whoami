# whoami

Identity-first authentication for TypeScript applications.

> [!WARNING]
> The legacy `WhoamiService` facade in `@odysseon/whoami-core` is deprecated and scheduled for removal in `v4.0.0`.
> New integrations should use the feature-first API and the Express example in [packages/example-express/](packages/example-express/README.md).

## Why Teams Pick It

- Keep authentication rules in a framework-agnostic core.
- Compose only the adapters you need for hashing, JWTs, and framework integration.
- Preserve strong typing across user IDs, including `string` and `number` identifiers.

## Architecture At A Glance

```mermaid
graph TD
    App["Application"] --> Core["Whoami Core"]
    Core --> Ports["Ports"]
    Ports --> Repos["Repositories"]
    Ports --> Security["Security Adapters"]
    Ports --> Utilities["Framework Utilities"]
    Security --> Argon2["Argon2"]
    Security --> Jose["JOSE"]
    Security --> WebCrypto["WebCrypto"]
    Utilities --> Nest["NestJS Adapter"]
```

## Quick Links

| Area | Purpose |
| --- | --- |
| [packages/](packages/README.md) | Package map for the monorepo |
| [packages/core/](packages/core/README.md) | Core authentication engine |
| [docs/architecture.md](docs/architecture.md) | Architecture overview |
| [docs/type-model.md](docs/type-model.md) | ID and token typing rules |

## Package Map

- `@odysseon/whoami-core`: the domain facade, contracts, and orchestration logic.
- `@odysseon/whoami-adapter-argon2`: password hashing adapter.
- `@odysseon/whoami-adapter-jose`: JWT signing and verification adapter.
- `@odysseon/whoami-adapter-webcrypto`: deterministic token hashing adapter.
- `@odysseon/whoami-adapter-nestjs`: NestJS module, controller, guard, and exception filter.

## Quick Start

```bash
pnpm install
pnpm test
```

Feature-first example:

```ts
import { RegisterAccountUseCase } from "@odysseon/whoami-core";
```

Legacy facade example:

```ts
import { WhoamiService, type UserWithEmail } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

type AppUser = {
  id: number;
  email: string;
};

const whoami = new WhoamiService<AppUser>({
  configuration: {
    authMethods: { credentials: true },
    refreshTokens: { enabled: true },
  },
  logger: console,
  tokenSigner: new JoseTokenSigner({
    secret: "replace-this-with-a-long-secret-of-at-least-32-characters",
  }),
  passwordHasher: new Argon2PasswordHasher(),
  tokenHasher: new WebCryptoTokenHasher(),
  tokenGenerator: {
    generate: () => crypto.randomUUID(),
  },
  passwordUserRepository: myPasswordRepository,
  refreshTokenRepository: myRefreshTokenRepository,
});

const user: UserWithEmail<AppUser> = await whoami.registerWithEmail({
  email: "user@example.com",
  password: "correct horse battery staple",
});
```

`WhoamiService` remains supported for migration, but it is deprecated and targeted for removal in `v4.0.0`.

## Development

```bash
pnpm -r exec tsc --noEmit
pnpm test
```

## License

[ISC](LICENSE)
