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
import { Public, AUTH_METHODS } from "@odysseon/whoami-adapter-nestjs";
import type { AuthMethods } from "@odysseon/whoami-core";
import {
  LoginPasswordDto,
  OAuthLoginDto,
  ReceiptTokenResponse,
} from "./dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AUTH_METHODS) private readonly auth: AuthMethods) {}

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
    const receipt = await this.auth.authenticateWithPassword!({
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
    const receipt = await this.auth.authenticateWithOAuth!({
      email: dto.email,
      provider: dto.provider,
      providerId: dto.providerId,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
