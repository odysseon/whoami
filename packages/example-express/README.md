# @odysseon/whoami-example-express

A minimal Express 5 application demonstrating all `@odysseon/whoami-*` adapters wired together with in-memory stores.

## Adapters used

| Adapter                              | Role                               |
| ------------------------------------ | ---------------------------------- |
| `@odysseon/whoami-adapter-argon2`    | Hashes and verifies passwords      |
| `@odysseon/whoami-adapter-jose`      | Signs and verifies receipt JWTs    |
| `@odysseon/whoami-adapter-webcrypto` | Available for opaque token hashing |

## Run

```bash
pnpm --filter @odysseon/whoami-example-express dev
```

Set `PORT` to override the default (`3000`). Set `JOSE_SECRET` to a string of at least 32 characters to use a custom signing secret.

## Routes

| Method | Path           | Auth         | Description                                             |
| ------ | -------------- | ------------ | ------------------------------------------------------- |
| `POST` | `/register`    | Public       | Create an account + password credential, return receipt |
| `POST` | `/login`       | Public       | Verify password, return receipt token                   |
| `POST` | `/login/oauth` | Public       | Auto-register or verify via OAuth, return receipt token |
| `GET`  | `/me`          | Bearer token | Return authenticated account identity                   |

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
