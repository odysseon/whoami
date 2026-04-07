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
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import {
  createAuth,
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
  type AccountRepository,
  type AuthMethods,
  type ReceiptSigner,
} from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
  type JoseReceiptConfig,
} from "@odysseon/whoami-adapter-jose";
import { Public } from "@odysseon/whoami-adapter-nestjs";
import {
  InMemoryAccountRepository,
  InMemoryPasswordCredentialStore,
  InMemoryOAuthCredentialStore,
} from "../infrastructure/in-memory.stores.js";
import { TOKENS } from "../tokens.js";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class RegisterDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "secret123", minLength: 8 })
  password!: string;
}

class RegisterResponse {
  @ApiProperty({ type: String, example: "eyJhbGciOiJIUzI1NiJ9..." })
  token!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(
    @Inject(TOKENS.AUTH)
    private readonly auth: AuthMethods,
  ) {}

  @ApiOperation({
    summary: "Register a new account",
    description:
      "Creates an account with a password credential and returns a receipt token.",
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: "Account created",
    type: RegisterResponse,
  })
  @ApiConflictResponse({ description: "Email already registered" })
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ token: string; expiresAt: Date }> {
    const receipt = await this.auth.registerWithPassword!({
      email: dto.email,
      password: dto.password,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export const JOSE_CONFIG_TOKEN = "JOSE_CONFIG_TOKEN";

@Module({
  controllers: [AccountsController],
  providers: [
    // Infrastructure singletons
    { provide: TOKENS.ACCOUNT_REPOSITORY, useClass: InMemoryAccountRepository },
    {
      provide: TOKENS.PASSWORD_CREDENTIAL_STORE,
      useClass: InMemoryPasswordCredentialStore,
    },
    {
      provide: TOKENS.OAUTH_CREDENTIAL_STORE,
      useClass: InMemoryOAuthCredentialStore,
    },
    {
      provide: TOKENS.GENERATE_ID,
      useFactory: (): (() => string) => {
        let counter = 1;
        return (): string => String(counter++);
      },
    },
    // Adapters
    Argon2PasswordHasher,
    {
      provide: JOSE_CONFIG_TOKEN,
      useFactory: (): JoseReceiptConfig => ({
        secret:
          process.env["JOSE_SECRET"] ?? "dev-secret-at-least-32-chars-long!!",
        issuer: "whoami-nestjs-example",
      }),
    },
    {
      provide: JoseReceiptSigner,
      useFactory: (config: JoseReceiptConfig): JoseReceiptSigner =>
        new JoseReceiptSigner(config),
      inject: [JOSE_CONFIG_TOKEN],
    },
    {
      provide: JoseReceiptVerifier,
      useFactory: (config: JoseReceiptConfig): JoseReceiptVerifier =>
        new JoseReceiptVerifier(config),
      inject: [JOSE_CONFIG_TOKEN],
    },
    {
      provide: IssueReceiptUseCase,
      useFactory: (signer: ReceiptSigner): IssueReceiptUseCase =>
        new IssueReceiptUseCase({ signer, tokenLifespanMinutes: 60 }),
      inject: [JoseReceiptSigner],
    },
    {
      provide: VerifyReceiptUseCase,
      useFactory: (verifier: JoseReceiptVerifier): VerifyReceiptUseCase =>
        new VerifyReceiptUseCase(verifier),
      inject: [JoseReceiptVerifier],
    },
    // createAuth facade — single source of truth for all auth methods
    {
      provide: TOKENS.AUTH,
      useFactory: (
        accountRepo: AccountRepository,
        passwordStore: InMemoryPasswordCredentialStore,
        oauthStore: InMemoryOAuthCredentialStore,
        hashManager: Argon2PasswordHasher,
        tokenSigner: IssueReceiptUseCase,
        verifyReceipt: VerifyReceiptUseCase,
        generateId: () => string,
      ): AuthMethods =>
        createAuth({
          accountRepo,
          tokenSigner,
          verifyReceipt,
          logger: {
            info: (msg, ...meta): void =>
              console.info("[whoami]", msg, ...meta),
            warn: (msg, ...meta): void =>
              console.warn("[whoami]", msg, ...meta),
            error: (msg, trace, ...meta): void =>
              console.error("[whoami]", msg, trace, ...meta),
          },
          generateId,
          password: { hashManager, passwordStore },
          oauth: { oauthStore },
        }),
      inject: [
        TOKENS.ACCOUNT_REPOSITORY,
        TOKENS.PASSWORD_CREDENTIAL_STORE,
        TOKENS.OAUTH_CREDENTIAL_STORE,
        Argon2PasswordHasher,
        IssueReceiptUseCase,
        VerifyReceiptUseCase,
        TOKENS.GENERATE_ID,
      ],
    },
  ],
  exports: [
    TOKENS.ACCOUNT_REPOSITORY,
    TOKENS.PASSWORD_CREDENTIAL_STORE,
    TOKENS.OAUTH_CREDENTIAL_STORE,
    TOKENS.GENERATE_ID,
    TOKENS.AUTH,
    IssueReceiptUseCase,
    VerifyReceiptUseCase,
    JoseReceiptVerifier,
  ],
})
export class AccountsModule {}
