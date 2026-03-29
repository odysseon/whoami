# @odysseon/whoami-example-express

A minimal Express 5 application demonstrating all `@odysseon/whoami-*` adapters wired together with in-memory stores.

## Adapters used

| Adapter                              | Role                                    |
| ------------------------------------ | --------------------------------------- |
| `@odysseon/whoami-adapter-argon2`    | Hashes and verifies passwords           |
| `@odysseon/whoami-adapter-jose`      | Signs and verifies receipt JWTs         |
| `@odysseon/whoami-adapter-webcrypto` | Hashes magic-link tokens before storage |

## Run

```bash
pnpm --filter @odysseon/whoami-example-express dev
```

Set `PORT` to override the default (`3000`). Set `JOSE_SECRET` to a string of at least 32 characters to use a custom signing secret.

## Routes

| Method | Path                        | Auth         | Description                                             |
| ------ | --------------------------- | ------------ | ------------------------------------------------------- |
| `POST` | `/register`                 | Public       | Create an account + password credential                 |
| `POST` | `/login`                    | Public       | Verify password, issue receipt token                    |
| `POST` | `/login/magic-link/request` | Public       | Generate a magic-link token (returned in body for demo) |
| `POST` | `/login/magic-link/verify`  | Public       | Verify magic-link token, issue receipt token            |
| `POST` | `/login/oauth`              | Public       | Auto-register or verify via OAuth, issue receipt token  |
| `GET`  | `/me`                       | Bearer token | Return authenticated account profile                    |

## cURL Examples

**Register:**

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

**Magic-link request:**

```bash
curl -X POST http://localhost:3000/login/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}'
```

**Magic-link verify** (use the `magicLinkToken` from the request response):

```bash
curl -X POST http://localhost:3000/login/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","token":"<magicLinkToken>"}'
```

**OAuth login** (auto-registers on first call):

```bash
curl -X POST http://localhost:3000/login/oauth \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","provider":"google","providerId":"g-12345"}'
```

**Protected profile** (use the `token` from any login response):

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer <token>"
```
