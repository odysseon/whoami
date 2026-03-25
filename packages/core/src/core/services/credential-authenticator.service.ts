import { WhoamiError } from "../../errors/whoami-error.js";
import type { IEmailPasswordCredentials } from "../../interfaces/operation-contracts/credentials.interface.js";
import type { IAuthTokens } from "../../interfaces/operation-contracts/auth-tokens.interface.js";
import type { IUserWithEmail } from "../../interfaces/models/user.interface.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { WhoamiServiceDependencies } from "../whoami.service.js";
import type { TokenOrchestrator } from "./token-orchestrator.service.js";
import { IPasswordUserRepository } from "../../interfaces/ports/repositories/user-repository.port.js";
import { IPasswordHasher } from "../../interfaces/ports/security/password-hasher.port.js";

export class CredentialAuthenticator {
  constructor(
    private readonly deps: WhoamiServiceDependencies,
    private readonly status: IWhoamiAuthStatus,
    private readonly tokens: TokenOrchestrator,
  ) {}

  public async register(
    data: IEmailPasswordCredentials,
  ): Promise<IUserWithEmail> {
    this.ensureEnabled();
    if (!data.password?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Empty password.");

    const { repo, hasher } = this.getDeps();
    if (await repo.findByEmail(data.email)) {
      throw new WhoamiError("USER_ALREADY_EXISTS", "Email taken.");
    }

    const passwordHash = await hasher.hash(data.password);
    const user = await repo.createWithEmail({
      email: data.email,
      passwordHash,
    });
    this.deps.logger.info("Registered via email", { userId: user.id });
    return user;
  }

  public async login(data: IEmailPasswordCredentials): Promise<IAuthTokens> {
    this.ensureEnabled();
    const genericErr = new WhoamiError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
    if (!data.password?.trim()) throw genericErr;

    const { repo, hasher } = this.getDeps();
    const user = await repo.findByEmail(data.email);
    if (!user || !(await hasher.verify(user.passwordHash, data.password))) {
      throw genericErr;
    }

    this.deps.logger.info("Logged in via credentials", { userId: user.id });
    return await this.tokens.issueTokens(user.id);
  }

  public async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    this.ensureEnabled();
    if (!newPassword?.trim())
      throw new WhoamiError("INVALID_CREDENTIALS", "Empty password.");

    const { repo, hasher } = this.getDeps();
    const user = await repo.findById(userId);
    if (!user) throw new WhoamiError("USER_NOT_FOUND", "User missing.");

    const newPasswordHash = await hasher.hash(newPassword);
    await repo.updatePassword({ userId, newPasswordHash });
    this.deps.logger.info("Password updated", { userId });
  }

  private ensureEnabled(): void {
    if (!this.status.authMethods.credentials)
      throw new WhoamiError("AUTH_METHOD_DISABLED", "Credentials disabled.");
  }

  private getDeps(): {
    repo: IPasswordUserRepository;
    hasher: IPasswordHasher;
  } {
    if (!this.deps.passwordUserRepository || !this.deps.passwordHasher) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Missing credential dependencies.",
      );
    }
    return {
      repo: this.deps.passwordUserRepository,
      hasher: this.deps.passwordHasher,
    };
  }
}
