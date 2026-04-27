# @odysseon/whoami-adapter-nestjs — Examples

## 1. Full setup with password + OAuth (AppModule)

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { OAuthModule } from "@odysseon/whoami-core/oauth";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { createPrismaAdapters } from "@odysseon/whoami-adapter-prisma";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET")!;
        const signer = new JoseReceiptSigner({ secret, issuer: "my-app" });

        const prisma = new PrismaClient({
          adapter: new PrismaPg({
            connectionString: config.get("DATABASE_URL")!,
          }),
        });
        const { accountRepo, passwordHashStore, resetTokenStore, oauthStore } =
          createPrismaAdapters(prisma);

        const secureToken = new WebCryptoSecureTokenAdapter();
        const clock = { now: () => new Date() };

        return {
          modules: [
            PasswordModule({
              accountRepo,
              passwordHashStore,
              resetTokenStore,
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner: signer,
              idGenerator: { generate: () => crypto.randomUUID() },
              logger: console,
              clock,
              secureToken,
            }),
            OAuthModule({
              accountRepo,
              oauthStore,
              receiptSigner: signer,
              idGenerator: { generate: () => crypto.randomUUID() },
              logger: console,
            }),
          ],
          receiptVerifier: new JoseReceiptVerifier({
            secret,
            issuer: "my-app",
          }),
        };
      },
    }),
  ],
})
export class AppModule {}
```

---

## 2. Inject a module and call auth flows from a controller

```ts
import {
  Controller,
  Post,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Public, moduleToken } from "@odysseon/whoami-adapter-nestjs";
import type { PasswordMethods } from "@odysseon/whoami-core/password";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(moduleToken("password")) private readonly password: PasswordMethods,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: { email: string; password: string }) {
    const { receipt } = await this.password.authenticateWithPassword(dto);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: { email: string; password: string }) {
    const { account } = await this.password.registerWithPassword(dto);
    return { accountId: account.id };
  }
}
```

---

## 3. Access current identity in a protected route

```ts
import { Controller, Get } from "@nestjs/common";
import { CurrentReceipt } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("me")
export class IdentityController {
  @Get()
  getIdentity(@CurrentReceipt() receipt: Receipt) {
    return {
      accountId: receipt.accountId.value,
      expiresAt: receipt.expiresAt,
    };
  }
}
```

---

## 4. OAuth callback with OAuthCallbackHandler

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { Public, OAuthCallbackHandler } from "@odysseon/whoami-adapter-nestjs";

@Controller("auth")
export class OAuthController {
  constructor(private readonly oauthHandler: OAuthCallbackHandler) {}

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(
    @OAuthProfile() profile: { email: string; sub: string },
  ) {
    const receipt = await this.oauthHandler.handle({
      email: profile.email,
      provider: "google",
      providerId: profile.sub,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

---

## 5. Magic link setup (AppModule)

```ts
import { MagicLinkModule } from "@odysseon/whoami-core/magiclink";
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";

// Inside useFactory, alongside or instead of PasswordModule:
const { accountRepo, magicLinkStore } = createPrismaAdapters(prisma);
const secureToken = new WebCryptoSecureTokenAdapter();
const clock = { now: () => new Date() };

return {
  modules: [
    MagicLinkModule({
      accountRepo,
      magicLinkStore,
      receiptSigner: signer,
      idGenerator: { generate: () => crypto.randomUUID() },
      logger: console,
      clock,
      secureToken,
    }),
  ],
  receiptVerifier: verifier,
};
```

```ts
// Controller
import type { MagicLinkMethods } from "@odysseon/whoami-core/magiclink";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(moduleToken("magiclink"))
    private readonly magicLink: MagicLinkMethods,
  ) {}

  @Public()
  @Post("magic-link/request")
  async requestMagicLink(@Body() dto: { email: string }) {
    const { token } = await this.magicLink.requestMagicLink(dto);
    // Send token to user via email — never expose it in the response
    await this.emailService.send(
      dto.email,
      `Your link: https://myapp.com/auth?token=${token}`,
    );
    return { sent: true };
  }

  @Public()
  @Post("magic-link/verify")
  async verifyMagicLink(@Body() dto: { token: string }) {
    const { receipt } = await this.magicLink.authenticateWithMagicLink(dto);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

---

## 6. Verify-only setup (guard only, no auth flows)

When auth flows are handled elsewhere and you only need the guard:

```ts
WhoamiModule.register({
  modules: [],
  receiptVerifier: new JoseReceiptVerifier({ secret, issuer: "my-app" }),
});
```
