# @odysseon/whoami-adapter-express

Express 5 integration for `@odysseon/whoami-core`. Provides middleware for extracting and verifying receipt tokens, as well as an error handler that automatically maps domain errors to the correct HTTP status codes.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-express express
```

**Peer dependencies:** Requires `express@^5.0.0` and `@odysseon/whoami-core@13.0.0`.

---

## What's included

This adapter exports three main utilities:

1. `requireAuth(verifier)`
2. `optionalAuth(verifier)`
3. `whoamiErrorHandler()`

It also augments the Express `Request` object with strongly typed `identity` and `accountId` properties.

---

## Authentication Middleware

### `requireAuth(verifier)`

Middleware that enforces authentication. It extracts the `Authorization: Bearer <token>` header and verifies it using the provided `ReceiptVerifier`.

- **Success:** Sets `req.identity` and `req.accountId`, then calls `next()`.
- **Failure:** If the token is missing, malformed, or invalid (e.g., expired), it immediately responds with a `401 Unauthorized` JSON payload. It does _not_ forward authentication errors to the global error handler.

### `optionalAuth(verifier)`

Middleware for routes where authentication is optional.

- **Present & Valid:** If a token is provided and is valid, it sets `req.identity` and calls `next()`.
- **Missing or Invalid:** If no token is provided, or if the token fails verification, it silently swallows the error, does not set `req.identity`, and calls `next()`.

### The `req.identity` object

Both middlewares deliberately strip the raw receipt token from the request. This ensures sensitive tokens aren't accidentally leaked into logs, caches, or downstream services.

```ts
interface RequestIdentity {
  readonly accountId: AccountId;
  readonly expiresAt: Date;
}
```

You can access it in your route handlers:

```ts
app.get("/me", requireAuth(verifier), (req, res) => {
  // TypeScript knows req.identity exists and is a RequestIdentity
  res.json({ accountId: req.identity.accountId });
});
```

---

## Error Handling

### `whoamiErrorHandler()`

An Express error-handling middleware (`ErrorRequestHandler`) that catches any thrown `DomainError` and maps its semantic `DomainErrorCategory` to the appropriate HTTP status code.

**Important:** This must be registered _after_ all your routes.

#### HTTP Status Mapping

Because `@odysseon/whoami-core` is strictly decoupled from the transport layer, its errors carry a semantic category rather than an HTTP status. This handler performs the mapping:

| Domain Error Category | HTTP Status                 |
| :-------------------- | :-------------------------- |
| `BAD_REQUEST`         | `400 Bad Request`           |
| `UNAUTHORIZED`        | `401 Unauthorized`          |
| `NOT_FOUND`           | `404 Not Found`             |
| `CONFLICT`            | `409 Conflict`              |
| `UNPROCESSABLE`       | `422 Unprocessable Entity`  |
| `INTERNAL`            | `500 Internal Server Error` |

It responds with a clean JSON payload:

```json
{
  "statusCode": 409,
  "error": "ACCOUNT_ALREADY_EXISTS",
  "message": "An account with this email is already registered."
}
```

_Note: Programmer errors (`INVALID_CONFIGURATION` and `WRONG_CREDENTIAL_TYPE`) are logged using `console.error()`. All other domain errors are logged with `console.warn()`._

---

## Complete Wiring Example

```ts
import express from "express";
import { JoseReceiptVerifier } from "@odysseon/whoami-adapter-jose";
import {
  requireAuth,
  optionalAuth,
  whoamiErrorHandler,
} from "@odysseon/whoami-adapter-express";

// 1. Setup your verifier (using the JOSE adapter here)
const verifier = new JoseReceiptVerifier({
  secret: process.env.JWT_SECRET,
  issuer: "my-app",
});

const app = express();
app.use(express.json());

// 2. Protect routes
app.get("/api/protected", requireAuth(verifier), (req, res) => {
  res.json({
    message: "You are authenticated!",
    accountId: req.identity.accountId, // Strongly typed
    sessionExpiresAt: req.identity.expiresAt,
  });
});

// 3. Optional auth routes
app.get("/api/public-or-private", optionalAuth(verifier), (req, res) => {
  if (req.identity) {
    res.json({ message: `Welcome back, ${req.identity.accountId}` });
  } else {
    res.json({ message: "Welcome, guest" });
  }
});

// 4. Register the error handler LAST
app.use(whoamiErrorHandler());

app.listen(3000);
```
