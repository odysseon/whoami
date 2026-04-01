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
import { IssueReceiptUseCase } from "./features/receipts/index.js";
import { LoggerPort } from "./shared/index.js";

export interface AuthConfig {
  hashManager: PasswordManager;
  tokenSigner: IssueReceiptUseCase;
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
  const registerUseCase = new RegisterWithPasswordUseCase({
    accountRepo: config.accountRepo,
    passwordStore: config.passwordStore,
    generateId: config.generateId,
    hashPassword: config.hashManager.hash.bind(config.hashManager),
  });

  const verifyPasswordUseCase = new VerifyPasswordUseCase({
    passwordManager: config.hashManager,
    logger: config.logger,
  });

  const authenticateUseCase = new AuthenticateWithPasswordUseCase({
    passwordStore: config.passwordStore,
    verifyPassword: verifyPasswordUseCase,
    issueReceipt: config.tokenSigner,
  });

  // --- Registration ---
  const registerWithPassword = async (
    input: RegisterArgs,
  ): Promise<AuthResult> => {
    const account = await registerUseCase.execute({
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
    return await authenticateUseCase.execute({
      email: input.email,
      password: input.password,
    });
  };

  return {
    registerWithPassword,
    authenticateWithPassword,
  };
}
