# @odysseon/whoami-adapter-nestjs — Examples

## 1. Full setup with password + OAuth (AppModule)

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { WhoamiModule, WhoamiAuthGuard } from "@odysseon/whoami-adapter-nestjs";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import {
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core/internal";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get("JWT_SECRET")!;
        return {
          accountRepo: new MyAccountRepository(),
          tokenSigner: new IssueReceiptUseCase({
            signer: new JoseReceiptSigner({ secret, issuer: "my-app" }),
            tokenLifespanMinutes: 60,
          }),
          verifyReceipt: new VerifyReceiptUseCase(
            new JoseReceiptVerifier({ secret, issuer: "my-app" }),
          ),
          logger: console,
          generateId: () => crypto.randomUUID(),
          password: {
            hashManager: new Argon2PasswordHasher(),
            passwordStore: new MyPasswordCredentialStore(),
          },
          oauth: {
            oauthStore: new MyOAuthCredentialStore(),
          },
        };
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: WhoamiAuthGuard }],
})
export class AppModule {}
```

## 2. Inject AUTH_METHODS and call auth flows from a controller

```ts
import {
  Controller,
  Post,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Public, AUTH_METHODS } from "@odysseon/whoami-adapter-nestjs";
import type { AuthMethods } from "@odysseon/whoami-core";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AUTH_METHODS) private readonly auth: AuthMethods) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: { email: string; password: string }) {
    const receipt = await this.auth.authenticateWithPassword!(dto);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  @Public()
  @Post("oauth")
  @HttpCode(HttpStatus.OK)
  async oauth(
    @Body() dto: { email: string; provider: string; providerId: string },
  ) {
    const receipt = await this.auth.authenticateWithOAuth!(dto);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

## 3. Access the verified identity in a protected route

```ts
import { Controller, Get } from "@nestjs/common";
import { CurrentIdentity } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("me")
export class ProfileController {
  @Get()
  async getProfile(@CurrentIdentity() identity: Receipt) {
    return { accountId: identity.accountId.value };
  }
}
```

## 4. Use OAuthCallbackHandler in an OAuth callback

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { OAuthCallbackHandler, Public } from "@odysseon/whoami-adapter-nestjs";

@Controller("auth")
export class AuthController {
  constructor(private readonly oauthHandler: OAuthCallbackHandler) {}

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@OAuthProfile() profile: GoogleProfile) {
    const receipt = await this.oauthHandler.handle({
      email: profile.email,
      provider: "google",
      providerId: profile.sub,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
```

## 5. Override token extraction (cookies)

```ts
import { AuthTokenExtractor } from "@odysseon/whoami-adapter-nestjs";

class CookieTokenExtractor extends AuthTokenExtractor {
  extract(request: unknown): string | null {
    const req = request as { cookies?: Record<string, string> };
    return req.cookies?.receipt ?? null;
  }
}

WhoamiModule.registerAsync({
  useFactory: () => ({
    // ...auth config...
    tokenExtractor: new CookieTokenExtractor(),
  }),
});
```

## 6. Domain enforcement before OAuth (e.g. email domain restriction)

```ts
@Public()
@Get("google/callback")
@UseGuards(GoogleOAuthGuard)
async googleCallback(@OAuthProfile() profile: GoogleProfile) {
  if (!profile.email.endsWith("@oauife.edu.ng")) {
    throw new ForbiddenException("Only OAU email addresses are permitted.");
  }

  const receipt = await this.oauthHandler.handle({
    email: profile.email,
    provider: "google",
    providerId: profile.sub,
  });

  return { token: receipt.token };
}
```
