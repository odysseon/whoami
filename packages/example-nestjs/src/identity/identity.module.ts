import { Controller, Get, Inject, Module } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Receipt } from "@odysseon/whoami-core";
import {
  CurrentIdentity,
  WhoamiAuthGuard,
  WhoamiModule,
  type WhoamiModuleOptions,
} from "@odysseon/whoami-adapter-nestjs";
import { JoseReceiptVerifier } from "@odysseon/whoami-adapter-jose";
import { APP_GUARD } from "@nestjs/core";
import { InMemoryAccountRepository } from "../infrastructure/in-memory.stores.js";
import { AccountsModule } from "../accounts/accounts.module.js";
import { TOKENS } from "../tokens.js";

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

class ProfileResponse {
  @ApiProperty({ example: 1 })
  accountId!: unknown;

  @ApiProperty({ example: "ada@example.com", format: "email", nullable: true })
  email!: string | null;

  @ApiProperty({ format: "date-time" })
  tokenExpiresAt!: Date;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags("identity")
@ApiBearerAuth()
@Controller("me")
export class IdentityController {
  constructor(
    @Inject(TOKENS.ACCOUNT_REPOSITORY)
    private readonly accountRepo: InMemoryAccountRepository,
  ) {}

  /**
   * GET /me
   *
   * Returns the authenticated account's profile.
   * Protected by WhoamiAuthGuard via the global guard registered in AppModule.
   */
  @Get()
  @ApiOperation({ summary: "Get authenticated account profile" })
  @ApiOkResponse({
    description: "Authenticated profile",
    type: ProfileResponse,
  })
  @ApiUnauthorizedResponse({ description: "Missing or invalid receipt token" })
  async getMe(@CurrentIdentity() identity: Receipt): Promise<{
    accountId: unknown;
    email: string | null;
    tokenExpiresAt: Date;
  }> {
    const account = await this.accountRepo.findById(identity.accountId);
    return {
      accountId: identity.accountId.value,
      email: account?.email.value ?? null,
      tokenExpiresAt: identity.expiresAt,
    };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  imports: [
    AccountsModule,
    // WhoamiModule.registerAsync with no external inject — the factory closes
    // over the env var directly, avoiding cross-module DI token resolution.
    WhoamiModule.registerAsync({
      useFactory: (): WhoamiModuleOptions => ({
        receiptVerifier: new JoseReceiptVerifier({
          secret:
            process.env["JOSE_SECRET"] ?? "dev-secret-at-least-32-chars-long!!",
          issuer: "whoami-nestjs-example",
        }),
      }),
    }),
  ],
  controllers: [IdentityController],
  providers: [
    // Register WhoamiAuthGuard globally so every controller is protected by default.
    // Use @Public() on routes that should be open.
    {
      provide: APP_GUARD,
      useClass: WhoamiAuthGuard,
    },
  ],
})
export class IdentityModule {}
