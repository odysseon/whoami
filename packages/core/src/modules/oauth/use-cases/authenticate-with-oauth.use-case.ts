import { Credential, Receipt } from "../../../kernel/domain/entities/index.js";
import type { EmailAddress } from "../../../kernel/domain/value-objects/index.js";
import {
  createAccountId,
  createCredentialId,
  createEmailAddress,
} from "../../../kernel/domain/value-objects/index.js";
import {
  AuthenticationError,
  InvalidEmailError,
} from "../../../kernel/domain/errors/index.js";
import type { AccountRepository } from "../../../kernel/ports/account-repository.port.js";
import type {
  ReceiptSigner,
  IdGeneratorPort,
  LoggerPort,
} from "../../../kernel/ports/index.js";
import type { OAuthCredentialStore } from "../ports/oauth-credential-store.port.js";
import { createOAuthProof } from "../entities/oauth.proof.js";
import { Account } from "../../../kernel/domain/entities/account.js";

/**
 * Input for authenticating with OAuth
 */
export interface AuthenticateWithOAuthInput {
  readonly provider: string;
  readonly providerId: string;
  readonly email: string;
}

/**
 * Output from authenticating with OAuth
 */
export interface AuthenticateWithOAuthOutput {
  readonly receipt: Receipt;
  readonly account: { id: string; email: string; createdAt: Date };
  readonly isNewAccount: boolean;
}

/**
 * Use case for authenticating with OAuth.
 * Implements a three-phase security-first flow:
 * 1. Check for existing OAuth credential (fast path)
 * 2. If not found, check for existing account with same email
 * 3. If no account exists, auto-register; otherwise reject (conflict guard)
 */
export class AuthenticateWithOAuthUseCase {
  readonly #accountRepo: AccountRepository;
  readonly #oauthStore: OAuthCredentialStore;
  readonly #receiptSigner: ReceiptSigner;
  readonly #idGenerator: IdGeneratorPort;
  readonly #logger: LoggerPort;
  readonly #tokenLifespanMinutes: number;

  constructor(deps: {
    accountRepo: AccountRepository;
    oauthStore: OAuthCredentialStore;
    receiptSigner: ReceiptSigner;
    idGenerator: IdGeneratorPort;
    logger: LoggerPort;
    tokenLifespanMinutes: number;
  }) {
    this.#accountRepo = deps.accountRepo;
    this.#oauthStore = deps.oauthStore;
    this.#receiptSigner = deps.receiptSigner;
    this.#idGenerator = deps.idGenerator;
    this.#logger = deps.logger;
    this.#tokenLifespanMinutes = deps.tokenLifespanMinutes;
  }

  /**
   * Executes the authenticate with OAuth use case
   * @param input - The authentication input
   * @returns The receipt, account, and whether it's a new account
   */
  async execute(
    input: AuthenticateWithOAuthInput,
  ): Promise<AuthenticateWithOAuthOutput> {
    // Validate email
    let email: EmailAddress;
    try {
      email = createEmailAddress(input.email);
    } catch {
      throw new InvalidEmailError(`Invalid email: ${input.email}`);
    }

    // Phase 1: Check for existing OAuth credential (fast path)
    const existingCredential = await this.#oauthStore.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingCredential) {
      // Fast path: existing OAuth user
      const account = await this.#accountRepo.findById(
        existingCredential.accountId,
      );
      if (!account) {
        // This shouldn't happen - orphaned credential
        this.#logger.error("Orphaned OAuth credential", {
          provider: input.provider,
          providerId: input.providerId,
        });
        throw new AuthenticationError("Account not found");
      }

      const receipt = await this.#issueReceipt(account.id);

      this.#logger.info("OAuth authentication (fast path)", {
        accountId: account.id.toString(),
        provider: input.provider,
      });

      return {
        receipt,
        account: {
          id: account.id.toString(),
          email: account.email.toString(),
          createdAt: account.createdAt,
        },
        isNewAccount: false,
      };
    }

    // Phase 2: Check for existing account with same email
    const existingAccount = await this.#accountRepo.findByEmail(email);

    if (existingAccount) {
      // Conflict guard: account exists but no OAuth credential
      // User must log in with existing method and link OAuth via settings
      this.#logger.warn("OAuth conflict: account exists without OAuth link", {
        email: input.email,
        provider: input.provider,
      });
      throw new AuthenticationError(
        "An account already exists with this email. Please log in with your existing method and link this provider in settings.",
      );
    }

    // Phase 3: Auto-register new account
    const accountId = createAccountId(this.#idGenerator.generate());
    const newAccount = Account.create({
      id: accountId,
      email,
    });

    const credentialId = createCredentialId(this.#idGenerator.generate());
    const credential = Credential.create({
      id: credentialId,
      accountId,
      proof: createOAuthProof(input.provider, input.providerId),
    });

    await this.#accountRepo.save(newAccount);
    await this.#oauthStore.save(credential);

    const receipt = await this.#issueReceipt(accountId);

    this.#logger.info("OAuth auto-registration", {
      accountId: accountId.toString(),
      provider: input.provider,
    });

    return {
      receipt,
      account: {
        id: newAccount.id.toString(),
        email: newAccount.email.toString(),
        createdAt: newAccount.createdAt,
      },
      isNewAccount: true,
    };
  }

  /**
   * Issues a receipt for the given account ID
   */
  async #issueReceipt(
    accountId: ReturnType<typeof createAccountId>,
  ): Promise<Receipt> {
    const expiresAt = new Date(
      Date.now() + this.#tokenLifespanMinutes * 60 * 1000,
    );
    const receipt = await this.#receiptSigner.sign(accountId, expiresAt);
    return receipt;
  }
}
