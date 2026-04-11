import type { AccountId } from "../../../shared/index.js";
import type { AuthMethod } from "../../../shared/domain/auth-method.js";
import {
  CannotRemoveLastCredentialError,
  UnsupportedAuthMethodError,
  OAuthProviderNotFoundError,
} from "../../../shared/domain/errors/auth.error.js";
import type { PasswordCredentialStore } from "../../credentials/domain/ports/password-credential-store.port.js";
import type { OAuthCredentialStore } from "../../credentials/domain/ports/oauth-credential-store.port.js";

/**
 * Dependencies for {@link RemoveAuthMethodUseCase}.
 *
 * At least one store must be provided — the discriminated union enforces this
 * at compile time. Supply only the stores that match your configured auth methods.
 *
 * @public
 */
export type RemoveAuthMethodDeps =
  | {
      passwordStore: PasswordCredentialStore;
      oauthStore?: OAuthCredentialStore;
    }
  | {
      passwordStore?: PasswordCredentialStore;
      oauthStore: OAuthCredentialStore;
    };

/**
 * Input for {@link RemoveAuthMethodUseCase.execute}.
 * @public
 */
export interface RemoveAuthMethodInput {
  /** The account to modify. */
  accountId: AccountId;
  /** The authentication method to remove. */
  method: AuthMethod;
  /**
   * For `"oauth"`, optionally target a single provider rather than all OAuth
   * credentials. When omitted, all OAuth credentials for the account are removed.
   */
  provider?: string;
}

/**
 * Removes an authentication method from an account while enforcing the
 * "last credential" invariant — an account must always retain at least one
 * way to authenticate.
 *
 * @public
 */
export class RemoveAuthMethodUseCase {
  private readonly passwordStore: PasswordCredentialStore | undefined;
  private readonly oauthStore: OAuthCredentialStore | undefined;

  constructor(deps: RemoveAuthMethodDeps) {
    this.passwordStore = deps.passwordStore;
    this.oauthStore = deps.oauthStore;
  }

  /**
   * @throws {UnsupportedAuthMethodError} When the requested method is not configured.
   * @throws {CannotRemoveLastCredentialError} When removal would leave the account locked.
   * @throws {OAuthProviderNotFoundError} When the targeted OAuth provider is not linked.
   */
  async execute(input: RemoveAuthMethodInput): Promise<void> {
    if (input.method === "password") {
      return await this.removePassword(input.accountId);
    }

    if (input.method === "oauth") {
      return await this.removeOAuth(input.accountId, input.provider);
    }

    throw new UnsupportedAuthMethodError(input.method as string);
  }

  private async removePassword(accountId: AccountId): Promise<void> {
    if (!this.passwordStore) {
      throw new UnsupportedAuthMethodError("password");
    }

    const hasOAuth =
      this.oauthStore !== undefined &&
      (await this.oauthStore.existsForAccount(accountId));

    if (!hasOAuth) {
      throw new CannotRemoveLastCredentialError();
    }

    const cred = await this.passwordStore.findByAccountId(accountId);
    if (cred) {
      await this.passwordStore.delete(cred.id);
    }
  }

  private async removeOAuth(
    accountId: AccountId,
    provider?: string,
  ): Promise<void> {
    if (!this.oauthStore) {
      throw new UnsupportedAuthMethodError("oauth");
    }

    if (provider) {
      const allOAuth = await this.oauthStore.findAllByAccountId(accountId);
      const target = allOAuth.find((c) => c.oauthProvider === provider);

      if (!target) {
        throw new OAuthProviderNotFoundError(provider);
      }

      const remainingOAuth = allOAuth.length - 1;
      const hasPassword =
        this.passwordStore !== undefined &&
        (await this.passwordStore.existsForAccount(accountId));

      if (remainingOAuth === 0 && !hasPassword) {
        throw new CannotRemoveLastCredentialError();
      }

      await this.oauthStore.deleteByProvider(accountId, provider);
    } else {
      const hasPassword =
        this.passwordStore !== undefined &&
        (await this.passwordStore.existsForAccount(accountId));

      if (!hasPassword) {
        throw new CannotRemoveLastCredentialError();
      }

      await this.oauthStore.deleteAllForAccount(accountId);
    }
  }
}
