---
"@odysseon/whoami-adapter-prisma": minor
"@odysseon/whoami-core": minor
---

**New Package:** `@odysseon/whoami-adapter-prisma`

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
