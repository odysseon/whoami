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
import {
  AuthenticateOAuthUseCase,
  Credential,
  CredentialId,
  EmailAddress,
  IssueReceiptUseCase,
  ReceiptSigner,
  VerifyMagicLinkUseCase,
  VerifyPasswordUseCase,
  type LoggerPort,
} from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import {
  JoseReceiptSigner,
  type JoseReceiptConfig,
} from "@odysseon/whoami-adapter-jose";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";
import { Public } from "@odysseon/whoami-adapter-nestjs";
import {
  InMemoryCredentialStore,
  InMemoryAccountRepository,
} from "../infrastructure/in-memory.stores.js";
import { AccountsModule } from "../accounts/accounts.module.js";
import { TOKENS } from "../tokens.js";

// ---------------------------------------------------------------------------
// DTOs & response shapes
// ---------------------------------------------------------------------------
class LoginPasswordDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ example: "secret123" })
  password!: string;
}

class MagicLinkRequestDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;
}

class MagicLinkVerifyDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Raw token returned by /auth/magic-link/request",
  })
  token!: string;
}

class ReceiptTokenResponse {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiJ9..." })
  token!: string;

  @ApiProperty({ format: "date-time" })
  expiresAt!: Date;
}

class MagicLinkIssuedResponse {
  @ApiProperty({ example: "Magic link issued." })
  message!: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    required: false,
    description: "Demo only — never expose raw tokens in production.",
  })
  magicLinkToken?: string;

  @ApiProperty({ format: "date-time", required: false })
  expiresAt?: Date;

  @ApiProperty({
    example: "demo only — never expose tokens in production",
    required: false,
  })
  note?: string;
}

class OAuthLoginDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ example: "google" })
  provider!: string;

  @ApiProperty({ example: "g-12345" })
  providerId!: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly tokenHasher = new WebCryptoTokenHasher();

  constructor(
    private readonly verifyPassword: VerifyPasswordUseCase,
    private readonly verifyMagicLink: VerifyMagicLinkUseCase,
    private readonly authenticateOAuth: AuthenticateOAuthUseCase,
    private readonly issueReceipt: IssueReceiptUseCase,
    @Inject(TOKENS.CREDENTIAL_STORE)
    private readonly credentialStore: InMemoryCredentialStore,
    @Inject(TOKENS.ACCOUNT_REPOSITORY)
    private readonly accountRepo: InMemoryAccountRepository,
    @Inject(TOKENS.GENERATE_ID)
    private readonly generateId: () => string | number,
  ) {}

  /**
   * POST /auth/login
   *
   * Verifies a password credential and issues a receipt token.
   */
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
    const accountId = await this.verifyPassword.execute(
      dto.email,
      dto.password,
    );
    const receipt = await this.issueReceipt.execute(accountId);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  /**
   * POST /auth/magic-link/request
   *
   * Generates a magic-link token. In production, this would be emailed.
   * The token is returned directly here for demonstration purposes only.
   */
  @ApiOperation({
    summary: "Request a magic-link token",
    description:
      "Generates a one-time token valid for 15 minutes and stores its SHA-256 hash " +
      "(via WebCrypto adapter). In production the raw token would be emailed; here it " +
      "is returned in the body for demo purposes.",
  })
  @ApiBody({ type: MagicLinkRequestDto })
  @ApiOkResponse({
    description: "Magic link issued (or ambiguous response if email unknown)",
    type: MagicLinkIssuedResponse,
  })
  @Public()
  @Post("magic-link/request")
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: MagicLinkRequestDto): Promise<{
    message: string;
    magicLinkToken?: string;
    expiresAt?: Date;
    note?: string;
  }> {
    const emailVO = new EmailAddress(dto.email);
    const account = await this.accountRepo.findByEmail(emailVO);

    if (!account) {
      // Ambiguous response prevents user enumeration
      return {
        message: "If that email is registered, a magic link has been sent.",
      };
    }

    const rawToken = crypto.randomUUID();
    const hashedToken = await this.tokenHasher.hash(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const credential = Credential.loadExisting(
      new CredentialId(this.generateId()),
      account.id,
      { kind: "magic_link", token: hashedToken, expiresAt },
    );
    await this.credentialStore.saveWithEmail(credential, account.email);

    return {
      message: "Magic link issued.",
      magicLinkToken: rawToken,
      expiresAt,
      note: "demo only — never expose tokens in production",
    };
  }

  /**
   * POST /auth/magic-link/verify
   *
   * Verifies a magic-link token and issues a receipt token on success.
   */
  @ApiOperation({
    summary: "Verify a magic-link token",
    description:
      "Hashes the supplied token with SHA-256 (WebCrypto adapter) and compares it to the stored hash.",
  })
  @ApiBody({ type: MagicLinkVerifyDto })
  @ApiOkResponse({
    description: "Receipt token issued",
    type: ReceiptTokenResponse,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or expired magic-link token",
  })
  @Public()
  @Post("magic-link/verify")
  @HttpCode(HttpStatus.OK)
  async verifyMagicLinkRoute(
    @Body() dto: MagicLinkVerifyDto,
  ): Promise<{ token: string; expiresAt: Date }> {
    const hashedToken = await this.tokenHasher.hash(dto.token);
    const accountId = await this.verifyMagicLink.execute({
      rawEmail: dto.email,
      token: hashedToken,
      currentTime: new Date(),
    });
    const receipt = await this.issueReceipt.execute(accountId);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }

  /**
   * POST /auth/oauth
   *
   * Auto-registers or authenticates via OAuth and issues a receipt token.
   */
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
    const accountId = await this.authenticateOAuth.execute({
      rawEmail: dto.email,
      provider: dto.provider,
      providerId: dto.providerId,
    });
    const receipt = await this.issueReceipt.execute(accountId);
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

const consoleLogger: LoggerPort = {
  info: (msg, ...meta): void => console.info("[whoami]", msg, ...meta),
  warn: (msg, ...meta): void => console.warn("[whoami]", msg, ...meta),
  error: (msg, trace, ...meta): void =>
    console.error("[whoami]", msg, trace, ...meta),
};

export const JOSE_CONFIG_TOKEN = "JOSE_CONFIG_TOKEN";
@Module({
  imports: [AccountsModule],
  controllers: [AuthController],
  providers: [
    // Jose config
    {
      provide: JOSE_CONFIG_TOKEN,
      useFactory: (): JoseReceiptConfig => ({
        secret:
          process.env["JOSE_SECRET"] ?? "dev-secret-at-least-32-chars-long!!",
        issuer: "whoami-nestjs-example",
      }),
    },
    // Adapters
    {
      provide: JoseReceiptSigner,
      useFactory: (config: JoseReceiptConfig): JoseReceiptSigner =>
        new JoseReceiptSigner(config),
      inject: [JOSE_CONFIG_TOKEN],
    },
    WebCryptoTokenHasher,
    // Use cases
    {
      provide: VerifyPasswordUseCase,
      useFactory: (
        store: InMemoryCredentialStore,
        hasher: Argon2PasswordHasher,
      ): VerifyPasswordUseCase =>
        new VerifyPasswordUseCase(store, hasher, consoleLogger),
      inject: [TOKENS.CREDENTIAL_STORE, Argon2PasswordHasher],
    },
    {
      provide: VerifyMagicLinkUseCase,
      useFactory: (store: InMemoryCredentialStore): VerifyMagicLinkUseCase =>
        new VerifyMagicLinkUseCase(store, consoleLogger),
      inject: [TOKENS.CREDENTIAL_STORE],
    },
    {
      provide: AuthenticateOAuthUseCase,
      useFactory: (
        accountRepo: InMemoryAccountRepository,
        credStore: InMemoryCredentialStore,
        genId: () => string | number,
      ): AuthenticateOAuthUseCase =>
        new AuthenticateOAuthUseCase(
          accountRepo,
          credStore,
          genId,
          consoleLogger,
        ),
      inject: [
        TOKENS.ACCOUNT_REPOSITORY,
        TOKENS.CREDENTIAL_STORE,
        TOKENS.GENERATE_ID,
      ],
    },
    {
      provide: IssueReceiptUseCase,
      useFactory: (signer: ReceiptSigner): IssueReceiptUseCase =>
        new IssueReceiptUseCase(signer, 60),
      inject: [JoseReceiptSigner],
    },
  ],
})
export class AuthModule {}
