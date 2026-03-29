# @odysseon/whoami-example-nestjs

A NestJS 11 application demonstrating all `@odysseon/whoami-*` adapters wired through the NestJS DI container.

## Adapters used

| Adapter                              | Role                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `@odysseon/whoami-adapter-argon2`    | Hashes and verifies passwords                                                                 |
| `@odysseon/whoami-adapter-jose`      | Signs and verifies receipt JWTs                                                               |
| `@odysseon/whoami-adapter-webcrypto` | Hashes magic-link tokens before storage                                                       |
| `@odysseon/whoami-adapter-nestjs`    | `WhoamiModule`, `WhoamiAuthGuard`, `WhoamiExceptionFilter`, `@CurrentIdentity()`, `@Public()` |

## Module structure

```
AppModule
├── AuthModule           (imports AccountsModule)
│   └── AccountsModule   ← shared stores + Argon2PasswordHasher
└── IdentityModule       (imports AccountsModule + WhoamiModule)
    └── AccountsModule   ← NestJS deduplicates to a single singleton
```

`AccountsModule` is imported by both `AuthModule` and `IdentityModule`. NestJS deduplicates module instances so the in-memory stores remain true singletons across all features.

`WhoamiAuthGuard` is registered via `APP_GUARD` in `IdentityModule`, making every route protected by default. Routes that should be publicly accessible are decorated with `@Public()`.

## Run

```bash
# development (tsx, no compile step)
pnpm --filter @odysseon/whoami-example-nestjs dev

# production (compiled)
pnpm --filter @odysseon/whoami-example-nestjs build
pnpm --filter @odysseon/whoami-example-nestjs start
```

Set `PORT` to override the default (`3000`). Set `JOSE_SECRET` to a string of at least 32 characters to use a custom signing secret.

## Routes

| Method | Path                       | Auth         | Description                                             |
| ------ | -------------------------- | ------------ | ------------------------------------------------------- |
| `POST` | `/accounts/register`       | Public       | Create an account + password credential                 |
| `POST` | `/auth/login`              | Public       | Verify password, issue receipt token                    |
| `POST` | `/auth/magic-link/request` | Public       | Generate a magic-link token (returned in body for demo) |
| `POST` | `/auth/magic-link/verify`  | Public       | Verify magic-link token, issue receipt token            |
| `POST` | `/auth/oauth`              | Public       | Auto-register or verify via OAuth, issue receipt token  |
| `GET`  | `/me`                      | Bearer token | Return authenticated account profile                    |

## cURL Examples

**Register:**

```bash
curl -X POST http://localhost:3000/accounts/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

**Magic-link request:**

```bash
curl -X POST http://localhost:3000/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}'
```

**Magic-link verify** (use the `magicLinkToken` from the request response):

```bash
curl -X POST http://localhost:3000/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","token":"<magicLinkToken>"}'
```

**OAuth login** (auto-registers on first call):

```bash
curl -X POST http://localhost:3000/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","provider":"google","providerId":"g-12345"}'
```

**Protected profile** (use the `token` from any login response):

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer <token>"
```
