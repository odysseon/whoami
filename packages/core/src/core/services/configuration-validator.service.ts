import { WhoamiError } from "../../errors/whoami-error.js";
import type { IWhoamiAuthStatus } from "../../interfaces/operation-contracts/auth-status.interface.js";
import type { WhoamiServiceDependencies } from "../whoami.service.js";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export class ConfigurationValidator {
  public readonly status: IWhoamiAuthStatus;
  private readonly configurationState: "explicit" | "unspecified";

  constructor(private readonly deps: WhoamiServiceDependencies) {
    this.configurationState = deps.configuration ? "explicit" : "unspecified";
    this.status = this.resolveStatus();
    this.validateConfiguration();
    this.logStatus();
  }

  private resolveStatus(): IWhoamiAuthStatus {
    const config = this.deps.configuration;
    return {
      authMethods: {
        credentials: config?.authMethods?.credentials ?? false,
        oauth: config?.authMethods?.oauth ?? false,
      },
      refreshTokens: config?.refreshTokens?.enabled ?? false,
      accessTokenTtlSeconds:
        config?.accessTokenTtlSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlSeconds:
        (config?.refreshTokens?.enabled ?? false)
          ? (config?.refreshTokenTtlSeconds ??
            DEFAULT_REFRESH_TOKEN_TTL_SECONDS)
          : null,
    };
  }

  private validateConfiguration(): void {
    if (this.status.accessTokenTtlSeconds <= 0) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "accessTokenTtlSeconds must be > 0.",
      );
    }

    if (
      this.status.refreshTokens &&
      (!this.status.refreshTokenTtlSeconds ||
        this.status.refreshTokenTtlSeconds <= 0)
    ) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "refreshTokenTtlSeconds must be > 0.",
      );
    }

    this.ensureExplicitConfig(
      "credentials",
      Boolean(this.deps.passwordUserRepository || this.deps.passwordHasher),
    );
    this.ensureExplicitConfig("oauth", Boolean(this.deps.oauthUserRepository));

    const hasRefreshDeps = Boolean(
      this.deps.refreshTokenRepository || this.deps.tokenHasher,
    );
    if (
      this.deps.configuration?.refreshTokens?.enabled === undefined &&
      hasRefreshDeps
    ) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        "Explicitly set refreshTokens.enabled when providing refresh deps.",
      );
    }
  }

  private ensureExplicitConfig(
    method: keyof IWhoamiAuthStatus["authMethods"],
    hasDeps: boolean,
  ): void {
    if (
      this.deps.configuration?.authMethods?.[method] === undefined &&
      hasDeps
    ) {
      throw new WhoamiError(
        "INVALID_CONFIGURATION",
        `Explicitly set authMethods.${method} when providing its deps.`,
      );
    }
  }

  private logStatus(): void {
    if (this.configurationState === "unspecified") {
      this.deps.logger.warn(
        "Configuration",
        "No explicit auth config; defaults applied.",
      );
    }
    this.deps.logger.info("Credentials Status", {
      enabled: this.status.authMethods.credentials,
    });
    this.deps.logger.info("OAuth Status", {
      enabled: this.status.authMethods.oauth,
    });
    this.deps.logger.info("Refresh Tokens Status", {
      enabled: this.status.refreshTokens,
    });
  }
}
