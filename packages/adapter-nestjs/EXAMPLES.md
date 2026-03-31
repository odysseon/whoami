# @odysseon/whoami-adapter-nestjs — Examples

## 1. Register WhoamiModule (receipt verification)

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { WhoamiModule, WhoamiAuthGuard } from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptVerifier } from "@odysseon/whoami-adapter-jose";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        receiptVerifier: new JoseReceiptVerifier({
          secret: config.get("JWT_SECRET")!,
          issuer: "my-app",
        }),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: WhoamiAuthGuard }],
})
export class AppModule {}
```

## 2. Register WhoamiOAuthModule and use OAuthCallbackHandler

```ts
import { Module, Controller, Get, UseGuards } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiOAuthModule, Public } from "@odysseon/whoami-adapter-nestjs";
import { OAuthCallbackHandler } from "@odysseon/whoami-core";
import { JoseReceiptSigner } from "@odysseon/whoami-adapter-jose";

@Controller("auth")
class AuthController {
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

@Module({
  imports: [
    ConfigModule,
    WhoamiOAuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, ACCOUNT_REPO_TOKEN, CRED_STORE_TOKEN],
      useFactory: (config, accountRepository, credentialStore) => ({
        accountRepository,
        credentialStore,
        receiptSigner: new JoseReceiptSigner({
          secret: config.get("JWT_SECRET")!,
        }),
        generateId: () => crypto.randomUUID(),
      }),
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

## 3. Access the verified identity in a protected route

```ts
import { Controller, Get } from "@nestjs/common";
import { CurrentIdentity } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("me")
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@CurrentIdentity() identity: Receipt) {
    // Use identity.accountId.value to look up your own user record
    const user = await this.userService.findByAccountId(
      identity.accountId.value,
    );
    return { accountId: identity.accountId.value, profile: user };
  }
}
```

## 4. Override token extraction (e.g. cookies)

```ts
import type { AuthTokenExtractor } from "@odysseon/whoami-adapter-nestjs";

class CookieTokenExtractor implements AuthTokenExtractor {
  extract(request: { cookies?: Record<string, string> }) {
    return request.cookies?.receipt ?? null;
  }
}

WhoamiModule.registerAsync({
  useFactory: () => ({
    receiptVerifier: new JoseReceiptVerifier({
      secret: process.env.JWT_SECRET!,
    }),
    tokenExtractor: new CookieTokenExtractor(),
  }),
});
```

## 5. Domain enforcement before OAuth (e.g. OAU email restriction)

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
