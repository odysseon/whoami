# @odysseon/whoami-adapter-nestjs Examples

### 1. Core wiring only (recommended)

`WhoamiModule` provides dependency wiring for `WhoamiService` + default secure adapters.

You are responsible for your own controllers and DTOs.

#### Example controller

```ts
import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { WhoamiService } from "@odysseon/whoami-core";
import { IEmailPasswordCredentials } from "@odysseon/whoami-core";
import { WhoamiError } from "@odysseon/whoami-core";

@Controller("auth")
export class AuthController {
  constructor(private readonly whoamiService: WhoamiService) {}

  @Post("register")
  async register(@Body() body: { email: string; password: string }) {
    try {
      return await this.whoamiService.registerWithEmail(body);
    } catch (error) {
      if (error instanceof WhoamiError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post("login")
  async login(@Body() body: IEmailPasswordCredentials) {
    try {
      return this.whoamiService.loginWithEmail(body);
    } catch (error) {
      if (error instanceof WhoamiError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post("refresh")
  async refresh(@Body("refreshToken") refreshToken: string) {
    try {
      return this.whoamiService.refreshTokens(refreshToken);
    } catch (error) {
      if (error instanceof WhoamiError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
```

### 2. Things this package does NOT do

- DB repository implementation (should be separate package, e.g. `whoami-adapter-prisma`)
- HTTP layer API design (auth routes, status codes, serialization)
- Schema validation / class-validator configuration
- Session/roles/permissions authorization
