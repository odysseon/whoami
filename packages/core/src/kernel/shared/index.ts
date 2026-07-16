export { CompositeDeserializer } from "./composite-deserializer.js";
export { AuthOrchestrator } from "./auth-orchestrator.js";
export { buildAuthLifecycle, type AuthLifecycle } from "./auth-lifecycle.js";
export { assertObject, credentialProof } from "./deserializer-helpers.js";
export { parseEmail } from "./email-parser.js";
export {
  IssueReceiptUseCase,
  type IssueReceiptDeps,
} from "./issue-receipt.use-case.js";
export {
  AuthenticateWithReceiptUseCase,
  type AuthenticatedIdentity,
  type AuthenticateWithReceiptDeps,
} from "./authenticate-with-receipt.use-case.js";
