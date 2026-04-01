import { AccountRepository } from "./features/accounts/index.js";
import {
  AuthenticateWithPasswordUseCase,
  AuthMethods,
  AuthResult,
} from "./features/authentication/index.js";
import { VerifyPasswordUseCase } from "./features/credentials/application/verify-password.usecase.js";
import {
  PasswordCredentialStore,
  PasswordManager,
  RegisterWithPasswordUseCase,
} from "./features/credentials/index.js";
import {
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "./features/receipts/index.js";
import { LoggerPort } from "./shared/index.js";

export interface AuthConfig {
  hashManager: PasswordManager;
  tokenSigner: IssueReceiptUseCase;
  tokenVerifier: VerifyReceiptUseCase;
  passwordStore: PasswordCredentialStore;
  accountRepo: AccountRepository;
  logger: LoggerPort;
  generateId: () => string | number;
}

type RegisterArgs = {
  email: string;
  password: string;
};

type LoginArgs = {
  email: string;
  password: string;
};

export function createAuth(config: AuthConfig): AuthMethods {
  // --- Registration ---
  const registerWithPassword = async (
    input: RegisterArgs,
  ): Promise<AuthResult> => {
    const useCase = new RegisterWithPasswordUseCase({
      accountRepo: config.accountRepo,
      passwordStore: config.passwordStore,
      generateId: config.generateId,
      hashPassword: config.hashManager.hash.bind(config.hashManager),
    });

    const account = await useCase.execute({
      email: input.email,
      password: input.password,
    });

    const receipt = await config.tokenSigner.execute(account.id);

    return { accountId: account.id, token: receipt.token };
  };

  // --- Authenticate Password ---
  const authenticateWithPassword = async (
    input: LoginArgs,
  ): Promise<AuthResult> => {
    const authUseCase = new AuthenticateWithPasswordUseCase({
      passwordStore: config.passwordStore,
      verifyPassword: new VerifyPasswordUseCase({
        passwordManager: config.hashManager,
        logger: config.logger,
      }),
      issueReceipt: config.tokenSigner,
    });

    return await authUseCase.execute({
      email: input.email,
      password: input.password,
    });
  };

  return {
    registerWithPassword,
    authenticateWithPassword,
  };
}
