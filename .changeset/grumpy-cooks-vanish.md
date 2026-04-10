---
"@odysseon/whoami-core": minor
---

- **Password Updates**: Added `UpdatePasswordUseCase` and `auth.updatePassword()` to allow authenticated users to securely change their passwords.

- **Facade Architecture**: All authentication flows are now centralized in the `createAuth` factory. Concrete use cases are moved to the `/internal` entry point.
- **NestJS Global Module**: `WhoamiModule` is now marked as `@Global()` and `WhoamiOAuthModule` has been merged into it.
- **Port Updates**: `PasswordCredentialStore` now requires an `update` method.
