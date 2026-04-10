/**
 * Internal exports — for adapter authors only.
 *
 * These are the concrete use-case classes that adapters may need to inject
 * via DI tokens. Application code should call {@link createAuth} from the
 * public API and never import these directly.
 *
 * @internal
 */
export { RegisterWithPasswordUseCase } from "../features/credentials/application/register-password.usecase.js";
export { RemovePasswordUseCase } from "../features/credentials/application/remove-password.usecase.js";
export { LinkOAuthToAccountUseCase } from "../features/credentials/application/link-oauth.usecase.js";
export { AuthenticateOAuthUseCase } from "../features/authentication/application/authenticate-oauth.usecase.js";
export { AuthenticateWithPasswordUseCase } from "../features/authentication/application/authenticate-password.usecase.js";
export { AddPasswordAuthUseCase } from "../features/authentication/application/add-password-auth.usecase.js";
export { RegisterAccountUseCase } from "../features/accounts/application/register-account.use-case.js";
export { IssueReceiptUseCase } from "../features/receipts/application/issue-receipt.usecase.js";
export { VerifyReceiptUseCase } from "../features/receipts/application/verify-receipt.usecase.js";
export { RemoveAuthMethodUseCase } from "../features/authentication/application/remove-auth-method.usecase.js";
