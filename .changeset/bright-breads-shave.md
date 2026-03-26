---
"@odysseon/whoami-adapter-nestjs": major
---

Completely rebuilt the NestJS adapter to align with the pure identity core `0.6.0`.

- **Generic OAuth Routing:** Replaced `loginWithGoogle` with the generic `loginWithOAuth` controller endpoint.
- **Enterprise Boundaries:** Introduced `WhoamiExceptionFilter` to automatically map pure core domain errors (e.g., `TOKEN_EXPIRED`) to standard HTTP status codes (`410 Gone`).
- **Secure By Default:** Added a globally bindable `WhoamiAuthGuard` paired with a `@Public()` decorator.
- **DX Luxuries:** Added the `@CurrentIdentity()` parameter decorator for strictly-typed JWT payload extraction in route handlers.
- **Decoupled Extraction:** Implemented the `ITokenExtractor` port via `BearerTokenExtractor`, allowing consumers to override how tokens are pulled from requests via `WhoamiModule` options.
