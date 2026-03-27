import { EmailAddress } from "src/shared/domain/value-objects/index.js";
import { Credential } from "../credential.entity.js";

export interface CredentialStore {
  findByEmail(email: EmailAddress): Promise<Credential | null>;
}
