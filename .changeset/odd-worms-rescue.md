---
"@odysseon/whoami-core": major
---

Introduced a plugin-based authentication architecture and added full OAuth support.

- Refactored `createAuth` to support modular configuration for password and OAuth strategies.
- Added `authenticateWithOAuth` and `linkOAuthToAccount` methods.
- Added support for adding/removing authentication methods with safety guards against "orphaned" accounts.
- Updated registration and login flows to consistently return authentication receipts.
- Moved and standardized authentication types in a dedicated `types.ts` file.
