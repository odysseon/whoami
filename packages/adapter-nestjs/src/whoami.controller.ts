import { Body, Controller, Get, Post, Type, UseGuards } from "@nestjs/common";
import type {
  IAuthTokens,
  IUserWithEmail,
  IWhoamiAuthStatus,
} from "@odysseon/whoami-core";
import { WhoamiError, WhoamiService } from "@odysseon/whoami-core";
import { GoogleOauthDto } from "./dto/google-oauth.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";
import { WhoamiIdentity } from "./whoami.decorator.js";
import { mapWhoamiError } from "./whoami-error.mapper.js";
import type { WhoamiRequestIdentity } from "./whoami-auth.types.js";

function buildWhoamiController(path: string): Type<unknown> {
  @Controller(path)
  class ConfigurableWhoamiController {
    constructor(private readonly whoamiService: WhoamiService) {}

    @Post("register")
    async register(@Body() body: RegisterDto): Promise<IUserWithEmail> {
      try {
        return await this.whoamiService.registerWithEmail({
          email: body.email,
          password: body.password,
        });
      } catch (error) {
        if (error instanceof WhoamiError) {
          throw mapWhoamiError(error);
        }

        throw error;
      }
    }

    @Post("login")
    async login(@Body() body: LoginDto): Promise<IAuthTokens> {
      try {
        return await this.whoamiService.loginWithEmail({
          email: body.email,
          password: body.password,
        });
      } catch (error) {
        if (error instanceof WhoamiError) {
          throw mapWhoamiError(error);
        }

        throw error;
      }
    }

    @Post("refresh")
    async refresh(@Body() body: RefreshDto): Promise<IAuthTokens> {
      try {
        return await this.whoamiService.refreshTokens(body.refreshToken);
      } catch (error) {
        if (error instanceof WhoamiError) {
          throw mapWhoamiError(error);
        }

        throw error;
      }
    }

    @Post("google")
    async google(@Body() body: GoogleOauthDto): Promise<IAuthTokens> {
      try {
        return await this.whoamiService.loginWithGoogle({
          idToken: body.idToken,
        });
      } catch (error) {
        if (error instanceof WhoamiError) {
          throw mapWhoamiError(error);
        }

        throw error;
      }
    }

    @Get("status")
    status(): IWhoamiAuthStatus {
      return this.whoamiService.getAuthStatus();
    }

    @Get("me")
    @UseGuards(WhoamiAuthGuard)
    me(
      @WhoamiIdentity() identity: WhoamiRequestIdentity,
    ): WhoamiRequestIdentity {
      return identity;
    }
  }

  return ConfigurableWhoamiController;
}

export const WhoamiController = buildWhoamiController("auth");

export function createWhoamiController(path: string): Type<unknown> {
  if (path === "auth") {
    return WhoamiController;
  }

  return buildWhoamiController(path);
}
