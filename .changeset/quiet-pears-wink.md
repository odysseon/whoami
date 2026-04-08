---
"@odysseon/whoami-core": major
"@odysseon/whoami-adapter-webcrypto": minor
"@odysseon/whoami-adapter-argon2": minor
"@odysseon/whoami-adapter-nestjs": minor
---

- **Breaking Change**: Bifurcated the public API surface. [cite_start]Moved concrete use-case classes to the `@odysseon/whoami-core/internal` entry point to prevent implementation leakage [cite: 82, 86-87, 103].
- [cite_start]Standardized the main index to export only shared primitives, domain entities, ports, and the `createAuth` factory [cite: 83-91, 96].

- [cite_start]**Feature**: Introduced the `AUTH_METHODS` DI token, allowing the full auth facade to be injected directly into services [cite: 61-63, 72].
