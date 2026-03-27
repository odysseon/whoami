# @odysseon/whoami-adapter-nestjs Examples

## 1. Register the module with a receipt verifier

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WhoamiModule } from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptCodec } from "@odysseon/whoami-adapter-jose";

@Module({
  imports: [
    ConfigModule.forRoot(),
    WhoamiModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        receiptVerifier: new JoseReceiptCodec({
          secret: config.get("JWT_SECRET")!,
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

## 2. Protect selected routes

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  CurrentIdentity,
  Public,
  WhoamiAuthGuard,
} from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";

@Controller("account")
export class AccountController {
  @UseGuards(WhoamiAuthGuard)
  @Get("me")
  me(@CurrentIdentity() identity: Receipt) {
    return {
      accountId: identity.accountId.value,
      expiresAt: identity.expiresAt,
    };
  }

  @Public()
  @Get("landing")
  landing() {
    return { message: "Welcome to the public page" };
  }
}
```

## 3. Override token extraction

```ts
import type { AuthTokenExtractor } from "@odysseon/whoami-adapter-nestjs";

class CookieTokenExtractor implements AuthTokenExtractor {
  extract(request: { cookies?: Record<string, string> }) {
    return request.cookies?.receipt ?? null;
  }
}
```
