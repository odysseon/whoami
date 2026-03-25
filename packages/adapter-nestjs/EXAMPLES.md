# @odysseon/whoami-adapter-nestjs Examples

### 1. Zero-to-working controller

`WhoamiModule` now provides dependency wiring for `WhoamiService`, the default secure adapters, a built-in auth controller, and an access-token guard.

```ts
import { Module } from "@nestjs/common";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PrismaRefreshTokenRepository } from "./refresh-token.repository";
import { PrismaUserRepository } from "./user.repository";

@Module({
  imports: [
    WhoamiModule.register({
      userRepository: PrismaUserRepository,
      refreshTokenRepository: PrismaRefreshTokenRepository,
      tokenSignerOptions: {
        secret: process.env.JWT_SECRET!,
      },
    }),
  ],
})
export class AppModule {}
```

This exposes:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

`GET /auth/me` confirms identity from the access token and returns the verified JWT payload, where the baseline guarantee is `sub`.

### 2. Guard your own routes

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  WhoamiAuthGuard,
  WhoamiIdentity,
  type WhoamiRequestIdentity,
} from "@odysseon/whoami-adapter-nestjs";

@Controller("account")
export class AccountController {
  @Get("me")
  @UseGuards(WhoamiAuthGuard)
  me(@WhoamiIdentity() identity: WhoamiRequestIdentity) {
    return {
      sub: identity.sub,
    };
  }
}
```

If you extend the core models or operation contracts, disable the built-in controller and create your own controller around the re-exported `WhoamiService`.

### 3. Things this package does NOT do

- DB repository implementation (should be separate package, e.g. `whoami-adapter-prisma`)
- Rich user hydration beyond confirming the caller's identity
- Schema validation / class-validator configuration
- Session/roles/permissions authorization
