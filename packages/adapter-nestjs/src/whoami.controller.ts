import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { WhoamiService } from "@odysseon/whoami-core";
import type {
  IWhoamiAuthStatus,
  IUserWithEmail,
  IAuthTokens,
} from "@odysseon/whoami-core";
import {
  EmailPasswordDto,
  OAuthDto,
  RefreshTokenDto,
} from "./dtos/credentials.dto.js";

@Controller("auth")
export class WhoamiController {
  constructor(private readonly whoamiService: WhoamiService) {}

  @Get("status")
  public getStatus(): IWhoamiAuthStatus {
    return this.whoamiService.getAuthStatus();
  }

  @Post("register")
  public async registerWithEmail(
    @Body() dto: EmailPasswordDto,
  ): Promise<IUserWithEmail> {
    return await this.whoamiService.registerWithEmail(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  public async loginWithEmail(
    @Body() dto: EmailPasswordDto,
  ): Promise<IAuthTokens> {
    return await this.whoamiService.loginWithEmail(dto);
  }

  @Post("oauth")
  @HttpCode(HttpStatus.OK)
  public async loginWithOAuth(@Body() dto: OAuthDto): Promise<IAuthTokens> {
    return await this.whoamiService.loginWithOAuth(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  public async refreshTokens(
    @Body() dto: RefreshTokenDto,
  ): Promise<IAuthTokens> {
    return await this.whoamiService.refreshTokens(dto.refreshToken);
  }
}
