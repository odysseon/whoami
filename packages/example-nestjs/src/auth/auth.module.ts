import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Module,
  Post,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { type AuthMethods } from "@odysseon/whoami-core";
import { Public } from "@odysseon/whoami-adapter-nestjs";
import { AccountsModule } from "../accounts/accounts.module.js";
import { TOKENS } from "../tokens.js";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class LoginPasswordDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ example: "secret123" })
  password!: string;
}

class OAuthLoginDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ example: "google" })
  provider!: string;

  @ApiProperty({ example: "g-12345" })
  providerId!: string;
}

class ReceiptTokenResponse {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiJ9..." })
  token!: string;

  @ApiProperty({ format: "date-time" })
  expiresAt!: Date;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(TOKENS.AUTH)
    private readonly auth: AuthMethods,
  ) {}

  @ApiOperation({ summary: "Login with email + password" })
  @ApiBody({ type: LoginPasswordDto })
  @ApiOkResponse({
    description: "Receipt token issued",
    type: ReceiptTokenResponse,
  })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async loginPassword(
    @Body() dto: LoginPasswordDto,
  ): Promise<{ token: string; expiresAt: Date }> {
    const receipt = await this.auth.authenticateWithPassword!({
      email: dto.email,
      password: dto.password,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  @ApiOperation({
    summary: "Login or auto-register via OAuth",
    description:
      "Auto-registers a new account on the first call for a given email. " +
      "On subsequent calls verifies that provider + providerId match the stored credential.",
  })
  @ApiBody({ type: OAuthLoginDto })
  @ApiOkResponse({
    description: "Receipt token issued",
    type: ReceiptTokenResponse,
  })
  @ApiUnauthorizedResponse({ description: "OAuth provider mismatch" })
  @Public()
  @Post("oauth")
  @HttpCode(HttpStatus.OK)
  async loginOAuth(
    @Body() dto: OAuthLoginDto,
  ): Promise<{ token: string; expiresAt: Date }> {
    const receipt = await this.auth.authenticateWithOAuth!({
      email: dto.email,
      provider: dto.provider,
      providerId: dto.providerId,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  imports: [AccountsModule],
  controllers: [AuthController],
})
export class AuthModule {}
