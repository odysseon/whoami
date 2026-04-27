# whoami

**whoami answers one question: who is making this request?**

It handles identity — registration, authentication (password and OAuth), and signed receipt tokens. It does not manage profiles, roles, or application-level user data. That is intentionally your domain.

## Why this matters

Most auth libraries conflate identity with user management. They force you to extend their `User` model, fight their schema, and work around their assumptions. whoami owns exactly one thing:

```
AccountId ──► "This request is from account abc-123. You can trust that."
```

Everything else — what that account can do, what profile they have, what community they belong to — lives in your application, linked by a single foreign key.

## How your entities link to Account

whoami returns an `AccountId` after authentication. Your application creates its own user record linked by that ID. No base class to extend, no schema to fight.

```
whoami DB:
  accounts  { id, email }                      ← all whoami ever stores

your DB:
  users     { id, account_id ← accountId.value, display_name, avatar, ... }
  posts     { id, author_id  → users.id }
  channels  { id, owner_id   → users.id }
```

## Packages

| Package | npm scope | Purpose |
|---|---|---|
| [`core`](packages/core/README.md) | `@odysseon/whoami-core` | Domain logic, port interfaces, module factories, `AuthOrchestrator` |
| [`adapter-argon2`](packages/adapter-argon2/README.md) | `@odysseon/whoami-adapter-argon2` | `PasswordHasher` via argon2 |
| [`adapter-jose`](packages/adapter-jose/README.md) | `@odysseon/whoami-adapter-jose` | `ReceiptSigner` / `ReceiptVerifier` via jose (HS256 JWT) |
| [`adapter-nestjs`](packages/adapter-nestjs/README.md) | `@odysseon/whoami-adapter-nestjs` | NestJS module, guard, decorators, exception filter, OAuth handler |

## Examples

| Example | Framework | What it shows |
|---|---|---|
| [`example-nestjs`](packages/example-nestjs/README.md) | NestJS 11 | Full wiring — password + OAuth flows, global guard, Swagger UI |
| [`example-express`](packages/example-express/README.md) | Express 5 | Minimal wiring — password + OAuth flows, custom auth middleware |

## Quick start

```bash
pnpm install

# run the NestJS example
pnpm --filter @odysseon/whoami-example-nestjs dev

# run the Express example
pnpm --filter @odysseon/whoami-example-express dev

# run all tests
pnpm test

# typecheck all packages
pnpm -r exec tsc --noEmit
```

## Key docs

| Doc | Audience |
|---|---|
| [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) | Why whoami exists and what it stands for |
| [docs/architecture.md](docs/architecture.md) | Zone model, dependency rules, internal structure — contributors only |
| [docs/type-model.md](docs/type-model.md) | `AccountId`, `Receipt`, `CredentialProof`, error types |

## License

[ISC](LICENSE)
