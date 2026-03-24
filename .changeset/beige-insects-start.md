---
"@odysseon/whoami-core": minor
---

**Package Refactoring:** Extracted `WebCryptoTokenHasher` from core into a dedicated adapter package.

**Removed from `@odysseon/whoami-core`:**

- `src/adapters/security/webcrypto-token-hasher.adapter.ts`
- `src/adapters/security/webcrypto-token-hasher.adapter.spec.ts`
- Export of `WebCryptoTokenHasher` from core's `index.ts`

**Moved to:** `@odysseon/whoami-adapter-webcrypto` (new package)

- Improves modularity by separating adapter implementations from core business logic
- Core package now focuses on domain logic and interfaces
- Adapters are optional and can be installed as needed
- Follows the plugin architecture pattern established by `adapter-jose` and `adapter-argon2`

- Consumers who need WebCrypto hashing must now install `@odysseon/whoami-adapter-webcrypto` separately
- Core package becomes lighter with fewer dependencies
