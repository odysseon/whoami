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

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get("JWT_SECRET")!;
        const signer = new JoseReceiptSigner({ secret, issuer: "my-app" });

        return {
          modules: [
            PasswordModule({
              accountRepo: new MyAccountRepository(),
              passwordStore: new MyPasswordCredentialStore(),
              passwordHasher: new Argon2PasswordHasher(),
              receiptSigner: signer,
              idGenerator: () => crypto.randomUUID(),
              logger: console,
            }),
            OAuthModule({
              accountRepo: new MyAccountRepository(),
              oauthStore: new MyOAuthCredentialStore(),
              receiptSigner: signer,
              idGenerator: () => crypto.randomUUID(),
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

## 5. Verify-only setup (guard only, no auth flows)

When auth flows are handled elsewhere and you only need the guard:

```ts
WhoamiModule.register({
  modules: [],
  receiptVerifier: new JoseReceiptVerifier({ secret, issuer: "my-app" }),
});
```
