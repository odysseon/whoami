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
  email!: string;
  password!: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

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
