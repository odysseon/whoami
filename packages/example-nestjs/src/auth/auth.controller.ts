import {
  Body,
  Controller,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Public, moduleToken } from "@odysseon/whoami-adapter-nestjs";
import type { PasswordMethods, OAuthMethods } from "@odysseon/whoami-core";
import {
  LoginPasswordDto,
  OAuthLoginDto,
  ReceiptTokenResponse,
} from "./dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(moduleToken("password"))
    private readonly password: PasswordMethods,
    @Inject(moduleToken("oauth"))
    private readonly oauth: OAuthMethods,
  ) {}

  @ApiOperation({ summary: "Login with email + password" })
  @ApiBody({ type: LoginPasswordDto })
  @ApiOkResponse({ type: ReceiptTokenResponse })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async loginPassword(
    @Body() dto: LoginPasswordDto,
  ): Promise<ReceiptTokenResponse> {
    const { receipt } = await this.password.authenticateWithPassword({
      email: dto.email,
      password: dto.password,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  @ApiOperation({ summary: "Login or auto-register via OAuth" })
  @ApiBody({ type: OAuthLoginDto })
  @ApiOkResponse({ type: ReceiptTokenResponse })
  @ApiUnauthorizedResponse({ description: "OAuth provider mismatch" })
  @Public()
  @Post("oauth")
  @HttpCode(HttpStatus.OK)
  async loginOAuth(@Body() dto: OAuthLoginDto): Promise<ReceiptTokenResponse> {
    const result = await this.oauth.authenticateWithOAuth({
      email: dto.email,
      provider: dto.provider,
      providerId: dto.providerId,
    });
    return { token: result.receipt.token, expiresAt: result.receipt.expiresAt };
  }
}
