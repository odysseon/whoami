# @odysseon/whoami-adapter-prisma

## 1.0.0-dev.1

### Patch Changes

- Updated dependencies [7408441]
  - @odysseon/whoami-core@12.0.0-dev.2

## 1.0.0-dev.0

### Minor Changes

- 9d6b1db: **New Package:** `@odysseon/whoami-adapter-prisma`
  - Implements all five credential stores (Account, PasswordHash, PasswordResetToken, OAuthCredential, MagicLinkToken)
  - Schema fragment approach with postinstall merge script
  - No build-time dependency on `@prisma/client` (uses structural typing)
  - Works with Prisma 5, 6, and 7
  - Includes `createPrismaAdapters()` factory for easy wiring

  **Example Express Updates:**
  - Migrates from in-memory to Prisma-backed stores
  - Adds MagicLinkModule with request/verify endpoints
  - Includes Prisma 7+ setup with PostgreSQL and migrations
  - Requires `DATABASE_URL` environment variable

  **Documentation:**
  - Migration guide from in-memory to Prisma
  - Relationship patterns between Account and User models

### Patch Changes

- Updated dependencies [82db1e2]
- Updated dependencies [9d6b1db]
  - @odysseon/whoami-core@12.0.0-dev.1
