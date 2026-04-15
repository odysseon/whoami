export { Credential } from "./credential.entity.js";
export type { CredentialProof } from "./credential.proof.port.js";
export { PasswordProof, OAuthProof } from "./credential.types.js";
export {
  CompositeDeserializer,
  type ProofDeserializer,
} from "./composite-deserializer.js";
export type {
  CreatePasswordProps,
  CreateOAuthProps,
  LoadExistingProps,
} from "./credential.entity.js";
