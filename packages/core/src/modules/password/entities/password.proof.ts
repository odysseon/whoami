export type { PasswordHashProof } from "./password-hash.proof.js";

export {
  createPasswordHashProof,
  isPasswordHashProof,
} from "./password-hash.proof.js";

export {
  type PasswordResetProof,
  createPasswordResetProof,
  markResetProofAsUsed,
} from "./password-reset.proof.js";

export {
  isResetProofExpired,
  isResetProofUsed,
  isPasswordResetProof,
} from "./password-proof.guards.js";
