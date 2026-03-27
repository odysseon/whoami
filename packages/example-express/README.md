# Example Express App

This package is a small Express application that consumes `@odysseon/whoami-core`.

## Run

```bash
pnpm --filter @odysseon/whoami-example-express dev
```

## Endpoints

- `GET /health`
- `POST /accounts/register`
- `POST /magic-links`
- `POST /sessions/password`
- `POST /sessions/magic-link`

## cURL Examples

Health check:

```bash
curl http://localhost:3000/health
```

Register an account with a password:

```bash
curl -X POST http://localhost:3000/accounts/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ada@example.com\",\"password\":\"secret123\"}"
```

Create a magic link for an existing account:

```bash
curl -X POST http://localhost:3000/magic-links \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ada@example.com\"}"
```

Login with email and password:

```bash
curl -X POST http://localhost:3000/sessions/password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ada@example.com\",\"password\":\"secret123\"}"
```

Login with a magic link token returned by `/magic-links`:

```bash
curl -X POST http://localhost:3000/sessions/magic-link \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ada@example.com\",\"token\":\"magic:replace-me\"}"
```
