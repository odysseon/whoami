---
"@odysseon/whoami-core": major
---

**Core API Removal**

- `createAuth` factory function removed — applications now compose modules directly
- `AuthConfig`, `AuthMethods`, `CoreAuthMethods` types removed
- No central composition layer — each module can be used independently

**AuthModule Interface Redesign**

- Removed generic `TMethods` parameter and `methods` property
- Module factories return `Methods & AuthModule` intersection type
- `removeAllCredentialsForAccount` now accepts optional provider filter
- `AuthOrchestrator` handles filtering generically (no per-module conditionals)

**Export Changes**

- Root export now only contains kernel + modules (no composition layer)
- New `/internal` sub-path for adapter authors (use-case classes only)
- All type casts replace `as unknown as AccountId` with `createAccountId` factory

**SecureTokenPort**

- New port for platform-agnostic cryptographic token operations
- `generateToken()` — 256-bit secure random tokens
- `hashToken()` — SHA-256 hashing with base64url encoding

- All module deserializers now use helper functions (`assertObject`, `credentialProof`)
- Verification script expanded to 13 checks (type safety, module independence, build)
- Better non-null assertion detection in code quality checks

```typescript
// v11: Centralized factory
import { createAuth } from '@odysseon/whoami-core';
const auth = createAuth({ password: {...}, oauth: {...} });

// v12: Direct application composition
import { PasswordModule, OAuthModule } from '@odysseon/whoami-core';
import { AuthOrchestrator } from '@odysseon/whoami-core/kernel';

const password = PasswordModule({ ... });
const oauth = OAuthModule({ ... });
const orchestrator = new AuthOrchestrator([password, oauth]);

// Use methods directly from modules
await password.registerWithPassword({ email, password });
await oauth.authenticateWithOAuth({ provider, providerId, email });

// Use orchestrator for cross-module operations
await orchestrator.removeAuthMethod(accountId, "oauth", { provider: "google" });
```
