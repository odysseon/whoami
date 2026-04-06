import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { IdentityModule } from "./identity/identity.module.js";

/**
 * Root application module.
 *
 * Dependency flow:
 *   AccountsModule  → provides shared stores + Argon2PasswordHasher
 *                     (imported by both AuthModule and IdentityModule;
 *                      NestJS deduplicates to a single singleton instance)
 *   AuthModule      → consumes stores, provides auth use-cases + routes
 *   IdentityModule  → registers WhoamiModule (NestJS adapter) + global guard + /me route
 */
@Module({
  imports: [AuthModule, IdentityModule],
})
export class AppModule {}
