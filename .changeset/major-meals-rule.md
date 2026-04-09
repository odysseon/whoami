---
"@odysseon/whoami-adapter-nestjs": major
---

Breaking Change: Refactored NestJS integration for better developer experience.

- `WhoamiModule` is now a Global module; manual imports in feature modules are no longer required.
- Deleted `WhoamiOAuthModule`. `OAuthCallbackHandler` is now provided directly by the main `WhoamiModule`.
- Moved `AUTH_METHODS` token to `@odysseon/whoami-adapter-nestjs/tokens`.
