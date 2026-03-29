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
  AccountRepository,
  Credential,
  CredentialId,
  RegisterAccountUseCase,
} from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { Public } from "@odysseon/whoami-adapter-nestjs";
import {
  InMemoryAccountRepository,
  InMemoryCredentialStore,
} from "../infrastructure/in-memory.stores.js";
import { TOKENS } from "../tokens.js";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class RegisterDto {
  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ example: "secret123", minLength: 8 })
  password!: string;
}

class AccountCreatedResponse {
  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: "ada@example.com", format: "email" })
  email!: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(
    private readonly registerAccount: RegisterAccountUseCase,
    @Inject(TOKENS.CREDENTIAL_STORE)
    private readonly credentialStore: InMemoryCredentialStore,
    private readonly argon2: Argon2PasswordHasher,
    @Inject(TOKENS.GENERATE_ID)
    private readonly generateId: () => string | number,
  ) {}

  /**
   * POST /accounts/register
   *
   * Creates a new account and stores a password credential for it.
   */
  @ApiOperation({
    summary: "Register a new account",
    description:
      "Creates an account and an Argon2 password credential. Returns `409` if the email is already registered.",
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: "Account created",
    type: AccountCreatedResponse,
  })
  @ApiConflictResponse({ description: "Email already registered" })
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ accountId: unknown; email: string }> {
    const account = await this.registerAccount.execute(dto.email);

    const hash = await this.argon2.hash(dto.password);
    const credentialId = new CredentialId(this.generateId());
    const credential = Credential.loadExisting(credentialId, account.id, {
      kind: "password",
      hash,
    });

    await this.credentialStore.saveWithEmail(credential, account.email);

    return { accountId: account.id.value, email: account.email.value };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [AccountsController],
  providers: [
    // In-memory stores (singletons shared across feature modules)
    {
      provide: TOKENS.ACCOUNT_REPOSITORY,
      useClass: InMemoryAccountRepository,
    },
    {
      provide: TOKENS.CREDENTIAL_STORE,
      useClass: InMemoryCredentialStore,
    },
    // ID generator
    {
      provide: TOKENS.GENERATE_ID,
      useFactory: (): (() => number) => {
        let counter = 1;
        return (): number => counter++;
      },
    },
    // Adapters
    Argon2PasswordHasher,
    // Use case
    {
      provide: RegisterAccountUseCase,
      useFactory: (
        repo: AccountRepository,
        genId: () => string | number,
      ): RegisterAccountUseCase => new RegisterAccountUseCase(repo, genId),
      inject: [TOKENS.ACCOUNT_REPOSITORY, TOKENS.GENERATE_ID],
    },
  ],
  exports: [
    TOKENS.ACCOUNT_REPOSITORY,
    TOKENS.CREDENTIAL_STORE,
    TOKENS.GENERATE_ID,
    Argon2PasswordHasher,
  ],
})
export class AccountsModule {}
