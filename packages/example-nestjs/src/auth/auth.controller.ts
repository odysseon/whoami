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
  ApiCreatedResponse,
} from "@nestjs/swagger";
import { Public, moduleToken } from "@odysseon/whoami-adapter-nestjs";
import type {
  PasswordMethods,
  OAuthMethods,
  MagicLinkMethods,
} from "@odysseon/whoami-core";
import {
  LoginPasswordDto,
  OAuthLoginDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
  ReceiptTokenResponse,
  MagicLinkRequestResponse,
} from "./dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(moduleToken("password"))
    private readonly password: PasswordMethods,
    @Inject(moduleToken("oauth"))
    private readonly oauth: OAuthMethods,
    @Inject(moduleToken("magiclink"))
    private readonly magicLink: MagicLinkMethods,
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

  @ApiOperation({ summary: "Request a magic link" })
  @ApiBody({ type: MagicLinkRequestDto })
  @ApiCreatedResponse({ type: MagicLinkRequestResponse })
  @Public()
  @Post("magic-link/request")
  @HttpCode(HttpStatus.CREATED)
  async requestMagicLink(
    @Body() dto: MagicLinkRequestDto,
  ): Promise<MagicLinkRequestResponse> {
    const result = await this.magicLink.requestMagicLink({
      email: dto.email,
    });
    return {
      message: "Magic link issued.",
      magicLinkToken: result.plainTextToken,
      expiresAt: result.expiresAt,
      isNewAccount: result.isNewAccount,
      note: "demo only — never expose tokens in production",
    };
  }

  @ApiOperation({ summary: "Verify a magic link token" })
  @ApiBody({ type: MagicLinkVerifyDto })
  @ApiOkResponse({ type: ReceiptTokenResponse })
  @ApiUnauthorizedResponse({ description: "Invalid or expired magic link" })
  @Public()
  @Post("magic-link/verify")
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(
    @Body() dto: MagicLinkVerifyDto,
  ): Promise<ReceiptTokenResponse> {
    const result = await this.magicLink.authenticateWithMagicLink({
      token: dto.token,
    });
    return { token: result.receipt.token, expiresAt: result.receipt.expiresAt };
  }
}
