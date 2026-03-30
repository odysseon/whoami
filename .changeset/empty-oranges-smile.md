---
"@odysseon/whoami-adapter-nestjs": minor
"@odysseon/whoami-core": minor
---

Refactored authentication use cases to use structured input objects and moved callback handlers to the core library.

- Moved `OAuthCallbackHandler` from NestJS adapter to core to make it framework-agnostic.
- Introduced `PasswordCallbackHandler` and `MagicLinkCallbackHandler` in core.
- Changed `VerifyPasswordUseCase.execute` to accept a `VerifyPasswordInput` object instead of positional arguments.
- Standardized NestJS `WhoamiOAuthModule` to act as a DI wrapper for core handlers.
