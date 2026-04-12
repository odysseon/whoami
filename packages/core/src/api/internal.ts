/**
 * Internal exports — for adapter authors only.
 *
 * These are concrete use-case classes that DI adapters (e.g. NestJS) may need
 * to inject via tokens. Application code should use {@link createAuth} from the
 * public API and never import these directly.
 *
 * @internal
 */
export { IssueReceiptUseCase } from "../kernel/receipt/usecases/issue-receipt.usecase.js";
export { VerifyReceiptUseCase } from "../kernel/receipt/usecases/verify-receipt.usecase.js";
export { RemoveAuthMethodUseCase } from "../kernel/auth/usecases/remove-auth-method.usecase.js";

// Password module
export { RegisterWithPasswordUseCase } from "../modules/password/usecases/register.usecase.js";
export { AuthenticateWithPasswordUseCase } from "../modules/password/usecases/authenticate.usecase.js";
export { AddPasswordUseCase } from "../modules/password/usecases/add-password.usecase.js";
export { ChangePasswordUseCase } from "../modules/password/usecases/change-password.usecase.js";

// OAuth module
export { AuthenticateWithOAuthUseCase } from "../modules/oauth/usecases/authenticate.usecase.js";
export { LinkOAuthToAccountUseCase } from "../modules/oauth/usecases/link-account.usecase.js";
export { UnlinkOAuthUseCase } from "../modules/oauth/usecases/unlink-account.usecase.js";
