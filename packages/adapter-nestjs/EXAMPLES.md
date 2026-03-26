# @odysseon/whoami-adapter-nestjs Examples

### 1. Zero-to-working controller

`WhoamiModule` uses `registerAsync` to provide dependency wiring for the pure `WhoamiService`, the default secure adapters, a built-in auth controller, a global exception filter, and a global access-token guard.

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

import { PrismaPasswordUserRepository } from "./repositories/password-user.repository";
import { PrismaRefreshTokenRepository } from "./repositories/refresh-token.repository";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        configuration: {
          authMethods: {
            credentials: true,
            oauth: false,
          },
          refreshTokens: {
            enabled: true,
            refreshTokenTtlSeconds: 604800,
          },
        },
        tokenSigner: new JoseTokenSigner({ secret: config.get("JWT_SECRET")! }),
        passwordHasher: new Argon2PasswordHasher(),
        tokenHasher: new WebCryptoTokenHasher(),
        passwordUserRepository: new PrismaPasswordUserRepository(),
        refreshTokenRepository: new PrismaRefreshTokenRepository(),
      }),
    }),
  ],
})
export class AppModule {}
```

This out-of-the-box configuration exposes:

- `POST /auth/register` (Credentials)
- `POST /auth/login` (Credentials)
- `POST /auth/oauth` (Generic OAuth)
- `POST /auth/refresh`
- `GET /auth/status`

### 2. Expose and Protect Your Own Routes

The module binds `WhoamiAuthGuard` globally, making your application **Secure by Default**. You do not need to add `@UseGuards()` to your controllers.

Use `@Public()` to bypass the global guard, and `@CurrentIdentity()` to extract the strictly-typed JWT payload.

```ts
import { Controller, Get } from "@nestjs/common";
import { Public, CurrentIdentity } from "@odysseon/whoami-adapter-nestjs";
import type { IJwtPayload } from "@odysseon/whoami-core";

@Controller("account")
export class AccountController {
  // 🔒 Protected automatically by the global guard
  @Get("me")
  me(@CurrentIdentity() identity: IJwtPayload) {
    return {
      sub: identity.sub, // The baseline identity guarantee
    };
  }

  // 🔓 Bypasses the global guard
  @Public()
  @Get("landing")
  landing() {
    return { message: "Welcome to the public page" };
  }
}
```

### 3. OAuth-Only Configuration

If you do not want to manage passwords, you can configure the adapter for OAuth-only. You omit the password hasher and password repository completely.

_Note: It is the responsibility of your infrastructure (e.g., Passport.js) to verify the third-party token (Google/GitHub) and forward the extracted provider ID to the generic `/auth/oauth` endpoint._

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";
import { PrismaOAuthUserRepository } from "./repositories/oauth-user.repository";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        configuration: {
          authMethods: {
            credentials: false, // Disabled
            oauth: true, // Enabled
          },
          refreshTokens: {
            enabled: false,
          },
        },
        tokenSigner: new JoseTokenSigner({ secret: config.get("JWT_SECRET")! }),
        oauthUserRepository: new PrismaOAuthUserRepository(),
      }),
    }),
  ],
})
export class AppModule {}
```

### 4. Things this package does NOT do

- **DB repository implementation:** You must provide your own database adapters (e.g., Prisma, TypeORM) that satisfy the core `I...Repository` interfaces.
- **Third-Party Token Verification:** This library manages _your_ internal session identity. Verifying a Google or GitHub ID token over the network is an infrastructure concern (best handled by `passport.js` or similar tools).
- **Rich user hydration:** The core guarantees identity (`sub`). Loading profiles, avatars, or metadata is the responsibility of your application layer.
- **Authorization:** Roles, permissions, and ACLs are strictly outside the scope of this package.
