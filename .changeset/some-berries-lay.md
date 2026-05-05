---
"@odysseon/whoami-adapter-webcrypto": minor
"@odysseon/whoami-example-express": minor
"@odysseon/whoami-adapter-argon2": minor
"@odysseon/whoami-adapter-nestjs": minor
"@odysseon/whoami-adapter-prisma": minor
"@odysseon/whoami-example-nestjs": minor
"@odysseon/whoami-adapter-jose": minor
"@odysseon/whoami-core": minor
---

Switch to ESM-only output with subpath exports

- Remove dual CJS/ESM builds across all packages
- Core modules now import from subpaths (`/password`, `/oauth`, `/magiclink`, `/kernel`)
- Root entrypoint no longer re-exports all modules
- Simplify build scripts to single `tsc` invocation
