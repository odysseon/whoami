import {
  RegisterWithPasswordUseCase,
  AuthenticateWithPasswordUseCase,
  ChangePasswordUseCase,
  AddPasswordToAccountUseCase,
  RequestPasswordResetUseCase,
  VerifyPasswordResetUseCase,
  RevokeAllPasswordResetsUseCase,
} from "./use-cases/index.js";
import type { PasswordModuleConfig } from "./password.config.js";

export interface PasswordUseCases {
  readonly register: RegisterWithPasswordUseCase;
  readonly authenticate: AuthenticateWithPasswordUseCase;
  readonly changePassword: ChangePasswordUseCase;
  readonly addPassword: AddPasswordToAccountUseCase;
  readonly requestReset: RequestPasswordResetUseCase;
  readonly verifyReset: VerifyPasswordResetUseCase;
  readonly revokeAllResets: RevokeAllPasswordResetsUseCase;
}

export function buildPasswordUseCases(
  config: PasswordModuleConfig,
  tokenLifespanMinutes: number,
  resetTokenLifespanMinutes: number,
): PasswordUseCases {
  return {
    register: new RegisterWithPasswordUseCase({
      accountRepo: config.accountRepo,
      passwordHashStore: config.passwordHashStore,
      passwordHasher: config.passwordHasher,
      idGenerator: config.idGenerator,
      logger: config.logger,
    }),

    authenticate: new AuthenticateWithPasswordUseCase({
      accountRepo: config.accountRepo,
      passwordHashStore: config.passwordHashStore,
      passwordHasher: config.passwordHasher,
      receiptSigner: config.receiptSigner,
      logger: config.logger,
      tokenLifespanMinutes,
    }),

    changePassword: new ChangePasswordUseCase({
      accountRepo: config.accountRepo,
      passwordHashStore: config.passwordHashStore,
      passwordHasher: config.passwordHasher,
      logger: config.logger,
    }),

    addPassword: new AddPasswordToAccountUseCase({
      accountRepo: config.accountRepo,
      passwordHashStore: config.passwordHashStore,
      passwordHasher: config.passwordHasher,
      idGenerator: config.idGenerator,
      logger: config.logger,
    }),

    requestReset: new RequestPasswordResetUseCase({
      accountRepo: config.accountRepo,
      resetTokenStore: config.resetTokenStore,
      idGenerator: config.idGenerator,
      logger: config.logger,
      clock: config.clock,
      secureToken: config.secureToken,
      config: { tokenLifespanMinutes: resetTokenLifespanMinutes },
    }),

    verifyReset: new VerifyPasswordResetUseCase({
      resetTokenStore: config.resetTokenStore,
      receiptSigner: config.receiptSigner,
      secureToken: config.secureToken,
      config: { receiptLifespanMinutes: 10 },
    }),

    revokeAllResets: new RevokeAllPasswordResetsUseCase({
      resetTokenStore: config.resetTokenStore,
    }),
  };
}
